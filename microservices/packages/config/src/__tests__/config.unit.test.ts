import { describe, it, expect } from 'vitest';
import { EnvSchema } from '../index.js';

describe('Unit - Config: EnvSchema', () => {
  describe('NODE_ENV', () => {
    it('debe aceptar "development"', () => {
      const result = EnvSchema.safeParse({ NODE_ENV: 'development' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });

    it('debe aceptar "test"', () => {
      const result = EnvSchema.safeParse({ NODE_ENV: 'test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('test');
      }
    });

    it('debe aceptar "production"', () => {
      const result = EnvSchema.safeParse({ NODE_ENV: 'production' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('production');
      }
    });

    it('debe usar "development" como default', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });

    it('debe rechazar valor inválido', () => {
      const result = EnvSchema.safeParse({ NODE_ENV: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('Infrastructure URLs - Defaults', () => {
    it('debe usar default para AMQP_URL', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AMQP_URL).toBe('amqp://guest:guest@localhost');
      }
    });

    it('debe usar default para DATABASE_URL', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_URL).toBe('postgres://postgres:postgres@localhost:5432/lunchday');
      }
    });

    it('debe usar default para REDIS_URL', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.REDIS_URL).toBe('redis://localhost:6379');
      }
    });

    it('debe aceptar AMQP_URL custom', () => {
      const result = EnvSchema.safeParse({ AMQP_URL: 'amqp://user:pass@rabbitmq:5672' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AMQP_URL).toBe('amqp://user:pass@rabbitmq:5672');
      }
    });
  });

  describe('RabbitMQ Config', () => {
    it('debe usar default 100 para RMQ_PREFETCH', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.RMQ_PREFETCH).toBe(100);
      }
    });

    it('debe coerce string a number para RMQ_PREFETCH', () => {
      const result = EnvSchema.safeParse({ RMQ_PREFETCH: '50' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.RMQ_PREFETCH).toBe(50);
      }
    });

    it('debe rechazar RMQ_PREFETCH menor a 1', () => {
      const result = EnvSchema.safeParse({ RMQ_PREFETCH: '0' });
      expect(result.success).toBe(false);
    });

    it('debe rechazar RMQ_PREFETCH negativo', () => {
      const result = EnvSchema.safeParse({ RMQ_PREFETCH: '-5' });
      expect(result.success).toBe(false);
    });
  });

  describe('Market Config', () => {
    it('debe usar defaults para configuración de Market', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.MARKET_URL).toBe('https://recruitment.alegra.com/api/farmers-market');
        expect(result.data.MARKET_MAX_ATTEMPTS).toBe(6);
        expect(result.data.MARKET_BASE_BACKOFF_MS).toBe(150);
        expect(result.data.MARKET_CONCURRENCY).toBe(64);
        expect(result.data.MARKET_HTTP_CONN).toBe(32);
      }
    });

    it('debe aceptar valores custom para Market', () => {
      const result = EnvSchema.safeParse({
        MARKET_URL: 'https://custom-market.com',
        MARKET_MAX_ATTEMPTS: '10',
        MARKET_BASE_BACKOFF_MS: '200',
        MARKET_CONCURRENCY: '100',
        MARKET_HTTP_CONN: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.MARKET_URL).toBe('https://custom-market.com');
        expect(result.data.MARKET_MAX_ATTEMPTS).toBe(10);
        expect(result.data.MARKET_BASE_BACKOFF_MS).toBe(200);
        expect(result.data.MARKET_CONCURRENCY).toBe(100);
        expect(result.data.MARKET_HTTP_CONN).toBe(50);
      }
    });

    it('debe rechazar MARKET_MAX_ATTEMPTS menor a 1', () => {
      const result = EnvSchema.safeParse({ MARKET_MAX_ATTEMPTS: '0' });
      expect(result.success).toBe(false);
    });
  });

  describe('Reconciler Config', () => {
    it('debe usar defaults para configuración de Reconciler', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.RECONCILER_MAX_RETRIES).toBe(6);
        expect(result.data.RECONCILER_EVERY_MS).toBe(15_000);
        expect(result.data.RECONCILER_BASE_DELAY_MIN).toBe(1);
        expect(result.data.RECONCILER_BATCH_LIMIT).toBe(200);
        expect(result.data.RECONCILER_BASE_SECONDS).toBe(3);
      }
    });

    it('debe coerce strings a numbers para Reconciler', () => {
      const result = EnvSchema.safeParse({
        RECONCILER_MAX_RETRIES: '10',
        RECONCILER_EVERY_MS: '30000',
        RECONCILER_BASE_DELAY_MIN: '5',
        RECONCILER_BATCH_LIMIT: '500',
        RECONCILER_BASE_SECONDS: '10',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.RECONCILER_MAX_RETRIES).toBe(10);
        expect(result.data.RECONCILER_EVERY_MS).toBe(30000);
        expect(result.data.RECONCILER_BASE_DELAY_MIN).toBe(5);
        expect(result.data.RECONCILER_BATCH_LIMIT).toBe(500);
        expect(result.data.RECONCILER_BASE_SECONDS).toBe(10);
      }
    });

    it('debe rechazar RECONCILER_MAX_RETRIES negativo', () => {
      const result = EnvSchema.safeParse({ RECONCILER_MAX_RETRIES: '-1' });
      expect(result.success).toBe(false);
    });

    it('debe aceptar RECONCILER_MAX_RETRIES en 0', () => {
      const result = EnvSchema.safeParse({ RECONCILER_MAX_RETRIES: '0' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.RECONCILER_MAX_RETRIES).toBe(0);
      }
    });

    it('debe rechazar RECONCILER_EVERY_MS menor a 100', () => {
      const result = EnvSchema.safeParse({ RECONCILER_EVERY_MS: '50' });
      expect(result.success).toBe(false);
    });
  });

  describe('Order/BFF Config', () => {
    it('debe usar defaults para Order/BFF', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ORDER_BATCH_SIZE).toBe(100);
        expect(result.data.BFF_PORT).toBe(4000);
        expect(result.data.BFF_PREFIX).toBe('/api/v1');
      }
    });

    it('debe aceptar valores custom para Order/BFF', () => {
      const result = EnvSchema.safeParse({
        ORDER_BATCH_SIZE: '200',
        BFF_PORT: '8080',
        BFF_PREFIX: '/v2',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ORDER_BATCH_SIZE).toBe(200);
        expect(result.data.BFF_PORT).toBe(8080);
        expect(result.data.BFF_PREFIX).toBe('/v2');
      }
    });

    it('debe rechazar ORDER_BATCH_SIZE menor a 1', () => {
      const result = EnvSchema.safeParse({ ORDER_BATCH_SIZE: '0' });
      expect(result.success).toBe(false);
    });

    it('debe rechazar BFF_PORT menor a 1', () => {
      const result = EnvSchema.safeParse({ BFF_PORT: '0' });
      expect(result.success).toBe(false);
    });
  });

  describe('Predictor AI Config', () => {
    it('debe usar defaults para Predictor', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ANALYSIS_WINDOW_HOURS).toBe(1);
        expect(result.data.MIN_ORDERS_BATCH).toBe(10);
        expect(result.data.DEBOUNCE_MS).toBe(5000);
        expect(result.data.FORCE_ANALYSIS_INTERVAL_MS).toBe(60000);
        expect(result.data.CLEANUP_INTERVAL_MS).toBe(3_600_000);
        expect(result.data.KEEP_PREDICTIONS_COUNT).toBe(100);
      }
    });

    it('debe coerce strings a numbers para Predictor', () => {
      const result = EnvSchema.safeParse({
        ANALYSIS_WINDOW_HOURS: '2',
        MIN_ORDERS_BATCH: '20',
        DEBOUNCE_MS: '10000',
        FORCE_ANALYSIS_INTERVAL_MS: '120000',
        CLEANUP_INTERVAL_MS: '7200000',
        KEEP_PREDICTIONS_COUNT: '200',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ANALYSIS_WINDOW_HOURS).toBe(2);
        expect(result.data.MIN_ORDERS_BATCH).toBe(20);
        expect(result.data.DEBOUNCE_MS).toBe(10000);
        expect(result.data.FORCE_ANALYSIS_INTERVAL_MS).toBe(120000);
        expect(result.data.CLEANUP_INTERVAL_MS).toBe(7200000);
        expect(result.data.KEEP_PREDICTIONS_COUNT).toBe(200);
      }
    });

    it('debe rechazar DEBOUNCE_MS menor a 1000', () => {
      const result = EnvSchema.safeParse({ DEBOUNCE_MS: '500' });
      expect(result.success).toBe(false);
    });

    it('debe rechazar FORCE_ANALYSIS_INTERVAL_MS menor a 10000', () => {
      const result = EnvSchema.safeParse({ FORCE_ANALYSIS_INTERVAL_MS: '5000' });
      expect(result.success).toBe(false);
    });

    it('debe rechazar CLEANUP_INTERVAL_MS menor a 60000', () => {
      const result = EnvSchema.safeParse({ CLEANUP_INTERVAL_MS: '30000' });
      expect(result.success).toBe(false);
    });
  });

  describe('Groq AI Provider', () => {
    it('debe usar defaults para Groq', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GROQ_ENABLED).toBe(false);
        expect(result.data.GROQ_API_KEY).toBeUndefined();
        expect(result.data.GROQ_MODEL).toBe('llama3-70b-8192');
      }
    });

    it('debe coerce string "true" a boolean true para GROQ_ENABLED', () => {
      const result = EnvSchema.safeParse({ GROQ_ENABLED: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GROQ_ENABLED).toBe(true);
      }
    });

    it('debe coerce string vacía a boolean false para GROQ_ENABLED', () => {
      const result = EnvSchema.safeParse({ GROQ_ENABLED: '' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GROQ_ENABLED).toBe(false);
      }
    });

    it('debe coerce número 1 a boolean true para GROQ_ENABLED', () => {
      const result = EnvSchema.safeParse({ GROQ_ENABLED: '1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GROQ_ENABLED).toBe(true);
      }
    });

    it('debe aceptar GROQ_API_KEY opcional', () => {
      const result = EnvSchema.safeParse({ GROQ_API_KEY: 'test-api-key-123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GROQ_API_KEY).toBe('test-api-key-123');
      }
    });

    it('debe aceptar GROQ_MODEL custom', () => {
      const result = EnvSchema.safeParse({ GROQ_MODEL: 'llama3-8b-8192' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GROQ_MODEL).toBe('llama3-8b-8192');
      }
    });
  });

  describe('Schema completo', () => {
    it('debe validar configuración completa válida', () => {
      const fullConfig = {
        NODE_ENV: 'production',
        AMQP_URL: 'amqp://user:pass@rabbitmq:5672',
        DATABASE_URL: 'postgres://user:pass@db:5432/lunchday',
        REDIS_URL: 'redis://redis:6379',
        RMQ_PREFETCH: '200',
        MARKET_URL: 'https://market.com',
        MARKET_MAX_ATTEMPTS: '5',
        MARKET_BASE_BACKOFF_MS: '100',
        MARKET_CONCURRENCY: '50',
        MARKET_HTTP_CONN: '25',
        RECONCILER_MAX_RETRIES: '3',
        RECONCILER_EVERY_MS: '20000',
        RECONCILER_BASE_DELAY_MIN: '2',
        RECONCILER_BATCH_LIMIT: '100',
        RECONCILER_BASE_SECONDS: '5',
        ORDER_BATCH_SIZE: '150',
        BFF_PORT: '4000',
        BFF_PREFIX: '/api/v2',
        ANALYSIS_WINDOW_HOURS: '3',
        MIN_ORDERS_BATCH: '15',
        DEBOUNCE_MS: '3000',
        FORCE_ANALYSIS_INTERVAL_MS: '90000',
        CLEANUP_INTERVAL_MS: '1800000',
        KEEP_PREDICTIONS_COUNT: '50',
        GROQ_ENABLED: 'true',
        GROQ_API_KEY: 'test-key',
        GROQ_MODEL: 'llama3-8b',
      };

      const result = EnvSchema.safeParse(fullConfig);
      expect(result.success).toBe(true);
    });

    it('debe aplicar todos los defaults cuando no se proveen valores', () => {
      const result = EnvSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});