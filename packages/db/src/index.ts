import pg from 'pg';
const { Pool } = pg;

export function createPool(connectionString: string) {
  return new Pool({ connectionString });
}

export async function withTx<T>(pool: pg.Pool, fn: (cx: pg.PoolClient) => Promise<T>): Promise<T> {
  const cx = await pool.connect();
  try {
    await cx.query('BEGIN');
    const out = await fn(cx);
    await cx.query('COMMIT');
    return out;
  } catch (e) {
    try {
      await cx.query('ROLLBACK');
    } catch {}
    throw e;
  } finally {
    cx.release();
  }
}

export type { Pool, PoolClient } from 'pg';
