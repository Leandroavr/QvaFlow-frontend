<template>
  <div
    ref="tableContainerRef"
    class="relative flex w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-sm outline-none"
    tabindex="0"
    role="region"
    aria-label="Tabla de datos"
    @keydown="handleKeyDown"
  >
    <!-- Barra de acciones en lote si hay selección activa -->
    <div
      v-if="selectable && selectedRowKeys.length > 0"
      class="border-primary/20 flex flex-wrap items-center justify-between gap-3 border-b bg-primary-subtle px-4 py-2 text-xs"
    >
      <div class="flex items-center gap-2 font-medium text-primary">
        <span
          >{{ selectedRowKeys.length }} fila{{
            selectedRowKeys.length > 1 ? 's' : ''
          }}
          seleccionada{{ selectedRowKeys.length > 1 ? 's' : '' }}</span
        >
      </div>

      <div class="flex items-center gap-2">
        <slot
          name="batch-actions"
          :selected-rows="selectedRows"
          :selected-keys="selectedRowKeys"
          :clear-selection="clearSelection"
        />

        <BaseButton variant="ghost" density="compact" class="text-xs" @click="clearSelection">
          Deseleccionar
        </BaseButton>
      </div>
    </div>

    <!-- Contenedor con scroll de la tabla -->
    <div class="flex-1 overflow-x-auto overflow-y-auto" :style="{ maxHeight: scrollHeight }">
      <table class="w-full border-collapse text-left text-xs text-content-primary">
        <!-- Cabecera fija (Sticky) con tokens de superficie hundida -->
        <thead class="sticky top-0 z-10 border-b border-border-subtle bg-surface-sunken">
          <tr class="h-10">
            <!-- Columna de selección múltiple (checkbox) -->
            <th v-if="selectable" scope="col" class="w-10 px-3 py-2 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                :disabled="loading || displayedRows.length === 0"
                class="border-border-default h-4 w-4 rounded text-primary accent-primary focus:ring-primary focus-visible:outline-none"
                aria-label="Seleccionar todas las filas"
                @change="toggleSelectAll"
              />
            </th>

            <!-- Columnas de datos -->
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              scope="col"
              :style="{ width: col.width, minWidth: col.minWidth }"
              :class="[
                'group select-none whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-secondary',
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                    ? 'text-center'
                    : 'text-left',
                col.sortable &&
                  !loading &&
                  'hover:bg-surface-card/60 cursor-pointer transition-colors',
                col.headerClass,
              ]"
              @click="col.sortable && handleSort(col.key)"
            >
              <div
                :class="[
                  'inline-flex items-center gap-1.5 whitespace-nowrap',
                  col.align === 'right'
                    ? 'justify-end'
                    : col.align === 'center'
                      ? 'justify-center'
                      : 'justify-start',
                ]"
              >
                <span>{{ col.title }}</span>
                <span v-if="col.currency" class="font-normal normal-case text-content-muted">
                  ({{ col.currency }})
                </span>

                <!-- Indicador de ordenación: solo en columnas ordenables, atenuado hasta hover u ordenación activa -->
                <span v-if="col.sortable" class="inline-flex shrink-0">
                  <ArrowUp
                    v-if="activeSortKey === col.key && activeSortDirection === 'asc'"
                    class="h-3.5 w-3.5 text-primary"
                    aria-hidden="true"
                  />
                  <ArrowDown
                    v-else-if="activeSortKey === col.key && activeSortDirection === 'desc'"
                    class="h-3.5 w-3.5 text-primary"
                    aria-hidden="true"
                  />
                  <ArrowUpDown
                    v-else
                    class="h-3 w-3 text-content-muted opacity-25 transition-opacity group-hover:opacity-80"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </th>

            <!-- Columna de acciones por fila (Sticky a la derecha) -->
            <th
              v-if="hasActions"
              scope="col"
              class="sticky right-0 z-20 w-12 border-l border-border-subtle bg-surface-sunken px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-content-secondary shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]"
            >
              <span class="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>

        <!-- Cuerpo de la tabla (filas de ~40px de altura) -->
        <tbody class="divide-y divide-border-subtle bg-surface-card">
          <!-- Estado 1: Loading (Filas esqueleto) -->
          <template v-if="loading">
            <tr v-for="idx in skeletonRowCount" :key="`skeleton-${idx}`" class="h-10 animate-pulse">
              <td v-if="selectable" class="px-3 py-2 text-center">
                <BaseSkeleton class="mx-auto h-4 w-4 rounded" />
              </td>

              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-3 py-2"
                :class="
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                "
              >
                <BaseSkeleton
                  :class="
                    col.align === 'right'
                      ? 'ml-auto h-3.5 w-16 rounded'
                      : col.align === 'center'
                        ? 'mx-auto h-3.5 w-20 rounded'
                        : 'h-3.5 w-24 rounded'
                  "
                />
              </td>

              <td
                v-if="hasActions"
                class="sticky right-0 z-10 w-12 border-l border-border-subtle bg-surface-card px-2 py-2 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]"
              >
                <BaseSkeleton class="mx-auto h-6 w-6 rounded-md" />
              </td>
            </tr>
          </template>

          <!-- Estado 2: Error (Mensaje con botón reintentar) -->
          <tr v-else-if="error">
            <td :colspan="totalColspan" class="p-8 text-center">
              <div class="flex flex-col items-center justify-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-state-error-bg text-state-error"
                >
                  <AlertCircle class="h-5 w-5" aria-hidden="true" />
                </div>
                <div class="max-w-md">
                  <p class="text-xs font-semibold text-content-primary">Error al cargar datos</p>
                  <p class="mt-1 text-xs text-state-error">
                    {{
                      typeof error === 'string'
                        ? error
                        : error.message || 'Ocurrió un error inesperado al obtener los registros.'
                    }}
                  </p>
                </div>
                <BaseButton
                  variant="secondary"
                  density="compact"
                  :icon="RotateCw"
                  class="mt-1"
                  @click="emit('retry')"
                >
                  Reintentar
                </BaseButton>
              </div>
            </td>
          </tr>

          <!-- Estado 3: Vacío (EmptyState accesible) -->
          <tr v-else-if="displayedRows.length === 0">
            <td :colspan="totalColspan" class="p-8">
              <EmptyState
                :title="emptyTitle"
                :description="emptyDescription"
                :icon="emptyIcon || FolderSearch"
              >
                <template v-if="$slots['empty-actions']" #actions>
                  <slot name="empty-actions" />
                </template>
              </EmptyState>
            </td>
          </tr>

          <!-- Estado 4: Filas de datos reales -->
          <template v-else>
            <tr
              v-for="(row, rIdx) in displayedRows"
              :key="getRowIdentifier(row, rIdx)"
              :class="[
                'group h-10 transition-colors',
                isRowSelected(row, rIdx) ? 'bg-primary-subtle/40' : 'hover:bg-surface-sunken/40',
                isRowActive(row, rIdx) &&
                  'shadow-xs border-l-4 !border-l-primary !bg-surface-sunken font-medium',
                activeKeyboardRowIndex === rIdx &&
                  'ring-primary/60 bg-surface-sunken/60 ring-1 ring-inset',
              ]"
              :aria-selected="isRowActive(row, rIdx) || isRowSelected(row, rIdx) || undefined"
              @click="handleRowClick(row, rIdx)"
            >
              <!-- Checkbox de selección -->
              <td v-if="selectable" class="w-10 px-3 py-2 text-center" @click.stop>
                <input
                  type="checkbox"
                  :checked="isRowSelected(row, rIdx)"
                  class="border-border-default h-4 w-4 rounded text-primary accent-primary focus:ring-primary focus-visible:outline-none"
                  :aria-label="`Seleccionar fila ${rIdx + 1}`"
                  @change="toggleRowSelection(row, rIdx)"
                />
              </td>

              <!-- Celdas de datos -->
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                :class="[
                  'px-3 py-2 text-content-primary',
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left',
                  col.cellClass,
                ]"
              >
                <!-- Slot personalizado por celda `#cell-{key}` -->
                <slot
                  :name="`cell-${col.key}`"
                  :row="row"
                  :value="getCellValue(row, col)"
                  :column="col"
                  :index="rIdx"
                >
                  <!-- Formateo monetario automático si la columna define divisa -->
                  <MoneyCell
                    v-if="col.currency"
                    :value="getCellValue(row, col)"
                    :currency="col.currency as any"
                  />
                  <!-- Render estándar de texto -->
                  <span v-else class="block truncate">
                    {{ getCellValue(row, col) ?? '—' }}
                  </span>
                </slot>
              </td>

              <!-- Menú de acciones por fila (Sticky a la derecha) -->
              <td
                v-if="hasActions"
                :class="[
                  'sticky right-0 z-10 w-12 border-l border-border-subtle px-2 py-2 text-center shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors',
                  isRowSelected(row, rIdx)
                    ? 'bg-primary-subtle'
                    : 'bg-surface-card group-hover:bg-surface-sunken',
                ]"
                @click.stop
              >
                <slot name="actions" :row="row" :index="rIdx">
                  <BaseDropdownMenu
                    v-if="actions"
                    :items="actions(row)"
                    align="end"
                    @select="(id) => emit('row-action', { actionId: id, row })"
                  >
                    <template #trigger>
                      <button
                        type="button"
                        class="hover:border-border-default flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-content-muted transition-colors hover:bg-surface-sunken hover:text-content-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Acciones de fila"
                      >
                        <MoreHorizontal class="h-4 w-4" aria-hidden="true" />
                      </button>
                    </template>
                  </BaseDropdownMenu>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Paginación inferior -->
    <DataTablePagination
      v-if="showPagination"
      :page="currentPage"
      :per-page="currentPerPage"
      :total="totalRowsCount"
      :disabled="loading"
      @update:page="handlePageChange"
      @update:per-page="handlePerPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Component } from 'vue'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  AlertCircle,
  RotateCw,
  FolderSearch,
} from 'lucide-vue-next'
import {
  useTable,
  stockFeatures,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
} from '@tanstack/vue-table'

