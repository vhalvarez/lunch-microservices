import { describe, it, expect } from 'vitest';
import {
  mean,
  standardDeviation,
  median,
  linearRegression,
  exponentialSmoothing,
  forecastNextValue,
  coefficientOfVariation,
  detectTrend,
  percentile,
  normalize,
} from '../stats.js';

describe('Unit - RecommenderAI Stats: mean', () => {
  it('debe calcular media correctamente', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('debe retornar 0 para array vacío', () => {
    expect(mean([])).toBe(0);
  });

  it('debe calcular media de números decimales', () => {
    expect(mean([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
  });

  it('debe calcular media de un solo elemento', () => {
    expect(mean([42])).toBe(42);
  });

  it('debe manejar números negativos', () => {
    expect(mean([-1, -2, -3])).toBe(-2);
  });

  it('debe manejar mezcla de positivos y negativos', () => {
    expect(mean([-10, 0, 10])).toBe(0);
  });
});

describe('Unit - RecommenderAI Stats: standardDeviation', () => {
  it('debe calcular desviación estándar correctamente', () => {
    const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2, 0);
  });

  it('debe retornar 0 para array vacío', () => {
    expect(standardDeviation([])).toBe(0);
  });

  it('debe retornar 0 para valores idénticos', () => {
    expect(standardDeviation([5, 5, 5, 5])).toBe(0);
  });

  it('debe calcular desviación de un solo elemento', () => {
    expect(standardDeviation([42])).toBe(0);
  });

  it('debe manejar números negativos', () => {
    const result = standardDeviation([-2, -4, -6]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('Unit - RecommenderAI Stats: median', () => {
  it('debe calcular mediana de array impar', () => {
    expect(median([1, 3, 5, 7, 9])).toBe(5);
  });

  it('debe calcular mediana de array par', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('debe retornar 0 para array vacío', () => {
    expect(median([])).toBe(0);
  });

  it('debe calcular mediana de un solo elemento', () => {
    expect(median([42])).toBe(42);
  });

  it('debe manejar array desordenado', () => {
    expect(median([5, 1, 9, 3, 7])).toBe(5);
  });

  it('debe manejar números negativos', () => {
    expect(median([-5, -1, 0, 1, 5])).toBe(0);
  });

  it('debe manejar números decimales', () => {
    expect(median([1.5, 2.5, 3.5])).toBe(2.5);
  });
});

describe('Unit - RecommenderAI Stats: linearRegression', () => {
  it('debe calcular regresión lineal perfecta', () => {
    const xValues = [1, 2, 3, 4, 5];
    const yValues = [2, 4, 6, 8, 10]; // y = 2x

    const result = linearRegression(xValues, yValues);

    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(0, 5);
    expect(result.r2).toBeCloseTo(1, 5);
  });

  it('debe manejar arrays vacíos', () => {
    const result = linearRegression([], []);

    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.r2).toBe(0);
  });

  it('debe manejar arrays de diferente longitud', () => {
    const result = linearRegression([1, 2, 3], [1, 2]);

    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.r2).toBe(0);
  });

  it('debe calcular regresión con pendiente negativa', () => {
    const xValues = [1, 2, 3, 4, 5];
    const yValues = [10, 8, 6, 4, 2];

    const result = linearRegression(xValues, yValues);

    expect(result.slope).toBeCloseTo(-2, 5);
    expect(result.intercept).toBeCloseTo(12, 5);
    expect(result.r2).toBeCloseTo(1, 5);
  });

  it('debe calcular r2 entre 0 y 1', () => {
    const xValues = [1, 2, 3, 4, 5];
    const yValues = [2.1, 3.9, 6.2, 7.8, 10.1];

    const result = linearRegression(xValues, yValues);

    expect(result.r2).toBeGreaterThanOrEqual(0);
    expect(result.r2).toBeLessThanOrEqual(1);
  });

  it('debe manejar un solo punto', () => {
    const result = linearRegression([1], [2]);

    expect(result.r2).toBeGreaterThanOrEqual(0);
    expect(result.r2).toBeLessThanOrEqual(1);
  });
});

describe('Unit - RecommenderAI Stats: exponentialSmoothing', () => {
  it('debe aplicar suavizado exponencial', () => {
    const values = [10, 12, 15, 14, 16];
    const result = exponentialSmoothing(values, 0.3);

    expect(result).toHaveLength(5);
    expect(result[0]).toBe(10); // primer valor sin cambio
    expect(result[result.length - 1]).toBeGreaterThan(10);
  });

  it('debe retornar array vacío para input vacío', () => {
    expect(exponentialSmoothing([])).toEqual([]);
  });

  it('debe retornar mismo array para un solo elemento', () => {
    expect(exponentialSmoothing([42])).toEqual([42]);
  });

  it('debe usar alpha 0.3 por defecto', () => {
    const values = [10, 20];
    const result = exponentialSmoothing(values);

    expect(result[0]).toBe(10);
    expect(result[1]).toBeCloseTo(10 * 0.7 + 20 * 0.3);
  });

  it('debe aplicar diferentes valores de alpha', () => {
    const values = [10, 20, 30];

    const result1 = exponentialSmoothing(values, 0.1);
    const result2 = exponentialSmoothing(values, 0.9);

    // Con alpha bajo, los cambios son más suaves
    // Con alpha alto, los cambios son más bruscos
    expect(result1[2]).not.toBeCloseTo(result2[2]);
  });
});

describe('Unit - RecommenderAI Stats: forecastNextValue', () => {
  it('debe predecir siguiente valor', () => {
    const values = [10, 12, 15, 14, 16];
    const result = forecastNextValue(values, 0.3);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('debe usar alpha 0.3 por defecto', () => {
    const values = [10, 12, 15];
    const result = forecastNextValue(values);

    expect(typeof result).toBe('number');
  });

  it('debe manejar valores crecientes', () => {
    const values = [10, 20, 30, 40];
    const result = forecastNextValue(values);

    expect(result).toBeGreaterThan(values[0]);
  });

  it('debe manejar valores decrecientes', () => {
    const values = [40, 30, 20, 10];
    const result = forecastNextValue(values);

    expect(result).toBeLessThan(values[0]);
  });
});

describe('Unit - RecommenderAI Stats: coefficientOfVariation', () => {
  it('debe calcular coeficiente de variación', () => {
    const result = coefficientOfVariation([2, 4, 6, 8, 10]);

    expect(result).toBeGreaterThan(0);
  });

  it('debe retornar 0 cuando la media es 0', () => {
    expect(coefficientOfVariation([0, 0, 0])).toBe(0);
  });

  it('debe retornar 0 para valores idénticos', () => {
    expect(coefficientOfVariation([5, 5, 5])).toBe(0);
  });

  it('debe retornar mayor CV para datos más dispersos', () => {
    const cv1 = coefficientOfVariation([9, 10, 11]);
    const cv2 = coefficientOfVariation([5, 10, 15]);

    expect(cv2).toBeGreaterThan(cv1);
  });

  it('debe retornar 0 para array vacío', () => {
    expect(coefficientOfVariation([])).toBe(0);
  });
});

describe('Unit - RecommenderAI Stats: detectTrend', () => {
  it('debe detectar tendencia creciente', () => {
    const values = [1, 2, 3, 4, 5];
    const result = detectTrend(values);

    expect(result.trend).toBe('increasing');
    expect(result.strength).toBeGreaterThan(0.9);
  });

  it('debe detectar tendencia decreciente', () => {
    const values = [5, 4, 3, 2, 1];
    const result = detectTrend(values);

    expect(result.trend).toBe('decreasing');
    expect(result.strength).toBeGreaterThan(0.9);
  });

  it('debe detectar tendencia estable', () => {
    const values = [5, 5, 5, 5, 5];
    const result = detectTrend(values);

    expect(result.trend).toBe('stable');
  });

  it('debe retornar stable con strength 0 para menos de 2 valores', () => {
    const result = detectTrend([42]);

    expect(result.trend).toBe('stable');
    expect(result.strength).toBe(0);
  });

  it('debe calcular strength entre 0 y 1', () => {
    const values = [1, 3, 2, 4, 3, 5];
    const result = detectTrend(values);

    expect(result.strength).toBeGreaterThanOrEqual(0);
    expect(result.strength).toBeLessThanOrEqual(1);
  });

  it('debe detectar tendencia con ruido', () => {
    const values = [1, 2.1, 2.9, 4.2, 4.8, 6.1];
    const result = detectTrend(values);

    expect(result.trend).toBe('increasing');
  });
});

describe('Unit - RecommenderAI Stats: percentile', () => {
  it('debe calcular percentil 50 (mediana)', () => {
    const result = percentile([1, 2, 3, 4, 5], 50);
    expect(result).toBe(3);
  });

  it('debe calcular percentil 0', () => {
    const result = percentile([1, 2, 3, 4, 5], 0);
    expect(result).toBe(1);
  });

  it('debe calcular percentil 100', () => {
    const result = percentile([1, 2, 3, 4, 5], 100);
    expect(result).toBe(5);
  });

  it('debe retornar 0 para array vacío', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('debe interpolar entre valores', () => {
    const result = percentile([1, 2, 3, 4], 25);
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(2);
  });

  it('debe manejar array desordenado', () => {
    const result = percentile([5, 1, 3, 2, 4], 50);
    expect(result).toBe(3);
  });

  it('debe calcular percentil 75', () => {
    const result = percentile([1, 2, 3, 4, 5], 75);
    expect(result).toBeCloseTo(4, 1);
  });

  it('debe calcular percentil 25', () => {
    const result = percentile([1, 2, 3, 4, 5], 25);
    expect(result).toBeCloseTo(2, 1);
  });
});

describe('Unit - RecommenderAI Stats: normalize', () => {
  it('debe normalizar valores entre 0 y 1', () => {
    const result = normalize([10, 20, 30, 40, 50]);

    expect(result[0]).toBe(0);
    expect(result[result.length - 1]).toBe(1);
    result.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    });
  });

  it('debe retornar array vacío para input vacío', () => {
    expect(normalize([])).toEqual([]);
  });

  it('debe retornar 0.5 para valores idénticos', () => {
    const result = normalize([5, 5, 5, 5]);
    result.forEach((val) => {
      expect(val).toBe(0.5);
    });
  });

  it('debe normalizar valores negativos', () => {
    const result = normalize([-10, 0, 10]);

    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0.5);
    expect(result[2]).toBe(1);
  });

  it('debe normalizar un solo elemento', () => {
    const result = normalize([42]);
    expect(result[0]).toBe(0.5);
  });

  it('debe mantener el orden relativo', () => {
    const values = [5, 15, 10, 20];
    const result = normalize(values);

    expect(result[0]).toBeLessThan(result[2]); // 5 < 10
    expect(result[2]).toBeLessThan(result[1]); // 10 < 15
    expect(result[1]).toBeLessThan(result[3]); // 15 < 20
  });
});
