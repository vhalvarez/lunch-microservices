<script setup lang="ts">
import { TabsTrigger as RekaTabsTrigger } from 'reka-ui';
import type { TabsTriggerProps } from 'reka-ui';
import { cn } from '@/lib/utils';

defineProps<TabsTriggerProps & { class?: string }>();
</script>

<template>
  <RekaTabsTrigger
    :value="$props.value"
    :disabled="$props.disabled"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm',
      $props.class
    )"
  >
    <slot />
  </RekaTabsTrigger>
</template>
