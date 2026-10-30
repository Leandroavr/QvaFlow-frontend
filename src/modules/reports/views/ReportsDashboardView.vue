<template>
  <div class="space-y-5">
    <!-- BARRA SUPERIOR DE CONTROL: FILTRO MENSUAL COMO PRIMER FILTRO -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <!-- Primer Filtro: Selector de Mes -->
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            1. Período / Mes de Análisis:
          </span>
          <a-select
            v-model:value="reportsStore.selectedMonth"
            class="w-64 font-bold"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
            size="large"
            @change="(val: any) => reportsStore.setMonthFilter(val)"
          >
            <a-select-option
              v-for="m in reportsStore.availableMonths"
              :key="m.key"
              :value="m.key"
            >
              📅 {{ m.label }}
            </a-select-option>
          </a-select>
        </div>

        <!-- Filtros Secundarios -->
        <div>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            2. Tipo:
          </span>
          <a-select
            v-model:value="reportsStore.selectedMovementType"
            class="w-36 sm:min-w-[170px]"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
            size="large"
          >
            <a-select-option value="ALL">Ventas y Compras</a-select-option>
            <a-select-option value="VENTA">Solo Ventas</a-select-option>
            <a-select-option value="COMPRA">Solo Compras</a-select-option>
          </a-select>
        </div>

        <div>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            3. Categoría:
          </span>
          <a-select
            v-model:value="reportsStore.selectedCategory"
            class="w-44 sm:min-w-[180px]"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
            size="large"
          >
            <a-select-option
              v-for="cat in reportsStore.availableCategories"
              :key="cat"
              :value="cat"
            >
              {{ cat === 'ALL' ? 'Todas las Categorías' : cat }}
            </a-select-option>
          </a-select>
        </div>
      </div>

      <!-- Botón de Actualizar -->
      <a-button
        size="large"
        :loading="reportsStore.loading"
        class="self-end md:self-auto"
        @click="reportsStore.fetchReportsData"
      >
        <template #icon><ReloadOutlined /></template>
        <span>Actualizar Datos</span>
      </a-button>
    </div>

    <!-- TARJETAS KPIS: BALANCE MENSUAL DE VENTAS Y COMPRAS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Ventas Totales del Mes -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ventas (Ingresos)</span>
          <h3 class="text-xl font-black text-emerald-600 m-0 mt-0.5">
            {{ formatearMoneda(reportsStore.monthlyFinance?.salesCUP || 0, 'CUP') }}
          </h3>
          <span class="text-xs text-slate-400 font-mono">
            ${{ (reportsStore.monthlyFinance?.salesUSD || 0).toFixed(2) }} USD • {{ reportsStore.monthlyFinance?.salesCount || 0 }} tickets
          </span>
        </div>
        <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
          📈
        </div>
      </div>

      <!-- 2. Compras Totales del Mes -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Compras (Egresos)</span>
          <h3 class="text-xl font-black text-rose-600 m-0 mt-0.5">
            {{ formatearMoneda(reportsStore.monthlyFinance?.purchasesCUP || 0, 'CUP') }}
          </h3>
          <span class="text-xs text-slate-400 font-mono">
            ${{ (reportsStore.monthlyFinance?.purchasesUSD || 0).toFixed(2) }} USD • {{ reportsStore.monthlyFinance?.purchasesCount || 0 }} facturas
          </span>
        </div>
        <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
          🛒
        </div>
      </div>

      <!-- 3. Margen Bruto (Ventas - Compras) -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ganancia Bruta (Ventas - Compras)</span>
          <h3
            class="text-xl font-black m-0 mt-0.5"
            :class="(reportsStore.monthlyFinance?.grossProfitCUP || 0) >= 0 ? 'text-qvaflow-navy' : 'text-rose-600'"
          >
            {{ formatearMoneda(reportsStore.monthlyFinance?.grossProfitCUP || 0, 'CUP') }}
          </h3>
          <span class="text-xs text-slate-400 font-mono">
            ${{ (reportsStore.monthlyFinance?.grossProfitUSD || 0).toFixed(2) }} USD neto
          </span>
        </div>
        <div class="w-11 h-11 rounded-xl bg-blue-50 text-qvaflow-navy flex items-center justify-center text-xl font-bold">
          💰
        </div>
      </div>

      <!-- 4. Rentabilidad Comercial -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Rentabilidad Comercial</span>
          <div class="flex items-baseline gap-2 mt-0.5">
            <h3 class="text-2xl font-black text-slate-900 m-0">
              {{ reportsStore.monthlyFinance?.marginPercent || 0 }}%
            </h3>
            <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
              Saludable
            </span>
          </div>
          <span class="text-xs text-slate-400">Margen sobre ventas</span>
        </div>
        <div class="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
          📊
        </div>
      </div>
    </div>

    <!-- PESTAÑAS: BALANCE FINANCIERO Y ANALÍTICA DE PRODUCTOS -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <a-tabs v-model:activeKey="activeTab">
        <!-- PESTAÑA 1: BALANCE DE VENTAS Y COMPRAS -->
        <a-tab-pane key="movements" tab="Balance de Ventas y Compras">
          <div class="space-y-4 pt-1">
            <!-- Barra Proporcional de Flujo (Ventas vs Compras) -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="text-emerald-700">
                  Ingresos por Ventas: {{ formatearMoneda(reportsStore.monthlyFinance?.salesCUP || 0, 'CUP') }}
                </span>
                <span class="text-rose-700">
                  Egresos por Compras: {{ formatearMoneda(reportsStore.monthlyFinance?.purchasesCUP || 0, 'CUP') }}
                </span>
              </div>

              <!-- Barra de dos colores proporcional -->
              <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  class="bg-emerald-500 h-full transition-all duration-500"
                  :style="{ width: `${salesRatioPercent}%` }"
                  title="Proporción Ventas"
                ></div>
                <div
                  class="bg-rose-500 h-full transition-all duration-500"
                  :style="{ width: `${100 - salesRatioPercent}%` }"
                  title="Proporción Compras"
                ></div>
              </div>
            </div>

            <!-- Tabla de Movimientos del Mes Seleccionado -->
            <a-table
              :columns="movementsColumns"
              :data-source="reportsStore.filteredMovements"
              :loading="reportsStore.loading"
              :pagination="{ pageSize: 8, showTotal: (t: number) => `Total ${t} operaciones en el mes` }"
              row-key="id"
              class="overflow-x-auto"
            >
              <template #bodyCell="{ column, record }">
                <!-- Columna Tipo -->
                <template v-if="column.key === 'type'">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="record.type === 'VENTA' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                  >
                    {{ record.type === 'VENTA' ? '📈 Venta' : '🛒 Compra' }}
                  </span>
                </template>

                <!-- Columna Referencia -->
                <template v-else-if="column.key === 'reference'">
                  <span class="font-mono font-bold text-xs text-slate-800">{{ record.reference }}</span>
                </template>

                <!-- Columna Concepto -->
                <template v-else-if="column.key === 'description'">
                  <div class="text-xs">
                    <span class="font-semibold text-slate-800 block">{{ record.description }}</span>
                    <span class="text-[10px] text-slate-400">{{ record.category }} • {{ record.warehouse }}</span>
                  </div>
                </template>

                <!-- Columna Importe CUP -->
                <template v-else-if="column.key === 'amountCUP'">
                  <span
                    class="font-bold text-xs"
                    :class="record.type === 'VENTA' ? 'text-emerald-700' : 'text-rose-700'"
                  >
                    {{ record.type === 'VENTA' ? '+' : '-' }}{{ formatearMoneda(record.amountCUP, 'CUP') }}
                  </span>
                </template>

                <!-- Columna Importe USD -->
                <template v-else-if="column.key === 'amountUSD'">
                  <span class="font-mono text-xs font-semibold text-slate-600">
                    ${{ record.amountUSD.toFixed(2) }} USD
                  </span>
                </template>

                <!-- Columna Método / Estado -->
                <template v-else-if="column.key === 'paymentMethod'">
                  <span class="text-xs text-slate-600">{{ record.paymentMethod }}</span>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- PESTAÑA 2: ANALÍTICA DE PRODUCTOS (TOP VENTAS Y OCIOSOS) -->
        <a-tab-pane key="products" tab="Rendimiento de Catálogo e Inventario">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
            <!-- Top 5 Productos Más Vendidos -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div>
                    <h4 class="font-bold text-slate-800 text-sm m-0">🏆 Top 5 Productos Más Vendidos</h4>
                    <p class="text-xs text-slate-400 m-0">Mayor volumen de rotación en el período</p>
                  </div>
                  <span class="text-xs font-semibold text-qvaflow-navy bg-blue-50 px-2 py-0.5 rounded">
                    Mes Seleccionado
                  </span>
                </div>

                <a-table
                  :columns="topColumns"
                  :data-source="reportsStore.topProducts"
                  :loading="reportsStore.loading"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'product'">
                      <div>
                        <div class="font-semibold text-slate-800 text-xs">{{ record.name }}</div>
                        <div class="text-[10px] text-slate-400">{{ record.category }} • {{ record.code }}</div>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'performance'">
                      <div class="w-28">
                        <div class="flex justify-between text-[11px] mb-0.5">
                          <span class="font-bold text-slate-700">{{ record.unitsSold }} uds</span>
                          <span class="text-slate-400">{{ record.percentage }}%</span>
                        </div>
                        <a-progress
                          :percent="record.percentage"
                          :show-info="false"
                          stroke-color="#1E3E6B"
                          size="small"
                        />
                      </div>
                    </template>

                    <template v-else-if="column.key === 'revenue'">
                      <span class="font-bold text-slate-800 text-xs">
                        {{ formatearMoneda(record.totalRevenue, 'CUP') }}
                      </span>
                    </template>
                  </template>
                </a-table>
              </div>
            </div>

            <!-- Registro de Productos Ociosos (Sin Rotación > 30 días) -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div>
                    <h4 class="font-bold text-amber-800 text-sm m-0">⚠️ Productos Ociosos (Sin Rotación)</h4>
                    <p class="text-xs text-slate-400 m-0">Artículos sin ventas en los últimos 30 días</p>
                  </div>
                  <span class="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Retenido: {{ formatearMoneda(reportsStore.totalIdleCapital, 'CUP') }}
                  </span>
                </div>

                <a-table
                  :columns="idleColumns"
                  :data-source="reportsStore.idleProducts"
                  :loading="reportsStore.loading"
                  :pagination="false"
                  size="small"
                  row-key="id"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'product'">
                      <div>
                        <div class="font-semibold text-slate-800 text-xs">{{ record.name }}</div>
                        <div class="text-[10px] text-slate-400">{{ record.warehouse }}</div>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'stock'">
                      <span class="font-medium text-xs text-slate-700">
                        {{ record.stock }} {{ record.unit }}
                      </span>
                    </template>

                    <template v-else-if="column.key === 'tiedUpCapital'">
                      <span class="font-bold text-rose-600 text-xs">
                        {{ formatearMoneda(record.tiedUpCapital, 'CUP') }}
                      </span>
                    </template>

                    <template v-else-if="column.key === 'inactivity'">
                      <span
                        class="text-[11px] px-1.5 py-0.2 rounded font-bold"
                        :class="record.daysWithoutSale > 40 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'"
                      >
                        {{ record.daysWithoutSale }} días
                      </span>
                    </template>

                    <template v-else-if="column.key === 'action'">
                      <a-button
                        size="small"
                        type="link"
                        class="text-qvaflow-red hover:text-qvaflow-red-dark font-semibold p-0 cursor-pointer"
                        @click="handleOfferAction(record.name)"
                      >
                        Ofertar
                      </a-button>
                    </template>
                  </template>
                </a-table>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import useReportsStore from '../store/reportsStore'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'

