import pino, { LoggerOptions } from 'pino';

export function createLogger(name: string, opts: LoggerOptions = {}) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { svc: name },
    ...opts,
  });
}
