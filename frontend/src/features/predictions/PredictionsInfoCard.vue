<template>
  <Card class="shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
    <CardHeader class="p-5">
      <CardTitle class="flex items-center gap-2 font-semibold text-purple-900">
        <span class="text-2xl">🤖</span>
        <span>Sistema de Predicción Inteligente</span>
      </CardTitle>
    </CardHeader>

    <CardContent class="p-5 space-y-4">
      <!-- Descripción principal -->
      <div class="bg-white/80 rounded-lg p-4 border border-purple-200">
        <p class="text-sm text-gray-700 leading-relaxed">
          Sistema de <strong>análisis predictivo</strong> que monitorea patrones de consumo de ingredientes
          y comportamiento del mercado para generar <strong>alertas inteligentes</strong> sobre posibles
          cuellos de botella operacionales.
        </p>
      </div>

      <!-- Motor y Tecnología -->
      <div class="space-y-3">
        <h4 class="font-semibold text-purple-900 flex items-center gap-2">
          <span>⚙️</span>
          <span>Tecnología</span>
        </h4>

        <div class="grid gap-3">
          <div class="flex gap-3 items-start bg-white/60 p-3 rounded-lg border border-purple-200">
            <div class="text-2xl">🧠</div>
            <div class="flex-1">
              <h5 class="font-semibold text-sm text-gray-900">Motor de IA</h5>
              <p class="text-xs text-gray-600 mt-1">
                <strong>Groq API + Llama 3.1 8B Instant</strong> - Modelo de lenguaje optimizado para análisis predictivo en tiempo real
              </p>
            </div>
          </div>

          <div class="flex gap-3 items-start bg-white/60 p-3 rounded-lg border border-purple-200">
            <div class="text-2xl">☁️</div>
            <div class="flex-1">
              <h5 class="font-semibold text-sm text-gray-900">Infraestructura</h5>
              <p class="text-xs text-gray-600 mt-1">
                <strong>AWS EC2 t2.micro</strong> - Instancia en la nube ejecutando análisis 24/7
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cómo funciona -->
      <div class="space-y-3">
        <h4 class="font-semibold text-purple-900 flex items-center gap-2">
          <span>🔄</span>
          <span>¿Cómo funciona?</span>
        </h4>

        <div class="grid gap-3">
          <div class="flex gap-3 items-start bg-white/60 p-3 rounded-lg">
            <div class="text-2xl">📊</div>
            <div class="flex-1">
              <h5 class="font-semibold text-sm text-gray-900">1. Recolección de Datos</h5>
              <p class="text-xs text-gray-600 mt-1">
                Analiza hasta las últimas <strong>{{ analysisOrders }} órdenes</strong> procesadas, registrando consumo de ingredientes
                y compras al mercado
              </p>
            </div>
          </div>

          <div class="flex gap-3 items-start bg-white/60 p-3 rounded-lg">
            <div class="text-2xl">🔍</div>
            <div class="flex-1">
              <h5 class="font-semibold text-sm text-gray-900">2. Análisis Estadístico</h5>
              <p class="text-xs text-gray-600 mt-1">
                Calcula promedios de consumo por orden, desviaciones estándar, tendencias y patrones de disponibilidad del mercado
              </p>
            </div>
          </div>

          <div class="flex gap-3 items-start bg-white/60 p-3 rounded-lg">
            <div class="text-2xl">🤖</div>
            <div class="flex-1">
              <h5 class="font-semibold text-sm text-gray-900">3. Predicción con IA</h5>
              <p class="text-xs text-gray-600 mt-1">
                Groq analiza los datos con Llama 3.1 8B y genera predicciones contextualizadas con recomendaciones específicas
              </p>
            </div>
          </div>

          <div class="flex gap-3 items-start bg-white/60 p-3 rounded-lg">
            <div class="text-2xl">⚠️</div>
            <div class="flex-1">
              <h5 class="font-semibold text-sm text-gray-900">4. Alertas Operacionales</h5>
              <p class="text-xs text-gray-600 mt-1">
                Combina análisis de reglas + IA para identificar: alta demanda, mercado poco confiable, compras frecuentes y cuellos de botella
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tipos de Alertas -->
      <div class="space-y-3">
        <h4 class="font-semibold text-purple-900 flex items-center gap-2">
          <span>🎯</span>
          <span>Tipos de Alertas</span>
        </h4>

        <div class="grid gap-2">
          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
              Alta Demanda
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Ingrediente usado en más del 50% de los platos
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-orange-100 text-orange-800 border border-orange-300 text-xs font-bold">
              Mercado Poco Confiable
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Tasa de éxito del mercado menor al 70%
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs font-bold">
              Compras Frecuentes
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Stock insuficiente - se compra cada 5 platos o menos
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold">
              Cuello de Botella
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Combinación crítica: stock bajo + alta demanda + mercado poco confiable
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold">
              Predicción IA
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Análisis generado por Llama 3.1 basado en tendencias y patrones complejos
            </p>
          </div>
        </div>
      </div>

      <!-- Niveles de severidad -->
      <div class="space-y-3">
        <h4 class="font-semibold text-purple-900 flex items-center gap-2">
          <span>📊</span>
          <span>Niveles de Severidad</span>
        </h4>

        <div class="grid gap-2">
          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
              Crítica
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Acción inmediata requerida - Alto riesgo operacional
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-orange-100 text-orange-800 border border-orange-300 text-xs font-bold">
              Alta
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Planificar solución pronto - Riesgo medio-alto
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs font-bold">
              Media
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Monitorear de cerca - Situación bajo control
            </p>
          </div>

          <div class="flex items-center gap-3 bg-white/60 p-2 rounded-lg">
            <div class="px-3 py-1 rounded bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold">
              Baja
            </div>
            <p class="text-xs text-gray-700 flex-1">
              Información preventiva - Sin riesgo inmediato
            </p>
          </div>
        </div>
      </div>

      <!-- Beneficios -->
      <div class="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-4 border border-purple-300">
        <h4 class="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <span>✨</span>
          <span>Beneficios</span>
        </h4>
        <ul class="space-y-1 text-xs text-gray-700">
          <li class="flex items-center gap-2">
            <span class="text-green-600">✓</span>
            <span>Previene interrupciones por falta de ingredientes</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="text-green-600">✓</span>
            <span>Optimiza el stock inicial en bodega</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="text-green-600">✓</span>
            <span>Identifica patrones del mercado poco confiables</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="text-green-600">✓</span>
            <span>Recomendaciones basadas en datos reales y análisis de IA</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="text-green-600">✓</span>
            <span>Análisis continuo automático cada 5 minutos</span>
          </li>
        </ul>
      </div>

      <!-- Actualización -->
      <div class="text-center text-xs text-purple-700 pt-2 border-t border-purple-200">
        <p class="flex items-center justify-center gap-2">
          <span>🔄</span>
          <span>Análisis automático cada 5 minutos con datos en tiempo real</span>
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

defineProps<{
  analysisOrders: number;
}>();
</script>
