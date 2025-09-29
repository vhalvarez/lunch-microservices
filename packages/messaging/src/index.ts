import { connect as amqpConnect, Connection, Channel, ConsumeMessage } from 'amqplib';
import pino from 'pino';

export type Binding = { exchange: string; rk: string };
export type Handler = (data: any, raw: ConsumeMessage, ch: Channel) => Promise<void> | void;

export interface BusOptions {
  url?: string;
  prefetch?: number;
  appId?: string;
}

export class Bus {
  private conn!: Connection;
  private ch!: Channel;
  private log = pino({ name: 'bus' });
  private url: string;
  private prefetch: number;
  private appId?: string;

  constructor(opts: BusOptions = {}) {
    this.url = opts.url || process.env.AMQP_URL || 'amqp://localhost';
    this.prefetch = opts.prefetch ?? Number(process.env.RMQ_PREFETCH || 100);
    this.appId = opts.appId;
  }

  async connect(): Promise<void> {
    this.conn = await amqpConnect(this.url);
    this.conn.on('error', (err) => this.log.error({ err }, 'amqp connection error'));
    this.conn.on('close', () => this.log.warn('amqp connection closed'));
    this.ch = await this.conn.createChannel();
    await this.ch.prefetch(this.prefetch);
    this.log.info({ url: this.url, prefetch: this.prefetch }, 'bus connected');
  }

  async publish(exchange: string, rk: string, payload: object): Promise<boolean> {
    await this.ch.assertExchange(exchange, 'topic', { durable: true });
    const ok = this.ch.publish(exchange, rk, Buffer.from(JSON.stringify(payload)), {
      contentType: 'application/json',
      persistent: true,
      appId: this.appId,
      timestamp: Date.now(),
    });
    if (!ok) this.log.warn({ exchange, rk }, 'publish backpressure (write buffer full)');
    return ok;
  }

  async subscribe(queue: string, bindings: Binding[], handler: Handler): Promise<void> {
    const q = await this.ch.assertQueue(queue, { durable: true });
    for (const b of bindings) {
      await this.ch.assertExchange(b.exchange, 'topic', { durable: true });
      await this.ch.bindQueue(q.queue, b.exchange, b.rk);
    }
    await this.ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const data = msg.content.length ? JSON.parse(msg.content.toString()) : undefined;
        await handler(data, msg, this.ch);
        this.ch.ack(msg);
      } catch (err) {
        this.log.error({ err }, 'consumer handler error → nack no requeue');
        this.ch.nack(msg, false, false);
      }
    });
    this.log.info({ queue, bindings }, 'consuming started');
  }

  async ensureDlq(queue: string): Promise<void> {
    const dlq = `${queue}.dlq`;
    await this.ch.assertQueue(dlq, { durable: true });
    this.log.info({ dlq }, 'dlq ensured');
  }

  async close(): Promise<void> {
    try {
      await this.ch?.close();
    } catch {}
    try {
      await this.conn?.close();
    } catch {}
    this.log.info('bus closed');
  }
}
