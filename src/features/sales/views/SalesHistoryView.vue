<template>
  <div class="space-y-4 p-4 md:p-6">
    <!-- Encabezado de Página -->
    <PageHeader
      title="Historial de Ventas"
      description="Consulta, auditoría de tickets comerciales y comprobantes fiscales de venta."
    >
      <template #actions>
        <BaseButton
          v-if="can('sales.create')"
          variant="primary"
          density="compact"
          class="gap-1.5"
          data-testid="btn-go-to-pos"
          @click="router.push('/sales/pos')"
        >
          <Store class="h-4 w-4" aria-hidden="true" />
          <span>Punto de Venta</span>
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Barra de Filtros en 2 Filas Sincronizada con la URL -->
    <div
      class="shadow-xs flex w-full flex-col gap-2.5 rounded-xl border border-border-subtle bg-surface-card p-3"
      data-testid="sales-history-filter-bar"
    >
      <!-- Fila 1: Buscador (ancho flexible), Cajero, Turno -->
      <div class="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
        <!-- Buscador con ancho flexible y debounce -->
        <div class="min-w-[200px] flex-1">
          <BaseInput
            :model-value="search"
            placeholder="Buscar por ticket, cajero o producto..."
            density="compact"
            :prefix-icon="Search"
            clearable
            @update:model-value="handleSearchUpdate"
            @clear="handleClearSearch"
          />
        </div>

        <!-- Selector de Cajero -->
        <div class="w-full shrink-0 sm:w-52">
          <BaseSelect
            :model-value="cashier || 'ALL'"
            :options="cashierOptions"
            placeholder="Cajero"
            density="compact"
            data-testid="filter-cashier-select"
            @update:model-value="handleCashierChange"
          />
        </div>

        <!-- Selector de Turno (dependiente del cajero) -->
        <div class="w-full shrink-0 sm:w-72">
          <BaseSelect
            :model-value="shiftId || 'ALL'"
            :options="shiftOptions"
            placeholder="Turno"
            density="compact"
            data-testid="filter-shift-select"
            @update:model-value="handleShiftChange"
          />
        </div>
      </div>

      <!-- Fila 2: Moneda, Desde, Hasta, y Limpiar filtros -->
      <div class="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Filtro por Moneda -->
          <div class="w-44 shrink-0">
            <BaseSelect
              :model-value="currency || 'ALL'"
              :options="currencyOptions"
              placeholder="Moneda"
              density="compact"
              data-testid="filter-currency-select"
              @update:model-value="handleCurrencyChange"
            />
          </div>

          <!-- Filtro Fecha Desde -->
          <div class="flex items-center gap-1.5">
            <label for="filter-desde" class="shrink-0 text-xs font-medium text-content-secondary">
              Desde:
            </label>
            <div class="w-34">
              <BaseInput
                id="filter-desde"
                :model-value="desde"
                type="date"
                density="compact"
                title="Fecha inicial de venta (Desde)"
                aria-label="Fecha inicial de venta (Desde)"
                @update:model-value="handleDesdeChange"
              />
            </div>
          </div>

          <!-- Filtro Fecha Hasta -->
          <div class="flex items-center gap-1.5">
            <label for="filter-hasta" class="shrink-0 text-xs font-medium text-content-secondary">
              Hasta:
            </label>
            <div class="w-34">
              <BaseInput
                id="filter-hasta"
                :model-value="hasta"
                type="date"
                density="compact"
                title="Fecha final de venta (Hasta)"
                aria-label="Fecha final de venta (Hasta)"
                @update:model-value="handleHastaChange"
              />
            </div>
          </div>
        </div>

        <!-- Botón Limpiar filtros (inline, solo visible cuando hay filtros activos) -->
        <BaseButton
          v-if="hasActiveFilters"
          variant="ghost"
          density="compact"
          :icon="RotateCcw"
          class="shrink-0 text-xs text-content-secondary hover:text-content-primary"
          data-testid="btn-clear-filters"
          @click="handleClearFilters"
        >
          Limpiar filtros
        </BaseButton>
      </div>
    </div>

    <!-- Tabla Principal de Ventas en Modo Servidor -->
    <DataTable
      mode="server"
      :columns="columns"
      :data="sales"
      :total="total"
      :loading="isLoading"
      :error="error"
      empty-title="No se encontraron ventas"
      empty-description="No existen tickets de venta registrados que coincidan con los filtros seleccionados."
      :page="page"
      :per-page="perPage"
      :sort="sort"
      data-testid="sales-history-table"
      @update:page="setPage"
      @update:per-page="setPerPage"
      @update:sort="setSort"
      @retry="loadSales"
    >
      <!-- Folio del Ticket -->
      <template #cell-id="{ row }">
        <span class="font-mono font-semibold text-content-primary" data-testid="cell-ticket-id">
          {{ row.id }}
        </span>
      </template>

      <!-- Fecha y Hora (dd/mm/aaaa hh:mm) -->
      <template #cell-createdAt="{ row }">
        <span class="font-mono text-content-secondary" data-testid="cell-created-at">
          {{ formatDate(row.createdAt, { includeTime: true }) }}
        </span>
      </template>

      <!-- Turno Asociado -->
      <template #cell-shiftId="{ row }">
        <span class="font-mono text-content-secondary" data-testid="cell-shift-id">
          {{ row.shiftId }}
        </span>
      </template>

      <!-- Cajero (Flexible con Truncate y Title) -->
      <template #cell-cashierName="{ row }">
        <span
          class="block truncate font-medium text-content-primary"
          :title="row.cashierName"
          data-testid="cell-cashier-name"
        >
          {{ row.cashierName }}
        </span>
      </template>

      <!-- Total con Divisa en Segunda Línea -->
      <template #cell-total="{ row }">
        <div class="text-right" data-testid="cell-total">
          <span class="block font-mono font-semibold text-content-primary">
            {{ row.paidCurrency === 'USD' ? row.totalUSD : row.totalCUP }}
          </span>
          <span class="block text-[10px] font-medium uppercase tracking-wider text-content-muted">
            {{ row.paidCurrency }}
          </span>
        </div>
      </template>

      <!-- Cobro (Moneda y Método) -->
      <template #cell-payment="{ row }">
        <div class="flex items-center gap-1.5" data-testid="cell-payment">
          <span
            class="rounded border border-border-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-[11px] font-bold text-content-secondary"
          >
            {{ row.paidCurrency }}
          </span>
          <span class="text-xs text-content-secondary">
            {{ formatPaymentMethod(row.paymentMethod) }}
          </span>
        </div>
      </template>

      <!-- Estado de la Venta (Completada o Anulada) -->
      <template #cell-status="{ row }">
        <BaseBadge
          :variant="row.status === 'COMPLETED' ? 'success' : 'danger'"
          size="sm"
          data-testid="cell-status"
        >
          {{ row.status === 'COMPLETED' ? 'Completada' : 'Anulada' }}
        </BaseBadge>
      </template>

      <!-- Acción: Ver Comprobante -->
      <template #cell-actions="{ row }">
        <BaseButton
          variant="ghost"
          density="compact"
          class="p-1 text-xs font-semibold text-primary hover:underline"
          title="Ver detalle del ticket"
          data-testid="btn-view-sale"
          @click="handleOpenDetail(row.id)"
        >
          Ver
        </BaseButton>
      </template>
    </DataTable>

    <!-- Componente de Detalle y Anulación (Integrado en Bloque 2) -->
    <SaleDetailDrawer
      v-model:open="isDrawerOpen"
      :sale="selectedSale"
      :is-loading="isLoadingDetail"
      :error="detailError"
      :is-cancelling="isCancelling"
      :cancel-error="cancelError"
      @cancel="handleCancelSale"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Store, Search, RotateCcw } from 'lucide-vue-next'
