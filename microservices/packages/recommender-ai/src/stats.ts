/**
 * Estadistica
 */

/**
 * Calcula la media de un array de números
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Desviación estándar
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calcula la mediana
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calcula regresión lineal simple
 */
export function linearRegression(
  xValues: number[],
  yValues: number[],
): { slope: number; intercept: number; r2: number } {
  if (xValues.length !== yValues.length || xValues.length === 0) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = xValues.length;
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = yValues.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => {
    const predicted = slope * xValues[i] + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);

  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

/**
 * Suavizado exponencial simple para forecasting
 */
export function exponentialSmoothing(values: number[], alpha: number = 0.3): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [...values];

  const smoothed: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
  }

  return smoothed;
}

/**
 * Predice el siguiente valor usando suavizado exponencial
 */
export function forecastNextValue(values: number[], alpha: number = 0.3): number {
  const smoothed = exponentialSmoothing(values, alpha);
  return smoothed[smoothed.length - 1];
}

/**
 * Calcula el coeficiente de variación (CV)
 * CV = (desviación estándar / media) * 100
 */
export function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  const stdDev = standardDeviation(values);
  return (stdDev / avg) * 100;
}

/**
 * Detecta tendencia usando regresión lineal
 */
export function detectTrend(
  values: number[],
): { trend: 'increasing' | 'stable' | 'decreasing'; strength: number } {
  if (values.length < 2) {
    return { trend: 'stable', strength: 0 };
  }

  const xValues = values.map((_, i) => i);
  const { slope, r2 } = linearRegression(xValues, values);

  const slopeThreshold = 0.01;

  let trend: 'increasing' | 'stable' | 'decreasing';
  if (Math.abs(slope) < slopeThreshold) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return { trend, strength: r2 };
}

/**
 * Calcula percentiles
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Normaliza valores a rango 0-1
 */
export function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}