import BaseButton from '../BaseButton.vue'
import BaseSkeleton from '../BaseSkeleton.vue'
import BaseDropdownMenu, { type DropdownMenuItemConfig } from '../BaseDropdownMenu.vue'
import EmptyState from '../EmptyState.vue'
import MoneyCell from './MoneyCell.vue'
import DataTablePagination from './DataTablePagination.vue'
import type { DataTableColumn, DataTableMode, SortDirection, ServerDataResponse } from './types'

interface Props<T = any> {
  mode?: DataTableMode
  data: T[] | ServerDataResponse<T>
  columns: DataTableColumn<T>[]
  total?: number
  page?: number
  perPage?: number
  sort?: string
  loading?: boolean
  error?: string | Error | null
  selectable?: boolean
  selectedKeys?: (string | number)[]
  rowKey?: string | ((row: T) => string | number)
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: Component
  actions?: (row: T) => DropdownMenuItemConfig[]
  primaryAction?: (row: T) => void
  scrollHeight?: string
  skeletonRowCount?: number
  showPagination?: boolean
  selectedId?: string | number | null
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'client',
  total: 0,
  page: 1,
  perPage: 10,
  sort: '',
  loading: false,
  error: null,
  selectable: false,
  selectedKeys: () => [],
  rowKey: 'id',
  emptyTitle: 'No se encontraron datos',
  emptyDescription: 'No hay registros disponibles con los criterios actuales.',
  emptyIcon: undefined,
  actions: undefined,
  primaryAction: undefined,
  scrollHeight: 'calc(100vh - 280px)',
  skeletonRowCount: 5,
  showPagination: true,
  selectedId: null,
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:perPage', perPage: number): void
  (e: 'update:sort', sort: string): void
  (e: 'update:selectedKeys', keys: (string | number)[]): void
  (e: 'query-change', params: { page: number; perPage: number; sort: string }): void
  (e: 'row-click', row: any): void
  (e: 'row-action', payload: { actionId: string; row: any }): void
  (e: 'primary-action', row: any): void
  (e: 'retry'): void
}>()

