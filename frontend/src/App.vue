<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import Index from './pages/index.vue';
</script>

<template>
  <Index />
  <Toaster />
  <VueQueryDevtools />
</template>
