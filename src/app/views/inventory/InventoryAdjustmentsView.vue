<template>
  <div class="space-y-6">
    <!-- Encabezado de la página -->
    <PageHeader
      title="Ajustes de Inventario"
      description="Registro y auditoría de ajustes físicos de existencias, roturas y mermas."
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          density="compact"
          :icon="RefreshCw"
          :loading="isLoading"
          @click="refreshAdjustments"
        >
          Actualizar
        </BaseButton>

        <BaseButton
          v-if="can('inventory.adjust')"
          variant="primary"
          density="compact"
          :icon="Plus"
          @click="handleNewAdjustmentClick"
        >
          Nuevo ajuste
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Barra de Filtros -->
    <FilterBar
      :search="search"
      search-placeholder="Buscar por número o motivo..."
      :has-active-filters="hasActiveFilters"
      @update:search="handleSearchUpdate"
      @clear="handleClearFilters"
    >
      <template #filters>
        <!-- Filtro: Fecha Desde -->
        <div class="flex shrink-0 items-center gap-1.5">
          <label for="filter-adjustments-desde" class="text-xs font-medium text-content-muted"
            >Desde:</label
          >
          <div class="w-36">
            <BaseInput
              id="filter-adjustments-desde"
              type="date"
              :model-value="desde"
              density="compact"
              aria-label="Fecha desde"
              @update:model-value="handleDesdeUpdate"
            />
          </div>
        </div>

        <!-- Filtro: Fecha Hasta -->
        <div class="flex shrink-0 items-center gap-1.5">
          <label for="filter-adjustments-hasta" class="text-xs font-medium text-content-muted"
            >Hasta:</label
          >
          <div class="w-36">
            <BaseInput
              id="filter-adjustments-hasta"
              type="date"
              :model-value="hasta"
              density="compact"
              aria-label="Fecha hasta"
              @update:model-value="handleHastaUpdate"
            />
          </div>
        </div>

        <!-- Filtro: Estado -->
        <div class="w-38 shrink-0">
          <BaseSelect
            :model-value="status"
            :options="statusOptions"
            inline-prefix="Estado"
            include-all-option
            all-option-label="Todos"
            all-option-value=""
            placeholder="Estado"
            aria-label="Filtrar por estado"
            @update:model-value="handleStatusUpdate"
          />
        </div>
      </template>
    </FilterBar>

    <!-- Tabla de Ajustes en modo servidor -->
    <DataTable
      mode="server"
      :data="adjustments"
      :columns="columns"
      :total="total"
      :page="page"
      :per-page="perPage"
      :sort="sort"
      :loading="isLoading"
      :error="error"
      empty-title="No se encontraron ajustes"
      empty-description="No hay documentos de ajuste que coincidan con los filtros seleccionados."
      row-key="id"
      :fixed-layout="true"
      @update:page="handlePageChange"
      @update:per-page="handlePerPageChange"
      @update:sort="handleSortChange"
      @query-change="handleQueryChange"
      @row-click="openAdjustmentDetail"
      @retry="loadData"
    >
      <!-- Celda personalizada: Número de documento -->
      <template #cell-noDocument="{ value }">
        <span class="font-mono text-xs font-semibold text-primary">
          {{ value }}
        </span>
      </template>

      <!-- Celda personalizada: Fecha -->
      <template #cell-date="{ value }">
        <span class="whitespace-nowrap font-mono text-xs text-content-secondary">
          {{ formatDateTime(value) }}
        </span>
      </template>

      <!-- Celda personalizada: Motivo (truncate) -->
      <template #cell-reason="{ value }">
        <div class="truncate text-content-primary" :title="value">
          {{ value || '—' }}
        </div>
      </template>

      <!-- Celda personalizada: Cantidad de líneas -->
      <template #cell-itemsCount="{ row }">
        <span class="font-medium text-content-secondary">
          {{ row.items?.length ?? 0 }}
        </span>
      </template>

      <!-- Celda personalizada: Estado con BaseBadge -->
      <template #cell-status="{ value }">
        <div class="flex items-center justify-center">
          <BaseBadge :variant="getStatusBadgeVariant(value)" :dot="true" size="sm">
            {{ getStatusBadgeLabel(value) }}
          </BaseBadge>
        </div>
      </template>

      <!-- Celda personalizada: Creado por -->
      <template #cell-createdBy="{ value }">
        <span class="truncate text-xs text-content-muted" :title="value">
          {{ value || '—' }}
        </span>
      </template>

      <!-- Celda personalizada: Acción Ver -->
      <template #cell-actions="{ row }">
        <BaseButton
          variant="ghost"
          density="compact"
          class="p-1 text-xs font-semibold text-primary hover:underline"
          title="Ver detalle del ajuste"
          data-testid="btn-view-adjustment"
          @click.stop="openAdjustmentDetail(row)"
        >
          Ver
        </BaseButton>
      </template>
    </DataTable>

    <!-- Drawer de Detalle del Ajuste -->
    <BaseDrawer
      :open="isDrawerOpen"
      title="Detalle de Ajuste"
      :description="selectedAdjustment ? `Documento ${selectedAdjustment.noDocument}` : ''"
      size="lg"
      @update:open="isDrawerOpen = $event"
    >
      <div v-if="selectedAdjustment" class="space-y-6">
        <!-- Tarjeta de Cabecera del Documento -->
        <div class="space-y-3 rounded-xl border border-border-subtle bg-surface-sunken p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="inline-flex items-center gap-1 font-mono text-xs text-content-muted">
                <FileText class="h-3.5 w-3.5" aria-hidden="true" />
                {{ selectedAdjustment.noDocument }}
              </span>
              <h3 class="mt-1 text-base font-bold text-content-primary">
                {{ selectedAdjustment.reason || 'Sin motivo especificado' }}
              </h3>
            </div>
            <BaseBadge
              :variant="getStatusBadgeVariant(selectedAdjustment.status)"
              :dot="true"
              size="md"
            >
              {{ getStatusBadgeLabel(selectedAdjustment.status) }}
            </BaseBadge>
          </div>

          <div
            class="grid grid-cols-1 gap-2 border-t border-border-subtle pt-2 text-xs sm:grid-cols-2"
          >
            <div>
              <span class="text-content-muted">Fecha y hora:</span>
              <span class="ml-1 font-mono font-medium text-content-primary">
                {{ formatDateTime(selectedAdjustment.date) }}
              </span>
            </div>
            <div>
              <span class="text-content-muted">Creado por:</span>
              <span class="ml-1 font-medium text-content-primary">
                {{ selectedAdjustment.createdBy || 'Sistema' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabla de Items del Ajuste -->
        <div>
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-content-muted">
            Líneas de Ajuste Físico ({{ selectedAdjustment.items.length }})
          </h4>

          <div class="overflow-hidden rounded-lg border border-border-subtle">
            <table class="w-full text-left text-xs">
              <thead
                class="border-b border-border-subtle bg-surface-sunken font-semibold text-content-secondary"
              >
                <tr>
                  <th scope="col" class="px-3 py-2.5">Producto</th>
                  <th scope="col" class="px-3 py-2.5">Localización</th>
                  <th scope="col" class="px-3 py-2.5 text-right">Sistema</th>
                  <th scope="col" class="px-3 py-2.5 text-right">Contado</th>
                  <th scope="col" class="px-3 py-2.5 text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-subtle bg-surface-card">
                <tr
                  v-for="(line, idx) in selectedAdjustment.items"
                  :key="line.id ?? idx"
                  class="hover:bg-surface-sunken/50 transition-colors"
                >
                  <td class="px-3 py-2.5">
                    <div class="font-medium text-content-primary">{{ line.productName }}</div>
                    <div class="font-mono text-[11px] text-content-muted">
                      {{ line.productCode }}
                    </div>
                  </td>
                  <td class="px-3 py-2.5 text-content-secondary">
                    <div>
                      {{ line.locationCode }}
                      <span v-if="line.locationName">({{ line.locationName }})</span>
                    </div>
                    <div class="text-[11px] text-content-muted">{{ line.warehouseName }}</div>
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono text-content-muted">
                    {{ line.systemQuantity }}
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono font-medium text-content-primary">
                    {{ line.countedQuantity }}
                  </td>
                  <td class="px-3 py-2.5 text-right font-mono">
                    <span :class="formatDifference(line.difference).colorClass">
                      {{ formatDifference(line.difference).text }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, RefreshCw, FileText } from 'lucide-vue-next'

import PageHeader from '@/shared/ui/PageHeader.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { SelectOption } from '@/shared/ui/BaseSelect.vue'
import BaseDrawer from '@/shared/ui/BaseDrawer.vue'
import { DataTable, FilterBar } from '@/shared/ui/DataTable'
import type { DataTableColumn } from '@/shared/ui/DataTable'

import { useAdjustments } from '@/features/inventory/composables/useAdjustments'
import { useDataTableQuery } from '@/shared/composables/useDataTableQuery'
import { usePermissions } from '@/shared/composables/usePermissions'
import type { InventoryAdjustment, DocumentStatus } from '@/features/inventory/types'

const router = useRouter()
const { can } = usePermissions()

const {
  adjustments,
  total,
  selectedAdjustment,
  isLoading,
  error,
  hasActiveFilters,
  fetchAdjustments,
  fetchAdjustmentById,
  selectAdjustment,
  resetFilters: resetComposableFilters,
} = useAdjustments()

// Sincronización completa con URL
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
  resetFilters: resetUrlQuery,
} = useDataTableQuery<{
  desde: string
  hasta: string
  status: DocumentStatus | ''
}>({
  initialSort: 'date:desc',
  initialFilters: {
    desde: '',
    hasta: '',
    status: '',
  },
  syncUrl: true,
})

const desde = computed(() => filters.value.desde)
const hasta = computed(() => filters.value.hasta)
const status = computed(() => filters.value.status)

// Drawer de detalle
const isDrawerOpen = ref(false)

// Opciones de estado
const statusOptions: SelectOption[] = [
  { label: 'Confirmado', value: 'CONFIRMED' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Cancelado', value: 'CANCELLED' },
]

// Definición de columnas con anchos estables y table-layout fijo
const columns: DataTableColumn<InventoryAdjustment>[] = [
  {
    key: 'noDocument',
    title: 'Número',
    width: '135px',
    sortable: true,
  },
  {
    key: 'date',
    title: 'Fecha',
    width: '150px',
    sortable: true,
  },
  {
    key: 'reason',
    title: 'Motivo',
    sortable: true,
  },
  {
    key: 'itemsCount',
    title: 'Líneas',
    width: '75px',
    align: 'center',
    sortable: false,
  },
  {
    key: 'status',
    title: 'Estado',
    width: '115px',
    align: 'center',
    sortable: true,
  },
  {
    key: 'createdBy',
    title: 'Creado por',
    width: '120px',
    sortable: true,
  },
  {
    key: 'actions',
    title: '',
    width: '60px',
    align: 'center',
    sortable: false,
  },
]

function getStatusBadgeVariant(s?: DocumentStatus): 'success' | 'neutral' | 'danger' {
  if (s === 'DRAFT') return 'neutral'
  if (s === 'CANCELLED') return 'danger'
  return 'success'
}

function getStatusBadgeLabel(s?: DocumentStatus): string {
  if (s === 'DRAFT') return 'Borrador'
  if (s === 'CANCELLED') return 'Cancelado'
  return 'Confirmado'
}

function formatDateTime(isoString?: string): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return isoString
  }
}

