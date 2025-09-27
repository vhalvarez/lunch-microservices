import { Client } from 'pg';
import { env } from '@lunch/config'

const INGREDIENTS = [
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
] as const;

async function main() {
  const client = new Client({ connectionString: env.DATABASE_URL });
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
  `);

  for (const ing of INGREDIENTS) {
    await client.query(
      `insert into stock(ingredient, qty)
       values($1, 5)
       on conflict (ingredient) do nothing`,
      [ing],
    );
  }

  await client.query(`
    alter table reservations
      add column if not exists retry_count int not null default 0,
      add column if not exists last_retry_at timestamptz null,
      add column if not exists prepared_at timestamptz null
  `);

  await client.query(`
    do $$ begin
      alter table stock
        add constraint stock_qty_nonneg check (qty >= 0);
    exception when duplicate_object then null; end $$;

    do $$ begin
      alter table reservation_items
        add constraint reservation_items_needed_nonneg check (needed >= 0);
    exception when duplicate_object then null; end $$;

    do $$ begin
      alter table reservation_items
        add constraint reservation_items_reserved_nonneg check (reserved >= 0);
    exception when duplicate_object then null; end $$;

    do $$ begin
      alter table reservation_items
        add constraint reservation_items_reserved_le_needed
        check (reserved <= needed);
    exception when duplicate_object then null; end $$;
  `);

  await client.query(`
    create table if not exists market_purchases(
      id bigserial primary key,
      plate_id uuid not null,
      ingredient text not null,
      qty_requested int not null check (qty_requested >= 0),
      quantity_sold int not null check (quantity_sold >= 0),
      created_at timestamptz not null default now()
    );
    create index if not exists idx_market_purchases_plate on market_purchases(plate_id);
    create index if not exists idx_market_purchases_ing on market_purchases(ingredient);
  `);

  await client.query(`
    create index if not exists idx_reservations_status on reservations(status);
    create index if not exists idx_reservations_last_retry on reservations(last_retry_at);
    create index if not exists idx_reservation_items_plate on reservation_items(plate_id);
  `);

  console.log('migrated + seeded (y)');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
