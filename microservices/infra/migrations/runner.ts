import { getDbPool, closeDatabase } from '@lunch/db';
import { createLogger } from '@lunch/logger';
import { env } from '@lunch/config';

const log = createLogger('migration-runner');

interface Migration {
  id: string;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

/**
 * Tabla de control de migraciones
 */
async function ensureMigrationTable() {
  const pool = getDbPool('migration-control');
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_id VARCHAR(50) UNIQUE NOT NULL,
        migration_name TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_id 
        ON schema_migrations(migration_id);
    `);
  } catch (error) {
    throw error;
  }
}

/**
 * Verifica si una migración ya fue aplicada
 */
async function isMigrationApplied(migrationId: string): Promise<boolean> {
  const pool = getDbPool('migration-check');
  
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE migration_id = $1',
      [migrationId],
    );
    return rows.length > 0;
  } catch (error) {
    // Si la tabla no existe, retornar false
    return false;
  }
}

/**
 * Marca una migración como aplicada
 */
async function markMigrationApplied(migrationId: string, migrationName: string) {
  const pool = getDbPool('migration-mark');
  
  try {
    await pool.query(
      'INSERT INTO schema_migrations (migration_id, migration_name) VALUES ($1, $2)',
      [migrationId, migrationName],
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Desmarca una migración
 */
async function unmarkMigration(migrationId: string) {
  const pool = getDbPool('migration-unmark');
  
  try {
    await pool.query(
      'DELETE FROM schema_migrations WHERE migration_id = $1',
      [migrationId],
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Ejecuta las migraciones pendientes
 */
export async function runMigrations(migrations: Migration[]) {
  log.info({ total: migrations.length }, 'Starting migrations');

  await ensureMigrationTable();

  let applied = 0;
  let skipped = 0;

  for (const migration of migrations) {
    const alreadyApplied = await isMigrationApplied(migration.id);

    if (alreadyApplied) {
      log.info({ id: migration.id, name: migration.name }, 'Migration already applied, skipping');
      skipped++;
      continue;
    }

    try {
      log.info({ id: migration.id, name: migration.name }, 'Running migration');
      
      await migration.up();
      await markMigrationApplied(migration.id, migration.name);
      
      log.info({ id: migration.id, name: migration.name }, '✅ Migration completed');
      applied++;
    } catch (error) {
      log.error({ id: migration.id, name: migration.name, error }, '❌ Migration failed');
      throw error;
    }
  }

  log.info({ applied, skipped, total: migrations.length }, '✅ All migrations completed');
}

/**
 * Revierte la última migración
 */
export async function rollbackLastMigration(migrations: Migration[]) {
  const pool = getDbPool('migration-rollback-check');
  
  try {
    const { rows } = await pool.query(`
      SELECT migration_id, migration_name 
      FROM schema_migrations 
      ORDER BY applied_at DESC 
      LIMIT 1
    `);

    if (rows.length === 0) {
      log.info('No migrations to rollback');
      return;
    }

    const lastMigration = rows[0];
    const migration = migrations.find((m) => m.id === lastMigration.migration_id);

    if (!migration) {
      log.error({ id: lastMigration.migration_id }, 'Migration definition not found');
      throw new Error(`Migration ${lastMigration.migration_id} not found`);
    }

    log.info(
      { id: migration.id, name: migration.name },
      'Rolling back migration',
    );

    await migration.down();
    await unmarkMigration(migration.id);

    log.info({ id: migration.id, name: migration.name }, '✅ Migration rolled back');
  } catch (error) {
    throw error;
  }
}

/**
 * Muestra el estado de las migraciones
 */
export async function showMigrationStatus(migrations: Migration[]) {
  await ensureMigrationTable();

  console.log('\n📊 Migration Status\n');
  console.log('ID'.padEnd(10), '│', 'Name'.padEnd(40), '│', 'Status');
  console.log('─'.repeat(10), '┼', '─'.repeat(40), '┼', '─'.repeat(15));

  for (const migration of migrations) {
    const applied = await isMigrationApplied(migration.id);
    const status = applied ? '✅ Applied' : '⏳ Pending';
    
    console.log(
      migration.id.padEnd(10),
      '│',
      migration.name.substring(0, 40).padEnd(40),
      '│',
      status,
    );
  }

  console.log();
}
