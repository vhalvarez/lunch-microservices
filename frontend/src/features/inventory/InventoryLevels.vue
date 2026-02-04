<script setup lang="ts">
import { computed } from 'vue';

interface IngredientItem {
  name: string;
  quantity: number;
}

const props = defineProps<{
  inventory: IngredientItem[]; // Changed from Record<string, number> to Array
}>();

const STOCK_BASELINE = 20; // Minimum scale for the bar

// Icon mapping based on ingredient name (lowercase)
const INGREDIENT_CONFIG: Record<string, { icon: string; label: string }> = {
  tomato: { icon: '🍅', label: 'Tomato' },
  lemon: { icon: '🍋', label: 'Lemon' },
  potato: { icon: '🥔', label: 'Potato' },
  rice: { icon: '🍚', label: 'Rice' },
  onion: { icon: '🧅', label: 'Onion' },
  ketchup: { icon: '🥫', label: 'Ketchup' },
  lettuce: { icon: '🥬', label: 'Lettuce' },
  cheese: { icon: '🧀', label: 'Cheese' },
  meat: { icon: '🥩', label: 'Meat' },
  chicken: { icon: '🍗', label: 'Chicken' },
};

const ingredients = computed(() => {
  if (!props.inventory || !Array.isArray(props.inventory)) return [];
  
  // Sort alphabetically
  const sortedInventory = [...props.inventory].sort((a, b) => a.name.localeCompare(b.name));

  // Find the highest quantity to scale the bars (at least STOCK_BASELINE)
  const maxQty = Math.max(STOCK_BASELINE, ...sortedInventory.map(i => i.quantity));

  return sortedInventory.map(item => {
    // Determine key from name (lowercase)
    const key = item.name.toLowerCase();
    const config = INGREDIENT_CONFIG[key] || { icon: '📦', label: item.name };
    const qty = item.quantity;
    
    let status = 'Good';
    let color = 'bg-[#22c55e]';
    let badgeColor = 'bg-[#22c55e]/20 text-[#22c55e]';

    if (qty < 5) {
      status = 'Low';
      color = 'bg-[#ef4444]'; // Red
      badgeColor = 'bg-[#ef4444]/20 text-[#ef4444]';
    } else if (qty < 10) {
      status = 'Med';
      color = 'bg-yellow-500';
      badgeColor = 'bg-yellow-500/20 text-yellow-500';
    }

    return {
      key,
      name: config.label,
      icon: config.icon,
      qty,
      status,
      color,
      badgeColor,
      percent: Math.min((qty / maxQty) * 100, 100)
    };
  });
});
</script>

<template>
  <div class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-6 h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <span class="text-white">📦</span>
        <h3 class="text-lg font-bold text-white">Inventory Levels</h3>
      </div>
      <button class="px-3 py-1 bg-[#133926] hover:bg-[#1f4b33] text-[#22c55e] text-xs font-bold rounded uppercase tracking-wider transition-colors cursor-pointer">
        Restock All
      </button>
    </div>

    <!-- Header -->
    <div class="grid grid-cols-12 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">
      <div class="col-span-4">Ingredient</div>
      <div class="col-span-2 text-center">Status</div>
      <div class="col-span-4">Stock Level</div>
      <div class="col-span-2 text-right">Qty</div>
    </div>

    <!-- List -->
    <div class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <div v-for="item in ingredients" :key="item.key" class="grid grid-cols-12 items-center px-2 py-2 hover:bg-[#133926]/30 rounded-lg transition-colors group">
        <!-- Name + Icon -->
        <div class="col-span-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-[#133926] flex items-center justify-center text-lg">
            <span>{{ item.icon }}</span>
          </div>
          <span class="text-white font-medium text-sm">{{ item.name }}</span>
        </div>

        <!-- Status -->
        <div class="col-span-2 flex justify-center">
          <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase', item.badgeColor]">
            {{ item.status }}
          </span>
        </div>

        <!-- Bar -->
        <div class="col-span-4">
          <div class="h-2 w-full bg-[#051810] rounded-full overflow-hidden">
            <div :class="['h-full rounded-full transition-all duration-500', item.color]" :style="{ width: item.percent + '%' }"></div>
          </div>
        </div>

        <!-- Qty -->
        <div class="col-span-2 text-right text-gray-400 text-sm font-mono">
          <span class="text-white font-bold">{{ item.qty }}</span>
        </div>
      </div>
    </div>
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
