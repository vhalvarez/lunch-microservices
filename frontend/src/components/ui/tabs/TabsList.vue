<script setup lang="ts">
import { TabsList as RekaTabsList } from 'reka-ui';
import type { TabsListProps } from 'reka-ui';
import { cn } from '@/lib/utils';

defineProps<TabsListProps & { class?: string }>();
</script>

<template>
  <RekaTabsList
    :class="cn('inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600', $props.class)"
  >
    <slot />
  </RekaTabsList>
</template>
