<template>
  <div
    class="min-h-screenmx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="text-center space-y-4">
          <div class="flex items-center justify-center gap-2">
            <h1 class="text-4xl font-bold">Sistema de Cocina Inteligente</h1>
          </div>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Gestión automatizada para la jornada de donación masiva.
          </p>
        </div>
      </div>

      <!-- Panel -->
      <Card class="shadow-warm my-4">
        <CardHeader class="p-5">
          <CardTitle class="flex items-center space-x-2">
            <span class="inline-flex text-2xl items-center justify-center"
              >👨‍🍳</span
            >
            <span>Panel de Control del Gerente</span>
          </CardTitle>

          <CardDescription class="text-sm text-gray-500 mt-1">
            Inicia la preparación de platos para los comensales
          </CardDescription>
        </CardHeader>

        <CardContent class="p-5">
          <div class="flex flex-col sm:flex-row gap-4 items-end">
            <div class="flex-1">
              <Label
                for="quantity"
                class="block text-sm font-medium text-gray-700"
                >Cantidad de platos a preparar</Label
              >
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
                :disabled="
                  isProcessing || !orderQuantityNum || orderQuantityNum <= 0
                "
                @click="handleStartOrders"
                >{{
                  isProcessing ? "Procesando..." : "Iniciar Preparación"
                }}</Button
              >
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-4">
        <Card
          class="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md hover:scale-110 scale-100 transition"
        >
          <CardHeader class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium">Platos Ordenados</CardTitle>
            <div>👥</div>
          </CardHeader>
          <div class="text-2xl font-bold text-orange-600 mt-2">
            {{ stats.totalPlatesOrdered.toLocaleString() }}
          </div>
          <p class="text-xs text-gray-500">Total de órdenes</p>
        </Card>

        <Card
          class="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition hover:scale-110 scale-100"
        >
          <CardHeader class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium">Completados</CardTitle>
            <div>📈</div>
          </CardHeader>
          <div class="text-2xl font-bold text-green-600 mt-2">
            {{ stats.platesCompleted.toLocaleString() }}
          </div>
          <p class="text-xs text-gray-500">Platos entregados</p>
        </Card>

        <Card
          class="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition hover:scale-110 scale-100"
        >
          <CardHeader class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium">En Progreso</CardTitle>
            <div>⏱️</div>
          </CardHeader>
          <div class="text-2xl font-bold text-amber-600 mt-2">
            {{ stats.platesInProgress.toLocaleString() }}
          </div>
          <p class="text-xs text-gray-500">Cocinando ahora</p>
        </Card>

        <Card
          class="bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition hover:scale-110 scale-100"
        >
          <CardHeader class="flex items-center justify-between">
            <CardTitle class="text-sm font-medium">Tiempo Promedio</CardTitle>
            <div>⏱️</div>
          </CardHeader>
          <div class="text-2xl font-bold text-emerald-600 mt-2">
            {{ avgFmt }}
          </div>
          <p class="text-xs text-gray-500">
            p95: {{ p95Fmt }}
            <span v-if="timingsCount">• n={{ timingsCount }}</span>
          </p>
        </Card>
      </div>

      <!-- Inventory and Orders -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card class="shadow-sm">
          <CardHeader class="p-5">
            <CardTitle class="flex items-center gap-2 font-semibold">
              <span class="text-indigo-600">🛒</span>
              <span>Inventario de Bodega</span>
            </CardTitle>
            <CardDescription class="text-sm text-gray-500">
              Estado actual de ingredientes disponibles
            </CardDescription>
          </CardHeader>
          <CardContent class="p-5">
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="item in inventory"
                :key="item.ingredient"
                class="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-green-50 to-green-100 hover:scale-110 scale-100"
              >
                <span class="font-medium capitalize text-sm">{{
                  item.ingredient
                }}</span>

                <Badge
                  :class="{
                    'bg-red-100 text-red-700 border border-red-200':
                      item.quantity < 3,
                    'bg-yellow-100 text-yellow-700 border border-yellow-200':
                      item.quantity >= 3 && item.quantity < 5,
                    'bg-green-100 text-green-900 border border-green-500':
                      item.quantity >= 5,
                  }"
                >
                  {{ item.quantity }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Ordenes -->
        <Card class="rounded-xl shadow-sm">
          <CardHeader class="p-5">
            <CardTitle class="font-semibold">Órdenes Recientes</CardTitle>
            <CardDescription class="text-sm text-gray-500"
              >Últimas 10 órdenes procesadas</CardDescription
            >
          </CardHeader>

          <CardContent class="p-5">
            <div class="space-y-3 max-h-80 overflow-y-auto">
              <p
                v-if="orders.length === 0"
                class="text-center text-gray-500 py-8"
              >
                No hay órdenes aún. ¡Inicia la preparación!
              </p>
              <div
                v-else
                v-for="order in recentOrders"
                :key="order.id"
                class="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition"
                @click="openOrder(order.id)"
              >
                <div class="flex-1 cursor-pointer">
                  <p class="font-medium text-sm">
                    Orden #{{ order.id.split("-")[1] }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ new Date(order.createdAt).toLocaleTimeString() }}
                  </p>
                </div>
                <Badge
                  class="px-2 py-1 rounded text-xs font-bold cursor-pointer"
                  :class="badgeClass(order.status)"
                >
                  {{ statusText(order.status) }}
                </Badge>
              </div>

              <OrderDetailDrawer
                :open="detailOpen"
                :plateId="selectedOrderId"
                @update:open="detailOpen = $event"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Stats -->
      <Card v-if="stats.totalPlatesOrdered > 0" class="shadow-sm w-full my-4">
        <CardHeader class="p-5 border-b">
          <CardTitle class="font-semibold">Estadísticas Detalladas</CardTitle>
        </CardHeader>
        <CardContent class="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">
              {{
                (
                  (stats.platesCompleted /
                    Math.max(stats.totalPlatesOrdered, 1)) *
                  100
                ).toFixed(1)
              }}%
            </div>
            <p class="text-sm text-gray-500">Tasa de éxito</p>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">
              {{ stats.totalIngredientsPurchased }}
            </div>
            <p class="text-sm text-gray-500">Ingredientes comprados</p>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">
              {{ stats.platesFailed }}
            </div>
            <p class="text-sm text-gray-500">Platos fallidos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useKitchenSystem } from "@/composables/useKitchenSystem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import OrderDetailDrawer from "./OrderDetailDrawer.vue";

