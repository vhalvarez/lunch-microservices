import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

export interface TestInfrastructure {
  postgres: StartedPostgreSqlContainer;
  rabbitmq: StartedRabbitMQContainer;
  redis: StartedTestContainer;
}

export async function startInfrastructure(): Promise<TestInfrastructure> {
  console.log('🚀 Starting test infrastructure...');

  console.log('  📦 Starting PostgreSQL...');
  const postgres = await new PostgreSqlContainer('postgres:16-alpine')
    .withExposedPorts(5432)
    .start();
  console.log('  ✅ PostgreSQL started');

  console.log('  🐰 Starting RabbitMQ...');
  const rabbitmq = await new RabbitMQContainer('rabbitmq:3.12-alpine')
    .withExposedPorts(5672)
    .start();
  console.log('  ✅ RabbitMQ started');

  console.log('  🔴 Starting Redis...');
  const redis = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();
  console.log('  ✅ Redis started');

  console.log('✅ All infrastructure started');

  return { postgres, rabbitmq, redis };
}

export async function stopInfrastructure(infra: TestInfrastructure): Promise<void> {
  console.log('🛑 Stopping test infrastructure...');

  await infra.postgres?.stop();
  await infra.rabbitmq?.stop();
  await infra.redis?.stop();

  console.log('✅ Infrastructure stopped');
}

export function getEnvironmentVariables(infra: TestInfrastructure): Record<string, string> {
  return {
    NODE_ENV: 'test',
    DATABASE_URL: infra.postgres.getConnectionUri(),
    AMQP_URL: infra.rabbitmq.getAmqpUrl(),
    REDIS_URL: `redis://${infra.redis.getHost()}:${infra.redis.getMappedPort(6379)}`,
    RMQ_PREFETCH: '10',
    BFF_PORT: '1500',
    LOG_LEVEL: 'error',
  };
}
