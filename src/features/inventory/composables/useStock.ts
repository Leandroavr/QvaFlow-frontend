import { ref, computed } from 'vue'
import { inventoryService } from '@/services'
import type { StockItem, StockSummary, StockStatus, StockQueryParams } from '../types'
import { ApiError } from '@/shared/types/api'

export function useStock() {
  const items = ref<StockItem[]>([])
  const total = ref<number>(0)
  const page = ref<number>(1)
  const perPage = ref<number>(10)
  const sort = ref<string>('productName:asc')

  // Filtros reactivos
  const search = ref<string>('')
  const warehouse = ref<string>('')
  const location = ref<string>('')
  const category = ref<string>('')
  const status = ref<StockStatus | ''>('')

  // Resumen global
  const summary = ref<StockSummary | null>(null)

  // Estados de carga y error
  const isLoading = ref<boolean>(false)
  const isLoadingSummary = ref<boolean>(false)
  const error = ref<string | null>(null)

  const hasActiveFilters = computed<boolean>(() => {
    return (
      Boolean(search.value.trim()) ||
      Boolean(warehouse.value) ||
      Boolean(location.value) ||
      Boolean(category.value) ||
      Boolean(status.value)
    )
  })

  async function fetchStock() {
    isLoading.value = true
    error.value = null
    try {
      const params: StockQueryParams = {
        page: page.value,
        perPage: perPage.value,
        sort: sort.value || undefined,
        search: search.value.trim() || undefined,
        warehouse: warehouse.value || undefined,
        location: location.value || undefined,
        category: category.value || undefined,
        status: (status.value as StockStatus) || undefined,
      }

      const response = await inventoryService.getStock(params)
      items.value = response.items
      total.value = response.total
      page.value = response.page
      perPage.value = response.perPage
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al cargar las existencias'
      items.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function fetchSummary() {
    isLoadingSummary.value = true
    try {
      summary.value = await inventoryService.getStockSummary()
    } catch {
      // Si falla el resumen, dejamos summary como null sin bloquear la tabla
      summary.value = null
    } finally {
      isLoadingSummary.value = false
    }
  }

  function resetFilters() {
    search.value = ''
    warehouse.value = ''
    location.value = ''
    category.value = ''
    status.value = ''
    page.value = 1
    return fetchStock()
  }

  function setStatusFilter(newStatus: StockStatus | '') {
    // Si ya tiene este estado seleccionado, alternar a deseleccionado
    if (status.value === newStatus) {
      status.value = ''
    } else {
      status.value = newStatus
    }
    page.value = 1
    return fetchStock()
  }

  return {
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
  }
}