// Contenedor principal de la tabla para navegación por teclado
const tableContainerRef = ref<HTMLElement | null>(null)
const activeKeyboardRowIndex = ref<number>(-1)

// Columnas visibles filtradas
const visibleColumns = computed(() => {
  return props.columns.filter((c) => c.visible !== false)
})

const hasActions = computed(() => {
  return !!props.actions
})

const totalColspan = computed(() => {
  let count = visibleColumns.value.length
  if (props.selectable) count += 1
  if (hasActions.value) count += 1
  return count
})

// Normalización de datos para modo cliente o servidor
const rawDataArray = computed(() => {
  if (Array.isArray(props.data)) {
    return props.data
  }
  if (props.data && Array.isArray((props.data as ServerDataResponse).items)) {
    return (props.data as ServerDataResponse).items
  }
  return []
})

// Identificador único de fila
const getRowIdentifier = (row: any, fallbackIndex: number): string | number => {
  if (!row) return fallbackIndex
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  if (typeof props.rowKey === 'string' && row[props.rowKey] !== undefined) {
    return row[props.rowKey]
  }
  return row.id !== undefined ? row.id : fallbackIndex
}

// Valor de una celda
const getCellValue = (row: any, col: DataTableColumn) => {
  if (col.cell) {
    return col.cell(row)
  }
  return row ? row[col.key] : undefined
}

