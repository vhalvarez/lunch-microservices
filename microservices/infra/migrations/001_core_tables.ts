import { getDbPool, closeDatabase } from '@lunch/db';
import { createLogger } from '@lunch/logger';

const log = createLogger('migration-001');

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

/**
 * Migración 001: Setup inicial de tablas core
 * - stock
 * - reservations
 * - reservation_items
 * - market_purchases
 */
export async function up() {
  const pool = getDbPool('migration-001');

  try {
    log.info('Running migration 001: Core tables setup');

    await pool.query('BEGIN');

    // 1. Tabla de stock (inventario)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        ingredient TEXT PRIMARY KEY,
        qty INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT stock_qty_nonneg CHECK (qty >= 0)
      );
    `);

    // 2. Tabla de reservas (órdenes/platos)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        plate_id UUID PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_retry_at TIMESTAMPTZ NULL,
        prepared_at TIMESTAMPTZ NULL,
        CONSTRAINT reservations_status_check 
          CHECK (status IN ('pending', 'reserved', 'failed'))
      );
    `);

    // 3. Tabla de items de reserva
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservation_items (
        plate_id UUID NOT NULL REFERENCES reservations(plate_id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        needed INTEGER NOT NULL,
        reserved INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(plate_id, ingredient),
        CONSTRAINT reservation_items_needed_nonneg CHECK (needed >= 0),
        CONSTRAINT reservation_items_reserved_nonneg CHECK (reserved >= 0),
        CONSTRAINT reservation_items_reserved_le_needed CHECK (reserved <= needed)
      );
    `);

    // 4. Tabla de compras en mercado
    await pool.query(`
      CREATE TABLE IF NOT EXISTS market_purchases (
        id BIGSERIAL PRIMARY KEY,
        plate_id UUID NOT NULL,
        ingredient TEXT NOT NULL,
        qty_requested INTEGER NOT NULL CHECK (qty_requested >= 0),
        quantity_sold INTEGER NOT NULL CHECK (quantity_sold >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Índices para performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reservations_status 
        ON reservations(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_last_retry 
        ON reservations(last_retry_at);
      CREATE INDEX IF NOT EXISTS idx_reservations_created_at 
        ON reservations(created_at DESC);
        
      CREATE INDEX IF NOT EXISTS idx_reservation_items_plate 
        ON reservation_items(plate_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_items_ingredient 
        ON reservation_items(ingredient);
        
      CREATE INDEX IF NOT EXISTS idx_market_purchases_plate 
        ON market_purchases(plate_id);
      CREATE INDEX IF NOT EXISTS idx_market_purchases_ing 
        ON market_purchases(ingredient);
      CREATE INDEX IF NOT EXISTS idx_market_purchases_created_at 
        ON market_purchases(created_at DESC);
    `);

    // 6. Seed inicial de ingredientes
    log.info('Seeding initial stock...');
    for (const ingredient of INGREDIENTS) {
      await pool.query(
        `INSERT INTO stock(ingredient, qty)
         VALUES($1, 5)
         ON CONFLICT (ingredient) DO NOTHING`,
        [ingredient],
      );
    }

    await pool.query('COMMIT');
    log.info('✅ Migration 001 completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Migration 001 failed');
    throw error;
  } finally {
    await closeDatabase('migration-001');
  }
}

/**
 * Rollback de la migración 001
 */
export async function down() {
  const pool = getDbPool('migration-001-down');

  try {
    log.info('Rolling back migration 001');

    await pool.query('BEGIN');

    await pool.query('DROP TABLE IF EXISTS market_purchases CASCADE');
    await pool.query('DROP TABLE IF EXISTS reservation_items CASCADE');
    await pool.query('DROP TABLE IF EXISTS reservations CASCADE');
    await pool.query('DROP TABLE IF EXISTS stock CASCADE');

    await pool.query('COMMIT');
    log.info('✅ Migration 001 rolled back successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Rollback 001 failed');
    throw error;
  } finally {
    await closeDatabase('migration-001-down');
  }
}
