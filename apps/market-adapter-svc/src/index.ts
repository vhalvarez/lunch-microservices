import { request } from 'undici';
import pino from 'pino';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { Bus } from '@lunch/messaging';
import { Exchanges, RoutingKeys, PurchaseRequested, PurchaseCompleted } from '@lunch/shared-kernel';

const log = pino({ name: 'market-adapter' });

const MARKET = process.env.MARKET_URL || 'https://recruitment.alegra.com/api/farmers-market';
const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lunchday';

const PREFETCH = Number(process.env.MARKET_PREFETCH ?? 30);
const MAX_ATTEMPTS = Number(process.env.MARKET_MAX_ATTEMPTS ?? 6);
const BASE_BACKOFF_MS = Number(process.env.MARKET_BASE_BACKOFF_MS ?? 150);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number) => ms + Math.floor(Math.random() * 75);

async function buyOnce(ingredient: string): Promise<number> {
  const url = `${MARKET}/buy?ingredient=${encodeURIComponent(ingredient)}`;
  const res = await request(url, {
    method: 'GET',
    headers: { accept: 'application/json' },
    maxRedirections: 0,
    bodyTimeout: 2500,
  });
  const body = await res.body.json().catch(() => ({}) as any);
  const sold = Number((body as { quantitySold?: number })?.quantitySold ?? 0);
  return Number.isFinite(sold) ? sold : 0;
}

async function main() {
  // AMQP
  const bus = new Bus({
    url: process.env.AMQP_URL,
    prefetch: PREFETCH,
  });
  await bus.connect();

  // Postgres
  const pg = new Client({ connectionString: DATABASE_URL });
  await pg.connect();

  // Helper para registrar cada intento en el historial
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

        for (let attempt = 1; attempt <= MAX_ATTEMPTS && remaining > 0; attempt++) {
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

          // Guardar intento en historial (aunque sold sea 0)
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
            // backoff con jitter incremental
            await sleep(jitter(BASE_BACKOFF_MS * attempt));
          }
        }

        if (remaining > 0) {
          // Agotamos reintentos para este ingrediente → publish failed y salimos
          await bus.publish(Exchanges.purchase, RoutingKeys.purchaseFailed, {
            messageId: randomUUID(),
            plateId: e.plateId,
            ingredient: s.ingredient,
            remaining,
          });
          return;
        }
      }

      // Si llegamos aquí, logramos cubrir todos los faltantes
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

  // Cierre limpio opcional
  const shutdown = async () => {
    try {
      await pg.end();
    } catch {}
    try {
      await bus.close?.();
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
