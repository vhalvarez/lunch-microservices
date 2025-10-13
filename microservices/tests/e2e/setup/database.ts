import { Pool } from 'pg';

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

export async function setupDatabase(pool: Pool): Promise<void> {
  console.log('📊 Setting up database schema...');

  try {
    await pool.query('BEGIN');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        ingredient TEXT PRIMARY KEY,
        qty INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT stock_qty_nonneg CHECK (qty >= 0)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        plate_id UUID PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_retry_at TIMESTAMPTZ NULL,
        prepared_at TIMESTAMPTZ NULL,
        CONSTRAINT reservations_status_check 
          CHECK (status IN ('pending', 'reserved', 'failed', 'purchasing'))
      );
    `);

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        generated_at TIMESTAMPTZ NOT NULL,
        analysis_window_hours INTEGER NOT NULL,
        total_orders_analyzed INTEGER NOT NULL,
        critical_alerts_count INTEGER NOT NULL DEFAULT 0,
        high_alerts_count INTEGER NOT NULL DEFAULT 0,
        medium_alerts_count INTEGER NOT NULL DEFAULT 0,
        low_alerts_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_alerts (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        current_stock INTEGER NOT NULL,
        predicted_shortage_at TIMESTAMPTZ,
        hours_until_shortage NUMERIC(10,2),
        confidence INTEGER NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        recommended_reorder_qty INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_consumption_analysis (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        current_stock INTEGER NOT NULL,
        average_consumption_rate NUMERIC(10,4) NOT NULL,
        standard_deviation NUMERIC(10,4) NOT NULL,
        total_consumed INTEGER NOT NULL,
        total_orders INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const { rows: hasAnalysisWindowOrders } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'predictions' 
      AND column_name = 'analysis_window_orders'
    `);

    if (hasAnalysisWindowOrders.length === 0) {
      await pool.query(`
        ALTER TABLE predictions 
          ADD COLUMN analysis_window_orders INTEGER NOT NULL DEFAULT 100;
      `);
    }

    await pool.query(`
      ALTER TABLE prediction_alerts 
        ADD COLUMN IF NOT EXISTS alert_type VARCHAR(50) NOT NULL DEFAULT 'high_demand',
        ADD COLUMN IF NOT EXISTS orders_using_ingredient NUMERIC(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS purchase_frequency NUMERIC(5,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS market_success_rate NUMERIC(5,2) NOT NULL DEFAULT 100,
        ADD COLUMN IF NOT EXISTS actionable TEXT NOT NULL DEFAULT '';
    `);

    await pool.query(`
      ALTER TABLE prediction_consumption_analysis 
        ADD COLUMN IF NOT EXISTS average_consumption_per_order NUMERIC(10,4) NOT NULL DEFAULT 0;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prediction_purchase_analysis (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
        ingredient TEXT NOT NULL,
        total_purchase_attempts INTEGER NOT NULL DEFAULT 0,
        successful_purchases INTEGER NOT NULL DEFAULT 0,
        failed_purchases INTEGER NOT NULL DEFAULT 0,
        success_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
        total_quantity_requested INTEGER NOT NULL DEFAULT 0,
        total_quantity_received INTEGER NOT NULL DEFAULT 0,
        average_quantity_per_purchase NUMERIC(10,2) NOT NULL DEFAULT 0,
        last_purchase_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      -- Core tables indexes
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

      -- Predictions indexes
      CREATE INDEX IF NOT EXISTS idx_predictions_generated_at 
        ON predictions(generated_at DESC);
        
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_prediction_id 
        ON prediction_alerts(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_ingredient 
        ON prediction_alerts(ingredient);
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_severity 
        ON prediction_alerts(severity);
      CREATE INDEX IF NOT EXISTS idx_prediction_alerts_alert_type 
        ON prediction_alerts(alert_type);
        
      CREATE INDEX IF NOT EXISTS idx_prediction_consumption_prediction_id 
        ON prediction_consumption_analysis(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_prediction_consumption_ingredient 
        ON prediction_consumption_analysis(ingredient);

      CREATE INDEX IF NOT EXISTS idx_prediction_purchase_analysis_prediction_id 
        ON prediction_purchase_analysis(prediction_id);
      CREATE INDEX IF NOT EXISTS idx_prediction_purchase_analysis_ingredient 
        ON prediction_purchase_analysis(ingredient);
    `);

    console.log('🌱 Seeding initial stock...');
    for (const ingredient of INGREDIENTS) {
      await pool.query(
        `INSERT INTO stock(ingredient, qty)
         VALUES($1, 5)
         ON CONFLICT (ingredient) DO NOTHING`,
        [ingredient],
      );
    }

    await pool.query('COMMIT');
    console.log('✅ Database schema ready (8 tables created)');
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

export async function cleanDatabase(pool: Pool): Promise<void> {
  await pool.query(`
    TRUNCATE reservation_items, reservations, market_purchases RESTART IDENTITY CASCADE;
    UPDATE stock SET qty = 5;
  `);
}