const {
  orders,
  stats,
  inventory,
  isProcessing,
  startOrders,
  avgSeconds,
  p95Seconds,
  timingsCount,
} = useKitchenSystem();

const avgFmt = computed(() => `${avgSeconds.value.toFixed(1)}s`);
const p95Fmt = computed(() => `${p95Seconds.value.toFixed(1)}s`);

const orderQuantity = ref<string>("10");
const orderQuantityNum = computed(() =>
  parseInt(orderQuantity.value || "0", 10)
);

const recentOrders = computed(() => orders.value.slice(-10));

const selectedOrderId = ref<string | null>(null);
const detailOpen = ref(false);

function openOrder(orderId: string) {
  selectedOrderId.value = orderId;
  detailOpen.value = true;
}

function handleStartOrders() {
  const quantity = orderQuantityNum.value;

  if (Number.isFinite(quantity) && quantity > 0 && quantity <= 1_000_000) {
    startOrders(quantity);
  }
}

function badgeClass(status: "pending" | "cooking" | "completed" | "failed") {
  switch (status) {
    case "completed":
      return "bg-gray-900 text-white";
    case "cooking":
      return "bg-gray-200 text-gray-800";
    case "failed":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-white text-gray-800 border";
  }
}

function statusText(status: "pending" | "cooking" | "completed" | "failed") {
  return status === "pending"
    ? "Pendiente"
    : status === "cooking"
    ? "Cocinando"
    : status === "completed"
    ? "Completado"
    : "Fallido";
}
</script>
