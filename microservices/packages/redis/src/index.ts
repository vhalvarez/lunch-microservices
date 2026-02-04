import Redis from 'ioredis';
export type { Redis } from 'ioredis';

export function createRedis(url: string) {
  return new Redis(url);
}

export async function withIdempotency(
  redis: Redis,
  messageId: string,
  ttlSeconds: number,
  fn: () => Promise<void>,
): Promise<void> {
  const ok = await redis.set(`idem:${messageId}`, '1', 'EX', ttlSeconds, 'NX');
  if (!ok) return;
  await fn();
}
