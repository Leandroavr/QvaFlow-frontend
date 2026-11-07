import { ref, computed } from 'vue'
import { inventoryService } from '@/services'
import type { InventoryAdjustment, InventoryAdjustmentQueryParams, DocumentStatus } from '../types'
import type { Id } from '@/shared/types/api'
import { ApiError } from '@/shared/types/api'

export function useAdjustments() {
  const adjustments = ref<InventoryAdjustment[]>([])
  const total = ref<number>(0)
  const page = ref<number>(1)
  const perPage = ref<number>(10)
  const sort = ref<string>('date:desc')

  // Filtros reactivos
  const search = ref<string>('')
  const desde = ref<string>('')
  const hasta = ref<string>('')
  const status = ref<DocumentStatus | ''>('')

  // Detalle seleccionado
  const selectedAdjustment = ref<InventoryAdjustment | null>(null)
  const isLoadingDetail = ref<boolean>(false)

  // Estados de carga y error
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const hasActiveFilters = computed<boolean>(() => {
    return (
      Boolean(search.value.trim()) ||
      Boolean(desde.value) ||
      Boolean(hasta.value) ||
      Boolean(status.value)
    )
  })

  async function fetchAdjustments(customParams?: InventoryAdjustmentQueryParams) {
    isLoading.value = true
    error.value = null
    try {
      const params: InventoryAdjustmentQueryParams = {
        page: customParams?.page ?? page.value,
        perPage: customParams?.perPage ?? perPage.value,
        sort: customParams?.sort ?? sort.value ?? undefined,
        search:
          (customParams?.search !== undefined ? customParams.search : search.value.trim()) ||
          undefined,
        desde: (customParams?.desde ?? desde.value) || undefined,
        hasta: (customParams?.hasta ?? hasta.value) || undefined,
        status: (customParams?.status ?? status.value) || undefined,
      }

      const response = await inventoryService.listAdjustments(params)
      adjustments.value = response.items
      total.value = response.total
      page.value = response.page
      perPage.value = response.perPage
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : 'Error al cargar los ajustes de inventario'
      adjustments.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAdjustmentById(id: Id): Promise<InventoryAdjustment> {
    isLoadingDetail.value = true
    error.value = null
    try {
      const adjustment = await inventoryService.getAdjustment(id)
      selectedAdjustment.value = adjustment
      return adjustment
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al obtener el detalle del ajuste'
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }

  function selectAdjustment(adjustment: InventoryAdjustment | null) {
    selectedAdjustment.value = adjustment
  }

  function resetFilters() {
    search.value = ''
    desde.value = ''
    hasta.value = ''
    status.value = ''
    page.value = 1
    return fetchAdjustments()
  }

  return {
    adjustments,
    total,
    page,
    perPage,
    sort,
    search,
    desde,
    hasta,
    status,
    selectedAdjustment,
    isLoading,
    isLoadingDetail,
    error,
    hasActiveFilters,
    fetchAdjustments,
    fetchAdjustmentById,
    selectAdjustment,
    resetFilters,
  }
}