import PageHeader from '@/shared/ui/PageHeader.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { SelectOption } from '@/shared/ui/BaseSelect.vue'
import { DataTable } from '@/shared/ui/DataTable'
import type { DataTableColumn } from '@/shared/ui/DataTable'
import SaleDetailDrawer from '../components/SaleDetailDrawer.vue'
import { useSalesHistory } from '../composables/useSalesHistory'
import { useSalesFilters } from '../composables/useSalesFilters'
import { useDataTableQuery } from '@/shared/composables/useDataTableQuery'
import { usePermissions } from '@/shared/composables/usePermissions'
import { formatDate } from '@/shared/utils/formatDate'
import type { PaymentMethod, Currency } from '../types'

const router = useRouter()
const route = useRoute()
const { can } = usePermissions()

const {
  sales,
  total,
  isLoading,
  error,
  selectedSale,
  isLoadingDetail,
  detailError,
  isCancelling,
  cancelError,
  fetchSales,
  fetchSaleById,
  cancelSale,
} = useSalesHistory()

// Sincronización de tabla y filtros con la URL
const {
  page,
  perPage,
  sort,
  search,
  filters,
  setPage,
  setPerPage,
  setSort,
  setSearch,
  setFilter,
  resetFilters,
} = useDataTableQuery<{
  shiftId: string
  cashier: string
  desde: string
  hasta: string
  currency: string
}>({
  initialSort: 'createdAt:desc',
  initialFilters: {
    shiftId: '',
    cashier: '',
    desde: '',
    hasta: '',
    currency: '',
  },
  syncUrl: true,
})

