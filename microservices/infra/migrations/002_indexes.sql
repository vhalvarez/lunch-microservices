-- Migration: Add performance indexes
-- Created: 2026-01-26

-- Index for reservations filtering by status and retry logic
CREATE INDEX IF NOT EXISTS idx_reservations_status_retry
  ON reservations (status, last_retry_at)
  WHERE status IN ('pending', 'purchasing');

-- Index for reservation items lookups by plate_id
CREATE INDEX IF NOT EXISTS idx_reservation_items_plate_id
  ON reservation_items (plate_id);

-- Index for market purchases lookups by plate and ingredient
CREATE INDEX IF NOT EXISTS idx_market_purchases_plate_ingredient
  ON market_purchases (plate_id, ingredient);

-- Index for created_at ordering (common in queries)
CREATE INDEX IF NOT EXISTS idx_reservations_created_at
  ON reservations (created_at DESC);

COMMENT ON INDEX idx_reservations_status_retry IS 'Optimizes reconciler queries filtering pending/purchasing reservations';
COMMENT ON INDEX idx_reservation_items_plate_id IS 'Optimizes joins and lookups by plate_id';
COMMENT ON INDEX idx_market_purchases_plate_ingredient IS 'Optimizes market purchase history queries';
COMMENT ON INDEX idx_reservations_created_at IS 'Optimizes time-ordered queries';