const reportsStore = useReportsStore()
const { formatearMoneda } = useFormatoMoneda()

const activeTab = ref<'movements' | 'products'>('movements')

// Ratio de Ventas vs Compras para la barra gráfica
const salesRatioPercent = computed(() => {
  const sales = reportsStore.monthlyFinance?.salesCUP || 0
  const purchases = reportsStore.monthlyFinance?.purchasesCUP || 0
  const total = sales + purchases
  if (total <= 0) return 50
  return Math.round((sales / total) * 100)
})

// Columnas de Movimientos
const movementsColumns = [
  {
    title: 'Fecha',
    key: 'date',
    dataIndex: 'date',
    width: 140,
  },
  {
    title: 'Tipo',
    key: 'type',
    dataIndex: 'type',
    width: 110,
  },
  {
    title: 'Referencia',
    key: 'reference',
    dataIndex: 'reference',
    width: 130,
  },
  {
    title: 'Concepto / Descripción',
    key: 'description',
    dataIndex: 'description',
  },
  {
    title: 'Importe CUP',
    key: 'amountCUP',
    dataIndex: 'amountCUP',
    align: 'right' as const,
    width: 140,
  },
  {
    title: 'Importe USD',
    key: 'amountUSD',
    dataIndex: 'amountUSD',
    align: 'right' as const,
    width: 130,
  },
  {
    title: 'Forma de Pago',
    key: 'paymentMethod',
    dataIndex: 'paymentMethod',
    width: 150,
  },
]

