import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sleep, jitter } from '../index.js';

describe('Unit - Utils: sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe resolver despues del tiempo especificado', async () => {
    const promise = sleep(1000);

    vi.advanceTimersByTime(1000);

    await expect(promise).resolves.toBeUndefined();
  });

  it('debe resolver con 0 milisegundos', async () => {
    const promise = sleep(0);

    vi.advanceTimersByTime(0);

    await expect(promise).resolves.toBeUndefined();
  });

  it('debe resolver con tiempo largo', async () => {
    const promise = sleep(5000);

    vi.advanceTimersByTime(5000);

    await expect(promise).resolves.toBeUndefined();
  });

  it('no debe resolver antes del tiempo especificado', async () => {
    const promise = sleep(1000);
    let resolved = false;

    promise.then(() => {
      resolved = true;
    });

    vi.advanceTimersByTime(500);
    await Promise.resolve();

    expect(resolved).toBe(false);
  });

  describe('Unit - Utils: jitter', () => {
    it('debe retornar al menos el valor base', () => {
      const baseMs = 100;
      const result = jitter(baseMs);

      expect(result).toBeGreaterThanOrEqual(baseMs);
    });

    it('debe retornar máximo el doble del valor base', () => {
      const baseMs = 100;
      const result = jitter(baseMs);

      expect(result).toBeLessThan(baseMs * 2);
    });

    it('debe funcionar con valor base 0', () => {
      const result = jitter(0);

      expect(result).toBe(0);
    });

    it('debe agregar variación aleatoria', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const baseMs = 100;
      const result = jitter(baseMs);

      expect(result).toBe(150); // 100 + Math.floor(0.5 * 100)
    });

    it('debe agregar variación mínima cuando random es 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const baseMs = 100;
      const result = jitter(baseMs);

      expect(result).toBe(100); // 100 + Math.floor(0 * 100)
    });

    it('debe agregar variación máxima cuando random está cerca de 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99);

      const baseMs = 100;
      const result = jitter(baseMs);

      expect(result).toBe(199); // 100 + Math.floor(0.99 * 100)
    });

    it('debe manejar valores grandes', () => {
      const baseMs = 10000;
      const result = jitter(baseMs);

      expect(result).toBeGreaterThanOrEqual(baseMs);
      expect(result).toBeLessThan(baseMs * 2);
    });
  });
});
