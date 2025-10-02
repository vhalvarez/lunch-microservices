<script setup lang="ts">
import { TabsContent as RekaTabsContent } from 'reka-ui';
import type { TabsContentProps } from 'reka-ui';
import { cn } from '@/lib/utils';

defineProps<TabsContentProps & { class?: string }>();
</script>

<template>
  <RekaTabsContent
    :value="$props.value"
    :force-mount="$props.forceMount"
    :class="cn('mt-2', $props.class)"
  >
    <slot />
  </RekaTabsContent>
</template>
