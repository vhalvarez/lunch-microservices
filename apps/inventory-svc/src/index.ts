import pino from 'pino';
import { Pool, PoolClient } from 'pg';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { env } from '@lunch/config'
import { Bus } from '@lunch/messaging';
import {
  Exchanges,
  RoutingKeys,
  InventoryReserveRequested,
  InventoryReserved,
  PurchaseRequested,
  PurchaseCompleted,
  type Ingredient,
} from '@lunch/shared-kernel';
import { startReconciler } from './reconciler';

const log = pino({ name: 'inventory-svc' });

const pool = new Pool({ connectionString: env.DATABASE_URL });

async function withIdempotency(redis: Redis, messageId: string, fn: () => Promise<void>) {
  const key = `idem:${messageId}`;
  const ok = await redis.set(key, '1', 'EX', 60 * 60, 'NX'); // 1h
  if (!ok) {
    log.warn({ messageId }, 'duplicate message ignored');
    return;
  }
  await fn();
}

async function withTx<T>(fn: (cx: PoolClient) => Promise<T>) {
  const cx = await pool.connect();
  try {
    await cx.query('BEGIN');
    const out = await fn(cx);
    await cx.query('COMMIT');
    return out;
  } catch (err) {
    try {
      await cx.query('ROLLBACK');
    } catch {}
    throw err;
  } finally {
    cx.release();
  }
}

async function main() {
  const bus = new Bus({
    url: process.env.AMQP_URL,
    prefetch: 50,
  });
  await bus.connect();

  const redis = new Redis(env.REDIS_URL);

  await bus.subscribe(
    'inventory.reserve.requested.q',
    [
      {
        exchange: Exchanges.inventory,
        rk: RoutingKeys.inventoryReserveRequested,
      },
    ],
    async (evt: unknown) => {
      const parsed = InventoryReserveRequested.safeParse(evt);
      if (!parsed.success) {
        log.warn({ evt }, 'invalid InventoryReserveRequested');
        return;
      }
      const e = parsed.data;

      await withIdempotency(redis, e.messageId, async () => {
        const { shortages } = await withTx(async (cx) => {
          await cx.query(
            `insert into reservations(plate_id, status)
             values ($1,'pending')
             on conflict (plate_id) do update set status='pending'`,
            [e.plateId],
          );

          for (const r of e.items) {
            await cx.query(
              `insert into reservation_items(plate_id, ingredient, needed, reserved)
               values ($1,$2,$3,0)
               on conflict (plate_id, ingredient)
               do update set needed=excluded.needed`,
              [e.plateId, r.ingredient, r.qty],
            );
          }

          const shortages: Array<{ ingredient: Ingredient; missing: number }> = [];

          for (const r of e.items) {
            const res = await cx.query('select qty from stock where ingredient=$1 for update', [
              r.ingredient,
            ]);
            const curr = Number(res?.rows?.[0]?.qty ?? 0);

            if (curr >= r.qty) {
              await cx.query('update stock set qty = qty - $1 where ingredient=$2', [
                r.qty,
                r.ingredient,
              ]);
              await cx.query(
                'update reservation_items set reserved = $1 where plate_id=$2 and ingredient=$3',
                [r.qty, e.plateId, r.ingredient],
              );
            } else {
              const missing = r.qty - Math.max(curr, 0);
              shortages.push({
                ingredient: r.ingredient as Ingredient,
                missing,
              });

              if (curr > 0) {
                await cx.query('update stock set qty = 0 where ingredient=$1', [r.ingredient]);
              }
            }
          }

          if (shortages.length === 0) {
            await cx.query('update reservations set status=$2 where plate_id=$1', [
              e.plateId,
              'reserved',
            ]);
          }

          return { shortages };
        });

        if (shortages.length > 0) {
          await bus.publish(Exchanges.purchase, RoutingKeys.purchaseRequested, {
            messageId: randomUUID(),
            plateId: e.plateId,
            shortages,
          } satisfies PurchaseRequested);
        } else {
          await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
            messageId: randomUUID(),
            plateId: e.plateId,
            items: e.items.map((it) => ({
              ingredient: it.ingredient,
              qty: it.qty,
            })),
          } satisfies InventoryReserved);
        }
      });
    },
  );

  await bus.subscribe(
    'purchase.completed.to.inventory.q',
    [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseCompleted }],
    async (evt: unknown) => {
      const parsed = PurchaseCompleted.safeParse(evt);
      if (!parsed.success) {
        log.warn({ evt }, 'invalid PurchaseCompleted');
        return;
      }
      const e = parsed.data;

      await withIdempotency(redis, e.messageId, async () => {
        const txOut = await withTx(async (cx) => {
          for (const p of e.purchased) {
            await cx.query(
              `insert into stock(ingredient, qty) values ($1,$2)
               on conflict (ingredient) do update set qty = stock.qty + EXCLUDED.qty`,
              [p.ingredient, p.qty],
            );
          }

          const items = await cx.query(
            `select ingredient, needed, reserved
               from reservation_items
              where plate_id=$1
              order by ingredient`,
            [e.plateId],
          );

          let allOk = true;

          for (const it of items.rows) {
            const need = Number(it.needed) - Number(it.reserved);
            if (need <= 0) continue;

            const row = await cx.query('select qty from stock where ingredient=$1 for update', [
              it.ingredient,
            ]);
            const curr = Number(row?.rows?.[0]?.qty ?? 0);

            if (curr >= need) {
              await cx.query('update stock set qty = qty - $1 where ingredient=$2', [
                need,
                it.ingredient,
              ]);
              await cx.query(
                'update reservation_items set reserved = reserved + $1 where plate_id=$2 and ingredient=$3',
                [need, e.plateId, it.ingredient],
              );
            } else {
              allOk = false;
            }
          }

          if (allOk) {
            await cx.query('update reservations set status=$2 where plate_id=$1', [
              e.plateId,
              'reserved',
            ]);
            const rs = await cx.query(
              `select ingredient, reserved
                 from reservation_items
                where plate_id=$1
                order by ingredient`,
              [e.plateId],
            );
            const itemsPub = rs.rows.map((r) => ({
              ingredient: r.ingredient as Ingredient,
              qty: Number(r.reserved),
            }));
            return { allOk, itemsPub };
          }

          return {
            allOk,
            itemsPub: [] as Array<{ ingredient: Ingredient; qty: number }>,
          };
        });

        if (txOut.allOk) {
          await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
            messageId: randomUUID(),
            plateId: e.plateId,
            items: txOut.itemsPub,
          } satisfies InventoryReserved);
        } else {
          log.info({ plateId: e.plateId }, 'reservation still pending after purchase.completed');
        }
      });
    },
  );

  startReconciler(pool as any, bus, redis);

  log.info('inventory-svc up');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
