<template>
  <Card class="shadow-sm">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center gap-2 font-semibold">
        <span class="text-red-600">⚠️</span>
        <span>Alertas Operacionales</span>
      </CardTitle>
      <CardDescription class="text-sm text-gray-500">
        Análisis inteligente de patrones de consumo y comportamiento del mercado
      </CardDescription>
    </CardHeader>

    <CardContent class="p-5">
      <div v-if="!latest || !latest.alerts || latest.alerts.length === 0" class="text-center py-8">
        <div class="text-4xl mb-2">✅</div>
        <p class="text-sm text-gray-600">No hay alertas activas</p>
        <p class="text-xs text-gray-400 mt-1">El inventario está en buen estado</p>
      </div>

      <div v-else class="space-y-3 max-h-96 overflow-y-auto">
        <div
          v-for="alert in sortedAlerts"
          :key="alert.ingredient"
          :class="`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h4 class="font-semibold capitalize flex items-center gap-2">
                <span class="text-lg">{{ getIngredientIcon(alert.ingredient) }}</span>
                {{ alert.ingredient }}
                <Badge :class="getSeverityBadge(alert.severity)">
                  {{ SEVERITY_LABELS[alert.severity] }}
                </Badge>
                <Badge :class="getAlertTypeBadge(alert.alertType)">
                  {{ getAlertTypeLabel(alert.alertType) }}
                </Badge>
              </h4>
              <p class="text-sm text-gray-600 mt-1">{{ alert.reason }}</p>
              <p class="text-xs text-blue-700 mt-2 font-medium">💡 {{ alert.actionable }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
          <div>
          <span class="text-gray-500">Stock actual:</span>
          <span class="font-semibold ml-1">{{ alert.currentStock }}</span>
          </div>
          <div>
          <span class="text-gray-500">Stock mínimo:</span>
          <span class="font-semibold ml-1 text-green-600">{{ alert.recommendedMinStock }}</span>
          </div>
          <div>
          <span class="text-gray-500">Uso en platos:</span>
          <span class="font-semibold ml-1">{{ Number(alert.ordersUsingThisIngredient || 0).toFixed(1) }}%</span>
          </div>
          <div>
          <span class="text-gray-500">Éxito mercado:</span>
          <span class="font-semibold ml-1" :class="Number(alert.marketSuccessRate || 0) < 70 ? 'text-red-600' : 'text-green-600'">
          {{ Number(alert.marketSuccessRate || 0).toFixed(1) }}%
          </span>
          </div>
          <div>
          <span class="text-gray-500">Confianza:</span>
          <span class="font-semibold ml-1">{{ Number(alert.confidence || 0).toFixed(0) }}%</span>
          </div>
          <div>
          <span class="text-gray-500">Frecuencia compra:</span>
          <span class="font-semibold ml-1">{{ Number(alert.purchaseFrequency || 0).toFixed(1) }}%</span>
          </div>
          </div>
        </div>
      </div>

      <!-- Información del análisis -->
      <div v-if="latest" class="mt-4 pt-4 border-t text-xs text-gray-500">
        <div class="flex justify-between">
          <span>Órdenes analizadas: {{ latest.totalOrdersAnalyzed }}</span>
          <span>Ventana: últimas {{ latest.analysisWindowOrders }} órdenes</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '@/shared/types';
import type { PredictionSummary, PredictionSeverity, AlertType } from '@/shared/types';

const props = defineProps<{
  latest: PredictionSummary | undefined;
}>();

const sortedAlerts = computed(() => {
  if (!props.latest?.alerts) return [];

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return [...props.latest.alerts].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Ordenar por confianza (mayor primero)
    return b.confidence - a.confidence;
  });
});

function getSeverityColor(severity: PredictionSeverity): string {
  return SEVERITY_COLORS[severity];
}

function getSeverityBadge(severity: PredictionSeverity): string {
  const baseColors = SEVERITY_COLORS[severity];
  return `${baseColors} text-xs font-semibold`;
}

function getAlertTypeLabel(alertType: AlertType): string {
  const labels: Record<AlertType, string> = {
    high_demand: 'Alta Demanda',
    market_unreliable: 'Mercado Poco Confiable',
    frequent_purchases: 'Compras Frecuentes',
    potential_bottleneck: 'Cuello de Botella',
    ai_prediction: '🤖 IA',
  };
  return labels[alertType] || alertType;
}

function getAlertTypeBadge(alertType: AlertType): string {
  const colors: Record<AlertType, string> = {
    high_demand: 'bg-purple-100 text-purple-800 border-purple-300',
    market_unreliable: 'bg-amber-100 text-amber-800 border-amber-300',
    frequent_purchases: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    potential_bottleneck: 'bg-pink-100 text-pink-800 border-pink-300',
    ai_prediction: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  };
  return `${colors[alertType] || 'bg-gray-100 text-gray-800'} text-xs font-semibold`;
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
