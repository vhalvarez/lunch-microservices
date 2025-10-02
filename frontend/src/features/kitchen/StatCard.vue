<template>
  <Card class="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md hover:scale-110 scale-100 transition">
    <CardHeader class="flex items-center justify-between">
      <CardTitle class="text-sm font-medium">{{ title }}</CardTitle>
      <div>{{ icon }}</div>
    </CardHeader>
    <div :class="`text-2xl font-bold mt-2 ${valueClass}`">
      {{ value }}
    </div>
    <p class="text-xs text-gray-500">{{ description }}</p>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

defineProps<{
  title: string;
  value: string;
  icon: string;
  description: string;
  valueClass?: string;
}>();
</script>
