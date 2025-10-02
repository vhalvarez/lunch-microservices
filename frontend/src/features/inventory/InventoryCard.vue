<template>
  <Card class="shadow-sm">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center gap-2 font-semibold">
        <span class="text-indigo-600">🛒</span>
        <span>Inventario de Bodega</span>
      </CardTitle>
      <CardDescription class="text-sm text-gray-500">
        Estado actual de ingredientes disponibles
      </CardDescription>
    </CardHeader>
    <CardContent class="p-5">
      <div class="grid grid-cols-2 gap-3">
        <IngredientItem
          v-for="item in inventory"
          :key="item.name"
          :ingredient="item"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import IngredientItem from './IngredientItem.vue';
import type { Ingredient } from '@/shared/types';

defineProps<{
  inventory: Ingredient[];
}>();
</script>
