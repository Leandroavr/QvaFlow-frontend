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
    <div class="rounded-xl border border-border bg-surface-card p-4 shadow-sm">
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
        class="grid gap-4"
        :class="canSeeCosts ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5' : 'max-w-md grid-cols-1'"
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
        />

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

      <!-- Franja delgada de cobros por moneda -->
      <div
        v-if="activeSalesByCurrency.length > 0"
        class="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-surface-card px-3.5 py-2 text-xs text-content-secondary"
        data-test="sales-by-currency"
      >
        <span class="font-medium text-content-muted">
          Cobros por moneda (importe en cada moneda de cobro):
        </span>
        <div class="flex flex-wrap items-center gap-1.5">
          <span
            v-for="item in activeSalesByCurrency"
            :key="item.currency"
            class="whitespace-nowrap rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-content-primary"
          >
            {{ item.currency }}: {{ formatAmount(item.amount) }}
          </span>
        </div>
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
        <div
          class="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-sm sm:p-5"
          data-test="sales-vs-purchases-chart-container"
        >
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
                  <tr v-for="point in drawableTimeSeriesPoints" :key="point.date">
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
          class="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-sm sm:p-5"
          data-test="profit-chart-container"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-content-primary">Ganancia Bruta por Período</h3>
              <p class="text-xs text-content-muted">Ganancia bruta por período, en USD</p>
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
                  <tr v-for="point in drawableTimeSeriesPoints" :key="point.date">
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
        class="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-sm sm:p-5"
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

    <!-- Sección de Detalle en Pestañas -->
    <section
      aria-label="Detalle de transacciones y auditoría"
      class="mt-6"
      data-test="reports-tabs-section"
    >
      <BaseTabs
        :model-value="activeTab"
        :items="tabItems"
        data-test="reports-tabs"
        @update:model-value="handleTabChange"
      >
        <!-- Pestaña 1: Movimientos -->
        <template #movements>
          <div class="space-y-4 pt-2" data-test="tab-movements-content">
            <!-- Barra con búsqueda y contador -->
            <FilterBar
              :search-value="movementsSearch"
              search-placeholder="Buscar por referencia o descripción..."
              :has-active-filters="Boolean(movementsSearch.trim())"
              data-test="movements-filter-bar"
              @update:search-value="setMovementsSearch"
              @reset="setMovementsSearch('')"
            >
              <template #actions>
                <span class="text-xs font-medium text-content-muted" data-test="movements-count">
                  {{ movementsCountText }}
                </span>
              </template>
            </FilterBar>

            <!-- Tabla de movimientos en modo servidor -->
            <DataTable
              mode="server"
              :data="movements"
              :columns="movementColumns"
              :total="movementsTotal"
              :page="movementsPage"
              :per-page="movementsPerPage"
              :sort="movementsSort"
              :loading="movementsLoading"
              :error="movementsError"
              empty-title="Sin movimientos"
              empty-description="Sin movimientos con estos filtros"
              row-key="id"
              :fixed-layout="true"
              :page-size-options="[10, 20, 50]"
              data-test="movements-table"
              @update:page="setMovementsPage"
              @update:per-page="setMovementsPerPage"
              @update:sort="setMovementsSort"
              @query-change="handleMovementsQueryChange"
              @retry="retryMovements"
            >
              <!-- 1. Fecha: dd/mm/aaaa hh:mm -->
              <template #cell-date="{ value }">
                <span class="whitespace-nowrap font-mono text-xs text-content-secondary">
                  {{ formatMovementDateTime(value) }}
                </span>
              </template>

              <!-- 2. Tipo: BaseBadge (Venta correcto, Compra info; etiquetas en español) -->
              <template #cell-type="{ value }">
                <BaseBadge
                  :variant="value === 'SALE' ? 'success' : 'info'"
                  size="sm"
                  class="font-medium"
                >
                  {{ value === 'SALE' ? 'Venta' : 'Compra' }}
                </BaseBadge>
              </template>

              <!-- 3. Referencia (mono) -->
              <template #cell-reference="{ value }">
                <span class="font-mono text-xs font-semibold text-content-primary">
                  {{ value }}
                </span>
              </template>

              <!-- 4. Concepto (descripción y debajo categoría y almacén, truncados con title) -->
              <template #cell-description="{ row }">
                <div class="min-w-0 max-w-full">
                  <div
                    class="truncate text-xs font-medium text-content-primary"
                    :title="row.description"
                  >
                    {{ row.description }}
                  </div>
                  <div
                    class="truncate text-[11px] text-content-muted"
                    :title="`${row.categoryName} • ${row.warehouseName}`"
                  >
                    <span>{{ row.categoryName }}</span>
                    <span class="mx-1">•</span>
                    <span>{{ row.warehouseName }}</span>
                  </div>
                </div>
              </template>

              <!-- 5. Forma de pago -->
              <template #cell-paymentMethod="{ value }">
                <span class="truncate text-xs text-content-secondary" :title="value">
                  {{ value || '—' }}
                </span>
              </template>

              <!-- 6. Moneda (código) -->
              <template #cell-currency="{ value }">
                <span class="font-mono text-xs font-semibold text-content-primary">
                  {{ value }}
                </span>
              </template>

              <!-- 7. Importe alineado a la derecha como string decimal con 2 decimales y signo (+ / -) y color -->
              <template #cell-amount="{ row }">
                <div class="text-right font-mono text-xs font-semibold">
                  <span :class="row.type === 'SALE' ? 'text-state-success' : 'text-state-error'">
                    {{ row.type === 'SALE' ? '+' : '-' }}{{ formatDecimalAmount(row.amount) }}
                  </span>
                </div>
              </template>
            </DataTable>
          </div>
        </template>

        <!-- Pestaña 2: Más vendidos (SOLO en DEV) -->
        <template v-if="isDev" #top-selling>
          <div class="p-6" data-test="tab-top-selling-content">
            <EmptyState
              title="Próximo paso"
              description="El ranking de productos más vendidos por unidades e ingresos se integrará en la siguiente fase."
            />
          </div>
        </template>

        <!-- Pestaña 3: Ociosos (SOLO en DEV) -->
        <template v-if="isDev" #idle>
          <div class="p-6" data-test="tab-idle-content">
            <EmptyState
              title="Próximo paso"
              description="El reporte de productos ociosos y sin rotación se integrará en la siguiente fase."
            />
          </div>
        </template>
      </BaseTabs>
    </section>
  </div>
