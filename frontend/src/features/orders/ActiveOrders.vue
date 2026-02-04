<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Order } from '@/shared/types';
import { CheckCircle, ChefHat, UtensilsCrossed, Clock, X, ShoppingCart } from 'lucide-vue-next';
import { RECIPES_LIST } from '@/constants/recipes';
import { useInventory } from '@/features/inventory/useInventory';
import { useKitchenStats } from '@/features/kitchen/useKitchenStats';

const props = defineProps<{
  orders: Order[];
  limit?: number; // Optional limit for dashboard view
}>();

const { inventory } = useInventory();
const { marketLogs } = useKitchenStats();

const selectedFilter = ref('All');
const selectedOrder = ref<any>(null); // For modal

// Helper to determine recipe Name from ID
// We use a deterministic hash based on ID to pick a recipe
const DISH_NAMES = RECIPES_LIST.map(r => r.name);

const processedOrders = computed(() => {
  return props.orders.map((o, index) => {
    // Deterministic selection
    const nameIndex = (parseInt(o.id.replace(/\D/g, '')) + index) % DISH_NAMES.length;
    const recipeName = DISH_NAMES[nameIndex];
    const recipe = RECIPES_LIST.find(r => r.name === recipeName)!;
    
    return {
      ...o,
      recipe,
      table: (index % 10) + 1,
      seat: Math.floor(Math.random() * 4) + 1,
      timeRemaining: '12:30', // Mock
      progress: o.status === 'completed' ? 100 : o.status === 'cooking' ? 65 : 15
    };
  });
});

const filteredOrders = computed(() => {
  let list = processedOrders.value;
  
  if (selectedFilter.value !== 'All') {
    list = list.filter(o => o.recipe.type === selectedFilter.value);
  }

  if (props.limit) {
    return list.slice(0, props.limit);
  }
  return list;
});

// Logic to check inventory and market sourcing for a specific order
// Logic to check inventory and market sourcing for a specific order
const orderDetails = computed(() => {
  if (!selectedOrder.value) return null;

  // Graceful fallback for inventory and marketLogs
  const currentInventory = inventory.value || [];
  const currentLogs = marketLogs.value || [];

  const recipe = selectedOrder.value.recipe;
  const ingredients = recipe.items.map((itemName: string) => {
    // If inventory not loaded yet, assume 0 stock for safety, or check if array exists
    const invItem = currentInventory.find(i => i.name.toLowerCase() === itemName.toLowerCase());
    const stock = invItem ? invItem.quantity : 0;
    
    const recentlyBought = currentLogs.some(l => l.ingredient.toLowerCase() === itemName.toLowerCase());

    return {
      name: itemName,
      stock,
      hasStock: stock > 0,
      sourcedFromMarket: recentlyBought
    };
  });

  return {
    ...selectedOrder.value,
    ingredientsAnalysis: ingredients
  };
});


// Timeline Logic
const timelineEvents = computed(() => {
  if (!orderDetails.value) return [];

  const baseTime = new Date(orderDetails.value.createdAt);
  const events = [];

  // 1. Order Received (Always happened)
  events.push({
    time: baseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    label: 'Order Received',
    status: 'completed',
    color: 'bg-[#22c55e]'
  });

  // 2. Prep Started (Simulated: +1 min)
  const prepTime = new Date(baseTime.getTime() + 1 * 60000);
  const isPrep = ['cooking', 'completed'].includes(orderDetails.value.status);
  events.push({
    time: prepTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    label: 'Prep Started',
    status: isPrep ? 'completed' : 'current',
    color: 'bg-blue-500'
  });

  // 3. Cooking (Simulated: +3 mins)
  if (['cooking', 'completed'].includes(orderDetails.value.status)) {
    const cookTime = new Date(baseTime.getTime() + 3 * 60000);
    const isCooked = orderDetails.value.status === 'completed';
    events.push({
      time: cookTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: 'Cooking',
      status: isCooked ? 'completed' : 'current',
      color: 'bg-yellow-500'
    });
  }

  // 4. Ready (If completed)
  if (orderDetails.value.status === 'completed') {
    const readyTime = new Date(baseTime.getTime() + 8 * 60000); // Mock +8 mins
    events.push({
      time: readyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label: 'Ready to Serve',
      status: 'completed',
      color: 'bg-white'
    });
  } else {
    // Prediction
    events.push({
      time: '--:--',
      label: 'Estimated Ready',
      status: 'pending',
      color: 'bg-gray-600'
    });
  }

  return events;
});

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'completed': return { label: 'Ready', class: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/50', icon: CheckCircle };
    case 'cooking': return { label: 'Cooking', class: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50', icon: ChefHat };
    case 'pending': return { label: 'Prep', class: 'bg-purple-500/20 text-purple-500 border-purple-500/50', icon: UtensilsCrossed };
    case 'failed': return { label: 'Issue', class: 'bg-red-500/20 text-red-500 border-red-500/50', icon: Clock };
    default: return { label: status, class: 'bg-gray-600 text-white', icon: Clock };
  }
}


