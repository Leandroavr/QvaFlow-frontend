import { ref, computed } from 'vue'
import { inventoryService } from '@/services'
import type { StockTransfer, StockTransferQueryParams, DocumentStatus } from '../types'
import type { Id } from '@/shared/types/api'
import { ApiError } from '@/shared/types/api'

export function useTransfers() {
  const transfers = ref<StockTransfer[]>([])
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
  const selectedTransfer = ref<StockTransfer | null>(null)
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

  async function fetchTransfers(customParams?: StockTransferQueryParams) {
    isLoading.value = true
    error.value = null
    try {
      const params: StockTransferQueryParams = {
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

      const response = await inventoryService.listTransfers(params)
      transfers.value = response.items
      total.value = response.total
      page.value = response.page
      perPage.value = response.perPage
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : 'Error al cargar los traslados de inventario'
      transfers.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTransferById(id: Id): Promise<StockTransfer> {
    isLoadingDetail.value = true
    error.value = null
    try {
      const transfer = await inventoryService.getTransfer(id)
      selectedTransfer.value = transfer
      return transfer
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : 'Error al obtener el detalle del traslado'
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }

  function selectTransfer(transfer: StockTransfer | null) {
    selectedTransfer.value = transfer
  }

  function resetFilters() {
    search.value = ''
    desde.value = ''
    hasta.value = ''
    status.value = ''
    page.value = 1
    return fetchTransfers()
  }

  return {
    transfers,
    total,
    page,
    perPage,
    sort,
    search,
    desde,
    hasta,
    status,
    selectedTransfer,
    isLoading,
    isLoadingDetail,
    error,
    hasActiveFilters,
    fetchTransfers,
    fetchTransferById,
    selectTransfer,
    resetFilters,
  }
}
