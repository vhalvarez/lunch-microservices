<script setup lang="ts">
import { computed } from 'vue';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import BulkOrderGenerator from '@/features/orders/BulkOrderGenerator.vue';
import ActiveOrders from '@/features/orders/ActiveOrders.vue';
import InventoryLevels from '@/features/inventory/InventoryLevels.vue';
import MarketLog from '@/features/market/MarketLog.vue';
import RecipesGrid from '@/features/recipes/RecipesGrid.vue';
import PerformanceStats from '@/features/stats/PerformanceStats.vue';

// Hooks
import { useOrders } from '@/features/orders/useOrders';
import { useInventory } from '@/features/inventory/useInventory';
import { useKitchenStats } from '@/features/kitchen/useKitchenStats';

const { orders, createOrders, isCreating } = useOrders();
const { inventory } = useInventory();
const { stats, timings, marketLogs } = useKitchenStats();

// Calculate low stock items count
const lowStockCount = computed(() => {
  if (!inventory.value || !Array.isArray(inventory.value)) return 0;
  return inventory.value.filter(item => item.quantity < 5).length;
});

const hasActiveWork = computed(() => {
  if (!stats.value) return false;
  return stats.value.platesInProgress > 0 ||
         (stats.value.totalPlatesOrdered - stats.value.platesCompleted - stats.value.platesFailed) > 0;
});

const isProcessing = computed(() => isCreating.value || hasActiveWork.value);

function handleStartOrders(count: number) {
  createOrders(count);
}
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      
      <!-- Order Control -->
      <section>
        <BulkOrderGenerator
          :is-processing="isProcessing"
          @start-orders="handleStartOrders"
        />
      </section>

      <!-- Active Orders -->
      <!-- Active Orders -->
      <section>
        <ActiveOrders :orders="orders" />
      </section>

      <!-- Grid for Inventory & Market -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="h-[500px]">
          <InventoryLevels :inventory="inventory" />
        </div>
        <div class="h-[500px]">
          <MarketLog :logs="marketLogs" />
        </div>
      </section>

      <!-- Recipes -->
      <section>
        <RecipesGrid />
      </section>

      <!-- Performance Stats -->
      <section>
        <PerformanceStats 
          :stats="stats" 
          :avgPrepTime="timings?.avgSeconds" 
          :lowStockCount="lowStockCount"
        />
      </section>
      
    </div>
  </DashboardLayout>
</template>
