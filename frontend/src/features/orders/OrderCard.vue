<template>
  <div
    class="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition cursor-pointer"
    @click="$emit('click')"
  >
    <div class="flex-1">
      <p class="font-medium text-sm">Orden #{{ shortId }}</p>
      <p class="text-xs text-gray-500">{{ formattedTime }}</p>
    </div>
    <Badge :class="badgeClass" class="px-2 py-1 rounded text-xs font-bold">
      {{ statusLabel }}
    </Badge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from '@/shared/types';
import type { Order } from '@/shared/types';

const props = defineProps<{
  order: Order;
}>();

defineEmits<{
  click: [];
}>();

const shortId = computed(() => {
  return props.order.id.split('-')[1] ?? props.order.id.slice(0, 6);
});

const statusLabel = computed(() => ORDER_STATUS_LABELS[props.order.status]);
const badgeClass = computed(() => ORDER_STATUS_STYLES[props.order.status]);
const formattedTime = computed(() => new Date(props.order.createdAt).toLocaleTimeString());
</script>
