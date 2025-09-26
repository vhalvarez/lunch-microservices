import { request } from "undici";
import pino from "pino";
import { randomUUID } from "crypto";
import { Bus } from "@lunch/messaging";
import {
  Exchanges,
  RoutingKeys,
  PurchaseRequested,
  PurchaseCompleted,
} from "@lunch/shared-kernel";

const log = pino({ name: "market-adapter" });
const MARKET =
  process.env.MARKET_URL || "https://recruitment.alegra.com/api/farmers-market";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number) => ms + Math.floor(Math.random() * 75);

async function buyOnce(ingredient: string): Promise<number> {
  const url = `${MARKET}/buy?ingredient=${encodeURIComponent(ingredient)}`;
  const res = await request(url, {
    method: "GET",
    headers: { accept: "application/json" },
    maxRedirections: 0,
    bodyTimeout: 2500,
  });
  const body = await res.body.json().catch(() => ({} as any));
  const sold = Number((body as { quantitySold?: number })?.quantitySold ?? 0);
  return Number.isFinite(sold) ? sold : 0;
}

async function main() {
  const bus = new Bus({
    url: process.env.AMQP_URL,
    prefetch: 30,
  });
  await bus.connect();

  await bus.subscribe(
    "purchase.requested.q",
    [{ exchange: Exchanges.purchase, rk: RoutingKeys.purchaseRequested }],
    async (evt: unknown) => {
      const valid = PurchaseRequested.safeParse(evt);
      if (!valid.success) {
        log.warn({ evt }, "invalid PurchaseRequested");
        return;
      }
      const e = valid.data;

      const purchased: Record<string, number> = {};
      for (const s of e.shortages) {
        let remaining = s.missing;
        for (let attempt = 1; attempt <= 6 && remaining > 0; attempt++) {
          const sold = await buyOnce(s.ingredient).catch(() => 0);
          log.info(
            { plateId: e.plateId, ingredient: s.ingredient, attempt, sold },
            "market response"
          );
          if (sold > 0) {
            purchased[s.ingredient] = (purchased[s.ingredient] ?? 0) + sold;
            remaining -= sold;
          } else {
            await sleep(jitter(150 * attempt));
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
      await bus.publish(
        Exchanges.purchase,
        RoutingKeys.purchaseCompleted,
        done
      );
    }
  );
  log.info("market-adapter-svc up");
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
