import { Client } from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/lunchday";

const INGREDIENTS = [
  "tomato",
  "lemon",
  "potato",
  "rice",
  "ketchup",
  "lettuce",
  "onion",
  "cheese",
  "meat",
  "chicken",
] as const;

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  await client.query(`
    create table if not exists stock(
      ingredient text primary key,
      qty int not null default 0
    );
    create table if not exists reservations(
      plate_id uuid primary key,
      status text not null, -- 'pending'|'reserved'|'failed'
      created_at timestamptz not null default now()
    );
    create table if not exists reservation_items(
      plate_id uuid not null references reservations(plate_id) on delete cascade,
      ingredient text not null,
      needed int not null,
      reserved int not null default 0,
      primary key(plate_id, ingredient)
    );
    create table if not exists processed_messages(
      message_id uuid primary key,
      processed_at timestamptz not null default now()
    );
  `);

  for (const ing of INGREDIENTS) {
    await client.query(
      `insert into stock(ingredient, qty)
       values($1, 5)
       on conflict (ingredient) do nothing`,
      [ing]
    );
  }

  console.log("migrated + seeded (y)");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
