import { getDbPool, closeDatabase } from '@lunch/db';
import { createLogger } from '@lunch/logger';

const log = createLogger('migration-004');

/**
 * Migración 004: Agregar estado 'purchasing' para evitar compras duplicadas
 */
export async function up() {
  const pool = getDbPool('migration-004');

  try {
    log.info('Running migration 004: Add purchasing status');

    await pool.query('BEGIN');

    // Eliminar el constraint viejo
    await pool.query(`
      ALTER TABLE reservations 
      DROP CONSTRAINT IF EXISTS reservations_status_check;
    `);

    // Agregar el nuevo constraint con 'purchasing'
    await pool.query(`
      ALTER TABLE reservations 
      ADD CONSTRAINT reservations_status_check 
      CHECK (status IN ('pending', 'purchasing', 'reserved', 'failed'));
    `);

    await pool.query('COMMIT');
    log.info('✅ Migration 004 completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Migration 004 failed');
    throw error;
  } finally {
    await closeDatabase('migration-004');
  }
}

/**
 * Rollback de la migración 004
 */
export async function down() {
  const pool = getDbPool('migration-004-down');

  try {
    log.info('Rolling back migration 004');

    await pool.query('BEGIN');

    // Volver reservas 'purchasing' a 'pending'
    await pool.query(`
      UPDATE reservations 
      SET status = 'pending' 
      WHERE status = 'purchasing';
    `);

    // Eliminar el constraint con 'purchasing'
    await pool.query(`
      ALTER TABLE reservations 
      DROP CONSTRAINT IF EXISTS reservations_status_check;
    `);

    // Restaurar el constraint original
    await pool.query(`
      ALTER TABLE reservations 
      ADD CONSTRAINT reservations_status_check 
      CHECK (status IN ('pending', 'reserved', 'failed'));
    `);

    await pool.query('COMMIT');
    log.info('✅ Migration 004 rolled back successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Rollback 004 failed');
    throw error;
  } finally {
    await closeDatabase('migration-004-down');
  }
}
