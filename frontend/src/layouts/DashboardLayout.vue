<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
</script>

<template>
  <div class="min-h-screen bg-[#051810] text-gray-200 font-sans">
    <Sidebar />
    
    <div class="pl-64 flex flex-col min-h-screen">
      <Header />
      
      <main class="flex-1 p-8 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
