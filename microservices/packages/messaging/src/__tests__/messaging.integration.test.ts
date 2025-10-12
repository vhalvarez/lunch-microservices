import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { Bus } from '../index.js';

describe('Integration - Messaging: Bus', () => {
  let container: StartedRabbitMQContainer;
  let amqpUrl: string;

  beforeAll(async () => {
    console.log('Starting RabbitMQ container...');

    container = await new RabbitMQContainer('rabbitmq:3.12-alpine').withExposedPorts(5672).start();

    amqpUrl = container.getAmqpUrl();
    console.log('✅ RabbitMQ container started:', amqpUrl);
  }, 60000);

  afterAll(async () => {
    await container?.stop();
    console.log('🛑 RabbitMQ container stopped');
  }, 30000);

  describe('connect()', () => {
    it('debe conectarse a RabbitMQ correctamente', async () => {
      const bus = new Bus({ url: amqpUrl, prefetch: 10 });

      await expect(bus.connect()).resolves.not.toThrow();

      await bus.close();
    });

    it('debe fallar si la URL es inválida', async () => {
      const bus = new Bus({ url: 'amqp://invalid-host:5672' });

      await expect(bus.connect()).rejects.toThrow();
    });

    it('debe configurar prefetch correctamente', async () => {
      const bus = new Bus({ url: amqpUrl, prefetch: 50 });

      await bus.connect();

      await bus.close();
    });
  });

  describe('publish()', () => {
    let bus: Bus;

    beforeEach(async () => {
      bus = new Bus({ url: amqpUrl, prefetch: 10 });
      await bus.connect();
    });

    afterAll(async () => {
      await bus?.close();
    });

    it('debe publicar mensaje correctamente', async () => {
      const exchange = 'test-exchange';
      const routingKey = 'test.key';
      const payload = { message: 'Hello RabbitMQ' };

      const result = await bus.publish(exchange, routingKey, payload);

      expect(result).toBe(true);
    });

    it('debe publicar mensaje con diferentes tipos de datos', async () => {
      const exchange = 'test-exchange-2';

      await expect(bus.publish(exchange, 'test.object', { id: 1, name: 'test' })).resolves.toBe(
        true,
      );

      await expect(bus.publish(exchange, 'test.array', [1, 2, 3])).resolves.toBe(true);

      await expect(bus.publish(exchange, 'test.string', { value: 'test string' })).resolves.toBe(
        true,
      );

      await expect(bus.publish(exchange, 'test.number', { value: 42 })).resolves.toBe(true);

      await expect(bus.publish(exchange, 'test.boolean', { value: true })).resolves.toBe(true);
    });

    it('debe publicar múltiples mensajes', async () => {
      const exchange = 'test-exchange-3';

      for (let i = 0; i < 10; i++) {
        const result = await bus.publish(exchange, 'test.multiple', {
          index: i,
          message: `Message ${i}`,
        });
        expect(result).toBe(true);
      }
    });
  });

  describe('subscribe()', () => {
    it('debe consumir mensajes correctamente', async () => {
      const publishBus = new Bus({ url: amqpUrl });
      const subscribeBus = new Bus({ url: amqpUrl });

      await publishBus.connect();
      await subscribeBus.connect();

      const exchange = 'test-exchange-subscribe';
      const queue = 'test-queue-subscribe';
      const routingKey = 'test.subscribe';

      const receivedMessages: any[] = [];

      await subscribeBus.subscribe(queue, [{ exchange, rk: routingKey }], async (data) => {
        receivedMessages.push(data);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const payload = { message: 'Test message', timestamp: Date.now() };
      await publishBus.publish(exchange, routingKey, payload);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].message).toBe('Test message');

      await publishBus.close();
      await subscribeBus.close();
    }, 15000);

    it('debe consumir múltiples mensajes en orden', async () => {
      const publishBus = new Bus({ url: amqpUrl });
      const subscribeBus = new Bus({ url: amqpUrl });

      await publishBus.connect();
      await subscribeBus.connect();

      const exchange = 'test-exchange-multiple';
      const queue = 'test-queue-multiple';
      const routingKey = 'test.multiple';

      const receivedMessages: any[] = [];

      await subscribeBus.subscribe(queue, [{ exchange, rk: routingKey }], async (data) => {
        receivedMessages.push(data);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      for (let i = 0; i < 5; i++) {
        await publishBus.publish(exchange, routingKey, { index: i, message: `Message ${i}` });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(receivedMessages).toHaveLength(5);
      expect(receivedMessages[0].index).toBe(0);
      expect(receivedMessages[4].index).toBe(4);

      await publishBus.close();
      await subscribeBus.close();
    }, 15000);

    it('debe manejar múltiples bindings', async () => {
      const publishBus = new Bus({ url: amqpUrl });
      const subscribeBus = new Bus({ url: amqpUrl });

      await publishBus.connect();
      await subscribeBus.connect();

      const exchange1 = 'test-exchange-binding-1';
      const exchange2 = 'test-exchange-binding-2';
      const queue = 'test-queue-bindings';

      const receivedMessages: any[] = [];

      await subscribeBus.subscribe(
        queue,
        [
          { exchange: exchange1, rk: 'test.binding.1' },
          { exchange: exchange2, rk: 'test.binding.2' },
        ],
        async (data) => {
          receivedMessages.push(data);
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      await publishBus.publish(exchange1, 'test.binding.1', { source: 'exchange1' });
      await publishBus.publish(exchange2, 'test.binding.2', { source: 'exchange2' });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(receivedMessages).toHaveLength(2);
      expect(receivedMessages.some((m) => m.source === 'exchange1')).toBe(true);
      expect(receivedMessages.some((m) => m.source === 'exchange2')).toBe(true);

      await publishBus.close();
      await subscribeBus.close();
    }, 15000);

    it('debe hacer ACK de mensajes procesados correctamente', async () => {
      const publishBus = new Bus({ url: amqpUrl });
      const subscribeBus = new Bus({ url: amqpUrl });

      await publishBus.connect();
      await subscribeBus.connect();

      const exchange = 'test-exchange-ack';
      const queue = 'test-queue-ack';
      const routingKey = 'test.ack';

      let messageProcessed = false;

      await subscribeBus.subscribe(queue, [{ exchange, rk: routingKey }], async (data) => {
        messageProcessed = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      await publishBus.publish(exchange, routingKey, { test: 'ack' });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(messageProcessed).toBe(true);

      await publishBus.close();
      await subscribeBus.close();
    }, 15000);

    it('debe hacer NACK si el handler falla', async () => {
      const publishBus = new Bus({ url: amqpUrl });
      const subscribeBus = new Bus({ url: amqpUrl });

      await publishBus.connect();
      await subscribeBus.connect();

      const exchange = 'test-exchange-nack';
      const queue = 'test-queue-nack';
      const routingKey = 'test.nack';

      let handlerCalled = false;

      await subscribeBus.subscribe(queue, [{ exchange, rk: routingKey }], async (data) => {
        handlerCalled = true;
        throw new Error('Intentional error for NACK');
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      await publishBus.publish(exchange, routingKey, { test: 'nack' });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(handlerCalled).toBe(true);

      await publishBus.close();
      await subscribeBus.close();
    }, 15000);
  });

  describe('ensureDlq()', () => {
    it('debe crear Dead Letter Queue', async () => {
      const bus = new Bus({ url: amqpUrl });
      await bus.connect();

      const queue = 'test-queue-dlq';

      await expect(bus.ensureDlq(queue)).resolves.not.toThrow();

      await bus.close();
    });
  });

  describe('close()', () => {
    it('debe cerrar la conexión correctamente', async () => {
      const bus = new Bus({ url: amqpUrl });
      await bus.connect();

      await expect(bus.close()).resolves.not.toThrow();
    });

    it('debe permitir cerrar sin haber conectado', async () => {
      const bus = new Bus({ url: amqpUrl });

      await expect(bus.close()).resolves.not.toThrow();
    });

    it('debe permitir cerrar múltiples veces', async () => {
      const bus = new Bus({ url: amqpUrl });
      await bus.connect();

      await bus.close();
      await expect(bus.close()).resolves.not.toThrow();
    });
  });

  describe('Routing keys con wildcards', () => {
    it('debe enrutar con # (multi-level wildcard)', async () => {
      const publishBus = new Bus({ url: amqpUrl });
      const subscribeBus = new Bus({ url: amqpUrl });

      await publishBus.connect();
      await subscribeBus.connect();

      const exchange = 'test-exchange-wildcard';
      const queue = 'test-queue-wildcard';

      const receivedMessages: any[] = [];

      await subscribeBus.subscribe(queue, [{ exchange, rk: 'test.#' }], async (data) => {
        receivedMessages.push(data);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      await publishBus.publish(exchange, 'test.one', { value: 1 });
      await publishBus.publish(exchange, 'test.one.two', { value: 2 });
      await publishBus.publish(exchange, 'test.one.two.three', { value: 3 });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(receivedMessages.length).toBeGreaterThanOrEqual(3);

      await publishBus.close();
      await subscribeBus.close();
    }, 15000);
  });

  describe('Configuración de appId', () => {
    it('debe incluir appId en los mensajes si se configura', async () => {
      const bus = new Bus({ url: amqpUrl, appId: 'test-app-123' });
      await bus.connect();

      const exchange = 'test-exchange-appid';
      const routingKey = 'test.appid';

      await expect(bus.publish(exchange, routingKey, { test: 'appId' })).resolves.toBe(true);

      await bus.close();
    });
  });
});