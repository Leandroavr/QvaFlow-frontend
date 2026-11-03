<template>
  <div class="space-y-6">
    <!-- Encabezado de la página -->
    <PageHeader
      title="Stock de Inventario"
      description="Consulta y control de existencias físicas por almacén y localización."
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          density="compact"
          :loading="isLoading || isLoadingSummary"
          @click="refreshAll"
        >
          <RefreshCw class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Actualizar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Fila de Tarjetas de Resumen (StatCards) -->
    <div
      class="grid gap-4"
      :class="
        can('products.view_cost')
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-3'
      "
    >
      <!-- Total de unidades -->
      <StatCard
        label="Total unidades"
        :value="summary?.totalUnits ?? 0"
        description="Existencias globales"
        :icon="Boxes"
        :loading="isLoadingSummary"
      />

      <!-- Valor total al costo (Sensible RBAC: products.view_cost) -->
      <StatCard
        v-if="can('products.view_cost')"
        label="Valor al costo (CUP)"
        :value="summary?.costValue ? formatMoney(summary.costValue, 'CUP') : '—'"
        description="Capital invertido estimado"
        :icon="CircleDollarSign"
        :loading="isLoadingSummary"
      />

      <!-- Productos bajo stock (Clickable para filtrar) -->
      <div
        class="cursor-pointer transition-all hover:scale-[1.01]"
        role="button"
        tabindex="0"
        :aria-pressed="status === 'low'"
        :aria-label="`Filtrar por productos bajo stock (${summary?.lowStockCount ?? 0})`"
        @click="setStatusFilter('low')"
        @keydown.enter.prevent="setStatusFilter('low')"
        @keydown.space.prevent="setStatusFilter('low')"
      >
        <StatCard
          label="Bajo stock"
          :value="summary?.lowStockCount ?? 0"
          :description="
            status === 'low' ? 'Filtro activo (clic para quitar)' : 'Requieren reabastecimiento'
          "
          :icon="AlertTriangle"
          :loading="isLoadingSummary"
          :class="status === 'low' ? 'border-state-warning ring-2 ring-state-warning' : ''"
        />
      </div>

      <!-- Productos agotados (Clickable para filtrar) -->
      <div
        class="cursor-pointer transition-all hover:scale-[1.01]"
        role="button"
        tabindex="0"
        :aria-pressed="status === 'out'"
        :aria-label="`Filtrar por productos agotados (${summary?.outOfStockCount ?? 0})`"
        @click="setStatusFilter('out')"
        @keydown.enter.prevent="setStatusFilter('out')"
        @keydown.space.prevent="setStatusFilter('out')"
      >
        <StatCard
          label="Agotados"
          :value="summary?.outOfStockCount ?? 0"
          :description="
            status === 'out' ? 'Filtro activo (clic para quitar)' : 'Sin existencias disponibles'
          "
          :icon="PackageX"
          :loading="isLoadingSummary"
          :class="status === 'out' ? 'border-state-error ring-2 ring-state-error' : ''"
        />
      </div>
    </div>

    <!-- Barra de Filtros -->
    <FilterBar
      :search="search"
      search-placeholder="Buscar por producto o código..."
      :has-active-filters="hasActiveFilters"
      @update:search="handleSearchUpdate"
      @clear="handleClearFilters"
    >
      <template #filters>
        <!-- Filtro: Almacén -->
        <div class="w-48">
          <BaseSelect
            :model-value="warehouse"
            :options="warehouseOptions"
            include-all-option
            all-option-label="Todos los almacenes"
            all-option-value=""
            placeholder="Almacén"
            @update:model-value="handleWarehouseChange"
          />
        </div>

        <!-- Filtro: Localización (Dependiente del almacén) -->
        <div class="w-48">
          <BaseSelect
            :model-value="location"
            :options="locationOptions"
            include-all-option
            all-option-label="Todas las localizaciones"
            all-option-value=""
            placeholder="Localización"
            :disabled="!warehouse"
            @update:model-value="handleLocationChange"
          />
        </div>

        <!-- Filtro: Categoría -->
        <div class="w-44">
          <BaseSelect
            :model-value="category"
            :options="categoryOptions"
            include-all-option
            all-option-label="Todas las categorías"
            all-option-value=""
            placeholder="Categoría"
            @update:model-value="handleCategoryChange"
          />
        </div>

        <!-- Filtro: Estado -->
        <div class="w-40">
          <BaseSelect
            :model-value="status"
            :options="statusOptions"
            include-all-option
            all-option-label="Todos los estados"
            all-option-value=""
            placeholder="Estado"
            @update:model-value="handleStatusSelectChange"
          />
        </div>
      </template>
    </FilterBar>

    <!-- Tabla de Existencias en modo servidor -->
    <DataTable
      mode="server"
      :data="items"
      :columns="columns"
      :total="total"
      :page="page"
      :per-page="perPage"
      :sort="sort"
      :loading="isLoading"
      :error="error"
      empty-title="No se encontraron existencias"
      empty-description="No hay productos que coincidan con los filtros de búsqueda seleccionados."
      :actions="getRowActions"
      row-key="productCode"
      @update:page="handlePageChange"
      @update:per-page="handlePerPageChange"
      @update:sort="handleSortChange"
      @query-change="handleQueryChange"
      @row-action="handleRowAction"
      @row-click="openProductDetail"
      @retry="fetchStock"
    >
      <!-- Celda personalizada: Código -->
      <template #cell-productCode="{ value }">
        <span class="font-mono text-[11px] font-medium text-content-muted">
          {{ value }}
        </span>
      </template>

      <!-- Celda personalizada: Producto y Categoría -->
      <template #cell-productName="{ row }">
        <div class="min-w-0">
          <div class="truncate font-medium text-content-primary">
            {{ row.productName }}
          </div>
          <div class="truncate text-[11px] text-content-muted">
            {{ row.category }}
          </div>
        </div>
      </template>

      <!-- Celda personalizada: Almacén y Localización -->
      <template #cell-warehouseName="{ row }">
        <div class="min-w-0">
          <div class="truncate text-content-primary">
            {{ row.warehouseName }}
          </div>
          <div class="truncate text-[11px] text-content-muted">
            {{ row.locationName }}
          </div>
        </div>
      </template>

      <!-- Celda personalizada: Cantidad y Unidad -->
      <template #cell-quantity="{ row }">
        <div class="text-right">
          <span class="font-semibold tabular-nums text-content-primary">{{ row.quantity }}</span>
          <span class="ml-1 text-[11px] text-content-muted">{{ row.unit }}</span>
        </div>
      </template>

      <!-- Celda personalizada: Costo Unitario (Sensible RBAC) -->
      <template #cell-cost="{ row }">
        <MoneyCell v-if="row.cost" :value="row.cost" currency="CUP" />
        <span v-else class="text-content-muted">—</span>
      </template>

      <!-- Celda personalizada: Precio de Venta -->
      <template #cell-price="{ row }">
        <MoneyCell :value="row.price" currency="CUP" />
      </template>

      <!-- Celda personalizada: Estado con Dot -->
      <template #cell-status="{ row }">
        <div class="flex justify-center">
          <BaseBadge
            :variant="getStatusBadgeVariant(row.status)"
            :dot="true"
            size="sm"
            class="whitespace-nowrap"
          >
            {{ getStatusBadgeLabel(row.status) }}
          </BaseBadge>
        </div>
      </template>

      <!-- Celda personalizada: Actualizado (visible en pantallas >= 1440px) -->
      <template #cell-updatedAt="{ value }">
        <span class="whitespace-nowrap font-mono text-[11px] text-content-muted">
          {{ formatDateShort(value) }}
        </span>
      </template>
    </DataTable>

    <!-- Panel Lateral: Ficha Detallada de Existencia (BaseDrawer) -->
    <BaseDrawer
      :open="isDrawerOpen"
      title="Detalle de Existencia"
      description="Ficha completa de producto y ubicación en almacén"
      size="md"
      @update:open="isDrawerOpen = $event"
    >
      <div v-if="selectedItem" class="space-y-6">
        <!-- Encabezado de producto -->
        <div class="rounded-xl border border-border-subtle bg-surface-sunken p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="inline-flex items-center gap-1 font-mono text-xs text-content-muted">
                <Barcode class="h-3.5 w-3.5" aria-hidden="true" />
                {{ selectedItem.productCode }}
              </span>
              <h3 class="mt-1 text-base font-bold text-content-primary">
                {{ selectedItem.productName }}
              </h3>
              <p class="text-xs text-content-muted">{{ selectedItem.category }}</p>
            </div>
            <BaseBadge :variant="getStatusBadgeVariant(selectedItem.status)" :dot="true" size="md">
              {{ getStatusBadgeLabel(selectedItem.status) }}
            </BaseBadge>
          </div>
        </div>

        <!-- Métricas Principales de Stock -->
        <div>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Control de Existencias
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-border-subtle bg-surface-card p-3">
              <span class="text-[11px] text-content-muted">Stock actual</span>
              <div class="mt-1 text-lg font-bold text-content-primary">
                {{ selectedItem.quantity }}
                <span class="text-xs font-normal text-content-muted">{{ selectedItem.unit }}</span>
              </div>
            </div>

            <div class="rounded-lg border border-border-subtle bg-surface-card p-3">
              <span class="text-[11px] text-content-muted">Stock mínimo</span>
              <div class="mt-1 text-lg font-bold text-content-primary">
                {{ selectedItem.minStock }}
                <span class="text-xs font-normal text-content-muted">{{ selectedItem.unit }}</span>
              </div>
            </div>

            <div class="rounded-lg border border-border-subtle bg-surface-card p-3">
              <span class="text-[11px] text-content-muted">Precio venta</span>
              <div class="mt-1 text-lg font-bold text-content-primary">
                <MoneyCell :value="selectedItem.price" currency="CUP" :show-currency="true" />
              </div>
            </div>

            <div
              v-if="can('products.view_cost')"
              class="rounded-lg border border-border-subtle bg-surface-card p-3"
            >
              <span class="text-[11px] text-content-muted">Costo adquisición</span>
              <div class="mt-1 text-lg font-bold text-content-primary">
                <MoneyCell
                  v-if="selectedItem.cost"
                  :value="selectedItem.cost"
                  currency="CUP"
                  :show-currency="true"
                />
                <span v-else class="text-content-muted">—</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ubicación Física -->
        <div>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Ubicación Física
          </h4>
          <div class="space-y-2 rounded-xl border border-border-subtle bg-surface-card p-4 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-content-muted">Almacén:</span>
              <span class="font-medium text-content-primary"
                >{{ selectedItem.warehouseName }} ({{ selectedItem.warehouseCode }})</span
              >
            </div>
            <div class="flex items-center justify-between border-t border-border-subtle pt-2">
              <span class="text-content-muted">Localización:</span>
              <span class="font-medium text-content-primary"
                >{{ selectedItem.locationName }} ({{ selectedItem.locationCode }})</span
              >
            </div>
            <div class="flex items-center justify-between border-t border-border-subtle pt-2">
              <span class="text-content-muted">Última actualización:</span>
              <span class="font-mono text-content-muted">{{
                formatDate(selectedItem.updatedAt)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #actions>
        <BaseButton variant="secondary" density="compact" @click="handleAdjustFromDrawer">
          <SlidersHorizontal class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Ajustar stock
        </BaseButton>
        <BaseButton variant="secondary" density="compact" @click="handleTransferFromDrawer">
          <ArrowRightLeft class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Trasladar
        </BaseButton>
        <BaseButton variant="primary" density="compact" @click="isDrawerOpen = false">
          Cerrar
        </BaseButton>
      </template>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  Boxes,
  CircleDollarSign,
  AlertTriangle,
  PackageX,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ArrowRightLeft,
  Barcode,
} from 'lucide-vue-next'

import PageHeader from '@/shared/ui/PageHeader.vue'
import StatCard from '@/shared/ui/StatCard.vue'
import { DataTable, FilterBar, MoneyCell } from '@/shared/ui/DataTable'
import type { DataTableColumn } from '@/shared/ui/DataTable'
import type { DropdownMenuItemConfig } from '@/shared/ui/BaseDropdownMenu.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { SelectOption } from '@/shared/ui/BaseSelect.vue'
import BaseDrawer from '@/shared/ui/BaseDrawer.vue'

import { useStock } from '@/features/inventory/composables/useStock'
import { useWarehouses } from '@/features/inventory/composables/useWarehouses'
import { usePermissions } from '@/shared/composables/usePermissions'
import { formatMoney } from '@/shared/utils/formatMoney'
import type { StockItem, StockStatus } from '@/features/inventory/types'

const { can } = usePermissions()

const {
  items,
  total,
  page,
  perPage,
  sort,
  search,
  warehouse,
  location,
  category,
  status,
  summary,
  isLoading,
  isLoadingSummary,
  error,
  hasActiveFilters,
  fetchStock,
  fetchSummary,
  resetFilters,
  setStatusFilter,
} = useStock()

const { warehouses, locations, fetchWarehouses, fetchLocations } = useWarehouses()

// Estado del Drawer de detalle
const isDrawerOpen = ref(false)
const selectedItem = ref<StockItem | null>(null)

// Opciones de Almacén para BaseSelect
const warehouseOptions = computed<SelectOption[]>(() => {
  return warehouses.value.map((w) => ({
    label: w.name,
    value: w.code,
  }))
})

// Opciones de Localización (filtradas por almacén seleccionado)
const locationOptions = computed<SelectOption[]>(() => {
  return locations.value.map((l) => ({
    label: l.name || l.code,
    value: l.code,
  }))
})

// Opciones de Categoría fijas/frecuentes
const categoryOptions: SelectOption[] = [
  { label: 'Alimentos', value: 'Alimentos' },
  { label: 'Bebidas', value: 'Bebidas' },
  { label: 'Tabacos', value: 'Tabacos' },
  { label: 'Aseo Personal', value: 'Aseo Personal' },
  { label: 'Limpieza', value: 'Limpieza' },
  { label: 'Ferretería', value: 'Ferretería' },
]

// Opciones de Estado de Stock
const statusOptions: SelectOption[] = [
  { label: 'Normal', value: 'ok' },
  { label: 'Bajo', value: 'low' },
  { label: 'Agotado', value: 'out' },
]

// Detección reactiva de pantalla ancha (>= 1440px) para mostrar columna "Actualizado"
const isScreenWide = ref(typeof window !== 'undefined' ? window.innerWidth >= 1440 : false)
const handleResize = () => {
  if (typeof window !== 'undefined') {
    isScreenWide.value = window.innerWidth >= 1440
  }
}

// Definición de columnas de la tabla tipadas con anchos optimizados
const columns = computed<DataTableColumn<StockItem>[]>(() => {
  return [
    {
      key: 'productCode',
      title: 'Código',
      width: '105px',
      sortable: true,
    },
    {
      key: 'productName',
      title: 'Producto',
      sortable: true,
      minWidth: '160px',
    },
    {
      key: 'warehouseName',
      title: 'Ubicación',
      sortable: true,
      minWidth: '140px',
    },
    {
      key: 'quantity',
      title: 'Cantidad',
      align: 'right',
      width: '90px',
      sortable: true,
    },
    {
      key: 'cost',
      title: 'Costo',
      currency: 'CUP',
      align: 'right',
      width: '95px',
      sortable: true,
      visible: can('products.view_cost'),
    },
    {
      key: 'price',
      title: 'Precio',
      currency: 'CUP',
      align: 'right',
      width: '95px',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Estado',
      align: 'center',
      width: '85px',
      sortable: true,
    },
    {
      key: 'updatedAt',
      title: 'Actualizado',
      align: 'center',
      width: '110px',
      sortable: true,
      visible: isScreenWide.value,
    },
  ]
})

// Acciones del menú por fila
function getRowActions(_row: StockItem): DropdownMenuItemConfig[] {
  return [
    {
      id: 'view_detail',
      label: 'Ver detalle',
      icon: Eye,
    },
    {
      id: 'adjust',
      label: 'Ajustar stock',
      icon: SlidersHorizontal,
    },
    {
      id: 'transfer',
      label: 'Trasladar',
      icon: ArrowRightLeft,
    },
  ]
}

function handleRowAction({ actionId, row }: { actionId: string; row: StockItem }) {
  if (actionId === 'view_detail') {
    openProductDetail(row)
  } else if (actionId === 'adjust') {
    toast.info('Funcionalidad de ajuste de stock en desarrollo.')
  } else if (actionId === 'transfer') {
    toast.info('Funcionalidad de traslado en desarrollo.')
  }
}

function openProductDetail(row: StockItem) {
  selectedItem.value = row
  isDrawerOpen.value = true
}

function handleAdjustFromDrawer() {
  toast.info('Funcionalidad de ajuste de stock en desarrollo.')
}

function handleTransferFromDrawer() {
  toast.info('Funcionalidad de traslado en desarrollo.')
}

function getStatusBadgeVariant(s?: StockStatus): 'success' | 'warning' | 'danger' {
  if (s === 'low') return 'warning'
  if (s === 'out') return 'danger'
  return 'success'
}

function getStatusBadgeLabel(s?: StockStatus): string {
  if (s === 'low') return 'Bajo'
  if (s === 'out') return 'Agotado'
  return 'Normal'
}

function formatDateShort(isoString?: string): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  } catch {
    return isoString
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

// Handlers de filtros y paginación
function handleSearchUpdate(val: string) {
  search.value = val
  page.value = 1
  fetchStock()
}

async function handleWarehouseChange(val: string | number | null) {
  const code = (val as string) || ''
  warehouse.value = code
  location.value = ''
  page.value = 1
  if (code) {
    await fetchLocations(code)
  }
  await fetchStock()
}

function handleLocationChange(val: string | number | null) {
  location.value = (val as string) || ''
  page.value = 1
  fetchStock()
}

function handleCategoryChange(val: string | number | null) {
  category.value = (val as string) || ''
  page.value = 1
  fetchStock()
}

function handleStatusSelectChange(val: string | number | null) {
  status.value = (val as StockStatus) || ''
  page.value = 1
  fetchStock()
}

function handleClearFilters() {
  resetFilters()
}

function handlePageChange(newPage: number) {
  page.value = newPage
  fetchStock()
}

function handlePerPageChange(newPerPage: number) {
  perPage.value = newPerPage
  page.value = 1
  fetchStock()
}

function handleSortChange(newSort: string) {
  sort.value = newSort
  page.value = 1
  fetchStock()
}

function handleQueryChange(params: { page: number; perPage: number; sort: string }) {
  page.value = params.page
  perPage.value = params.perPage
  sort.value = params.sort
  fetchStock()
}

// Sincronización con Vue Router (URL query)
let router: ReturnType<typeof useRouter> | undefined
let route: ReturnType<typeof useRoute> | undefined
let isUpdatingUrl = false

try {
  router = useRouter()
  route = useRoute()
} catch {
  // Entornos de prueba sin inyección de router
}

function syncToUrl() {
  if (!router || !route || isUpdatingUrl) return
  const query: Record<string, string> = {}
  if (search.value.trim()) query.search = search.value.trim()
  if (warehouse.value) query.warehouse = warehouse.value
  if (location.value) query.location = location.value
  if (category.value) query.category = category.value
  if (status.value) query.status = status.value
  if (page.value > 1) query.page = String(page.value)
  if (perPage.value !== 10) query.perPage = String(perPage.value)
  if (sort.value && sort.value !== 'productName:asc') query.sort = sort.value

  const currentQuery = route.query || {}
  const isDifferent =
    Object.keys(query).length !== Object.keys(currentQuery).length ||
    Object.entries(query).some(([k, v]) => String(currentQuery[k] ?? '') !== String(v))

  if (isDifferent) {
    isUpdatingUrl = true
    router
      .replace({ query })
      .finally(() => {
        isUpdatingUrl = false
      })
      .catch(() => {
        isUpdatingUrl = false
      })
  }
}

watch([search, warehouse, location, category, status, page, perPage, sort], () => {
  if (!isUpdatingUrl) {
    syncToUrl()
  }
})

watch(
  () => route?.query,
  (q) => {
    if (!q || isUpdatingUrl) return
    const newSearch = (q.search as string) || ''
    const newWarehouse = (q.warehouse as string) || ''
    const newLocation = (q.location as string) || ''
    const newCategory = (q.category as string) || ''
    const newStatus = (q.status as StockStatus) || ''
    const newPage = q.page ? Number(q.page) : 1
    const newPerPage = q.perPage ? Number(q.perPage) : 10
    const newSort = (q.sort as string) || 'productName:asc'

    let changed = false
    if (search.value !== newSearch) {
      search.value = newSearch
      changed = true
    }
    if (warehouse.value !== newWarehouse) {
      warehouse.value = newWarehouse
      changed = true
    }
    if (location.value !== newLocation) {
      location.value = newLocation
      changed = true
    }
    if (category.value !== newCategory) {
      category.value = newCategory
      changed = true
    }
    if (status.value !== newStatus) {
      status.value = newStatus
      changed = true
    }
    if (page.value !== newPage) {
      page.value = newPage
      changed = true
    }
    if (perPage.value !== newPerPage) {
      perPage.value = newPerPage
      changed = true
    }
    if (sort.value !== newSort) {
      sort.value = newSort
      changed = true
    }

    if (changed) {
      fetchStock()
    }
  }
)

async function refreshAll() {
  await Promise.all([fetchStock(), fetchSummary(), fetchWarehouses()])
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
  if (route?.query) {
    if (route.query.search) search.value = String(route.query.search)
    if (route.query.warehouse) {
      warehouse.value = String(route.query.warehouse)
      await fetchLocations(warehouse.value)
    }
    if (route.query.location) location.value = String(route.query.location)
    if (route.query.category) category.value = String(route.query.category)
    if (route.query.status) status.value = String(route.query.status) as StockStatus
    if (route.query.page && !isNaN(Number(route.query.page))) page.value = Number(route.query.page)
    if (route.query.perPage && !isNaN(Number(route.query.perPage)))
      perPage.value = Number(route.query.perPage)
    if (route.query.sort) sort.value = String(route.query.sort)
  }
  await Promise.all([fetchWarehouses(), fetchStock(), fetchSummary()])
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>
