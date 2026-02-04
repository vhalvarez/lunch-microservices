<script setup lang="ts">
import { computed } from 'vue';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import { usePredictions } from '@/features/predictions/usePredictions';
import { useKitchenStats } from '@/features/kitchen/useKitchenStats';
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight
} from 'lucide-vue-next';

const { latest } = usePredictions();
const { traffic, efficiency } = useKitchenStats();

// --- Real Traffic Graph Data ---
const chartPoints = computed(() => {
    // Default 12 points (every 2 hours) or 24 points (hourly)
    // We map the incoming { hour: "14", count: 10 } to an array of values
    if (!traffic.value || traffic.value.length === 0) return Array(12).fill(0);
    
    // Create a map of hour -> count
    const map = new Map();
    traffic.value.forEach(t => map.set(parseInt(t.hour), t.count));
    
    // Generate last 12 hours points (or next 12 if prediction, but we use past traffic as "forecast" baseline for now)
    const currentHour = new Date().getHours();
    const points = [];
    for (let i = 0; i < 12; i++) {
        // Simple visualization: show a window of hours. 
        // For "Forecasting", we might project this forward, but for now we visualize actual traffic pattern.
        // Let's visualize 08:00 to 20:00 fixed window for stability, or dynamic.
        // Let's do dynamic: Past 6 hours + Future 6 (simulated by past average)
        // For MVP: Just map existing data to the curve.
        
        let h = (currentHour - 6 + i + 24) % 24;
        points.push(map.get(h) || 0);
    }
    return points;
});

function getChartPath() {
    if (chartPoints.value.every(p => p === 0)) return "M 0 150 L 600 150";

    const width = 600; 
    const height = 150;
    const maxVal = Math.max(...chartPoints.value, 10) * 1.2; // Scaling
    const stepX = width / (chartPoints.value.length - 1);
    
    let path = `M 0 ${height - (chartPoints.value[0] / maxVal) * height}`;
    
    for (let i = 1; i < chartPoints.value.length; i++) {
        const x = i * stepX;
        const y = height - (chartPoints.value[i] / maxVal) * height;
        const prevX = (i - 1) * stepX;
        const prevY = height - (chartPoints.value[i - 1] / maxVal) * height;
        const cpX = (prevX + x) / 2;
        path += ` Q ${cpX} ${prevY}, ${cpX} ${(prevY + y) / 2} T ${x} ${y}`;
    }
    return path;
}

const currentLoad = computed(() => efficiency.value?.flowEfficiency ?? 0);
const hasPeakAlert = computed(() => (efficiency.value?.flowEfficiency ?? 0) > 85);

const inventoryForecasts = computed(() => {
    if (latest.value?.alerts?.length) {
        return latest.value.alerts.slice(0, 3).map(a => ({
            name: a.ingredient,
            trend: a.ordersUsingThisIngredient > 5 ? 'up' : 'stable',
            demandChange: `+${Math.floor(a.confidence)}%`,
            stockLevel: Math.min((a.currentStock / (a.recommendedMinStock || 1)) * 100, 100), 
            severity: a.severity
        }));
    }
    return [];
});

const assistantMessages = computed(() => {
    const msgs = [];
    
    // Generate from Alerts
    if (latest.value?.alerts) {
        latest.value.alerts.slice(0, 2).forEach(a => {
            msgs.push({
                type: 'alert',
                title: 'INVENTORY ALERT',
                confidence: `${Math.round(a.confidence)}% Confidence`,
                text: `${a.actionable} (${a.reason})`,
                action: 'CHECK STOCK'
            });
        });
    }

    // Generate from Efficiency
    if (efficiency.value) {
        if (efficiency.value.flowEfficiency < 50) {
            msgs.push({
                type: 'staff',
                title: 'EFFICIENCY AI',
                confidence: '95% Confidence',
                text: 'Kitchen flow is low. Consider consolidating prep stations.',
                action: null
            });
        }
    }
    
    // Fallback if empty
    if (msgs.length === 0) {
        msgs.push({
            type: 'staff',
            title: 'SYSTEM STATUS',
            confidence: '100%',
            text: 'System is running optimally. No critical actions required.',
            action: null
        });
    }

    return msgs;
});

</script>

