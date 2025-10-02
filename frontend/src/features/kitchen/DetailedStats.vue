<template>
  <Card class="shadow-sm w-full my-4">
    <CardHeader class="p-5 border-b">
      <CardTitle class="font-semibold">Estadísticas Detalladas</CardTitle>
    </CardHeader>
    <CardContent class="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="text-center">
        <div class="text-3xl font-bold text-green-600">
          {{ successRate }}%
        </div>
        <p class="text-sm text-gray-500">Tasa de éxito</p>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-orange-600">
          {{ stats.totalIngredientsPurchased }}
        </div>
        <p class="text-sm text-gray-500">Ingredientes comprados</p>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold text-red-600">
          {{ stats.platesFailed }}
        </div>
        <p class="text-sm text-gray-500">Platos fallidos</p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KitchenStats } from '@/shared/types';

const props = defineProps<{
  stats: KitchenStats;
}>();

const successRate = computed(() => {
  const total = Math.max(props.stats.totalPlatesOrdered, 1);
  return ((props.stats.platesCompleted / total) * 100).toFixed(1);
});
</script>
