import { describe, it, expect, beforeEach } from 'vitest';
import RedisMock from 'ioredis-mock';
import { withIdempotency } from '../index.js';

describe('Integration - Redis: withIdempotency', () => {
  let redis: InstanceType<typeof RedisMock>;

  beforeEach(() => {
    redis = new RedisMock();
  });

  it('debe ejecutar función la primera vez', async () => {
    let executed = false;
    const messageId = 'test-message-1';

    await withIdempotency(redis, messageId, 60, async () => {
      executed = true;
    });

    expect(executed).toBe(true);
  });

  it('NO debe ejecutar función si messageId ya existe', async () => {
    let executionCount = 0;
    const messageId = 'test-message-2';

    await withIdempotency(redis, messageId, 60, async () => {
      executionCount++;
    });

    await withIdempotency(redis, messageId, 60, async () => {
      executionCount++;
    });

    expect(executionCount).toBe(1);
  });

  it('debe guardar messageId en Redis con prefijo "idem:"', async () => {
    const messageId = 'test-message-3';

    await withIdempotency(redis, messageId, 60, async () => {
      // no-op
    });

    const value = await redis.get(`idem:${messageId}`);
    expect(value).toBe('1');
  });

  it('debe configurar TTL correctamente', async () => {
    const messageId = 'test-message-4';
    const ttl = 120;

    await withIdempotency(redis, messageId, ttl, async () => {
      // no-op
    });

    const actualTtl = await redis.ttl(`idem:${messageId}`);
    expect(actualTtl).toBe(ttl);
  });

  it('debe permitir re-ejecución después de que expire el TTL', async () => {
    let executionCount = 0;
    const messageId = 'test-message-5';

    await withIdempotency(redis, messageId, 1, async () => {
      executionCount++;
    });

    await redis.del(`idem:${messageId}`);

    await withIdempotency(redis, messageId, 1, async () => {
      executionCount++;
    });

    expect(executionCount).toBe(2);
  });

  it('debe manejar múltiples messageIds diferentes', async () => {
    let count1 = 0;
    let count2 = 0;
    let count3 = 0;

    await withIdempotency(redis, 'msg-1', 60, async () => {
      count1++;
    });

    await withIdempotency(redis, 'msg-2', 60, async () => {
      count2++;
    });

    await withIdempotency(redis, 'msg-3', 60, async () => {
      count3++;
    });

    expect(count1).toBe(1);
    expect(count2).toBe(1);
    expect(count3).toBe(1);
  });

  it('debe ejecutar función async correctamente', async () => {
    let result = 0;
    const messageId = 'test-message-6';

    await withIdempotency(redis, messageId, 60, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      result = 42;
    });

    expect(result).toBe(42);
  });

  it('debe retornar void cuando función se ejecuta', async () => {
    const messageId = 'test-message-7';

    const returnValue = await withIdempotency(redis, messageId, 60, async () => {
      // no-op
    });

    expect(returnValue).toBeUndefined();
  });

  it('debe retornar void cuando función NO se ejecuta (ya existe)', async () => {
    const messageId = 'test-message-8';

    await withIdempotency(redis, messageId, 60, async () => {
      // no-op
    });

    const returnValue = await withIdempotency(redis, messageId, 60, async () => {
      throw new Error('No debería ejecutarse');
    });

    expect(returnValue).toBeUndefined();
  });

  it('debe manejar errores en la función sin guardar en Redis', async () => {
    const messageId = 'test-message-9';
    let executionCount = 0;

    try {
      await withIdempotency(redis, messageId, 60, async () => {
        executionCount++;
        throw new Error('Error intencional');
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(executionCount).toBe(1);

    const value = await redis.get(`idem:${messageId}`);
    expect(value).toBe('1');
  });

  it('debe manejar TTL de 0 segundos', async () => {
    const messageId = 'test-message-10';
    let executed = false;

    await withIdempotency(redis, messageId, 0, async () => {
      executed = true;
    });

    expect(executed).toBe(true);
    const ttl = await redis.ttl(`idem:${messageId}`);
    expect(ttl).toBeLessThanOrEqual(0);
  });

  it('debe trabajar con messageIds con caracteres especiales', async () => {
    const messageIds = [
      'msg-with-dashes',
      'msg_with_underscores',
      'msg.with.dots',
      'msg:with:colons',
      '550e8400-e29b-41d4-a716-446655440000',
    ];

    for (const messageId of messageIds) {
      let executed = false;
      await withIdempotency(redis, messageId, 60, async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    }
  });

  it('debe ser thread-safe (simular concurrencia)', async () => {
    const messageId = 'concurrent-test';
    let executionCount = 0;

    const promises = Array.from({ length: 5 }, () =>
      withIdempotency(redis, messageId, 60, async () => {
        executionCount++;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }),
    );

    await Promise.all(promises);

    expect(executionCount).toBe(1);
  });
});