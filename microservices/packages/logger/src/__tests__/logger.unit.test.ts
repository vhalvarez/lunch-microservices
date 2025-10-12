import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../index.js';
import pino from 'pino';

vi.mock('pino');

describe('Unit - Logger: createLogger', () => {
  const originalEnv = process.env.LOG_LEVEL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    process.env.LOG_LEVEL = originalEnv;
  });

  it('debe crear logger con nombre del servicio', () => {
    const mockLogger = { info: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('test-service');

    expect(pino).toHaveBeenCalledWith({
      level: 'info',
      base: { svc: 'test-service' },
    });
  });

  it('debe usar LOG_LEVEL de variable de entorno', () => {
    process.env.LOG_LEVEL = 'debug';
    const mockLogger = { debug: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('test-service');

    expect(pino).toHaveBeenCalledWith({
      level: 'debug',
      base: { svc: 'test-service' },
    });
  });

  it('debe usar "info" como nivel por defecto si no hay LOG_LEVEL', () => {
    delete process.env.LOG_LEVEL;
    const mockLogger = { info: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('my-service');

    expect(pino).toHaveBeenCalledWith({
      level: 'info',
      base: { svc: 'my-service' },
    });
  });

  it('debe mergear opciones custom con opciones por defecto', () => {
    const mockLogger = { info: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    const customOpts = {
      transport: { target: 'pino-pretty' },
    };

    createLogger('test-service', customOpts);

    expect(pino).toHaveBeenCalledWith({
      level: 'info',
      base: { svc: 'test-service' },
      transport: { target: 'pino-pretty' },
    });
  });

  it('debe permitir sobrescribir level con opciones custom', () => {
    const mockLogger = { error: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('test-service', { level: 'error' });

    expect(pino).toHaveBeenCalledWith({
      level: 'error',
      base: { svc: 'test-service' },
    });
  });

  it('debe permitir sobrescribir base con opciones custom', () => {
    const mockLogger = { info: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('test-service', { base: { svc: 'custom', env: 'prod' } });

    expect(pino).toHaveBeenCalledWith({
      level: 'info',
      base: { svc: 'custom', env: 'prod' },
    });
  });

  it('debe retornar el logger de pino', () => {
    const mockLogger = { info: vi.fn(), error: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    const logger = createLogger('test-service');

    expect(logger).toBe(mockLogger);
  });

  it('debe manejar diferentes niveles de LOG_LEVEL', () => {
    const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    
    levels.forEach((level) => {
      vi.clearAllMocks();
      process.env.LOG_LEVEL = level;
      const mockLogger = { [level]: vi.fn() };
      vi.mocked(pino).mockReturnValue(mockLogger as any);

      createLogger('test-service');

      expect(pino).toHaveBeenCalledWith({
        level,
        base: { svc: 'test-service' },
      });
    });
  });

  it('debe manejar nombres de servicio vacíos', () => {
    const mockLogger = { info: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('');

    expect(pino).toHaveBeenCalledWith({
      level: 'info',
      base: { svc: '' },
    });
  });

  it('debe manejar nombres de servicio con caracteres especiales', () => {
    const mockLogger = { info: vi.fn() };
    vi.mocked(pino).mockReturnValue(mockLogger as any);

    createLogger('test-service-123_v2');

    expect(pino).toHaveBeenCalledWith({
      level: 'info',
      base: { svc: 'test-service-123_v2' },
    });
  });
});