// Columnas para Top Productos
const topColumns = [
  {
    title: 'Producto',
    key: 'product',
    dataIndex: 'name',
  },
  {
    title: 'Rotación',
    key: 'performance',
    width: 130,
  },
  {
    title: 'Recaudado',
    key: 'revenue',
    dataIndex: 'totalRevenue',
    align: 'right' as const,
    width: 120,
  },
]

// Columnas para Productos Ociosos
const idleColumns = [
  {
    title: 'Producto / Almacén',
    key: 'product',
    dataIndex: 'name',
  },
  {
    title: 'Stock',
    key: 'stock',
    dataIndex: 'stock',
    width: 80,
  },
  {
    title: 'Retenido',
    key: 'tiedUpCapital',
    dataIndex: 'tiedUpCapital',
    align: 'right' as const,
    width: 105,
  },
  {
    title: 'Inactividad',
    key: 'inactivity',
    dataIndex: 'daysWithoutSale',
    width: 85,
  },
  {
    title: 'Acción',
    key: 'action',
    width: 70,
    align: 'center' as const,
  },
]

onMounted(() => {
  reportsStore.fetchReportsData()
})

const handleOfferAction = (productName: string) => {
  message.info(`Se ha marcado "${productName}" para liquidación o precio de oferta en el POS.`)
}
</script>