</template>

<script lang="ts">
import type { TimeSeriesPoint } from '../types'
import { formatLocalDate } from '../composables/useReports'

/**
 * Trunca los puntos de la serie temporal para no graficar días posteriores a hoy (fecha local).
 * Si el rango incluye días futuros (por ejemplo, el mes en curso), se trunca al último día <= hoy.
 * Si el rango es pasado, se conserva completo. En días pasados sin movimientos se mantiene 0.
 */
export function getDrawablePoints(
  points: TimeSeriesPoint[],
  granularity: 'day' | 'week' | 'month' = 'day',
  referenceDate: Date = new Date()
): TimeSeriesPoint[] {
  if (!points || points.length === 0) return []
  const todayStr = formatLocalDate(referenceDate)
  const todayMonth = todayStr.slice(0, 7)

  return points.filter((p) => {
    if (granularity === 'month') {
      const pMonth = p.date.slice(0, 7)
      return pMonth <= todayMonth
    }
    // Para 'day' y 'week', p.date es 'YYYY-MM-DD'
    return p.date <= todayStr
  })
}

/**
 * Formatea una fecha ISO ('YYYY-MM-DD' o 'YYYY-MM') para las etiquetas del eje X según la granularidad:
 * - day: 'dd/mm'
 * - week: 'sem dd/mm'
 * - month: 'mm/aaaa'
 * Sin conversión de zona horaria (procesamiento estricto de strings).
 */
export function formatAxisDate(
  dateStr: string,
  granularity: 'day' | 'week' | 'month' = 'day'
): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (granularity === 'month') {
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[0]}`
    }
    return dateStr
  }
  if (granularity === 'week') {
    if (parts.length >= 3) {
      return `sem ${parts[2]}/${parts[1]}`
    }
    if (parts.length === 2) {
      return `sem ${parts[1]}`
    }
    return dateStr
  }
  // Default: 'day'
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}`
  }
  return dateStr
}

/**
 * Formatea una fecha ISO para el tooltip en formato completo 'dd/mm/aaaa' (o 'mm/aaaa' en month).
 * Sin desfase por zona horaria.
 */
