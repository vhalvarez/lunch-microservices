<template>
  <Card class="shadow-sm border-l-4 border-l-purple-500">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center gap-2 font-semibold">
        <span class="text-purple-600">🤖</span>
        <span>Predicciones IA</span>
      </CardTitle>
      <CardDescription class="text-sm text-gray-500">
        Análisis predictivo de inventario
      </CardDescription>
    </CardHeader>

    <CardContent class="p-5">
      <div v-if="!isAvailable" class="text-center py-6">
        <div class="text-4xl mb-2">⏳</div>
        <p class="text-sm text-gray-600">
          {{ summary?.message || 'Generando predicciones...' }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          El servicio de IA está inicializando
        </p>
      </div>

      <div v-else class="space-y-4">
        <!-- Resumen de alertas -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="text-center p-3 rounded-lg bg-red-50 border border-red-200">
            <div class="text-2xl font-bold text-red-700">{{ summary?.critical || 0 }}</div>
            <div class="text-xs text-red-600">Críticas</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div class="text-2xl font-bold text-orange-700">{{ summary?.high || 0 }}</div>
            <div class="text-xs text-orange-600">Altas</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div class="text-2xl font-bold text-yellow-700">{{ summary?.medium || 0 }}</div>
            <div class="text-xs text-yellow-600">Medias</div>
          </div>
          <div class="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div class="text-2xl font-bold text-blue-700">{{ summary?.low || 0 }}</div>
            <div class="text-xs text-blue-600">Bajas</div>
          </div>
        </div>

        <!-- Última actualización -->
        <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>Total de alertas: {{ summary?.totalAlerts || 0 }}</span>
          <span v-if="summary?.generatedAt">
            Actualizado: {{ formatTime(summary.generatedAt) }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PredictionQuickSummary } from '@/shared/types';

defineProps<{
  summary: PredictionQuickSummary | undefined;
  isAvailable: boolean;
}>();

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  return date.toLocaleDateString();
}
</script>
