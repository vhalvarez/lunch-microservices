<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Orden #{{ shortId }}</DialogTitle>
        <DialogDescription>{{ recipeName }}</DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="py-6 text-sm text-gray-500">Cargando…</div>

      <div v-else-if="detail" class="space-y-4">
        <section>
          <h4 class="font-semibold mb-2">Ingredientes del plato</h4>
          <ul class="space-y-1 text-sm">
            <li
              v-for="item in detail.items"
              :key="item.ingredient"
              class="flex justify-between"
            >
              <span class="capitalize">{{ item.ingredient }}</span>
              <span>{{ item.reserved }}/{{ item.needed }}</span>
            </li>
          </ul>
        </section>

        <section v-if="detail.purchases?.length">
          <h4 class="font-semibold mt-4 mb-2">Compras asociadas</h4>
          <ul class="space-y-1 text-xs text-gray-600">
            <li
              v-for="purchase in detail.purchases"
              :key="purchase.id"
              class="flex justify-between"
            >
              <span class="capitalize">{{ purchase.ingredient }}</span>
              <span>
                {{ purchase.quantitySold }} (solicitado {{ purchase.qtyRequested }})
              </span>
            </li>
          </ul>
        </section>
      </div>

      <DialogFooter>
        <Button @click="$emit('update:open', false)">Cerrar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { toRef, watch } from 'vue';
import { useOrderDetail } from './useOrderDetail';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const props = defineProps<{
  plateId: string | null;
  open: boolean;
}>();

defineEmits<{
  'update:open': [value: boolean];
}>();

const plateIdRef = toRef(props, 'plateId');
const { detail, recipeName, isLoading, shortId, refetch } = useOrderDetail(plateIdRef);

watch(
  () => props.open,
  (open) => {
    if (open && props.plateId) {
      refetch();
    }
  }
);
</script>