const cashier = computed(() => filters.value.cashier)
const shiftId = computed(() => filters.value.shiftId)
const desde = computed(() => filters.value.desde)
const hasta = computed(() => filters.value.hasta)
const currency = computed(() => filters.value.currency)

const {
  cashierOptions,
  shiftOptions,
  availableShifts,
  setCashier: setFilterCashier,
  setShiftId: setFilterShiftId,
  loadFilterData,
} = useSalesFilters({
  initialCashier: cashier.value,
  initialShiftId: shiftId.value,
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const handleSearchUpdate = (val: string | number | null) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    setSearch(String(val || ''))
    setPage(1)
  }, 300)
}

const handleClearSearch = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  setSearch('')
  setPage(1)
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

const hasActiveFilters = computed<boolean>(() => {
  return (
    Boolean(search.value?.trim()) ||
    Boolean(cashier.value) ||
    Boolean(shiftId.value) ||
    Boolean(desde.value) ||
    Boolean(hasta.value) ||
    Boolean(currency.value)
  )
})

const currencyOptions: SelectOption[] = [
  { label: 'Moneda: Todas', value: 'ALL' },
  { label: 'CUP', value: 'CUP' },
  { label: 'USD', value: 'USD' },
  { label: 'CUP_TRANSFER', value: 'CUP_TRANSFER' },
  { label: 'MLC', value: 'MLC' },
]

const formatPaymentMethod = (method: PaymentMethod): string => {
  switch (method) {
    case 'CASH':
      return 'Efectivo'
    case 'TRANSFER':
      return 'Transferencia'
    case 'CARD':
      return 'Tarjeta'
    default:
      return method
  }
}

// Columnas con presupuesto estricto <= 780 px fijos (770 px fijos totales)
const columns: DataTableColumn[] = [
  {
    key: 'id',
    title: 'Ticket',
    width: '110px',
    sortable: true,
  },
  {
    key: 'createdAt',
    title: 'Fecha',
    width: '140px',
    sortable: true,
  },
  {
    key: 'shiftId',
    title: 'Turno',
    width: '120px',
    sortable: false,
  },
  {
    key: 'cashierName',
    title: 'Cajero',
    sortable: false,
    cellClass: 'min-w-[120px]',
  },
  {
    key: 'total',
    title: 'Total',
    width: '110px',
    align: 'right',
    sortable: false,
  },
  {
    key: 'payment',
    title: 'Cobro',
    width: '130px',
    sortable: false,
    headerClass: 'pl-6',
    cellClass: 'pl-6',
  },
  {
    key: 'status',
    title: 'Estado',
    width: '100px',
    sortable: false,
  },
  {
    key: 'actions',
    title: '',
    width: '60px',
    align: 'center',
    sortable: false,
  },
]

const isDrawerOpen = ref<boolean>(false)

