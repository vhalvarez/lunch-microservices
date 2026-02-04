<script setup lang="ts">
import { computed } from 'vue';
import { useMarketHistory } from '@/features/market/useMarketHistory';
import { AlertCircle, CheckCircle, Store } from 'lucide-vue-next';
import DashboardLayout from '@/layouts/DashboardLayout.vue';

const { history, isLoading, page, total, totalPages, setPage, status, setStatus } = useMarketHistory();

// Simple mock for "Provider" since we don't have it
const PROVIDER_NAME = "Lunch Market Adapter";

const sortedHistory = computed(() => {
  return [...history.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], { 
    month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6 h-full flex flex-col">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-white tracking-tight">Purchase History</h2>
          <p class="text-gray-400 mt-1">Track all automated market acquisitions and stock refills.</p>
        </div>
      </div>

      <!-- Features -->
      <div class="flex items-center justify-between gap-4 bg-[#0b2419] p-2 rounded-xl border border-[#1f4b33]">
        <div class="flex gap-1">
          <button 
            @click="setStatus(undefined)"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            :class="!status ? 'bg-[#1f4b33] text-white' : 'text-gray-400 hover:bg-[#1f4b33]/50 hover:text-white'"
          >
            All Time
          </button>
          <button 
            @click="setStatus('success')"
            class="px-4 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
            :class="status === 'success' ? 'bg-[#1f4b33] text-white' : 'text-gray-400 hover:bg-[#1f4b33]/50 hover:text-white'"
          >
            All Success
          </button>
          <button 
            @click="setStatus('failed')"
            class="px-4 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
            :class="status === 'failed' ? 'bg-[#1f4b33] text-white' : 'text-gray-400 hover:bg-[#1f4b33]/50 hover:text-white'"
          >
            All Failed
          </button>
        </div>
      </div>

      <!-- Table Section -->
      <div class="flex-1 bg-[#0b2419] border border-[#1f4b33] rounded-2xl overflow-hidden flex flex-col">
        <!-- Table Header -->
        <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1f4b33] bg-[#0d2e20]/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <div class="col-span-4">Ingredient & Order Context</div>
          <div class="col-span-2">Provider</div>
          <div class="col-span-2 text-right">Qty Purchased</div>
          <div class="col-span-2 text-right">Status</div>
          <div class="col-span-2 text-right">Actions</div>
        </div>

        <!-- Table Body -->
        <div class="overflow-y-auto flex-1 p-2 space-y-1">
          <div v-if="isLoading && history.length === 0" class="p-8 text-center text-gray-500">
            Loading history...
          </div>
          
          <div v-else-if="history.length === 0" class="p-8 text-center text-gray-500">
            No purchase history found.
          </div>

          <div 
            v-for="item in sortedHistory" 
            :key="item.id" 
            class="grid grid-cols-12 gap-4 px-4 py-4 rounded-xl hover:bg-[#1f4b33]/30 transition-colors items-center group"
          >
            <!-- Timestamp & Ingredient -->
            <div class="col-span-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-[#1f4b33] flex items-center justify-center text-xl shrink-0">
                🥗
              </div>
              <div>
                <h4 class="text-white font-bold capitalize">{{ item.ingredient }}</h4>
                <div class="flex flex-col text-xs text-gray-500 font-mono mt-0.5">
                   <span>{{ formatTime(item.createdAt) }}</span>
                   <span class="text-gray-600">Order #{{ item.plateId.split('-')[0] }}</span>
                </div>
              </div>
            </div>

            <!-- Provider -->
            <div class="col-span-2 flex items-center gap-2 text-gray-300 text-sm">
              <Store :size="14" />
              <span>{{ PROVIDER_NAME }}</span>
            </div>

            <!-- Qty -->
            <div class="col-span-2 text-right text-white font-mono">
              <span class="text-lg font-bold">{{ item.quantitySold }}</span>
              <span class="text-gray-500 text-xs ml-1">/ {{ item.qtyRequested }}</span>
            </div>

            <!-- Status -->
            <div class="col-span-2 flex justify-end">
               <span 
                 v-if="item.quantitySold >= item.qtyRequested" 
                 class="px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/20"
               >
                 <CheckCircle :size="12" />
                 Successful
               </span>
               <span 
                 v-else 
                 class="px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 bg-red-500/20 text-red-500 border border-red-500/20"
               >
                 <AlertCircle :size="12" />
                 Failed
               </span>
            </div>

            <!-- Actions -->
             <div class="col-span-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="text-gray-400 hover:text-white px-2">•••</button>
             </div>
          </div>
        </div>
        
        <!-- Pagination Footer -->
        <div class="p-4 border-t border-[#1f4b33] flex items-center justify-between text-xs text-gray-400">
           <span>Showing page <strong>{{ page }}</strong> of <strong>{{ totalPages }}</strong> ({{ total }} total)</span>
           <div class="flex gap-2">
             <button 
               @click="setPage(page - 1)"
               :disabled="page <= 1"
               class="px-3 py-1 rounded border border-[#1f4b33] hover:bg-[#1f4b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer"
             >
               &lt; Prev
             </button>
             
             <div class="px-3 py-1 rounded bg-[#22c55e] text-black font-bold">
               {{ page }}
             </div>

             <button 
               @click="setPage(page + 1)"
               :disabled="page >= totalPages"
               class="px-3 py-1 rounded border border-[#1f4b33] hover:bg-[#1f4b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer"
             >
               Next &gt;
             </button>
           </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
