<script setup lang="ts">
import { RECIPES_LIST } from '@/constants/recipes';

const recipes = RECIPES_LIST;
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <span class="text-[#22c55e]">📖</span>
      <h3 class="text-xl font-bold text-white">Available Recipes</h3>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <div 
        v-for="recipe in recipes" 
        :key="recipe.name"
        class="group relative overflow-hidden rounded-xl bg-[#0b2419] border border-[#1f4b33] hover:border-[#22c55e] transition-colors cursor-pointer"
      >
        <!-- Image with Gradient Overlay -->
        <div class="aspect-square w-full overflow-hidden relative">
          <img 
            :src="recipe.image" 
            :alt="recipe.name"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div :class="['absolute inset-0 bg-gradient-to-t opacity-60', recipe.color]"></div>
        </div>

        <div class="p-3">
          <h4 class="text-white font-bold text-sm truncate">{{ recipe.name }}</h4>
          <p class="text-xs text-gray-500 truncate" :title="recipe.ingredients">{{ recipe.ingredients }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
