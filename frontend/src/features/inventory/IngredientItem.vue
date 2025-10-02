<template>
  <div class="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-green-50 to-green-100 hover:scale-110 scale-100 transition">
    <span class="font-medium capitalize text-sm">{{ ingredient.name }}</span>
    <Badge :class="badgeClass">
      {{ ingredient.quantity }}
    </Badge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { Ingredient } from '@/shared/types';

const props = defineProps<{
  ingredient: Ingredient;
}>();

const badgeClass = computed(() => {
  if (props.ingredient.quantity < 3) {
    return 'bg-red-100 text-red-700 border border-red-200';
  }
  if (props.ingredient.quantity < 5) {
    return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  }
  return 'bg-green-100 text-green-900 border border-green-500';
});
</script>