<template>
  <DashboardLayout>
    <div class="h-full flex flex-col space-y-6">
      
      <!-- Top Header -->
      <div class="flex items-end justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">AI Demand & Predictions</h1>
            <p class="text-gray-400">Futuristic forecasting and kitchen optimization hub.</p>
          </div>
          
          <!-- View Toggle -->
          <div class="bg-[#0b2419] border border-[#1f4b33] p-1 rounded-lg flex text-xs font-bold">
              <button class="bg-[#7c3aed] text-white px-4 py-1.5 rounded-md shadow-lg shadow-purple-900/50">12H VIEW</button>
              <button class="text-gray-400 px-4 py-1.5 hover:text-white transition-colors">24H VIEW</button>
              <button class="text-gray-400 px-4 py-1.5 hover:text-white transition-colors">7D VIEW</button>
          </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-12 gap-6 h-full min-h-0">
          
          <!-- LEFT COLUMN (Main Graph + Inventory) -->
          <div class="col-span-8 flex flex-col gap-6">
              
              <!-- 1. Graph Card -->
              <div class="bg-[#0b2419] border border-[#1f4b33] rounded-3xl p-8 relative overflow-hidden">
                  <!-- Header -->
                  <div class="flex justify-between items-start mb-8 relative z-10">
                      <div>
                          <h2 class="text-white font-bold text-lg">Predicted Traffic vs. Current Capacity</h2>
                          <p class="text-gray-400 text-sm mt-1">Real-time neural network projection for the next 12 hours</p>
                          <div class="mt-4 flex items-center gap-3">
                              <span class="text-4xl font-bold text-white">Forecast: <span class="text-[#a855f7]">High Spike</span></span>
                              <span class="bg-[#051810] border border-[#1f4b33] text-[#22c55e] px-2 py-1 rounded text-xs font-bold font-mono">↗ +22%</span>
                          </div>
                      </div>
                      
                      <div class="text-right">
                          <p class="text-[#22c55e] text-4xl font-bold">{{ currentLoad }}% Load</p>
                          <p class="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">CURRENT STATUS</p>
                      </div>
                  </div>

                  <!-- Graph Container -->
                  <div class="h-64 relative w-full flex items-end">
                      <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 200">
                          <!-- Grid Lines -->
                          <line x1="0" y1="50" x2="600" y2="50" stroke="#1f4b33" stroke-width="1" stroke-dasharray="4 4" />
                          <line x1="0" y1="100" x2="600" y2="100" stroke="#1f4b33" stroke-width="1" stroke-dasharray="4 4" />
                          <line x1="0" y1="150" x2="600" y2="150" stroke="#1f4b33" stroke-width="1" stroke-dasharray="4 4" />
                          
                          <!-- Capacity Threshold Line -->
                          <line x1="0" y1="80" x2="600" y2="80" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="5 5" />
                          <text x="0" y="75" fill="#2dd4bf" font-size="10" font-weight="bold">CAPACITY THRESHOLD</text>

                          <!-- Graph Line -->
                          <path 
                            :d="getChartPath()" 
                            fill="none" 
                            stroke="#a855f7" 
                            stroke-width="5" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"
                            class="drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                          />
                      </svg>
                      
                      <!-- X Axis Labels -->
                      <div class="absolute bottom-0 w-full flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2">
                          <span>10 AM</span>
                          <span>12 PM</span>
                          <span>2 PM</span>
                          <span>4 PM</span>
                          <span>6 PM</span>
                          <span>8 PM</span>
                          <span class="text-[#a855f7]">PEAK SPIKE</span>
                      </div>
                  </div>
              </div>

              <!-- 2. Smart Inventory Forecasts Header -->
              <h3 class="text-white font-bold mt-2">Smart Inventory Forecasts</h3>

              <!-- 3. Forecast Cards -->
              <div class="grid grid-cols-3 gap-4">
                  <div 
                    v-for="(item, i) in inventoryForecasts" 
                    :key="i"
                    class="bg-[#0b2419] border border-[#1f4b33] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors"
                  >
                      <div class="flex justify-between items-start mb-4">
                          <h4 class="text-white font-bold capitalize">{{ item.name }}</h4>
                          <component 
                             :is="item.severity === 'critical' ? AlertTriangle : (item.trend === 'up' ? TrendingUp : ArrowRight)" 
                             :class="item.severity === 'critical' ? 'text-yellow-500' : (item.trend === 'up' ? 'text-[#a855f7]' : 'text-[#2dd4bf]')"
                             :size="18"
                          />
                      </div>
                      
                      <div class="flex justify-between items-end mb-2">
                           <div>
                               <p class="text-[10px] text-gray-400 font-bold uppercase">EXPECTED DEMAND</p>
                               <p class="text-2xl font-bold text-white mt-0.5">{{ item.demandChange }}</p>
                           </div>
                           <div class="text-right">
                               <p class="text-[10px] text-gray-400 font-bold uppercase">STOCK LEVEL</p>
                           </div>
                      </div>
                      
                      <!-- Progress Bar -->
                      <div class="h-1.5 bg-[#051810] rounded-full overflow-hidden flex justify-end">
                          <div 
                            class="h-full rounded-full" 
                            :class="item.severity === 'critical' ? 'bg-yellow-500 w-[15%]' : (item.stockLevel < 50 ? 'bg-[#a855f7] w-[30%]' : 'bg-[#2dd4bf] w-[80%]')"
                          ></div>
                      </div>
                  </div>
              </div>

          </div>

          <!-- RIGHT COLUMN (Alerts + Gauge + Assistant) -->
          <div class="col-span-4 flex flex-col gap-6">
              
              <!-- 1. Peak Alert Card -->
              <div v-if="hasPeakAlert" class="bg-yellow-500/10 border border-yellow-500/50 rounded-2xl p-6 relative overflow-hidden">
                   <!-- Icon Watermark -->
                   <AlertTriangle class="absolute -right-4 -top-4 text-yellow-500/20 w-32 h-32 rotate-12" />
                   
                   <div class="relative z-10">
                       <div class="flex items-center gap-2 mb-2 text-yellow-500 font-bold uppercase text-xs tracking-wider">
                           <Zap class="fill-yellow-500" :size="14" />
                           Peak Demand Alert
                       </div>
                       <h3 class="text-white font-bold text-lg leading-tight">
                           Incoming surge at 1:30 PM. Predicted traffic exceeds current staffing by 18%.
                       </h3>
                   </div>
              </div>

              <!-- 2. Kitchen Efficiency Gauge -->
              <div class="bg-[#0b2419] border border-[#1f4b33] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px]">
                  <h3 class="text-white font-bold text-sm self-start mb-4">Kitchen Efficiency</h3>
                  
                  <div class="relative w-40 h-40 flex items-center justify-center">
                       <!-- Circular Gauge SVG Simulation -->
                       <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                           <circle cx="50" cy="50" r="45" fill="none" stroke="#1f4b33" stroke-width="10" />
                           <circle cx="50" cy="50" r="45" fill="none" stroke="#a855f7" stroke-width="10" stroke-dasharray="283" stroke-dashoffset="20" stroke-linecap="round" />
                       </svg>
                       <div class="absolute inset-0 flex flex-col items-center justify-center">
                           <span class="text-4xl font-bold text-white">{{ currentLoad }}%</span>
                           <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">OPTIMAL FLOW</span>
                       </div>
                  </div>

                  <div class="w-full flex justify-between mt-6 px-4">
                      <div class="text-center">
                          <p class="text-[10px] text-gray-400 font-bold uppercase">TICKET TIME</p>
                          <p class="text-white font-bold">{{ efficiency?.avgPrepTime.toFixed(1) ?? '--' }}s</p>
                      </div>
                      <div class="text-center">
                          <p class="text-[10px] text-gray-400 font-bold uppercase">TURN RATE</p>
                          <p class="text-white font-bold">{{ efficiency?.turnRate ?? '--' }}/h</p>
                      </div>
                  </div>
              </div>

              <!-- 3. AI Assistant -->
              <div class="bg-[#0b2419] border border-[#1f4b33] rounded-3xl flex-1 flex flex-col overflow-hidden">
                  <div class="p-4 border-b border-[#1f4b33] flex justify-between items-center">
                      <div class="flex items-center gap-2">
                          <span class="text-[#a855f7]">✨</span>
                          <span class="text-white font-bold text-sm">AI Strategic Assistant</span>
                      </div>
                      <span class="bg-[#a855f7]/20 text-[#a855f7] text-[10px] font-bold px-2 py-0.5 rounded">LIVE</span>
                  </div>
                  
                  <div class="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                      <div 
                        v-for="(msg, i) in assistantMessages" 
                        :key="i"
                        class="bg-[#051810] rounded-xl p-4 border border-[#1f4b33]"
                      >
                         <div class="flex justify-between items-center mb-2">
                             <span 
                               class="text-[10px] font-bold px-2 py-0.5 rounded"
                               :class="msg.type === 'alert' ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' : 'bg-[#a855f7]/20 text-[#a855f7]'"
                             >
                                {{ msg.title }}
                             </span>
                             <span class="text-[10px] text-gray-500">{{ msg.confidence }}</span>
                         </div>
                         <p class="text-gray-300 text-xs leading-relaxed mb-3">
                             {{ msg.text }}
                         </p>
                         <button 
                           v-if="msg.action"
                           class="text-[10px] font-bold text-[#a855f7] flex items-center gap-1 hover:text-white transition-colors"
                         >
                            {{ msg.action }} <ArrowRight :size="10" />
                         </button>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    
    </div>
  </DashboardLayout>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #051810;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f4b33;
  border-radius: 4px;
}
</style>
