<template>
  <Card class="shadow-sm">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center gap-2 font-semibold">
        <span class="text-indigo-600">📊</span>
        <span>Análisis de Inventario</span>
      </CardTitle>
      <CardDescription class="text-sm text-gray-500">
        Visualización del estado operacional por ingrediente
      </CardDescription>
    </CardHeader>

    <CardContent class="p-5">
      <div v-if="!latest || !latest.alerts || latest.alerts.length === 0" class="text-center py-8">
        <div class="text-4xl mb-2">📈</div>
        <p class="text-sm text-gray-600">No hay datos para visualizar</p>
        <p class="text-xs text-gray-400 mt-1">Las predicciones aparecerán cuando haya suficientes órdenes</p>
      </div>

      <div v-else class="space-y-4">
        <!-- Métricas de inventario -->
        <div class="space-y-3">
          <div
            v-for="alert in topAlerts"
            :key="alert.ingredient"
            class="space-y-1"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium capitalize flex items-center gap-1">
                <span>{{ getIngredientIcon(alert.ingredient) }}</span>
                <span>{{ alert.ingredient }}</span>
              </span>
              <span class="text-xs text-gray-500">
                Stock: {{ alert.currentStock }} | Mín: {{ alert.recommendedMinStock }}
              </span>
            </div>

            <!-- Barra de salud del inventario -->
            <div class="relative h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                :class="getBarColor(alert.severity)"
                :style="{ width: `${getHealthPercentage(alert)}%` }"
                class="h-full transition-all duration-500 flex items-center justify-end pr-2"
              >
                <span v-if="getHealthPercentage(alert) > 20" class="text-xs font-semibold text-white">
                  {{ getHealthPercentage(alert).toFixed(0) }}%
                </span>
              </div>
              <div
                v-if="getHealthPercentage(alert) <= 20"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600"
              >
                {{ getHealthPercentage(alert).toFixed(0) }}%
              </div>
            </div>

            <!-- Métricas operacionales -->
            <div class="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              <span>Uso: <strong class="text-purple-600">{{ Number(alert.ordersUsingThisIngredient || 0).toFixed(0) }}%</strong></span>
              <span>•</span>
              <span>Mercado: <strong :class="Number(alert.marketSuccessRate || 0) < 70 ? 'text-red-600' : 'text-green-600'">
                {{ Number(alert.marketSuccessRate || 0).toFixed(0) }}%
              </strong></span>
              <span>•</span>
              <span>Confianza: <strong>{{ Number(alert.confidence || 0).toFixed(0) }}%</strong></span>
            </div>
          </div>
        </div>

        <!-- Leyenda -->
        <div class="pt-4 border-t">
          <h5 class="text-xs font-semibold text-gray-600 mb-2">Niveles de Salud del Inventario:</h5>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span class="text-gray-600">Crítico (0-25%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-orange-500"></div>
              <span class="text-gray-600">Alto (25-50%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span class="text-gray-600">Medio (50-75%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <span class="text-gray-600">Saludable (&gt;75%)</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            * Porcentaje basado en stock actual vs. stock mínimo recomendado
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PredictionSummary, PredictionSeverity, PredictionAlert } from '@/shared/types';

const props = defineProps<{
  latest: PredictionSummary | undefined;
}>();

const topAlerts = computed(() => {
  if (!props.latest?.alerts) return [];

  // Ordenar por severidad y mostrar los 8 más críticos
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return [...props.latest.alerts]
    .sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Ordenar por confianza (mayor primero)
      return Number(b.confidence || 0) - Number(a.confidence || 0);
    })
    .slice(0, 8);
});

function getHealthPercentage(alert: PredictionAlert): number {
  // Calcular porcentaje de salud basado en stock actual vs. stock mínimo recomendado
  const minStock = Number(alert.recommendedMinStock || 0);
  const currentStock = Number(alert.currentStock || 0);
  
  if (minStock === 0) return 100;
  
  const healthPercentage = (currentStock / minStock) * 100;
  return Math.max(5, Math.min(100, healthPercentage)); // Min 5% para visibilidad
}

function getBarColor(severity: PredictionSeverity): string {
  const colors = {
    critical: 'bg-gradient-to-r from-red-600 to-red-500',
    high: 'bg-gradient-to-r from-orange-600 to-orange-500',
    medium: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
    low: 'bg-gradient-to-r from-blue-600 to-blue-500',
  };
  return colors[severity];
}

function getIngredientIcon(ingredient: string): string {
  const icons: Record<string, string> = {
    'tomato': '🍅',
    'lemon': '🍋',
    'potato': '🥔',
    'rice': '🍚',
    'ketchup': '🍅',
    'lettuce': '🥬',
    'onion': '🧅',
    'cheese': '🧀',
    'meat': '🥩',
    'chicken': '🍗',
  };

  const key = ingredient.toLowerCase();
  return icons[key] ?? '🥘';
}
</script>
