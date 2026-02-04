<script setup lang="ts">
import KitchenDashboard from '@/widgets/KitchenDashboard.vue';

import MarketHistoryPage from '@/pages/MarketHistoryPage.vue';
import InventoryPage from '@/pages/InventoryPage.vue';
import OrderHistoryPage from '@/pages/OrderHistoryPage.vue';
import AIPredictionsPage from '@/pages/AIPredictionsPage.vue';
import { useSSE } from '@/composables/useSSE';
import { useNavigation } from '@/composables/useNavigation';

// Paso 3: Conectar SSE solo para logging (no afecta polling)
const { isConnected } = useSSE();
const { currentPage } = useNavigation();
</script>

<template>
  <div>
    <!-- Pequeño indicador de debug para saber si SSE conectó -->
    <div class="fixed bottom-2 right-2 text-xs px-2 py-1 rounded bg-black/80 text-white z-50">
      SSE: {{ isConnected ? '✅ Connected' : '❌ Disconnected' }}
    </div>
    
        <KitchenDashboard v-if="currentPage === 'dashboard'" />
    <InventoryPage v-else-if="currentPage === 'inventory'" />
    <MarketHistoryPage v-else-if="currentPage === 'market'" />
    <OrderHistoryPage v-else-if="currentPage === 'history'" />
    <AIPredictionsPage v-else-if="currentPage === 'predictions'" />
  </div>
</template>
