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
            <li v-for="it in detail.items" :key="it.ingredient" class="flex justify-between">
              <span class="capitalize">{{ it.ingredient }}</span>
              <span>{{ it.reserved }}/{{ it.needed }}</span>
            </li>
          </ul>
        </section>

        <section v-if="detail.purchases?.length">
          <h4 class="font-semibold mt-4 mb-2">Compras asociadas</h4>
          <ul class="space-y-1 text-xs text-gray-600">
            <li v-for="p in detail.purchases" :key="p.id" class="flex justify-between">
              <span class="capitalize">{{ p.ingredient }}</span>
              <span>{{ p.quantity_sold }} (solicitado {{ p.qty_requested }})</span>
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
import { computed, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/lunch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps<{ plateId: string | null; open: boolean }>()
defineEmits<{ (e: 'update:open', v: boolean): void }>()

const recipesQ = useQuery({
  queryKey: ['recipes'],
  queryFn: () => api.getRecipes(),
  staleTime: 60_000,
})

const detailQ = useQuery({
  queryKey: ['reservation', () => props.plateId],
  queryFn: () => api.getReservationDetail(props.plateId as string),
  enabled: computed(() => Boolean(props.plateId)),
})

const isLoading = computed(() => recipesQ.isLoading.value || detailQ.isLoading.value)
const detail = computed(() => detailQ.data?.value as any | undefined)

const shortId = computed(() =>
  props.plateId ? props.plateId.split('-')[1] ?? props.plateId.slice(0, 6) : '—'
)

// Match por conjunto de ingredientes (ignora cantidades de reserva; usa las cantidades de receta)
const recipeName = computed(() => {
  const d = detail.value
  const rs = recipesQ.data?.value as Array<{ name: string; items: { ingredient: string; qty: number }[] }> | undefined
  if (!d || !rs) return '—'
  const itemSet = new Set<string>((d.items ?? []).map((i: any) => i.ingredient))
  const match = rs.find(r => {
    const rSet = new Set<string>(r.items.map(i => i.ingredient))
    if (rSet.size !== itemSet.size) return false
    for (const ing of rSet) if (!itemSet.has(ing)) return false
    return true
  })
  return match?.name ?? 'Receta desconocida'
})

// Cuando se cierra, opcionalmente limpia (no estrictamente necesario)
watch(() => props.open, (open) => {
  if (!open) return
  // Si quieres refetch al abrir:
  detailQ.refetch()
})
</script>