export function formatTooltipDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length >= 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  if (parts.length === 2) {
    return `${parts[1]}/${parts[0]}`
  }
  return dateStr
}

/**
 * Formatea una fecha y hora ISO para la tabla de movimientos: 'dd/mm/aaaa hh:mm'.
 * Procesamiento estricto de strings sin desviaciones por zona horaria.
 */
export function formatMovementDateTime(isoStr: string): string {
  if (!isoStr) return ''
  const [datePart, rawTime] = isoStr.includes('T') ? isoStr.split('T') : isoStr.split(' ')
  if (!datePart) return isoStr
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return isoStr
  const timePart = rawTime ? rawTime.slice(0, 5) : '00:00'
  return `${d}/${m}/${y} ${timePart}`
}

/**
 * Normaliza cualquier importe decimal a string estándar de 2 decimales sin redondeo float.
 */
export function formatDecimalAmount(val: string | null | undefined): string {
  if (!val) return '0.00'
  const trimmed = String(val).trim()
  if (!trimmed) return '0.00'
  const isNegative = trimmed.startsWith('-')
  const abs = isNegative ? trimmed.slice(1) : trimmed
  const parts = abs.split('.')
  const whole = parts[0] || '0'
  const decimals = (parts[1] || '').padEnd(2, '0').slice(0, 2)
  return `${whole}.${decimals}`
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute, type LocationQueryRaw } from 'vue-router'
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
import BaseTabs, { type TabItem } from '@/shared/ui/BaseTabs.vue'
import DataTable, { type DataTableColumn } from '@/shared/ui/DataTable/DataTable.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useReports } from '../composables/useReports'
import { useReportMovements } from '../composables/useReportMovements'
import { formatMoney } from '@/shared/utils/formatMoney'
import { isPositiveDecimal } from '@/shared/utils/decimal'
import type { ReportPeriodPreset, ReportMovement } from '../types'

const isDev = import.meta.env.DEV

const route = useRoute()
const router = useRouter()

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

// Pestañas de Detalle
const tabItems = computed<TabItem[]>(() => {
  const items: TabItem[] = [{ id: 'movements', label: 'Movimientos' }]
  if (isDev) {
    items.push({ id: 'top-selling', label: 'Más vendidos' }, { id: 'idle', label: 'Ociosos' })
  }
  return items
})

const initialTab = typeof route?.query?.tab === 'string' ? route.query.tab : 'movements'
const activeTab = ref<string>(
  initialTab === 'top-selling' && isDev
    ? 'top-selling'
    : initialTab === 'idle' && isDev
      ? 'idle'
      : 'movements'
)

watch(
  () => route?.query?.tab,
  (newTab) => {
    if (newTab === 'top-selling' && isDev) {
      activeTab.value = 'top-selling'
    } else if (newTab === 'idle' && isDev) {
      activeTab.value = 'idle'
    } else {
      activeTab.value = 'movements'
    }
  }
)

const handleTabChange = (val: string) => {
  activeTab.value = val
  if (router && route) {
    const nextQuery: LocationQueryRaw = { ...route.query }
    if (val === 'movements') {
      delete nextQuery.tab
    } else {
      nextQuery.tab = val
    }
    const currentQuery = route.query
    const isDifferent =
      Object.keys(nextQuery).length !== Object.keys(currentQuery).length ||
      Object.entries(nextQuery).some(([k, v]) => currentQuery[k] !== v)
    if (isDifferent) {
      router.replace({ query: nextQuery })
    }
  }
}

// Composable de Movimientos
const {
  movements,
  total: movementsTotal,
  loading: movementsLoading,
  error: movementsError,
  page: movementsPage,
  perPage: movementsPerPage,
  sort: movementsSort,
  search: movementsSearch,
  setPage: setMovementsPage,
  setPerPage: setMovementsPerPage,
  setSort: setMovementsSort,
  setSearch: setMovementsSearch,
  handleQueryChange: handleMovementsQueryChange,
  loadMovements,
  retry: retryMovements,
} = useReportMovements({
  desde,
  hasta,
  type,
  categoryId,
  activeTab,
})

