<script setup lang="ts">
import { LayoutDashboard, Package, Store, History, Zap } from 'lucide-vue-next';
import { useNavigation } from '@/composables/useNavigation';

const { currentPage, navigateTo } = useNavigation();
</script>

<template>
  <aside class="w-64 bg-[#051810] border-r border-[#1f4b33] flex flex-col h-screen fixed left-0 top-0 z-40">
    <!-- Logo -->
    <div class="p-6 flex items-center gap-3">
      <div class="bg-[#22c55e] p-2 rounded-lg">
        <span class="font-bold text-black text-xl">R</span>
      </div>
      <div class="flex flex-col">
        <span class="font-bold text-white text-lg leading-tight">Restaurant OS</span>
        <span class="text-xs text-gray-400">Manager View</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-4 space-y-2">
      <button 
        @click="navigateTo('dashboard')"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
        :class="currentPage === 'dashboard' ? 'bg-[#22c55e] text-[#051810] font-bold shadow-lg shadow-[#22c55e]/20' : 'text-gray-400 hover:text-white hover:bg-[#1f4b33]'"
      >
        <LayoutDashboard :size="20" />
        <span>Overview</span>
      </button>

      <button 
        @click="navigateTo('predictions')"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
        :class="currentPage === 'predictions' ? 'bg-[#a855f7] text-white font-bold shadow-lg shadow-[#a855f7]/20' : 'text-gray-400 hover:text-white hover:bg-[#1f4b33]'"
      >
        <Zap :size="20" />
        <span>AI Insights</span>
      </button>

      <div class="h-px bg-[#1f4b33] my-2"></div>
      


      <a 
        href="#" 
        @click.prevent="navigateTo('inventory')"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
        :class="currentPage === 'inventory' ? 'bg-[#133926] text-[#22c55e]' : 'text-gray-400 hover:text-white hover:bg-[#133926]/50'"
      >
        <Package :size="20" />
        <span>Inventory</span>
      </a>

      <a 
        href="#" 
        @click.prevent="navigateTo('market')"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
        :class="currentPage === 'market' ? 'bg-[#133926] text-[#22c55e]' : 'text-gray-400 hover:text-white hover:bg-[#133926]/50'"
      >
        <Store :size="20" />
        <span>Market History</span>
      </a>



      <a 
        href="#" 
        @click.prevent="navigateTo('history')"
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
        :class="currentPage === 'history' ? 'bg-[#133926] text-[#22c55e]' : 'text-gray-400 hover:text-white hover:bg-[#133926]/50'"
        >
        <History :size="20" />
        <span>Order History</span>
      </a>
    </nav>


  </aside>
</template>
