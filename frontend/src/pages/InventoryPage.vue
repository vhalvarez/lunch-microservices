<script setup lang="ts">
import { computed, ref } from 'vue';
import { useInventory } from '@/features/inventory/useInventory';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  TrendingDown 
} from 'lucide-vue-next';

const { inventory } = useInventory();

// --- Local State ---
const selectedFilter = ref<'All' | 'Low Stock' | 'Good Stock'>('All');

// --- Computed ---
const totalItems = computed(() => {
  return inventory.value.reduce((acc, item) => acc + item.quantity, 0);
});

const lowStockItems = computed(() => {
  return inventory.value.filter(item => item.quantity < 5);
});

const filteredInventory = computed(() => {
  let items = inventory.value;



  // 2. Filter
  if (selectedFilter.value === 'Low Stock') {
    items = items.filter(i => i.quantity < 5);
  } else if (selectedFilter.value === 'Good Stock') {
    items = items.filter(i => i.quantity >= 5);
  }

  // Sort by name
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
});

// --- Icons Helper ---
const INGREDIENT_ICONS: Record<string, string> = {
  tomato: '🍅', lemon: '🍋', potato: '🥔', rice: '🍚',
  onion: '🧅', ketchup: '🥫', lettuce: '🥬', cheese: '🧀',
  meat: '🥩', chicken: '🍗'
};

function getIcon(name: string) {
  return INGREDIENT_ICONS[name.toLowerCase()] || '📦';
}

function getStatus(qty: number) {
  if (qty === 0) return { label: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle };
  if (qty < 5) return { label: 'Low Stock', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: TrendingDown };
  return { label: 'In Stock', color: 'text-[#22c55e]', bg: 'bg-[#22c55e]/10', icon: CheckCircle };
}

function getMaxStock(name: string) {
  // Mock max stock values for progress bars
  const limits: Record<string, number> = {
    potato: 50, rice: 50, meat: 20, chicken: 20,
    lemon: 20, tomato: 20, onion: 20, lettuce: 12, cheese: 15, ketchup: 10
  };
  return limits[name.toLowerCase()] || 20;
}



</script>

<template>
  <DashboardLayout>
    <div class="space-y-6 h-full flex flex-col">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-white tracking-tight">Warehouse Inventory</h2>
          <p class="text-gray-400 mt-1">Real-time stock monitoring and procurement status</p>
        </div>

      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Total Stock Card -->
        <div class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
          <div class="relative z-10">
             <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Items in Stock</p>
             <div class="flex items-baseline gap-2">
               <h3 class="text-4xl font-bold text-white">{{ totalItems }}</h3>
               <span class="text-[#22c55e] font-bold text-sm">Units</span>
             </div>
             <div class="w-32 h-1 bg-[#1f4b33] rounded-full mt-4 overflow-hidden">
               <div class="h-full bg-[#22c55e] w-3/4"></div>
             </div>
          </div>
          <div class="bg-[#1f4b33]/20 p-4 rounded-full">
            <Package :size="32" class="text-[#22c55e]" />
          </div>
        </div>

        <!-- Needs Restock Card -->
        <div class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group">
          <div class="relative z-10">
             <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Active Shortages</p>
             <div class="flex items-baseline gap-2">
               <h3 class="text-4xl font-bold text-white">{{ lowStockItems.length }}</h3>
               <span class="text-orange-500 font-bold text-sm">Critical</span>
             </div>
             <div class="w-32 h-1 bg-[#1f4b33] rounded-full mt-4 overflow-hidden">
               <div class="h-full bg-orange-500" :style="{ width: (lowStockItems.length / inventory.length) * 100 + '%' }"></div>
             </div>
          </div>
          <div class="bg-[#1f4b33]/20 p-4 rounded-full">
            <ShoppingCart :size="32" class="text-orange-500" />
          </div>
        </div>
      </div>

      <!-- Main Inventory Table Section -->
      <div class="flex-1 bg-[#0b2419] border border-[#1f4b33] rounded-2xl flex flex-col overflow-hidden">
        
        <!-- Filters Toolbar -->
        <div class="p-4 border-b border-[#1f4b33] flex flex-wrap items-center justify-between gap-4">
          <!-- Search -->


          <!-- Tabs -->
          <div class="flex bg-[#051810] p-1 rounded-xl border border-[#1f4b33]">
            <button 
              v-for="tab in ['All', 'Low Stock', 'Good Stock']" 
              :key="tab"
              @click="selectedFilter = tab as any"
              class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              :class="selectedFilter === tab ? 'bg-[#1f4b33] text-white shadow-sm' : 'text-gray-400 hover:text-white'"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <!-- Table Header -->
        <div class="grid grid-cols-12 gap-4 px-6 py-3 bg-[#0d2e20]/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#1f4b33]">
          <div class="col-span-4 md:col-span-3">Item</div>
          <div class="col-span-4 md:col-span-5">Stock Level</div>
          <div class="col-span-2 md:col-span-2">Status</div>

        </div>

        <!-- List -->
        <div class="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          <div 
            v-for="item in filteredInventory" 
            :key="item.name"
            class="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl hover:bg-[#1f4b33]/30 transition-colors group"
          >
            <!-- Item Name -->
            <div class="col-span-4 md:col-span-3 flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-[#1f4b33]/50 flex items-center justify-center text-xl border border-[#1f4b33] group-hover:border-[#22c55e]/50 transition-colors">
                {{ getIcon(item.name) }}
              </div>
              <div>
                <h4 class="text-white font-bold text-sm capitalize">{{ item.name }}</h4>
                <span class="text-[10px] text-gray-500">ID: #{{ item.name.substring(0,3).toUpperCase() }}</span>
              </div>
            </div>

            <!-- Stock Level (Bar) -->
            <div class="col-span-4 md:col-span-5 pr-4">
               <div class="flex justify-between text-xs mb-1.5">
                 <span class="font-bold text-white">{{ item.quantity }} <span class="text-gray-500 font-normal">Units</span></span>

               </div>
               <div class="h-1.5 w-full bg-[#051810] rounded-full overflow-hidden">
                 <div 
                   class="h-full rounded-full transition-all duration-500"
                   :class="getStatus(item.quantity).color === 'text-red-500' ? 'bg-red-500' : (getStatus(item.quantity).color === 'text-orange-500' ? 'bg-orange-500' : 'bg-[#22c55e]')"
                   :style="{ width: Math.min((item.quantity / getMaxStock(item.name)) * 100, 100) + '%' }"
                 ></div>
               </div>
            </div>

            <!-- Status -->
            <div class="col-span-2 md:col-span-2">
               <span 
                 class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                 :class="[getStatus(item.quantity).color, getStatus(item.quantity).bg, 'border-' + getStatus(item.quantity).color.replace('text-', '') + '/20']"
               >
                 <component :is="getStatus(item.quantity).icon" :size="12" />
                 <span class="hidden md:inline">{{ getStatus(item.quantity).label }}</span>
               </span>
            </div>


          </div>
          
          <!-- Empty State -->
          <div v-if="filteredInventory.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
             <Package :size="48" class="mb-4 opacity-20" />
             <p>No inventory items found matching your filters.</p>
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
