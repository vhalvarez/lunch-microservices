<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { ordersApi } from '@/features/orders/orders.api';
import type { Order } from '@/shared/types';

// --- State ---
const orders = ref<Order[]>([]);
const total = ref(0);
const limit = ref(10);
const page = ref(1);
const isLoading = ref(false);

const totalPages = computed(() => Math.ceil(total.value / limit.value));
const startRecord = computed(() => (page.value - 1) * limit.value + 1);
const endRecord = computed(() => Math.min(page.value * limit.value, total.value));

// --- Fetch Data ---
async function fetchHistory() {
  isLoading.value = true;
  try {
    const offset = (page.value - 1) * limit.value;
    const { data, total: totalCount } = await ordersApi.getAll({ 
      limit: limit.value, 
      offset 
    });
    orders.value = data;
    total.value = totalCount;
  } catch (e) {
    console.error('Failed to fetch orders', e);
  } finally {
    isLoading.value = false;
  }
}

function changePage(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  fetchHistory();
}

onMounted(() => {
  fetchHistory();
});

// --- Helpers ---
function formatTimestamp(ts: string) {
  const date = new Date(ts);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
}

function formatPrepTime(start: string, end?: string | null) {
  if (!end) return '--';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs <= 0) return '--';
  const diffSec = Math.floor(diffMs / 1000);
  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;
  return `${m}m ${s}s`;
}

// --- Icons Helper (Mock logic based on ID for visual variety) ---
const INGREDIENT_ICONS = ['🍅', '🍋', '🥔', '🍚', '🧅', '🥫', '🥬', '🧀', '🥩', '🍗'];

function getMockIngredients(id: string) {
  // Deterministic "random" ingredients based on ID char codes
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  const count = (seed % 3) + 2; // 2 to 4 ingredients
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(INGREDIENT_ICONS[(seed + i) % INGREDIENT_ICONS.length]);
  }
  return result;
}

// --- KPI Formatting ---
const totalMeals = computed(() => total.value);
</script>

<template>
  <DashboardLayout>
    <div class="h-full flex flex-col space-y-6">
      
      <!-- Header / KPIs -->
      <div class="flex items-start justify-between">
         <div>
            <h2 class="text-3xl font-bold text-white">Order History</h2>
            <h3 class="text-gray-400 mt-1">Complete log of all successfully processed and delivered meals.</h3>
         </div>
         
         <div class="flex gap-4">
             <!-- KPI 1 -->
             <div class="bg-[#1f4b33]/20 border border-[#1f4b33] rounded-xl px-5 py-3 min-w-[160px]">
                 <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Meals Today</p>
                 <div class="flex items-baseline gap-2">
                     <span class="text-3xl font-bold text-white">{{ totalMeals }}</span>
                     <span class="text-[#22c55e] text-xs font-bold">+12%</span>
                 </div>
             </div>
             <!-- KPI 2 -->
             <div class="bg-[#1f4b33]/20 border border-[#1f4b33] rounded-xl px-5 py-3 min-w-[160px]">
                 <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Avg Prep Time</p>
                 <div class="flex items-baseline gap-2">
                     <span class="text-3xl font-bold text-white">14m 22s</span>
                     <span class="text-orange-500 text-xs font-bold">-5%</span>
                 </div>
             </div>
         </div>
      </div>

      <!-- Table Panel -->
      <div class="flex-1 bg-[#0b2419] border border-[#1f4b33] rounded-2xl flex flex-col overflow-hidden">
          
          <!-- Header -->
          <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#1f4b33] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
             <div class="col-span-2">Order ID</div>
             <div class="col-span-2">Timestamp</div>
             <div class="col-span-3">Recipe Name</div>
             <div class="col-span-2">Ingredients Used</div>
             <div class="col-span-1">Prep Time</div>
             <div class="col-span-1">Status</div>
             <div class="col-span-1"></div> <!-- Spacer for removed actions -->
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="flex-1 flex items-center justify-center text-gray-500">
             Loading orders...
          </div>

          <!-- Rows -->
          <div v-else class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              <div 
                 v-for="order in orders" 
                 :key="order.id" 
                 class="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-[#1f4b33]/20 transition-colors border-b border-[#1f4b33]/30 last:border-0 group"
              >
                  <!-- ID -->
                  <div class="col-span-2 text-white font-mono text-sm">#{{ order.id.substring(0,8).toUpperCase() }}</div>
                  
                  <!-- Timestamp -->
                  <div class="col-span-2 flex flex-col">
                      <span class="text-white text-sm font-medium">{{ formatTimestamp(order.createdAt).date }}</span>
                      <span class="text-xs text-[#22c55e]">{{ formatTimestamp(order.createdAt).time }}</span>
                  </div>

                  <!-- Recipe (Mocked Name) -->
                  <div class="col-span-3 text-white font-bold text-sm">Meal {{ order.id.substring(0,4).toUpperCase() }}</div>

                  <!-- Ingredients (Mocked) -->
                  <div class="col-span-2 flex gap-1">
                      <div 
                        v-for="(icon, idx) in getMockIngredients(order.id)" 
                        :key="idx"
                        class="w-6 h-6 rounded-full bg-[#1f4b33] flex items-center justify-center text-xs border border-[#1f4b33] text-gray-300"
                      >
                         {{ icon }}
                      </div>
                  </div>

                  <!-- Prep Time -->
                  <div class="col-span-1 text-gray-300 text-sm font-mono">{{ formatPrepTime(order.createdAt, order.preparedAt) }}</div>

                  <!-- Status -->
                  <div class="col-span-1">
                      <span 
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                        :class="order.status === 'completed' ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30' : (order.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30')"
                      >
                         <span class="w-1.5 h-1.5 rounded-full" :class="order.status === 'completed' ? 'bg-[#22c55e]' : (order.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500')"></span>
                         <span class="capitalize">{{ order.status }}</span>
                      </span>
                  </div>

                  <!-- Empty Spacer -->
                  <div class="col-span-1"></div>
              </div>

               <!-- Empty State -->
               <div v-if="orders.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
                   <p>No orders found.</p>
               </div>
          </div>
          
          <!-- Footer Pagination -->
          <div class="p-4 border-t border-[#1f4b33] flex items-center justify-between bg-[#0b2419]">
              <span class="text-xs text-gray-500">
                Showing <span class="text-white font-bold">{{ startRecord }}</span> to <span class="text-white font-bold">{{ endRecord }}</span> of <span class="text-white font-bold">{{ total }}</span> results
              </span>
              
              <div class="flex gap-2">
                  <button 
                    @click="changePage(page - 1)"
                    :disabled="page === 1"
                    class="px-3 py-1.5 text-xs rounded-lg border border-[#1f4b33] text-gray-400 hover:text-white hover:bg-[#1f4b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >Previous</button>
                  
                  <span class="px-3 py-1.5 text-xs rounded-lg bg-[#22c55e] text-[#051810] font-bold">{{ page }}</span>
                  
                  <button 
                    @click="changePage(page + 1)"
                    :disabled="page === totalPages"
                    class="px-3 py-1.5 text-xs rounded-lg border border-[#1f4b33] text-gray-400 hover:text-white hover:bg-[#1f4b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >Next</button>
              </div>
          </div>
      </div>
      
    </div>
  </DashboardLayout>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #051810;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f4b33;
  border-radius: 4px;
}
</style>
