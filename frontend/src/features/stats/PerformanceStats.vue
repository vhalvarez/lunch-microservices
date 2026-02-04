<script setup lang="ts">
import { computed } from 'vue';
import type { KitchenStats } from '@/shared/types';

const props = defineProps<{
  stats?: KitchenStats;
  avgPrepTime?: number; // seconds
  lowStockCount?: number;
}>();

const formattedTime = computed(() => {
  if (!props.avgPrepTime) return '--';
  const mins = Math.floor(props.avgPrepTime / 60);
  const secs = Math.round(props.avgPrepTime % 60);
  return `${mins}m ${secs}s`;
});

const accuracy = computed(() => {
  if (!props.stats || props.stats.platesCompleted === 0) return '100%';
  const total = props.stats.platesCompleted + props.stats.platesFailed;
  if (total === 0) return '100%';
  return Math.round((props.stats.platesCompleted / total) * 100) + '%';
});
</script>

<template>
  <div class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-8 relative overflow-hidden">
    <!-- Header with tag -->
    <div class="flex justify-between items-start mb-8 relative z-10">
      <h3 class="text-xl font-bold text-white">Today's Performance</h3>
      <span class="bg-[#1f4b33] text-gray-300 text-xs px-2 py-1 rounded font-mono">Last 24 Hours</span>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
      <div class="space-y-1">
        <div class="text-5xl font-bold text-white">{{ stats?.platesCompleted || 0 }}</div>
        <div class="text-gray-400 text-sm">Orders Served</div>
      </div>

      <div class="space-y-1">
        <div class="text-5xl font-bold text-white">{{ formattedTime }}</div>
        <div class="text-gray-400 text-sm">Avg. Prep Time</div>
      </div>

      <div class="space-y-1">
        <div class="text-5xl font-bold text-white">{{ accuracy }}</div>
        <div class="text-gray-400 text-sm">Order Accuracy</div>
      </div>

      <div class="space-y-1">
        <div class="text-5xl font-bold text-white">{{ lowStockCount || 0 }}</div>
        <div class="text-gray-400 text-sm">Low Stock Alerts</div>
      </div>
    </div>
    
    <!-- Decorative background elements -->
    <div class="absolute right-0 bottom-0 w-96 h-full bg-gradient-to-l from-[#22c55e]/5 to-transparent pointer-events-none"></div>
  </div>
</template>
