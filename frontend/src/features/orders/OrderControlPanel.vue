<template>
  <Card class="shadow-warm my-4">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center space-x-2">
        <span class="inline-flex text-2xl items-center justify-center">👨‍🍳</span>
        <span>Panel de Control del Gerente</span>
      </CardTitle>
      <CardDescription class="text-sm text-gray-500 mt-1">
        Inicia la preparación de platos para los comensales
      </CardDescription>
    </CardHeader>

    <CardContent class="p-5">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1">
          <Label for="quantity" class="block text-sm font-medium text-gray-700">
            Cantidad de platos a preparar
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="1000000"
            placeholder="Max: 1000000"
            v-model="orderQuantity"
            class="mt-1 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div class="flex gap-2 flex-wrap">
          <Button
            class="px-6 py-3 cursor-pointer"
            :disabled="!isValidQuantity || isProcessing"
            @click="handleStartOrders"
          >
            {{ isProcessing ? 'Procesando...' : 'Iniciar Preparación' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const props = defineProps<{
  isProcessing: boolean;
}>();

const emit = defineEmits<{
  startOrders: [count: number];
}>();

const orderQuantity = ref<string>('10');

const orderQuantityNum = computed(() => parseInt(orderQuantity.value || '0', 10));
const isValidQuantity = computed(() =>
  Number.isFinite(orderQuantityNum.value) &&
  orderQuantityNum.value > 0 &&
  orderQuantityNum.value <= 1_000_000
);

function handleStartOrders() {
  if (isValidQuantity.value) {
    emit('startOrders', orderQuantityNum.value);
  }
}
</script>