const loadSales = async () => {
  try {
    await fetchSales({
      page: page.value,
      perPage: perPage.value,
      sort: sort.value || 'createdAt:desc',
      search: search.value?.trim() || undefined,
      cashierName: cashier.value || undefined,
      shiftId: shiftId.value || undefined,
      desde: desde.value || undefined,
      hasta: hasta.value || undefined,
      currency: (currency.value as Currency) || undefined,
    })
  } catch {
    // Error queda en error.value
  }
}

const handleCashierChange = (val: string | number | null) => {
  const str = String(val || '')
  const newCashier = str === 'ALL' ? '' : str
  setFilter('cashier', newCashier)
  setFilterCashier(newCashier)
  setPage(1)
  if (shiftId.value) {
    const shiftExists = availableShifts.value.some((s) => s.id === shiftId.value)
    if (!shiftExists) {
      setFilter('shiftId', '')
      setFilterShiftId('')
    }
  }
}

const handleShiftChange = (val: string | number | null) => {
  const str = String(val || '')
  const newShift = str === 'ALL' ? '' : str
  setFilter('shiftId', newShift)
  setFilterShiftId(newShift)
  setPage(1)
}

const handleCurrencyChange = (val: string | number | null) => {
  const str = String(val || '')
  setFilter('currency', str === 'ALL' ? '' : str)
  setPage(1)
}

const handleDesdeChange = (val: string | number | null) => {
  setFilter('desde', String(val || ''))
  setPage(1)
}

const handleHastaChange = (val: string | number | null) => {
  setFilter('hasta', String(val || ''))
  setPage(1)
}

const handleClearFilters = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  resetFilters()
  setSearch('')
  setFilterCashier('')
  setFilterShiftId('')
  setPage(1)
}

const handleOpenDetail = async (id: string) => {
  isDrawerOpen.value = true
  try {
    await fetchSaleById(id)
  } catch {
    // Error queda en detailError.value
  }
}

const handleCancelSale = async (reason: string) => {
  if (!selectedSale.value) return
  try {
    await cancelSale(selectedSale.value.id, reason)
  } catch {
    // Error queda en cancelError.value
  }
}

// Sincronizar cambios externos de la URL hacia el estado local
watch(
  () => route.query,
  (q) => {
    if (q.page) {
      const parsed = parseInt(String(q.page), 10)
      if (parsed && parsed !== page.value) {
        page.value = parsed
      }
    }
    if (q.sort && String(q.sort) !== sort.value) {
      sort.value = String(q.sort)
    }
    if (q.search !== undefined && String(q.search) !== search.value) {
      search.value = String(q.search)
    }
    const qCashier = q.cashier ?? q.cashierName
    if (qCashier !== undefined && String(qCashier) !== filters.value.cashier) {
      filters.value.cashier = String(qCashier)
      setFilterCashier(String(qCashier))
    }
    if (q.shiftId !== undefined && String(q.shiftId) !== filters.value.shiftId) {
      filters.value.shiftId = String(q.shiftId)
      setFilterShiftId(String(q.shiftId))
    }
    if (q.desde !== undefined && String(q.desde) !== filters.value.desde) {
      filters.value.desde = String(q.desde)
    }
    if (q.hasta !== undefined && String(q.hasta) !== filters.value.hasta) {
      filters.value.hasta = String(q.hasta)
    }
    if (q.currency !== undefined && String(q.currency) !== filters.value.currency) {
      filters.value.currency = String(q.currency)
    }
  },
  { deep: true }
)

// Carga inicial y reactividad a cambios de parámetros en URL
watch(
  [
    () => page.value,
    () => perPage.value,
    () => sort.value,
    () => search.value,
    () => filters.value.cashier,
    () => filters.value.shiftId,
    () => filters.value.desde,
    () => filters.value.hasta,
    () => filters.value.currency,
  ],
  () => {
    loadSales()
  }
)

onMounted(async () => {
  await loadFilterData()
  if (cashier.value && shiftId.value) {
    const shiftExists = availableShifts.value.some((s) => s.id === shiftId.value)
    if (!shiftExists) {
      setFilter('shiftId', '')
      setFilterShiftId('')
    }
  }
  loadSales()
})
</script>
