<template>
  <Card class="shadow-sm">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center gap-2 font-semibold">
        <span class="text-purple-600">📖</span>
        <span>Recetas Disponibles</span>
      </CardTitle>
      <CardDescription class="text-sm text-gray-500">
        Platos que se pueden preparar con los ingredientes
      </CardDescription>
    </CardHeader>
    <CardContent class="p-5">
      <div v-if="isLoading" class="text-center py-4 text-gray-500">
        Cargando recetas...
      </div>
      <div v-else-if="recipes.length === 0" class="text-center py-4 text-gray-500">
        No hay recetas disponibles
      </div>
      <div v-else class="space-y-4">
        <div
          v-for="recipe in recipes"
          :key="recipe.name"
          class="border rounded-lg p-4 hover:shadow-md transition bg-gradient-to-r from-purple-50 to-pink-50"
        >
          <h3 class="font-semibold text-lg capitalize mb-2 flex items-center gap-2">
            <span>🍽️</span>
            <span>{{ recipe.name }}</span>
          </h3>
          <div class="text-sm text-gray-600">
            <p class="font-medium mb-1">Ingredientes:</p>
            <ul class="flex flex-wrap gap-2">
              <li
                v-for="item in recipe.items"
                :key="item.ingredient"
                class="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-purple-200"
              >
                <span class="capitalize">{{ item.ingredient }}</span>
                <Badge variant="secondary" class="text-xs">
                  {{ item.qty }}
                </Badge>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Recipe } from '@/shared/types';

defineProps<{
  recipes: Recipe[];
  isLoading: boolean;
}>();
</script>
