<script setup lang="ts">
import { ref } from 'vue';
import { Zap } from 'lucide-vue-next';

defineProps<{
  isProcessing: boolean;
}>();

const emit = defineEmits<{
  (e: 'start-orders', count: number): void;
}>();

const orderCount = ref(10);

function handleSubmit() {
  emit('start-orders', orderCount.value);
}
</script>

<template>
  <div class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-8 relative overflow-hidden group">
    <!-- Glow effect -->
    <div class="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#22c55e]/10 transition-all duration-700"></div>

    <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="max-w-xl space-y-2">
        <h2 class="text-2xl font-bold text-white">Bulk Order Generator</h2>
        <p class="text-gray-400">
          Simulate high demand loads for the microservices architecture. Enter a quantity to spawn random orders.
        </p>
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto bg-[#051810]/50 p-2 rounded-xl backdrop-blur-sm border border-[#1f4b33]">
        <input 
          v-model="orderCount"
          type="number" 
          min="1" 
          max="100" 
          class="bg-transparent text-white text-center font-bold w-16 border-none focus:ring-0 text-lg outline-none"
        />
        
        <button 
          @click="handleSubmit"
          :disabled="isProcessing"
          class="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transform active:scale-95"
        >
          <Zap class="w-5 h-5" :class="{ 'animate-pulse': isProcessing }" />
          <span>{{ isProcessing ? 'Processing...' : 'Generate Orders' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
