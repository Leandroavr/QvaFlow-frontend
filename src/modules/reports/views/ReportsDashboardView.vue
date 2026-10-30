<template>
  <div class="space-y-5">
    <!-- BARRA SUPERIOR DE CONTROL: FILTRO MENSUAL COMO PRIMER FILTRO -->
    <div
      class="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center"
    >
      <!-- Primer Filtro: Selector de Mes -->
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
            <a-select-option v-for="m in reportsStore.availableMonths" :key="m.key" :value="m.key">
              📅 {{ m.label }}
            </a-select-option>
          </a-select>
        </div>

        <!-- Filtros Secundarios -->
        <div>
          <span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
          <span class="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- 1. Ventas Totales del Mes -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Ventas (Ingresos)</span
          >
          <h3 class="m-0 mt-0.5 text-xl font-black text-emerald-600">
            {{ formatearMoneda(reportsStore.monthlyFinance?.salesCUP || 0, 'CUP') }}
          </h3>
          <span class="font-mono text-xs text-slate-400">
            ${{ (reportsStore.monthlyFinance?.salesUSD || 0).toFixed(2) }} USD •
            {{ reportsStore.monthlyFinance?.salesCount || 0 }} tickets
          </span>
        </div>
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl font-bold text-emerald-600"
        >
          📈
        </div>
      </div>

      <!-- 2. Compras Totales del Mes -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Compras (Egresos)</span
          >
          <h3 class="m-0 mt-0.5 text-xl font-black text-rose-600">
            {{ formatearMoneda(reportsStore.monthlyFinance?.purchasesCUP || 0, 'CUP') }}
          </h3>
          <span class="font-mono text-xs text-slate-400">
            ${{ (reportsStore.monthlyFinance?.purchasesUSD || 0).toFixed(2) }} USD •
            {{ reportsStore.monthlyFinance?.purchasesCount || 0 }} facturas
          </span>
        </div>
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-xl font-bold text-rose-600"
        >
          🛒
        </div>
      </div>

      <!-- 3. Margen Bruto (Ventas - Compras) -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Ganancia Bruta (Ventas - Compras)</span
          >
          <h3
            class="m-0 mt-0.5 text-xl font-black"
            :class="
              (reportsStore.monthlyFinance?.grossProfitCUP || 0) >= 0
                ? 'text-qvaflow-navy'
                : 'text-rose-600'
            "
          >
            {{ formatearMoneda(reportsStore.monthlyFinance?.grossProfitCUP || 0, 'CUP') }}
          </h3>
          <span class="font-mono text-xs text-slate-400">
            ${{ (reportsStore.monthlyFinance?.grossProfitUSD || 0).toFixed(2) }} USD neto
          </span>
        </div>
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-qvaflow-navy"
        >
          💰
        </div>
      </div>

      <!-- 4. Rentabilidad Comercial -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Rentabilidad Comercial</span
          >
          <div class="mt-0.5 flex items-baseline gap-2">
            <h3 class="m-0 text-2xl font-black text-slate-900">
              {{ reportsStore.monthlyFinance?.marginPercent || 0 }}%
            </h3>
            <span class="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
              Saludable
            </span>
          </div>
          <span class="text-xs text-slate-400">Margen sobre ventas</span>
        </div>
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-xl font-bold text-purple-600"
        >
          📊
        </div>
      </div>
    </div>

    <!-- PESTAÑAS: BALANCE FINANCIERO Y ANALÍTICA DE PRODUCTOS -->
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <a-tabs v-model:activeKey="activeTab">
        <!-- PESTAÑA 1: BALANCE DE VENTAS Y COMPRAS -->
        <a-tab-pane key="movements" tab="Balance de Ventas y Compras">
          <div class="space-y-4 pt-1">
            <!-- Barra Proporcional de Flujo (Ventas vs Compras) -->
            <div class="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="text-emerald-700">
                  Ingresos por Ventas:
                  {{ formatearMoneda(reportsStore.monthlyFinance?.salesCUP || 0, 'CUP') }}
                </span>
                <span class="text-rose-700">
                  Egresos por Compras:
                  {{ formatearMoneda(reportsStore.monthlyFinance?.purchasesCUP || 0, 'CUP') }}
                </span>
              </div>

              <!-- Barra de dos colores proporcional -->
              <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full bg-emerald-500 transition-all duration-500"
                  :style="{ width: `${salesRatioPercent}%` }"
                  title="Proporción Ventas"
                ></div>
                <div
                  class="h-full bg-rose-500 transition-all duration-500"
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
              :pagination="{
                pageSize: 8,
                showTotal: (t: number) => `Total ${t} operaciones en el mes`,
              }"
              row-key="id"
              class="overflow-x-auto"
            >
              <template #bodyCell="{ column, record }">
                <!-- Columna Tipo -->
                <template v-if="column.key === 'type'">
                  <span
                    class="rounded px-2 py-0.5 text-xs font-bold"
                    :class="
                      record.type === 'VENTA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    "
                  >
                    {{ record.type === 'VENTA' ? '📈 Venta' : '🛒 Compra' }}
                  </span>
                </template>

                <!-- Columna Referencia -->
                <template v-else-if="column.key === 'reference'">
                  <span class="font-mono text-xs font-bold text-slate-800">{{
                    record.reference
                  }}</span>
                </template>

                <!-- Columna Concepto -->
                <template v-else-if="column.key === 'description'">
                  <div class="text-xs">
                    <span class="block font-semibold text-slate-800">{{ record.description }}</span>
                    <span class="text-[10px] text-slate-400"
                      >{{ record.category }} • {{ record.warehouse }}</span
                    >
                  </div>
                </template>

                <!-- Columna Importe CUP -->
                <template v-else-if="column.key === 'amountCUP'">
                  <span
                    class="text-xs font-bold"
                    :class="record.type === 'VENTA' ? 'text-emerald-700' : 'text-rose-700'"
                  >
                    {{ record.type === 'VENTA' ? '+' : '-'
                    }}{{ formatearMoneda(record.amountCUP, 'CUP') }}
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
          <div class="grid grid-cols-1 gap-5 pt-1 lg:grid-cols-2">
            <!-- Top 5 Productos Más Vendidos -->
            <div
              class="shadow-xs flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 class="m-0 text-sm font-bold text-slate-800">
                      🏆 Top 5 Productos Más Vendidos
                    </h4>
                    <p class="m-0 text-xs text-slate-400">
                      Mayor volumen de rotación en el período
                    </p>
                  </div>
                  <span
                    class="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-qvaflow-navy"
                  >
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
                        <div class="text-xs font-semibold text-slate-800">{{ record.name }}</div>
                        <div class="text-[10px] text-slate-400">
                          {{ record.category }} • {{ record.code }}
                        </div>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'performance'">
                      <div class="w-28">
                        <div class="mb-0.5 flex justify-between text-[11px]">
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
                      <span class="text-xs font-bold text-slate-800">
                        {{ formatearMoneda(record.totalRevenue, 'CUP') }}
                      </span>
                    </template>
                  </template>
                </a-table>
              </div>
            </div>

            <!-- Registro de Productos Ociosos (Sin Rotación > 30 días) -->
            <div
              class="shadow-xs flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 class="m-0 text-sm font-bold text-amber-800">
                      ⚠️ Productos Ociosos (Sin Rotación)
                    </h4>
                    <p class="m-0 text-xs text-slate-400">
                      Artículos sin ventas en los últimos 30 días
                    </p>
                  </div>
                  <span
                    class="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800"
                  >
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
                        <div class="text-xs font-semibold text-slate-800">{{ record.name }}</div>
                        <div class="text-[10px] text-slate-400">{{ record.warehouse }}</div>
                      </div>
                    </template>

                    <template v-else-if="column.key === 'stock'">
                      <span class="text-xs font-medium text-slate-700">
                        {{ record.stock }} {{ record.unit }}
                      </span>
                    </template>

                    <template v-else-if="column.key === 'tiedUpCapital'">
                      <span class="text-xs font-bold text-rose-600">
                        {{ formatearMoneda(record.tiedUpCapital, 'CUP') }}
                      </span>
                    </template>

                    <template v-else-if="column.key === 'inactivity'">
                      <span
                        class="py-0.2 rounded px-1.5 text-[11px] font-bold"
                        :class="
                          record.daysWithoutSale > 40
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        "
                      >
                        {{ record.daysWithoutSale }} días
                      </span>
                    </template>

                    <template v-else-if="column.key === 'action'">
                      <a-button
                        size="small"
                        type="link"
                        class="cursor-pointer p-0 font-semibold text-qvaflow-red hover:text-qvaflow-red-dark"
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