/**
 * Formatea la diferencia física vs sistema:
 * - Positiva: signo explícito '+' y color state-success.
 * - Negativa: signo explícito '-' y color state-error.
 * - Cero: '0.00' sin signo y color neutro.
 */
function formatDifference(diffStr: string): { text: string; colorClass: string } {
  const num = parseFloat(diffStr)
  if (isNaN(num) || num === 0) {
    return { text: '0.00', colorClass: 'text-content-secondary' }
  }
  if (num > 0) {
    const formatted = diffStr.startsWith('+') ? diffStr : `+${diffStr}`
    return { text: formatted, colorClass: 'text-state-success font-semibold' }
  }
  return { text: diffStr, colorClass: 'text-state-error font-semibold' }
}

async function loadData() {
  await fetchAdjustments({
    page: page.value,
    perPage: perPage.value,
    sort: sort.value,
    search: search.value,
    desde: desde.value,
    hasta: hasta.value,
    status: status.value,
  })
}

function refreshAdjustments() {
  return loadData()
}

function handleNewAdjustmentClick() {
  router.push('/inventory/adjustments/new')
}

function handleSearchUpdate(val: string) {
  setSearch(val)
  setPage(1)
  loadData()
}

function handleDesdeUpdate(val: string | number) {
  setFilter('desde', String(val || ''))
  setPage(1)
  loadData()
}

function handleHastaUpdate(val: string | number) {
  setFilter('hasta', String(val || ''))
  setPage(1)
  loadData()
}

function handleStatusUpdate(val: string | number | null) {
  setFilter('status', (val as DocumentStatus) || '')
  setPage(1)
  loadData()
}

function handleClearFilters() {
  resetComposableFilters()
  resetUrlQuery()
  loadData()
}

function handlePageChange(newPage: number) {
  setPage(newPage)
  loadData()
}

function handlePerPageChange(newPerPage: number) {
  setPerPage(newPerPage)
  setPage(1)
  loadData()
}

function handleSortChange(newSort: string) {
  setSort(newSort)
  loadData()
}

function handleQueryChange(params: { page: number; perPage: number; sort: string }) {
  setPage(params.page)
  setPerPage(params.perPage)
  setSort(params.sort)
  loadData()
}

async function openAdjustmentDetail(row: InventoryAdjustment) {
  try {
    selectAdjustment(row)
    isDrawerOpen.value = true
    // Obtener detalle enriquecido por id
    await fetchAdjustmentById(row.id)
  } catch {
    // Si falla el detalle por API, conservamos la fila seleccionada
  }
}

onMounted(() => {
  loadData()
})
</script>