// Configuración de la Tabla de Movimientos
const movementColumns: DataTableColumn<ReportMovement>[] = [
  { key: 'date', title: 'Fecha', width: '150px', sortable: true },
  { key: 'type', title: 'Tipo', width: '90px' },
  { key: 'reference', title: 'Referencia', width: '140px', sortable: true },
  { key: 'description', title: 'Concepto' },
  { key: 'paymentMethod', title: 'Forma de pago', width: '130px' },
  { key: 'currency', title: 'Moneda', width: '80px' },
  { key: 'amount', title: 'Importe', width: '130px', align: 'right', sortable: true },
]

const movementsCountText = computed(() => {
  const count = movementsTotal.value
  return `${count} ${count === 1 ? 'movimiento' : 'movimientos'}`
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

const activeSalesByCurrency = computed(() => {
  const items = summary.value?.salesByCurrency || []
  return items.filter((item) => isPositiveDecimal(item.amount))
})

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
const drawableTimeSeriesPoints = computed(() => {
  return getDrawablePoints(timeSeries.value?.points || [], timeSeries.value?.granularity || 'day')
})

const isTimeSeriesEmpty = computed(() => {
  return drawableTimeSeriesPoints.value.length === 0
})

const isCategoriesEmpty = computed(() => {
  return !categories.value || categories.value.length === 0
})

/**
 * Genera la configuración de tooltip para gráficos temporales (barras y línea).
 * Muestra la fecha completa 'dd/mm/aaaa' e importes con 2 decimales.
 */
function createTimeSeriesTooltip() {
  return {
    trigger: 'axis',
    formatter: (params: any) => {
      const list = Array.isArray(params) ? params : [params]
      if (list.length === 0) return ''
      const rawDate = list[0].axisValue || list[0].name || ''
      const dateFormatted = formatTooltipDate(String(rawDate))
      let html = `<div style="font-weight:600;margin-bottom:4px;">${dateFormatted}</div>`
      for (const item of list) {
        const marker = item.marker || ''
        const name = item.seriesName || ''
        const val = formatAmount(item.value)
        html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;"><span>${marker} ${name}</span><span style="font-weight:600;">${val} USD</span></div>`
      }
      return html
    },
  }
}

// Gráfico 1: Ventas vs Compras (Barras Agrupadas)
const barChartOption = computed(() => {
  const points = drawableTimeSeriesPoints.value
  const dates = points.map((p) => p.date)
  const salesData = points.map((p) => Number(p.salesTotal))
  const purchasesData = points.map((p) => Number(p.purchasesTotal || 0))

  const series: any[] = [
    {
      name: 'Ventas',
      type: 'bar',
      barMaxWidth: 28,
      data: salesData,
    },
  ]

  const legendData = ['Ventas']

  if (canSeeCosts.value) {
    series.push({
      name: 'Compras',
      type: 'bar',
      barMaxWidth: 28,
      data: purchasesData,
    })
    legendData.push('Compras')
  }

  return {
    legend: {
      data: legendData,
      top: 0,
    },
    tooltip: createTimeSeriesTooltip(),
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        hideOverlap: true,
        formatter: (val: string) => formatAxisDate(val, timeSeries.value?.granularity),
      },
    },
    yAxis: {
      type: 'value',
    },
    series,
  }
})

// Gráfico 2: Ganancia por período (Línea)
const lineChartOption = computed(() => {
  const points = drawableTimeSeriesPoints.value
  const dates = points.map((p) => p.date)
  const profitData = points.map((p) => Number(p.grossProfit || 0))

  return {
    tooltip: createTimeSeriesTooltip(),
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        hideOverlap: true,
        formatter: (val: string) => formatAxisDate(val, timeSeries.value?.granularity),
      },
    },
    yAxis: {
      type: 'value',
      min: (val: { min: number; max: number }) =>
        val.min != null && val.min < 0 ? Math.floor(val.min) : 0,
      max: (val: { min: number; max: number }) => (val.max != null && val.max < 0 ? 0 : undefined),
    },
    series: [
      {
        name: 'Ganancia Bruta',
        type: 'line',
        smooth: false,
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
      axisLabel: {
        interval: 0,
      },
    },
    series: [
      {
        name: 'Ventas',
        type: 'bar',
        barMaxWidth: 28,
        data: sales,
      },
    ],
  }
})
</script>
