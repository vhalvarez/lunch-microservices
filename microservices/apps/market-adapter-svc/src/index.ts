import { randomUUID } from 'crypto';
import { request } from 'undici';
import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';
import { getDbPool, closeDatabase } from '@lunch/db';
import { createBus } from '@lunch/bus';
import { Exchanges, RoutingKeys, PurchaseRequested, PurchaseCompleted } from '@lunch/shared-kernel';
import { jitter, sleep } from '@lunch/utils';

const log = createLogger('market-adapter');
const pg = getDbPool('market-adapter-svc');

async function buyOnce(ingredient: string): Promise<number> {
  const url = `${env.MARKET_URL}/buy?ingredient=${encodeURIComponent(ingredient)}`;
  const res = await request(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (res.statusCode !== 200) return 0;

  const body = await res.body.json().catch(() => ({}) as any);
  const sold = Number((body as { quantitySold?: number })?.quantitySold ?? 0);
  return Number.isFinite(sold) ? sold : 0;
}

async function recordMarketPurchase(params: {
  plateId: string;
  ingredient: string;
  qtyRequested: number;
  quantitySold: number;
}) {
  const { plateId, ingredient, qtyRequested, quantitySold } = params;
  try {
    await pg.query(
      `insert into market_purchases(plate_id, ingredient, qty_requested, quantity_sold)
       values ($1, $2, $3, $4)`,
      [plateId, ingredient, qtyRequested, quantitySold],
    );
  } catch (err) {
    log.error({ err, plateId, ingredient }, 'failed to insert market_purchases');
  }
}

async function main() {
  const bus = createBus(env.AMQP_URL, env.RMQ_PREFETCH);
  await bus.connect();

  await bus.subscribe(
    'purchase.requested.q',
    [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseRequested }],
    async (evt: unknown) => {
      const parsed = PurchaseRequested.safeParse(evt);
      if (!parsed.success) {
        log.warn({ evt }, 'invalid PurchaseRequested');
        return;
      }
      const e = parsed.data;

      const purchased: Record<string, number> = {};

      for (const s of e.shortages) {
        let remaining = s.missing;

        for (let attempt = 1; attempt <= env.MARKET_MAX_ATTEMPTS && remaining > 0; attempt++) {
          const qtyRequestedNow = remaining;

          const sold = await buyOnce(s.ingredient).catch(() => 0);
          log.info(
            {
              plateId: e.plateId,
              ingredient: s.ingredient,
              attempt,
              requested: qtyRequestedNow,
              sold,
            },
            'market response',
          );

          await recordMarketPurchase({
            plateId: e.plateId,
            ingredient: s.ingredient,
            qtyRequested: qtyRequestedNow,
            quantitySold: sold,
          });

          if (sold > 0) {
            purchased[s.ingredient] = (purchased[s.ingredient] ?? 0) + sold;
            remaining = Math.max(0, remaining - sold);
          } else {
            await sleep(jitter(env.MARKET_BASE_BACKOFF_MS * attempt));
          }
        }

        if (remaining > 0) {
          await bus.publish(Exchanges.purchase, RoutingKeys.purchaseFailed, {
            messageId: randomUUID(),
            plateId: e.plateId,
            ingredient: s.ingredient,
            remaining,
          });
          return;
        }
      }

      const done: PurchaseCompleted = {
        messageId: randomUUID(),
        plateId: e.plateId,
        purchased: Object.entries(purchased).map(([ingredient, qty]) => ({
          ingredient,
          qty,
        })) as any,
      };

      await bus.publish(Exchanges.purchase, RoutingKeys.purchaseCompleted, done);
    },
  );

  log.info('market-adapter-svc up');

  const shutdown = async () => {
    try {
      await closeDatabase('market-adapter-svc');
    } catch {}
    try {
      await (bus as any).close?.();
    } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
