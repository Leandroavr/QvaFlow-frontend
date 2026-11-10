<template>
  <div class="space-y-6">
    <!-- Encabezado de página -->
    <PageHeader
      title="Reportes Financieros"
      description="Balance de ventas, compras, márgenes comerciales y distribución por categorías"
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          density="compact"
          :icon="RefreshCw"
          :loading="summaryLoading || timeSeriesLoading || categoriesLoading"
          @click="loadAll"
        >
          Actualizar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Barra de filtros -->
    <div class="shadow-xs rounded-xl border border-border bg-surface-card p-4">
      <FilterBar :show-search="false" :can-clear="hasActiveFilters" @clear-all="resetFilters">
        <template #filters>
          <div class="flex flex-wrap items-center gap-3">
            <!-- 1. Período (Presets) -->
            <div class="flex items-center gap-1.5">
              <label for="reports-preset" class="text-xs font-medium text-content-secondary">
                Período:
              </label>
              <div class="w-40">
                <BaseSelect
                  id="reports-preset"
                  :model-value="preset"
                  :options="presetOptions"
                  density="compact"
                  aria-label="Período de reporte"
                  @update:model-value="handlePresetChange"
                />
              </div>
            </div>

            <!-- 2. Rango libre: Desde y Hasta (Solo si preset === 'custom') -->
            <template v-if="preset === 'custom'">
              <div class="flex items-center gap-1.5">
                <label for="reports-desde" class="text-xs font-medium text-content-secondary">
                  Desde:
                </label>
                <div class="w-36">
                  <BaseInput
                    id="reports-desde"
                    v-model="desde"
                    type="date"
                    density="compact"
                    :error="fieldErrors.desde"
                    @change="handleDateChange"
                  />
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <label for="reports-hasta" class="text-xs font-medium text-content-secondary">
                  Hasta:
                </label>
                <div class="w-36">
                  <BaseInput
                    id="reports-hasta"
                    v-model="hasta"
                    type="date"
                    density="compact"
                    :error="fieldErrors.hasta"
                    @change="handleDateChange"
                  />
                </div>
              </div>
            </template>

            <!-- 3. Tipo (Todos, Ventas, Compras [solo si canSeeCosts]) -->
            <div class="flex items-center gap-1.5">
              <label for="reports-type" class="text-xs font-medium text-content-secondary">
                Tipo:
              </label>
              <div class="w-36">
                <BaseSelect
                  id="reports-type"
                  :model-value="type"
                  :options="typeOptions"
                  density="compact"
                  aria-label="Tipo de operación"
                  @update:model-value="handleTypeChange"
                />
              </div>
            </div>

            <!-- 4. Categoría -->
            <div class="flex items-center gap-1.5">
              <label for="reports-category" class="text-xs font-medium text-content-secondary">
                Categoría:
              </label>
              <div class="w-48">
                <BaseSelect
                  id="reports-category"
                  :model-value="categoryId"
                  :options="categoryOptions"
                  density="compact"
                  aria-label="Filtrar por categoría"
                  @update:model-value="handleCategoryChange"
                />
              </div>
            </div>
          </div>
        </template>

        <template #actions>
          <span class="text-xs font-medium text-content-muted">
            Importes en USD (moneda base)
          </span>
        </template>
      </FilterBar>

      <!-- Mensaje de error de validación de rango -->
      <div
        v-if="validationError"
        class="mt-2.5 flex items-center gap-1.5 text-xs text-state-error"
        data-test="validation-error"
      >
        <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{{ validationError }}</span>
      </div>
    </div>

    <!-- Bloque de KPIs (StatCards) -->
    <section aria-labelledby="kpis-heading">
      <h2 id="kpis-heading" class="sr-only">Indicadores Clave de Rendimiento</h2>

      <!-- Error al cargar el resumen -->
      <div
        v-if="summaryError"
        class="rounded-xl border border-state-error-border bg-state-error-bg p-4 text-center"
      >
        <p class="text-xs font-medium text-state-error">{{ summaryError }}</p>
        <BaseButton variant="secondary" density="compact" class="mt-2" @click="reloadSummary">
          Reintentar resumen
        </BaseButton>
      </div>

      <!-- Fila de Tarjetas de Resumen -->
      <div
        v-else
        class="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4"
        data-test="kpis-grid"
      >
        <!-- 1. Ventas Totales -->
        <StatCard
          label="Ventas"
          :value="formatAmount(summary?.salesTotal)"
          :description="salesCountDescription"
          :loading="summaryLoading"
          :icon="TrendingUp"
          data-test="kpi-sales"
        >
          <!-- Desglose por moneda real de cobro si está disponible -->
          <template v-if="summary?.salesByCurrency && summary.salesByCurrency.length > 0" #footer>
            <div
              class="mt-1.5 flex flex-wrap gap-1 text-[11px] text-content-muted"
              data-test="sales-by-currency"
            >
              <span
                v-for="item in summary.salesByCurrency"
                :key="item.currency"
                class="rounded bg-surface-sunken px-1.5 py-0.5"
              >
                {{ item.currency }}: {{ formatAmount(item.amount) }}
              </span>
            </div>
          </template>
        </StatCard>

        <!-- 2. Compras a Proveedores (Sensible: solo con permiso de costos) -->
        <StatCard
          v-if="canSeeCosts && summary?.purchasesTotal !== undefined"
          label="Compras"
          :value="formatAmount(summary.purchasesTotal)"
          :description="purchasesCountDescription"
          :loading="summaryLoading"
          :icon="ShoppingBag"
          data-test="kpi-purchases"
        />

        <!-- 3. Ganancia Bruta (Sensible: solo con permiso de costos) -->
        <StatCard
          v-if="canSeeCosts && summary?.grossProfit !== undefined"
          label="Ganancia bruta"
          :value="formatGrossProfit(summary.grossProfit)"
          description="Ventas menos costo de lo vendido"
          :loading="summaryLoading"
          :icon="DollarSign"
          :value-class="isNegativeGrossProfit ? 'text-state-error' : 'text-content-primary'"
          data-test="kpi-gross-profit"
        />

        <!-- 4. Margen Comercial % (Sensible: solo con permiso de costos) -->
        <StatCard
          v-if="canSeeCosts && summary?.marginPercent !== undefined"
          label="Margen"
          :value="`${summary.marginPercent}%`"
          description="Sobre ventas"
          :loading="summaryLoading"
          :icon="Percent"
          data-test="kpi-margin"
        >
          <template #value-extra>
            <BaseBadge
              v-if="summary.marginHealth"
              :variant="marginBadgeVariant"
              size="sm"
              data-test="margin-health-badge"
            >
              {{ marginBadgeLabel }}
            </BaseBadge>
          </template>
        </StatCard>

        <!-- 5. Balance de Caja (Sensible: solo con permiso de costos) -->
        <StatCard
          v-if="canSeeCosts && summary?.cashBalance !== undefined"
          label="Balance de caja"
          :value="formatAmount(summary.cashBalance)"
          description="Ventas menos compras"
          :loading="summaryLoading"
          :icon="Wallet"
          :value-class="isNegativeCashBalance ? 'text-state-error' : 'text-content-primary'"
          data-test="kpi-cash-balance"
        />
      </div>
    </section>

    <!-- Bloque de Gráficos -->
    <section aria-labelledby="charts-heading" class="space-y-6">
      <h2 id="charts-heading" class="sr-only">Evolución y Gráficos Financieros</h2>

      <!-- Error al cargar series temporales -->
      <div
        v-if="timeSeriesError"
        class="rounded-xl border border-state-error-border bg-state-error-bg p-4 text-center"
      >
        <p class="text-xs font-medium text-state-error">{{ timeSeriesError }}</p>
        <BaseButton variant="secondary" density="compact" class="mt-2" @click="reloadTimeSeries">
          Reintentar evolución temporal
        </BaseButton>
      </div>

      <!-- Fila 1 de Gráficos: Ventas vs Compras + Ganancia por período -->
      <div
        v-else
        class="grid grid-cols-1 gap-6"
        :class="canSeeCosts ? 'lg:grid-cols-2' : 'grid-cols-1'"
      >
        <!-- Gráfico 1: Ventas vs Compras por período (Barras agrupadas) -->
        <div class="shadow-xs space-y-3 rounded-xl border border-border bg-surface-card p-4 sm:p-5">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-content-primary">
                {{ canSeeCosts ? 'Ventas vs Compras por Período' : 'Ventas por Período' }}
              </h3>
              <p class="text-xs text-content-muted">Divisa base contable (USD)</p>
            </div>
          </div>

          <BaseChart
            :option="barChartOption"
            aria-label="Gráfico de barras de evolución financiera por período"
            :loading="timeSeriesLoading"
            :empty="isTimeSeriesEmpty"
            height="290px"
          >
            <template #table>
              <table>
                <caption>
                  Ventas y Compras por Período (USD)
                </caption>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ventas (USD)</th>
                    <th v-if="canSeeCosts">Compras (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="point in timeSeries?.points || []" :key="point.date">
                    <td>{{ point.date }}</td>
                    <td>{{ point.salesTotal }}</td>
                    <td v-if="canSeeCosts">{{ point.purchasesTotal || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </BaseChart>
        </div>

        <!-- Gráfico 2: Ganancia por período (Línea; solo si canSeeCosts) -->
        <div
          v-if="canSeeCosts"
          class="shadow-xs space-y-3 rounded-xl border border-border bg-surface-card p-4 sm:p-5"
          data-test="profit-chart-container"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-content-primary">Ganancia Bruta por Período</h3>
              <p class="text-xs text-content-muted">Evolución de margen comercial en USD</p>
            </div>
          </div>

          <BaseChart
            :option="lineChartOption"
            aria-label="Gráfico de línea con la evolución de ganancia bruta por período"
            :loading="timeSeriesLoading"
            :empty="isTimeSeriesEmpty"
            height="290px"
          >
            <template #table>
              <table>
                <caption>
                  Ganancia Bruta por Período (USD)
                </caption>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ganancia Bruta (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="point in timeSeries?.points || []" :key="point.date">
                    <td>{{ point.date }}</td>
                    <td>{{ point.grossProfit || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </BaseChart>
        </div>
      </div>

      <!-- Fila 2 de Gráficos: Ventas por Categoría (Barras Horizontales) -->
      <div
        v-if="categoriesError"
        class="rounded-xl border border-state-error-border bg-state-error-bg p-4 text-center"
      >
        <p class="text-xs font-medium text-state-error">{{ categoriesError }}</p>
        <BaseButton variant="secondary" density="compact" class="mt-2" @click="reloadCategories">
          Reintentar categorías
        </BaseButton>
      </div>

      <div
        v-else
        class="shadow-xs space-y-3 rounded-xl border border-border bg-surface-card p-4 sm:p-5"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-content-primary">Ventas por Categoría</h3>
            <p class="text-xs text-content-muted">
              Distribución ordenada de mayor a menor recaudación (USD)
            </p>
          </div>
        </div>

        <BaseChart
          :option="categoryChartOption"
          aria-label="Gráfico de barras horizontales de ventas por categoría"
          :loading="categoriesLoading"
          :empty="isCategoriesEmpty"
          height="320px"
        >
          <template #table>
            <table>
              <caption>
                Distribución de Ventas por Categoría (USD)
              </caption>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Ventas (USD)</th>
                  <th>Unidades</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in sortedCategories" :key="cat.categoryId">
                  <td>{{ cat.categoryName }}</td>
                  <td>{{ cat.salesTotal }}</td>
                  <td>{{ cat.unitsSold }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </BaseChart>
      </div>
    </section>

    <!-- Contenedor reservado SOLO para desarrollo: Detalle de movimientos -->
    <div
      v-if="isDev"
      class="bg-surface-sunken/40 rounded-xl border border-dashed border-border p-6"
      data-test="dev-movements-placeholder"
    >
      <EmptyState
        title="Detalle de movimientos: próximo paso"
        description="Las pestañas con tablas detalladas de transacciones, productos ociosos y auditoría se integrarán en la siguiente fase."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Percent,
  Wallet,
  RefreshCw,
  AlertCircle,
} from 'lucide-vue-next'
import PageHeader from '@/shared/ui/PageHeader.vue'
import FilterBar from '@/shared/ui/DataTable/FilterBar.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import StatCard from '@/shared/ui/StatCard.vue'
import BaseBadge, { type BadgeVariant } from '@/shared/ui/BaseBadge.vue'
import BaseChart from '@/shared/ui/BaseChart/BaseChart.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useReports } from '../composables/useReports'
import { formatMoney } from '@/shared/utils/formatMoney'
import type { ReportPeriodPreset } from '../types'

const isDev = import.meta.env.DEV

const {
  preset,
  desde,
  hasta,
  type,
  categoryId,
  canSeeCosts,
  validationError,
  fieldErrors,

  summary,
  summaryLoading,
  summaryError,
  timeSeries,
  timeSeriesLoading,
  timeSeriesError,
  categories,
  categoriesLoading,
  categoriesError,

  setPreset,
  setRange,
  setType,
  setCategoryId,
  resetFilters,
  loadAll,
  reloadSummary,
  reloadTimeSeries,
  reloadCategories,
} = useReports()

onMounted(() => {
  loadAll()
})

// Opciones de Preset
const presetOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'last_7_days', label: 'Últimos 7 días' },
  { value: 'current_month', label: 'Mes actual' },
  { value: 'previous_month', label: 'Mes anterior' },
  { value: 'custom', label: 'Rango libre' },
]

// Opciones de Tipo de Operación
const typeOptions = computed(() => {
  const options = [
    { value: 'ALL', label: 'Todos' },
    { value: 'SALE', label: 'Ventas' },
  ]
  if (canSeeCosts.value) {
    options.push({ value: 'PURCHASE', label: 'Compras' })
  }
  return options
})

// Opciones de Categoría (dinámicas a partir de los datos o fijas)
const categoryOptions = computed(() => {
  const base = [{ value: 'ALL', label: 'Todas las categorías' }]
  if (categories.value && categories.value.length > 0) {
    categories.value.forEach((c) => {
      base.push({ value: String(c.categoryId), label: c.categoryName })
    })
    return base
  }
  return [
    { value: 'ALL', label: 'Todas las categorías' },
    { value: '1', label: 'Alimentos' },
    { value: '2', label: 'Bebidas' },
    { value: '3', label: 'Limpieza' },
    { value: '4', label: 'Snacks' },
    { value: '5', label: 'Cárnicos' },
  ]
})

const hasActiveFilters = computed(() => {
  return (
    preset.value !== 'current_month' ||
    type.value !== 'ALL' ||
    (Boolean(categoryId.value) && categoryId.value !== 'ALL')
  )
})

const handlePresetChange = (val: string | number | null) => {
  if (val) setPreset(val as ReportPeriodPreset)
}

const handleDateChange = () => {
  setRange(desde.value, hasta.value)
}

const handleTypeChange = (val: string | number | null) => {
  if (val) setType(val as 'ALL' | 'SALE' | 'PURCHASE')
}

const handleCategoryChange = (val: string | number | null) => {
  setCategoryId(val ? String(val) : 'ALL')
}

// Formateadores
const formatAmount = (val: string | null | undefined): string => {
  if (!val) return '0.00'
  return formatMoney(val, 'USD', { showCurrency: false })
}

const formatGrossProfit = (val: string | null | undefined): string => {
  if (!val) return '0.00'
  const isNegative = String(val).startsWith('-')
  const formatted = formatMoney(val, 'USD', { showCurrency: false })
  // Garantizar signo explícito si es negativo
  if (isNegative && !formatted.startsWith('-')) {
    return `-${formatted}`
  }
  return formatted
}

const isNegativeGrossProfit = computed(() => {
  return String(summary.value?.grossProfit || '').startsWith('-')
})

const isNegativeCashBalance = computed(() => {
  return String(summary.value?.cashBalance || '').startsWith('-')
})

const salesCountDescription = computed(() => {
  const count = summary.value?.salesCount ?? 0
  return `${count} ${count === 1 ? 'ticket' : 'tickets'}`
})

const purchasesCountDescription = computed(() => {
  const count = summary.value?.purchasesCount ?? 0
  return `${count} ${count === 1 ? 'factura' : 'facturas'}`
})

// Badge de Salud del Margen
const marginBadgeVariant = computed<BadgeVariant>(() => {
  const status = summary.value?.marginHealth
  if (status === 'HEALTHY') return 'success'
  if (status === 'WARNING') return 'warning'
  if (status === 'CRITICAL') return 'danger'
  return 'neutral'
})

const marginBadgeLabel = computed<string>(() => {
  const status = summary.value?.marginHealth
  if (status === 'HEALTHY') return 'Saludable'
  if (status === 'WARNING') return 'Atención'
  if (status === 'CRITICAL') return 'Crítico'
  return 'Normal'
})

// Gráficos
const isTimeSeriesEmpty = computed(() => {
  return !timeSeries.value?.points || timeSeries.value.points.length === 0
})

const isCategoriesEmpty = computed(() => {
  return !categories.value || categories.value.length === 0
})

// Gráfico 1: Ventas vs Compras (Barras Agrupadas)
const barChartOption = computed(() => {
  const points = timeSeries.value?.points || []
  const dates = points.map((p) => p.date)
  const salesData = points.map((p) => Number(p.salesTotal))
  const purchasesData = points.map((p) => Number(p.purchasesTotal || 0))

  const series: any[] = [
    {
      name: 'Ventas',
      type: 'bar',
      data: salesData,
    },
  ]

  const legendData = ['Ventas']

  if (canSeeCosts.value) {
    series.push({
      name: 'Compras',
      type: 'bar',
      data: purchasesData,
    })
    legendData.push('Compras')
  }

  return {
    legend: {
      data: legendData,
      top: 0,
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: any) => `${formatAmount(value)} USD`,
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
    },
    series,
  }
})

// Gráfico 2: Ganancia por período (Línea)
const lineChartOption = computed(() => {
  const points = timeSeries.value?.points || []
  const dates = points.map((p) => p.date)
  const profitData = points.map((p) => Number(p.grossProfit || 0))

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: any) => `${formatAmount(value)} USD`,
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Ganancia Bruta',
        type: 'line',
        smooth: true,
        data: profitData,
      },
    ],
  }
})

// Gráfico 3: Ventas por categoría (Barras horizontales ordenadas)
const sortedCategories = computed(() => {
  const list = [...(categories.value || [])]
  return list.sort((a, b) => Number(b.salesTotal) - Number(a.salesTotal))
})

const categoryChartOption = computed(() => {
  // Para barras horizontales ordenadas de mayor a menor con 'inverse: true' en yAxis
  const cats = sortedCategories.value
  const names = cats.map((c) => c.categoryName)
  const sales = cats.map((c) => Number(c.salesTotal))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: any) => `${formatAmount(value)} USD`,
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: names,
    },
    series: [
      {
        name: 'Ventas',
        type: 'bar',
        data: sales,
      },
    ],
  }
})
</script>
