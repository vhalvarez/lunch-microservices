import type { createLogger } from '@lunch/logger';
import type { Bus } from '@lunch/messaging';
import type { getDbPool } from '@lunch/db';

export type DbPool = ReturnType<typeof getDbPool>;
export type Logger = ReturnType<typeof createLogger>;

export interface RouteContext {
  bus: Bus;
  pool: DbPool;
  log: Logger;
}
