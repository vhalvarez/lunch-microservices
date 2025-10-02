import { Pool } from 'pg';
import { env } from '@lunch/config';
import { createLogger } from '@lunch/logger';

const log = createLogger('database-singleton');

class DatabaseSingleton {
  private static instances: Map<string, DatabaseSingleton> = new Map();
  private pool: Pool;
  private serviceName: string;

  private constructor(serviceName: string, databaseUrl: string) {
    this.serviceName = serviceName;
    this.pool = new Pool({ connectionString: databaseUrl });
    log.info({ service: serviceName }, 'Database pool initialized');
  }

  public static getInstance(serviceName: string = 'default', databaseUrl?: string): DatabaseSingleton {
    if (!DatabaseSingleton.instances.has(serviceName)) {
      const url = databaseUrl || env.DATABASE_URL;
      DatabaseSingleton.instances.set(serviceName, new DatabaseSingleton(serviceName, url));
    }
    return DatabaseSingleton.instances.get(serviceName)!;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      log.info({ service: this.serviceName }, 'Database pool closed');
    } catch (error) {
      log.error({ error, service: this.serviceName }, 'Error closing database pool');
      throw error;
    }
  }

  public static async closeAll(): Promise<void> {
    const closePromises = Array.from(DatabaseSingleton.instances.values()).map((instance) =>
      instance.close(),
    );
    await Promise.all(closePromises);
    DatabaseSingleton.instances.clear();
  }
}

export const getDatabase = (serviceName?: string) => DatabaseSingleton.getInstance(serviceName);
export const getDbPool = (serviceName?: string) => getDatabase(serviceName).getPool();
export const closeDatabase = (serviceName?: string) => getDatabase(serviceName).close();
export const closeAllDatabases = () => DatabaseSingleton.closeAll();
