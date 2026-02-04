<script setup lang="ts">
interface MarketLogItem {
  id: string;
  ingredient: string;
  qtyRequested: number;
  quantitySold: number;
  createdAt: string;
}

defineProps<{
  logs?: MarketLogItem[];
}>();

import { useNavigation } from '@/composables/useNavigation';

const { navigateTo } = useNavigation();

function goToHistory() {
  navigateTo('market');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-6 h-full flex flex-col overflow-hidden">
    <div class="flex items-center gap-2 mb-6 group cursor-pointer" @click="goToHistory">
      <span class="text-white">🏪</span>
      <h3 class="text-lg font-bold text-white group-hover:text-[#22c55e] transition-colors">Market Log</h3>
      <span class="ml-auto text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
    </div>

    <div class="space-y-6 relative ml-2 flex-col overflow-y-auto no-scrollbar flex-1 min-h-0" v-if="logs && logs.length > 0">
      <!-- Vertical Line -->
      <div class="absolute left-1.5 top-2 bottom-2 w-px bg-[#1f4b33]"></div>

      <div v-for="log in logs" :key="log.id" class="relative pl-6 group">
        <!-- Dot -->
        <div 
          class="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-[#0b2419] z-10"
          :class="log.quantitySold >= log.qtyRequested ? 'bg-[#22c55e]' : 'bg-[#ef4444]'"
        ></div>

        <div class="flex justify-between items-start">
          <div>
            <h4 class="text-white text-sm font-bold group-hover:text-[#22c55e] transition-colors">
              {{ log.quantitySold >= log.qtyRequested ? 'Purchase' : 'Failed' }}: {{ log.qtyRequested }} {{ log.ingredient }}
            </h4>
            <p 
              class="text-xs mt-0.5"
              :class="log.quantitySold >= log.qtyRequested ? 'text-gray-500' : 'text-[#ef4444]'"
            >
              {{ log.quantitySold >= log.qtyRequested ? 'Fulfilled by Market' : 'Insufficient Stock in Market' }}
            </p>
          </div>
          <span class="text-xs font-mono text-gray-600">{{ formatTime(log.createdAt) }}</span>
        </div>
      </div>
    </div>
    
    <div v-else class="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
      <span class="text-2xl mb-2">😴</span>
      No market activity yet
    </div>
  </div>
</template>
