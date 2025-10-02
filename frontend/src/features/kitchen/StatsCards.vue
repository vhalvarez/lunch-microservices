<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-4">
    <StatCard
      title="Platos Ordenados"
      :value="stats?.totalPlatesOrdered.toLocaleString() ?? '0'"
      icon="👥"
      description="Total de órdenes"
      value-class="text-orange-600"
    />
    <StatCard
      title="Completados"
      :value="stats?.platesCompleted.toLocaleString() ?? '0'"
      icon="📈"
      description="Platos entregados"
      value-class="text-green-600"
    />
    <StatCard
      title="En Progreso"
      :value="stats?.platesInProgress.toLocaleString() ?? '0'"
      icon="⏱️"
      description="Cocinando ahora"
      value-class="text-amber-600"
    />
    <StatCard
      title="Tiempo Promedio"
      :value="avgFmt"
      icon="⏱️"
      :description="`p95: ${p95Fmt}${timingsCount ? ' • n=' + timingsCount : ''}`"
      value-class="text-emerald-600"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatCard from './StatCard.vue';
import type { KitchenStats } from '@/shared/types';

interface Timings {
  avgSeconds: number;
  p95Seconds: number;
  count: number;
}

const props = defineProps<{
  stats: KitchenStats | undefined;
  timings: Timings | undefined;
}>();

const avgFmt = computed(() => `${(props.timings?.avgSeconds ?? 0).toFixed(1)}s`);
const p95Fmt = computed(() => `${(props.timings?.p95Seconds ?? 0).toFixed(1)}s`);
const timingsCount = computed(() => props.timings?.count ?? 0);
</script>
