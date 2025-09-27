// publish-inventory-reserve.ts
import { randomUUID } from 'crypto';
import { env } from '@lunch/config';
import { Bus } from '@lunch/messaging';
import { Exchanges, RoutingKeys, type Ingredient } from '@lunch/shared-kernel';

function argNum(name: string, def: number) {
  const ix = process.argv.indexOf(`--${name}`);
  if (ix >= 0 && process.argv[ix + 1]) {
    const n = Number(process.argv[ix + 1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return def;
}

const PLATES = argNum('plates', 1);

// Receta de prueba
// const sampleItems: Array<{ ingredient: Ingredient; qty: number }> = [
//   { ingredient: "ketchup", qty: 3 },
//   { ingredient: "tomato", qty: 2 },
// ];

// Una prueba mas estresante
const ALL: Ingredient[] = [
  'tomato',
  'lemon',
  'potato',
  'rice',
  'ketchup',
  'lettuce',
  'onion',
  'cheese',
  'meat',
  'chicken',
];
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const sampleItems = Array.from({ length: 2 + randInt(0, 2) }).map(() => {
  const ing = ALL[randInt(0, ALL.length - 1)];
  return { ingredient: ing, qty: randInt(1, 4) };
});

async function main() {
  const bus = new Bus({
    url: env.AMQP_URL,
  });
  await bus.connect();

  for (let i = 0; i < PLATES; i++) {
    const plateId = randomUUID();
    await bus.publish(Exchanges.inventory, RoutingKeys.inventoryReserveRequested, {
      messageId: randomUUID(),
      plateId,
      items: sampleItems,
    });
    console.log('published inventory.reserve.requested', { plateId });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
