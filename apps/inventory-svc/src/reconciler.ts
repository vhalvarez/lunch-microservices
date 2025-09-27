import pino from 'pino';
import { randomUUID } from 'crypto';
import type { Client } from 'pg';
import type Redis from 'ioredis';
import { env } from '@lunch/config';
import type { Bus } from '@lunch/messaging';
import {
  Exchanges,
  RoutingKeys,
  type Ingredient,
  type PurchaseRequested,
  type InventoryReserved,
} from '@lunch/shared-kernel';

const log = pino({ name: 'inventory-reconciler' });

function nextEligibleSQL() {
  // last_retry_at + (1min * 2^retry_count) <= now()
  return `
    (last_retry_at IS NULL
     OR last_retry_at + (INTERVAL '${env.RECONCILER_BASE_DELAY_MIN} minutes' * POWER(2, GREATEST(retry_count,0))) <= now())
  `;
}

async function tryAcquireLock(redis: Redis, key = 'locks:inventory:reconciler', ttlSec = 10) {
  const ok = await redis.set(key, '1', 'EX', ttlSec, 'NX');
  return !!ok;
}

export async function runReconcilerOnce(pg: Client, bus: Bus, redis: Redis) {
  const got = await tryAcquireLock(redis);
  if (!got) {
    log.debug('another reconciler is running; skipping');
    return;
  }

  try {
    const pending = await pg.query(
      `
      SELECT plate_id
      FROM reservations
      WHERE status = 'pending'
        AND ${nextEligibleSQL()}
        AND retry_count < $1
      ORDER BY last_retry_at NULLS FIRST
      LIMIT $2
      `,
      [env.RECONCILER_MAX_RETRIES, env.RECONCILER_BATCH_LIMIT],
    );

    if (pending.rowCount === 0) return;

    for (const row of pending.rows) {
      const plateId: string = row.plate_id;

      await pg.query('BEGIN');
      try {
        const itemsRes = await pg.query(
          `SELECT ingredient, needed, reserved
             FROM reservation_items
            WHERE plate_id = $1
            ORDER BY ingredient`,
          [plateId],
        );

        const shortages: Array<{ ingredient: Ingredient; missing: number }> = [];
        for (const it of itemsRes.rows) {
          const needed = Number(it.needed);
          const reserved = Number(it.reserved);
          const miss = Math.max(0, needed - reserved);
          if (miss > 0) {
            shortages.push({
              ingredient: it.ingredient as Ingredient,
              missing: miss,
            });
          }
        }

        // marcar intento
        await pg.query(
          `UPDATE reservations
              SET retry_count = retry_count + 1,
                  last_retry_at = now()
            WHERE plate_id = $1`,
          [plateId],
        );

        if (shortages.length === 0) {
          await pg.query(`UPDATE reservations SET status='reserved' WHERE plate_id=$1`, [plateId]);

          const rs = await pg.query(
            `SELECT ingredient, reserved
               FROM reservation_items
              WHERE plate_id=$1
              ORDER BY ingredient`,
            [plateId],
          );
          const items = rs.rows.map((r) => ({
            ingredient: r.ingredient as Ingredient,
            qty: Number(r.reserved),
          }));

          await pg.query('COMMIT');

          await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
            messageId: randomUUID(),
            plateId,
            items,
          } satisfies InventoryReserved);
        } else {
          await pg.query('COMMIT');

          await bus.publish(Exchanges.purchase, RoutingKeys.purchaseRequested, {
            messageId: randomUUID(),
            plateId,
            shortages,
          } satisfies PurchaseRequested);
        }
      } catch (err) {
        await pg.query('ROLLBACK');
        log.error({ err, plateId }, 'reconciler txn failed');
      }
    }

    await pg.query(
      `UPDATE reservations
          SET status='failed'
        WHERE status='pending'
          AND retry_count >= $1`,
      [env.RECONCILER_MAX_RETRIES],
    );
  } finally {
  }
}

export function startReconciler(pg: Client, bus: Bus, redis: Redis) {
  const everyMs = Number(env.RECONCILER_EVERY_MS ?? 15_000);
  setInterval(() => {
    runReconcilerOnce(pg, bus, redis).catch((e) => log.error({ e }, 'reconciler run error'));
  }, everyMs);
  log.info({ everyMs }, 'reconciler started');
}
