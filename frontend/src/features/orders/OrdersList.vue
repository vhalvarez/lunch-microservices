<template>
  <Card class="rounded-xl shadow-sm">
    <CardHeader class="p-5">
      <CardTitle class="font-semibold">Órdenes Recientes</CardTitle>
      <CardDescription class="text-sm text-gray-500">
        Últimas 10 órdenes procesadas
      </CardDescription>
    </CardHeader>

    <CardContent class="p-5">
      <div class="space-y-3 max-h-80 overflow-y-auto">
        <p v-if="orders.length === 0" class="text-center text-gray-500 py-8">
          No hay órdenes aún. ¡Inicia la preparación!
        </p>
        <OrderCard
          v-else
          v-for="order in recentOrders"
          :key="order.id"
          :order="order"
          @click="openOrder(order.id)"
        />
        <OrderDetailDialog
          :open="detailOpen"
          :plate-id="selectedOrderId"
          @update:open="detailOpen = $event"
        />
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import OrderCard from './OrderCard.vue';
import OrderDetailDialog from './OrderDetailDialog.vue';
import type { Order } from '@/shared/types';

const props = defineProps<{
  orders: Order[];
}>();

const recentOrders = computed(() => props.orders.slice(-10).reverse());

const selectedOrderId = ref<string | null>(null);
const detailOpen = ref(false);

function openOrder(orderId: string) {
  selectedOrderId.value = orderId;
  detailOpen.value = true;
}
</script>