// Control interno de paginación
const currentPage = ref(props.page)
const currentPerPage = ref(props.perPage)

watch(
  () => props.page,
  (val) => {
    if (val && val !== currentPage.value) {
      currentPage.value = val
    }
  }
)

watch(
  () => props.perPage,
  (val) => {
    if (val && val !== currentPerPage.value) {
      currentPerPage.value = val
    }
  }
)

// Control de ordenación activa
const activeSortKey = ref<string>('')
const activeSortDirection = ref<SortDirection | ''>('')

// Parsear formato "campo:asc|desc"
const parseSortProp = (sortString?: string) => {
  if (!sortString) {
    activeSortKey.value = ''
    activeSortDirection.value = ''
    return
  }
  const [field, dir] = sortString.split(':')
  activeSortKey.value = field || ''
  activeSortDirection.value = (dir === 'desc' ? 'desc' : 'asc') as SortDirection
}

watch(
  () => props.sort,
  (newSort) => {
    parseSortProp(newSort)
  },
  { immediate: true }
)

// Columnas para TanStack Table
const tanstackColumns = computed(() => {
  return visibleColumns.value.map((col) => ({
    id: col.key,
    accessorKey: col.key,
    header: col.title,
    enableSorting: !!col.sortable,
  }))
})

// Configuración de TanStack Table v9
const isServerMode = computed(() => props.mode === 'server')

const tanstackPaginationState = computed(() => ({
  pageIndex: Math.max(0, currentPage.value - 1),
  pageSize: currentPerPage.value,
}))

const tanstackSortingState = computed(() => {
  if (!activeSortKey.value || !activeSortDirection.value) return []
  return [{ id: activeSortKey.value, desc: activeSortDirection.value === 'desc' }]
})

// Total de registros
const totalRowsCount = computed(() => {
  if (isServerMode.value) {
    if (props.data && typeof (props.data as ServerDataResponse).total === 'number') {
      return (props.data as ServerDataResponse).total
    }
    return props.total
  }
  return rawDataArray.value.length
})

const table = useTable({
  features: {
    ...stockFeatures,
    sortedRowModel: createSortedRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    filteredRowModel: createFilteredRowModel(),
  },
  data: rawDataArray,
  columns: tanstackColumns.value,
  state: {
    get pagination() {
      return tanstackPaginationState.value
    },
    get sorting() {
      return tanstackSortingState.value
    },
  },
  manualPagination: isServerMode.value,
  manualSorting: isServerMode.value,
  rowCount: computed(() => totalRowsCount.value),
})

// Filas visibles a renderizar
const displayedRows = computed(() => {
  if (isServerMode.value) {
    // En modo servidor, los datos recibidos ya corresponden a la página actual
    return rawDataArray.value
  }
  // En modo cliente, TanStack aplica ordenación y paginación
  return table.getRowModel().rows.map((r) => r.original)
})

// Manejo de ordenación
const handleSort = (columnKey: string) => {
  let nextDirection: SortDirection | '' = 'asc'

  if (activeSortKey.value === columnKey) {
    if (activeSortDirection.value === 'asc') {
      nextDirection = 'desc'
    } else if (activeSortDirection.value === 'desc') {
      nextDirection = '' // limpiar ordenación
    }
  }

  activeSortKey.value = nextDirection ? columnKey : ''
  activeSortDirection.value = nextDirection

  const sortFormatted = nextDirection ? `${columnKey}:${nextDirection}` : ''
  emit('update:sort', sortFormatted)

  if (isServerMode.value) {
    emit('query-change', {
      page: currentPage.value,
      perPage: currentPerPage.value,
      sort: sortFormatted,
    })
  }
}

// Manejo de paginación
const handlePageChange = (newPage: number) => {
  currentPage.value = newPage
  activeKeyboardRowIndex.value = -1
  emit('update:page', newPage)

  if (isServerMode.value) {
    const sortFormatted =
      activeSortKey.value && activeSortDirection.value
        ? `${activeSortKey.value}:${activeSortDirection.value}`
        : ''
    emit('query-change', {
      page: newPage,
      perPage: currentPerPage.value,
      sort: sortFormatted,
    })
  }
}

