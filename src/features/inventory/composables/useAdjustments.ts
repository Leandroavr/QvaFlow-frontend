import { ref, computed } from 'vue'
import { inventoryService } from '@/services'
import type {
  InventoryAdjustment,
  InventoryAdjustmentQueryParams,
  CreateInventoryAdjustmentDto,
  DocumentStatus,
  StockItem,
  Location,
  Warehouse,
} from '../types'
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

  // Estados de carga y error para listado y detalle
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Estados de creación y validación de formulario
  const isSubmitting = ref<boolean>(false)
  const fieldErrors = ref<Record<string, string[]>>({})

  // Opciones de soporte para el formulario (existencias, localizaciones, almacenes)
  const availableStock = ref<StockItem[]>([])
  const locations = ref<Location[]>([])
  const warehouses = ref<Warehouse[]>([])
  const isLoadingOptions = ref<boolean>(false)

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

  async function fetchAdjustmentOptions(): Promise<void> {
    isLoadingOptions.value = true
    error.value = null
    try {
      const [stockRes, locsRes, whRes] = await Promise.all([
        inventoryService.getStock({ perPage: 100 }),
        inventoryService.getLocations(),
        inventoryService.getWarehouses(),
      ])
      availableStock.value = stockRes.items
      locations.value = locsRes
      warehouses.value = whRes
    } catch (err) {
      error.value =
        err instanceof ApiError ? err.message : 'Error al cargar las opciones de inventario'
    } finally {
      isLoadingOptions.value = false
    }
  }

  async function createAdjustment(dto: CreateInventoryAdjustmentDto): Promise<InventoryAdjustment> {
    isSubmitting.value = true
    error.value = null
    fieldErrors.value = {}

    try {
      const created = await inventoryService.createAdjustment(dto)
      return created
    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.message
        if ((err.statusCode === 400 || err.code === 'VALIDATION_ERROR') && err.details) {
          fieldErrors.value = err.details as Record<string, string[]>
        }
      } else {
        error.value = 'Error al registrar el ajuste de inventario'
      }
      throw err
    } finally {
      isSubmitting.value = false
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
    isSubmitting,
    fieldErrors,
    availableStock,
    locations,
    warehouses,
    isLoadingOptions,
    hasActiveFilters,
    fetchAdjustments,
    fetchAdjustmentById,
    fetchAdjustmentOptions,
    createAdjustment,
    selectAdjustment,
    resetFilters,
  }
}
