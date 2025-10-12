import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { createPool, withTx } from '../index.js';

describe('Integration - DB: withTx', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;

  beforeAll(async () => {
    console.log('Starting PostgreSQL container...');

    container = await new PostgreSqlContainer('postgres:16-alpine').withExposedPorts(5432).start();

    console.log('✅ PostgreSQL container started');

    const connectionString = container.getConnectionUri();
    pool = createPool(connectionString);

    await pool.query(`
      CREATE TABLE test_users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✅ Test table created');
  }, 60000);

  beforeEach(async () => {
    await pool.query('TRUNCATE test_users RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
    console.log('🛑 PostgreSQL container stopped');
  }, 30000);

  it('debe hacer COMMIT cuando la función tiene éxito', async () => {
    const result = await withTx(pool, async (client) => {
      await client.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
        'John Doe',
        'john@example.com',
      ]);
      return 'success';
    });

    expect(result).toBe('success');

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('John Doe');
    expect(rows[0].email).toBe('john@example.com');
  });

  it('debe hacer ROLLBACK cuando la función falla', async () => {
    try {
      await withTx(pool, async (client) => {
        await client.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
          'Jane Doe',
          'jane@example.com',
        ]);
        throw new Error('Intencional error');
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Intencional error');
    }

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(0);
  });

  it('debe retornar el valor de la función', async () => {
    const result = await withTx(pool, async (client) => {
      const { rows } = await client.query(
        'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id',
        ['Bob Smith', 'bob@example.com'],
      );
      return rows[0].id;
    });

    expect(typeof result).toBe('number');
    expect(result).toBe(1);
  });

  it('debe propagar errores correctamente', async () => {
    const errorMessage = 'Custom database error';

    await expect(
      withTx(pool, async (client) => {
        await client.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
          'Test',
          'test@example.com',
        ]);
        throw new Error(errorMessage);
      }),
    ).rejects.toThrow(errorMessage);

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(0);
  });

  it('debe permitir múltiples operaciones en la misma transacción', async () => {
    const insertedIds = await withTx(pool, async (client) => {
      const result1 = await client.query(
        'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id',
        ['User 1', 'user1@example.com'],
      );
      const result2 = await client.query(
        'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id',
        ['User 2', 'user2@example.com'],
      );
      const result3 = await client.query(
        'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id',
        ['User 3', 'user3@example.com'],
      );

      return [result1.rows[0].id, result2.rows[0].id, result3.rows[0].id];
    });

    expect(insertedIds).toHaveLength(3);

    const { rows } = await pool.query('SELECT * FROM test_users ORDER BY id');
    expect(rows).toHaveLength(3);
    expect(rows[0].name).toBe('User 1');
    expect(rows[1].name).toBe('User 2');
    expect(rows[2].name).toBe('User 3');
  });

  it('debe hacer ROLLBACK si una de múltiples operaciones falla', async () => {
    try {
      await withTx(pool, async (client) => {
        await client.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
          'User 1',
          'user1@example.com',
        ]);
        await client.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
          'User 2',
          'user2@example.com',
        ]);

        throw new Error('Failed operation');
      });
    } catch (error) {
      // esperado
    }

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(0);
  });

  it('debe manejar queries que retornan datos', async () => {
    await pool.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
      'Existing User',
      'existing@example.com',
    ]);

    const result = await withTx(pool, async (client) => {
      const { rows } = await client.query('SELECT * FROM test_users WHERE name = $1', [
        'Existing User',
      ]);
      return rows;
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Existing User');
    expect(result[0].email).toBe('existing@example.com');
  });

  it('debe manejar UPDATE dentro de transacción', async () => {
    const { rows: inserted } = await pool.query(
      'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id',
      ['Old Name', 'old@example.com'],
    );
    const userId = inserted[0].id;

    await withTx(pool, async (client) => {
      await client.query('UPDATE test_users SET name = $1 WHERE id = $2', ['New Name', userId]);
    });

    const { rows } = await pool.query('SELECT * FROM test_users WHERE id = $1', [userId]);
    expect(rows[0].name).toBe('New Name');
    expect(rows[0].email).toBe('old@example.com');
  });

  it('debe hacer ROLLBACK de UPDATE si falla', async () => {
    const { rows: inserted } = await pool.query(
      'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING id',
      ['Original Name', 'original@example.com'],
    );
    const userId = inserted[0].id;

    try {
      await withTx(pool, async (client) => {
        await client.query('UPDATE test_users SET name = $1 WHERE id = $2', [
          'Updated Name',
          userId,
        ]);
        throw new Error('Update failed');
      });
    } catch (error) {
      // esperado
    }

    const { rows } = await pool.query('SELECT * FROM test_users WHERE id = $1', [userId]);
    expect(rows[0].name).toBe('Original Name');
  });

  it('debe manejar DELETE dentro de transacción', async () => {
    await pool.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
      'User 1',
      'user1@example.com',
    ]);
    await pool.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
      'User 2',
      'user2@example.com',
    ]);

    await withTx(pool, async (client) => {
      await client.query('DELETE FROM test_users WHERE name = $1', ['User 1']);
    });

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('User 2');
  });

  it('debe hacer ROLLBACK de DELETE si falla', async () => {
    await pool.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
      'User 1',
      'user1@example.com',
    ]);
    await pool.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
      'User 2',
      'user2@example.com',
    ]);

    try {
      await withTx(pool, async (client) => {
        await client.query('DELETE FROM test_users WHERE name = $1', ['User 1']);
        throw new Error('Delete failed');
      });
    } catch (error) {
      // esperado
    }

    const { rows } = await pool.query('SELECT * FROM test_users ORDER BY name');
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('User 1');
    expect(rows[1].name).toBe('User 2');
  });

  it('debe retornar diferentes tipos de datos', async () => {
    const stringResult = await withTx(pool, async () => 'test string');
    expect(stringResult).toBe('test string');

    const numberResult = await withTx(pool, async () => 42);
    expect(numberResult).toBe(42);

    const objectResult = await withTx(pool, async () => ({ id: 1, name: 'test' }));
    expect(objectResult).toEqual({ id: 1, name: 'test' });

    const arrayResult = await withTx(pool, async () => [1, 2, 3]);
    expect(arrayResult).toEqual([1, 2, 3]);

    const nullResult = await withTx(pool, async () => null);
    expect(nullResult).toBeNull();

    const undefinedResult = await withTx(pool, async () => undefined);
    expect(undefinedResult).toBeUndefined();
  });

  it('debe manejar error de SQL inválido', async () => {
    await expect(
      withTx(pool, async (client) => {
        await client.query('INVALID SQL STATEMENT HERE');
      }),
    ).rejects.toThrow();

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(0);
  });

  it('debe manejar constraint violations con ROLLBACK', async () => {
    await pool.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
      'Test User',
      'test@example.com',
    ]);

    await expect(
      withTx(pool, async (client) => {
        await client.query('INSERT INTO test_users (name, email) VALUES ($1, $2)', [
          'Another User',
          'another@example.com',
        ]);

        throw new Error('duplicate key value violates unique constraint');
      }),
    ).rejects.toThrow();

    const { rows } = await pool.query('SELECT * FROM test_users');
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Test User');
  });
});
