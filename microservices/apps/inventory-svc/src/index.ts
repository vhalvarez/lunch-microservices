import { randomUUID } from 'crypto';
import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { getDbPool, withTx } from '@lunch/db';
import { createRedis, withIdempotency } from '@lunch/redis';
import { createBus } from '@lunch/bus';
import {
  Exchanges,
  RoutingKeys,
  InventoryReserveRequested,
  InventoryReserved,
  PurchaseRequested,
  PurchaseCompleted,
  PurchaseFailed,
  type Ingredient,
} from '@lunch/shared-kernel';
import { startReconciler } from './reconciler.js';

const log = createLogger('inventory-svc');
const pool = getDbPool('inventory-svc');
const redis = createRedis(env.REDIS_URL);

async function main() {
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);
  await bus.connect();

  await bus.subscribe(
    'inventory.reserve.requested.q',
    [{ exchange: Exchanges.inventory, rk: RoutingKeys.inventoryReserveRequested }],
    async (evt: unknown) => {
      const parsed = InventoryReserveRequested.safeParse(evt);
      if (!parsed.success) {
        log.warn({ evt }, 'invalid InventoryReserveRequested');
        return;
      }
      const e = parsed.data;

      await withIdempotency(redis, e.messageId, 60 * 60, async () => {
        const { shortages, shouldPurchase } = await withTx(pool, async (cx) => {
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
            const row = await cx.query('select qty from stock where ingredient=$1 for update', [
              r.ingredient,
            ]);
            const curr = Number(row?.rows?.[0]?.qty ?? 0);

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
              const reserveNow = Math.max(Math.min(curr, r.qty), 0);
              if (reserveNow > 0) {
                await cx.query('update stock set qty = qty - $1 where ingredient=$2', [
                  reserveNow,
                  r.ingredient,
                ]);
                await cx.query(
                  'update reservation_items set reserved = reserved + $1 where plate_id=$2 and ingredient=$3',
                  [reserveNow, e.plateId, r.ingredient],
                );
              }
              const missing = r.qty - reserveNow;
              if (missing > 0) {
                shortages.push({ ingredient: r.ingredient as Ingredient, missing });
              }
            }
          }

          if (shortages.length === 0) {
            await cx.query('update reservations set status=$2 where plate_id=$1', [
              e.plateId,
              'reserved',
            ]);
            return { shortages, shouldPurchase: false };
          } else {
            // Marcar como 'purchasing' para evitar reintentos del reconciliador
            await cx.query('update reservations set status=$2 where plate_id=$1', [
              e.plateId,
              'purchasing',
            ]);
            return { shortages, shouldPurchase: true };
          }
        });

        // Publicar eventos FUERA de la transacción
        if (shouldPurchase) {
          await bus.publish(Exchanges.purchase, RoutingKeys.purchaseRequested, {
            messageId: randomUUID(),
            plateId: e.plateId,
            shortages,
          } satisfies PurchaseRequested);
        } else {
          await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
            messageId: randomUUID(),
            plateId: e.plateId,
            items: e.items.map((it) => ({ ingredient: it.ingredient, qty: it.qty })),
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

      await withIdempotency(redis, e.messageId, 60 * 60, async () => {
        const txOut = await withTx(pool, async (cx) => {
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

            const reserveNow = Math.min(curr, need);
            if (reserveNow > 0) {
              await cx.query('update stock set qty = qty - $1 where ingredient=$2', [
                reserveNow,
                it.ingredient,
              ]);
              await cx.query(
                'update reservation_items set reserved = reserved + $1 where plate_id=$2 and ingredient=$3',
                [reserveNow, e.plateId, it.ingredient],
              );
            }
            if (reserveNow < need) {
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
          } else {
            await cx.query('update reservations set status=$2 where plate_id=$1', [
              e.plateId,
              'pending',
            ]);
          }

          return { allOk, itemsPub: [] as Array<{ ingredient: Ingredient; qty: number }> };
        });

        if (txOut.allOk) {
          await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserved, {
            messageId: randomUUID(),
            plateId: e.plateId,
            items: txOut.itemsPub,
          } satisfies InventoryReserved);
        } else {
          log.info(
            { plateId: e.plateId },
            'reservation incomplete after purchase.completed, returned to pending for reconciler',
          );
        }
      });
    },
  );

  await bus.subscribe(
    'purchase.failed.to.inventory.q',
    [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseFailed }],
    async (evt: unknown) => {
      const parsed = PurchaseFailed.safeParse(evt);
      if (!parsed.success) {
        log.warn({ evt }, 'invalid PurchaseFailed');
        return;
      }
      const e = parsed.data;

      await withIdempotency(redis, e.messageId, 3600, async () => {
        await withTx(pool, async (cx) => {
          const { rows } = await cx.query(
            `select 1
               from reservation_items
              where plate_id = $1
                and needed > reserved
              limit 1`,
            [e.plateId],
          );

          if (rows.length > 0) {
            await cx.query(
              `update reservations
                  set status = 'pending'
                where plate_id = $1`,
              [e.plateId],
            );
            log.warn(
              { plateId: e.plateId },
              'purchase failed, reservation returned to pending for retry',
            );
          }
        });
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