function openDetails(order: any) {
  selectedOrder.value = order;
}

function closeDetails() {
  selectedOrder.value = null;
}
const counts = computed(() => {
  const pending = props.orders.filter(o => o.status === 'pending').length;
  const cooking = props.orders.filter(o => o.status === 'cooking').length;
  const ready = props.orders.filter(o => o.status === 'completed').length;
  return { pending, cooking, ready };
});
</script>

<template>
  <div class="space-y-6">
    <!-- Header Row -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h3 class="text-2xl font-bold text-white tracking-tight">Active Orders</h3>
        <div class="flex gap-2">
           <span v-if="counts.pending > 0" class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/20 flex items-center gap-1">
             {{ counts.pending }} Prep
           </span>
           <span v-if="counts.cooking > 0" class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
             {{ counts.cooking }} Cooking
           </span>
            <span v-if="counts.ready > 0" class="px-3 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold border border-[#22c55e]/20 flex items-center gap-1">
             {{ counts.ready }} Ready
           </span>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="flex gap-2">
        <button 
          @click="selectedFilter = 'All'"
          class="px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg"
          :class="selectedFilter === 'All' ? 'bg-[#22c55e] text-[#051810] shadow-[#22c55e]/20' : 'bg-[#0b2419] border border-[#1f4b33] text-gray-400 hover:text-white'"
        >All</button>
        <button 
          @click="selectedFilter = 'Appetizers'"
          class="px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg"
          :class="selectedFilter === 'Appetizers' ? 'bg-[#22c55e] text-[#051810] shadow-[#22c55e]/20' : 'bg-[#0b2419] border border-[#1f4b33] text-gray-400 hover:text-white'"
        >Appetizers</button>
        <button 
          @click="selectedFilter = 'Entrees'"
          class="px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg"
          :class="selectedFilter === 'Entrees' ? 'bg-[#22c55e] text-[#051810] shadow-[#22c55e]/20' : 'bg-[#0b2419] border border-[#1f4b33] text-gray-400 hover:text-white'"
        >Entrees</button>
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      
      <!-- Column: Prep (Pending) -->
      <div class="flex flex-col bg-[#051810]/50 rounded-2xl border border-[#1f4b33] overflow-hidden">
        <div class="p-4 border-b border-[#1f4b33] bg-[#0b2419] flex justify-between items-center sticky top-0 z-10">
          <div class="flex items-center gap-2">
            <UtensilsCrossed :size="16" class="text-purple-400" />
            <h4 class="font-bold text-gray-200">Prep Station</h4>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-[#1f4b33] text-xs font-bold text-gray-400">{{ counts.pending }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <div 
            v-for="order in filteredOrders.filter(o => o.status === 'pending')" 
            :key="order.id"
            @click="openDetails(order)"
            class="bg-[#0b2419] border border-[#1f4b33] hover:border-purple-500/50 rounded-xl p-3 cursor-pointer group transition-all"
          >
            <div class="flex gap-3 mb-2">
              <img :src="order.recipe.image" class="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h5 class="text-white font-bold text-sm line-clamp-1">{{ order.recipe.name }}</h5>
                <p class="text-[10px] text-gray-500">Table {{ order.table }} • Seat {{ order.seat }}</p>
                <p class="text-[10px] text-purple-400 font-mono mt-0.5 font-bold">#{{ order.id.slice(0, 8) }}</p>
              </div>
            </div>
            
            <button @click.stop class="w-full py-1.5 rounded-lg bg-[#133926] text-white text-xs font-bold hover:bg-[#1f4b33] cursor-pointer">
               Bump to Cooking
            </button>
          </div>
          <div v-if="counts.pending === 0" class="text-center py-8 text-gray-600 text-xs italic">No orders in prep</div>
        </div>
      </div>

      <!-- Column: Cooking -->
      <div class="flex flex-col bg-[#051810]/50 rounded-2xl border border-[#1f4b33] overflow-hidden">
        <div class="p-4 border-b border-[#1f4b33] bg-[#0b2419] flex justify-between items-center sticky top-0 z-10">
          <div class="flex items-center gap-2">
            <ChefHat :size="16" class="text-emerald-500" />
            <h4 class="font-bold text-gray-200">Cooking</h4>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-[#1f4b33] text-xs font-bold text-gray-400">{{ counts.cooking }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <div 
            v-for="order in filteredOrders.filter(o => o.status === 'cooking')" 
            :key="order.id"
            @click="openDetails(order)"
            class="bg-[#0b2419] border border-[#1f4b33] hover:border-emerald-500/50 rounded-xl p-3 cursor-pointer group transition-all"
          >
            <div class="flex gap-3 mb-3">
              <img :src="order.recipe.image" class="w-12 h-12 rounded-lg object-cover" />
              <div class="flex-1">
                <h5 class="text-white font-bold text-sm line-clamp-1">{{ order.recipe.name }}</h5>
                <div class="flex justify-between items-center mt-1">
                   <p class="text-[10px] text-gray-500">Table {{ order.table }}</p>
                   <span class="text-xs font-mono font-bold text-white">{{ order.timeRemaining }}</span>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="h-1.5 w-full bg-[#051810] rounded-full overflow-hidden mb-3">
                <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" :style="{ width: order.progress + '%' }"></div>
            </div>
            
            <button @click.stop class="w-full py-1.5 rounded-lg bg-[#22c55e] text-[#051810] text-xs font-bold hover:bg-[#16a34a] shadow-lg shadow-emerald-500/20 cursor-pointer">
               Mark Done
            </button>
          </div>
          <div v-if="counts.cooking === 0" class="text-center py-8 text-gray-600 text-xs italic">No orders cooking</div>
        </div>
      </div>

      <!-- Column: Ready -->
      <div class="flex flex-col bg-[#051810]/50 rounded-2xl border border-[#1f4b33] overflow-hidden">
        <div class="p-4 border-b border-[#1f4b33] bg-[#0b2419] flex justify-between items-center sticky top-0 z-10">
          <div class="flex items-center gap-2">
             <CheckCircle :size="16" class="text-[#22c55e]" />
            <h4 class="font-bold text-gray-200">Ready to Serve</h4>
          </div>
          <span class="px-2 py-0.5 rounded-full bg-[#1f4b33] text-xs font-bold text-gray-400">{{ counts.ready }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <div 
            v-for="order in filteredOrders.filter(o => o.status === 'completed')" 
            :key="order.id"
            @click="openDetails(order)"
            class="bg-[#0b2419] border border-[#1f4b33] hover:border-[#22c55e] rounded-xl p-3 cursor-pointer group transition-all opacity-80 hover:opacity-100"
          >
            <div class="flex items-center gap-3">
              <img :src="order.recipe.image" class="w-10 h-10 rounded-full object-cover border border-[#22c55e]" />
              <div class="flex-1">
                <h5 class="text-white font-bold text-sm line-clamp-1 decoration-slate-500">{{ order.recipe.name }}</h5>
                 <p class="text-[10px] text-[#22c55e] font-bold">Ready for Pickup</p>
              </div>
               <button @click.stop class="px-3 py-1.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] text-xs font-bold cursor-default border border-[#22c55e]/30">
               Serve
            </button>
            </div>
          </div>
          <div v-if="counts.ready === 0" class="text-center py-8 text-gray-600 text-xs italic">No orders ready</div>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <Teleport to="body">
      <div v-if="selectedOrder" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="closeDetails">
        <div class="bg-[#0b2419] border border-[#1f4b33] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          
          <div v-if="orderDetails">
            <!-- Modal Header -->
            <div class="relative h-48">
              <img :src="orderDetails.recipe.image" class="w-full h-full object-cover opacity-60" />
              <div class="absolute inset-0 bg-gradient-to-t from-[#0b2419] via-[#0b2419]/50 to-transparent"></div>
              <button @click="closeDetails" class="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors cursor-pointer z-50">
                <X :size="20" />
              </button>
              <div class="absolute bottom-6 left-6">
                <div class="flex items-center gap-3 mb-2">
                  <span :class="['px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', getStatusBadge(orderDetails.status).class]">
                    {{ getStatusBadge(orderDetails.status).label }}
                  </span>
                  <span class="text-white/60 text-sm font-mono">#{{ orderDetails.id }}</span>
                </div>
                <h2 class="text-3xl font-bold text-white">{{ orderDetails.recipe.name }}</h2>
              </div>
            </div>
            
            <!-- Content -->
            <div class="p-8 overflow-y-auto space-y-8">
              
              <!-- Grid Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Left: Ingredients & Inventory -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2 mb-2">
                    <ChefHat :size="18" class="text-[#22c55e]" />
                    <h4 class="text-white font-bold uppercase tracking-wider text-xs">Ingredients & Sourcing</h4>
                  </div>
                  
                  <div class="space-y-3">
                    <div v-for="ing in orderDetails.ingredientsAnalysis" :key="ing.name" class="flex items-center justify-between p-3 bg-[#051810] rounded-xl border border-[#1f4b33]">
                      <div class="flex items-center gap-3">
                        <span class="text-lg capitalize text-white">{{ ing.name }}</span>
                      </div>
                      
                      <div class="flex flex-col gap-1 text-right items-end">
                        <!-- Stock Status -->
                        <span v-if="ing.hasStock" class="text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">Running Smooth</span>
                        <span v-else class="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Out of Stock</span>
                        
                        <!-- Market Status -->
                          <div v-if="ing.sourcedFromMarket" class="flex items-center gap-1 text-[10px] text-blue-400">
                            <ShoppingCart :size="10" />
                            <span>Sourced Today</span>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>

            <!-- Right: Order Timeline (Dynamic) -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-2">
                <Clock :size="18" class="text-blue-400" />
                <h4 class="text-white font-bold uppercase tracking-wider text-xs">Order Timeline</h4>
              </div>
              
              <div class="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#1f4b33]">
                  <div 
                    v-for="(event, i) in timelineEvents" 
                    :key="i"
                    class="relative transition-all duration-500"
                    :class="{'opacity-40': event.status === 'pending'}"
                  >
                    <!-- Dot -->
                    <div 
                      class="absolute -left-[21px] w-3 h-3 rounded-full border-2 border-[#0b2419] transition-colors duration-500"
                      :class="event.color"
                    ></div>
                    
                    <!-- Content -->
                    <p class="text-xs text-gray-400 mb-0.5 font-mono">{{ event.time }}</p>
                    <p class="text-white text-sm font-bold">{{ event.label }}</p>
                  </div>
              </div>
            </div>
              </div>
            </div>

            <div class="p-6 border-t border-[#1f4b33] bg-[#051810] flex justify-end gap-3">
              <button @click="closeDetails" class="px-6 py-2 rounded-xl border border-[#1f4b33] text-white hover:bg-[#1f4b33] transition-colors font-bold cursor-pointer">Close</button>
            </div>
          </div>
          
          <!-- Loading Fallback if orderDetails is not ready -->
          <div v-else class="p-12 text-center text-white">
             <p>Loading details...</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
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

