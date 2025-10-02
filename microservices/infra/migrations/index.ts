import { runMigrations, rollbackLastMigration, showMigrationStatus } from './runner.js';
import * as migration001 from './001_core_tables.js';
import * as migration002 from './002_predictions_legacy.js';
import * as migration003 from './003_predictions_refactor.js';
import * as migration004 from './004_add_purchasing_status.js';

const migrations = [
  {
    id: '001',
    name: 'Core tables (stock, reservations, market_purchases)',
    up: migration001.up,
    down: migration001.down,
  },
  {
    id: '002',
    name: 'Predictions tables (legacy)',
    up: migration002.up,
    down: migration002.down,
  },
  {
    id: '003',
    name: 'Predictions refactor (order-based model)',
    up: migration003.up,
    down: migration003.down,
  },
  {
    id: '004',
    name: 'Add purchasing status to prevent duplicate purchases',
    up: migration004.up,
    down: migration004.down,
  },
];

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'up':
    case 'migrate':
      console.log('🚀 Running migrations...\n');
      await runMigrations(migrations);
      break;

    case 'down':
    case 'rollback':
      console.log('⏪ Rolling back last migration...\n');
      await rollbackLastMigration(migrations);
      break;

    case 'status':
      await showMigrationStatus(migrations);
      break;

    case 'help':
    default:
      console.log(`
📦 Database Migration Tool

Usage: pnpm migrate <command>

Commands:
  up, migrate    Run all pending migrations
  down, rollback Rollback the last applied migration
  status         Show migration status
  help           Show this help message

Examples:
  pnpm migrate up       # Run all pending migrations
  pnpm migrate status   # Check which migrations are applied
  pnpm migrate rollback # Undo last migration
      `);
      break;
  }
}

main()
  .then(() => {
    console.log('\n✅ Done\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  });