const handlePerPageChange = (newPerPage: number) => {
  currentPerPage.value = newPerPage
  currentPage.value = 1
  activeKeyboardRowIndex.value = -1
  emit('update:perPage', newPerPage)
  emit('update:page', 1)

  if (isServerMode.value) {
    const sortFormatted =
      activeSortKey.value && activeSortDirection.value
        ? `${activeSortKey.value}:${activeSortDirection.value}`
        : ''
    emit('query-change', {
      page: 1,
      perPage: newPerPage,
      sort: sortFormatted,
    })
  }
}

// Selección de filas
const selectedRowKeys = ref<(string | number)[]>([...props.selectedKeys])

watch(
  () => props.selectedKeys,
  (newKeys) => {
    selectedRowKeys.value = [...newKeys]
  }
)

const selectedRows = computed(() => {
  return rawDataArray.value.filter((row, idx) => {
    const key = getRowIdentifier(row, idx)
    return selectedRowKeys.value.includes(key)
  })
})

const isRowSelected = (row: any, idx: number) => {
  const key = getRowIdentifier(row, idx)
  return selectedRowKeys.value.includes(key)
}

const isRowActive = (row: any, idx: number) => {
  if (props.selectedId === null || props.selectedId === undefined || props.selectedId === '') {
    return false
  }
  const key = getRowIdentifier(row, idx)
  return String(key) === String(props.selectedId)
}

const toggleRowSelection = (row: any, idx: number) => {
  const key = getRowIdentifier(row, idx)
  const index = selectedRowKeys.value.indexOf(key)
  if (index > -1) {
    selectedRowKeys.value.splice(index, 1)
  } else {
    selectedRowKeys.value.push(key)
  }
  emit('update:selectedKeys', [...selectedRowKeys.value])
}

const isAllSelected = computed(() => {
  if (displayedRows.value.length === 0) return false
  return displayedRows.value.every((row, idx) => isRowSelected(row, idx))
})

const isIndeterminate = computed(() => {
  if (displayedRows.value.length === 0) return false
  const someSelected = displayedRows.value.some((row, idx) => isRowSelected(row, idx))
  return someSelected && !isAllSelected.value
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deseleccionar todas las de la página actual
    const currentKeys = displayedRows.value.map((r, idx) => getRowIdentifier(r, idx))
    selectedRowKeys.value = selectedRowKeys.value.filter((k) => !currentKeys.includes(k))
  } else {
    // Añadir todas las de la página actual
    displayedRows.value.forEach((r, idx) => {
      const key = getRowIdentifier(r, idx)
      if (!selectedRowKeys.value.includes(key)) {
        selectedRowKeys.value.push(key)
      }
    })
  }
  emit('update:selectedKeys', [...selectedRowKeys.value])
}

const clearSelection = () => {
  selectedRowKeys.value = []
  emit('update:selectedKeys', [])
}

// Clic en fila
const handleRowClick = (row: any, idx: number) => {
  activeKeyboardRowIndex.value = idx
  emit('row-click', row)
}

// Navegación accesible por teclado (Flechas Arriba/Abajo, Enter)
// NOTA IMPORTANTE: NO roba el foco al montarse (para no alterar pistolas de código de barras)
const handleKeyDown = (event: KeyboardEvent) => {
  if (displayedRows.value.length === 0) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (activeKeyboardRowIndex.value < displayedRows.value.length - 1) {
      activeKeyboardRowIndex.value += 1
    } else {
      activeKeyboardRowIndex.value = 0
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (activeKeyboardRowIndex.value > 0) {
      activeKeyboardRowIndex.value -= 1
    } else {
      activeKeyboardRowIndex.value = displayedRows.value.length - 1
    }
  } else if (event.key === 'Enter') {
    if (
      activeKeyboardRowIndex.value >= 0 &&
      activeKeyboardRowIndex.value < displayedRows.value.length
    ) {
      event.preventDefault()
      const row = displayedRows.value[activeKeyboardRowIndex.value]
      if (props.primaryAction) {
        props.primaryAction(row)
      }
      emit('primary-action', row)
    }
  } else if (event.key === ' ' && props.selectable) {
    if (
      activeKeyboardRowIndex.value >= 0 &&
      activeKeyboardRowIndex.value < displayedRows.value.length
    ) {
      event.preventDefault()
      const row = displayedRows.value[activeKeyboardRowIndex.value]
      toggleRowSelection(row, activeKeyboardRowIndex.value)
    }
  }
}

defineExpose({
  focus: () => tableContainerRef.value?.focus(),
  table,
})
</script>
