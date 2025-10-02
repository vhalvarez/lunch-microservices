<template>
  <div class="min-h-screen mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50">
    <div class="max-w-4xl mx-auto space-y-6">
      <DashboardHeader />

      <OrderControlPanel
        :is-processing="isProcessing"
        @start-orders="handleStartOrders"
      />

      <StatsCards :stats="stats" :timings="timings" />

      <!-- Tabs de navegación -->
      <Tabs default-value="dashboard" class="w-full">
        <TabsList class="grid w-full grid-cols-2 bg-white shadow-sm">
          <TabsTrigger value="dashboard" class="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <span class="flex items-center gap-2">
              <span>🍽️</span>
              <span>Dashboard</span>
            </span>
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" class="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
            <span class="flex items-center gap-2">
              <span>🤖</span>
              <span>Análisis IA</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <!-- Tab: Dashboard Principal -->
        <TabsContent value="dashboard" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryCard :inventory="inventory" />
            <OrdersList :orders="orders" />
          </div>

          <RecipesCard :recipes="recipes" :is-loading="isLoadingRecipes" />

          <DetailedStats v-if="stats && stats.totalPlatesOrdered > 0" :stats="stats" />
        </TabsContent>

        <!-- Tab: Análisis IA -->
        <TabsContent value="ai-analysis" class="space-y-6">
          <!-- Resumen de Predicciones -->
          <PredictionsSummaryCard :summary="predictionsSummary" :is-available="predictionsAvailable" />

          <!-- Información sobre el Sistema de IA -->
          <PredictionsInfoCard
            v-if="predictionsAvailable"
            :analysis-orders="predictionsLatest?.analysisWindowOrders ?? 100"
          />

          <!-- Visualización y Alertas -->
          <div
            v-if="predictionsAvailable && predictionsLatest && predictionsLatest.alerts.length > 0"
            class="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <PredictionsChartCard :latest="predictionsLatest" />
            <PredictionsAlertsCard :latest="predictionsLatest" />
          </div>

          <!-- Mensaje cuando no hay datos -->
          <div
            v-else-if="predictionsAvailable && predictionsLatest && predictionsLatest.alerts.length === 0"
            class="text-center py-12 bg-white rounded-lg shadow-sm"
          >
            <div class="text-6xl mb-4">🎉</div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Todo está bajo control</h3>
            <p class="text-gray-600">No hay alertas operacionales en este momento.</p>
            <p class="text-sm text-gray-500 mt-2">El sistema continúa monitoreando el inventario automáticamente.</p>
          </div>

          <!-- Mensaje cuando no está disponible -->
          <div
            v-else-if="!predictionsAvailable"
            class="text-center py-12 bg-white rounded-lg shadow-sm"
          >
            <div class="text-6xl mb-4">⏳</div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Recopilando datos...</h3>
            <p class="text-gray-600">El sistema de predicción requiere más datos para generar análisis.</p>
            <p class="text-sm text-gray-500 mt-2">Procesa algunas órdenes y las predicciones aparecerán automáticamente.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DashboardHeader from './DashboardHeader.vue';
import OrderControlPanel from '@/features/orders/OrderControlPanel.vue';
import StatsCards from '@/features/kitchen/StatsCards.vue';
import DetailedStats from '@/features/kitchen/DetailedStats.vue';
import InventoryCard from '@/features/inventory/InventoryCard.vue';
import OrdersList from '@/features/orders/OrdersList.vue';
import RecipesCard from '@/features/recipes/RecipesCard.vue';
import PredictionsSummaryCard from '@/features/predictions/PredictionsSummaryCard.vue';
import PredictionsAlertsCard from '@/features/predictions/PredictionsAlertsCard.vue';
import PredictionsInfoCard from '@/features/predictions/PredictionsInfoCard.vue';
import PredictionsChartCard from '@/features/predictions/PredictionsChartCard.vue';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { useOrders } from '@/features/orders/useOrders';
import { useKitchenStats } from '@/features/kitchen/useKitchenStats';
import { useInventory } from '@/features/inventory/useInventory';
import { useRecipes } from '@/features/recipes/useRecipes';
import { usePredictions } from '@/features/predictions/usePredictions';

const { orders, createOrders, isCreating } = useOrders();
const { stats, timings } = useKitchenStats();
const { inventory } = useInventory();
const { recipes, isLoading: isLoadingRecipes } = useRecipes();
const { summary: predictionsSummary, latest: predictionsLatest, isAvailable: predictionsAvailable } = usePredictions();

const hasActiveWork = computed(() => {
  if (!stats.value) return false;
  return stats.value.platesInProgress > 0 ||
         (stats.value.totalPlatesOrdered - stats.value.platesCompleted - stats.value.platesFailed) > 0;
});

const isProcessing = computed(() => isCreating.value || hasActiveWork.value);

function handleStartOrders(count: number) {
  createOrders(count);
}
</script>
