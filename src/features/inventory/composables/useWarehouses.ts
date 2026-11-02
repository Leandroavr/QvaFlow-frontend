import { ref, computed } from 'vue'
import { inventoryService } from '@/services'
import type {
  Warehouse,
  Location,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateLocationDto,
  UpdateLocationDto,
} from '../types'
import { ApiError } from '@/shared/types/api'

export function useWarehouses() {
  const warehouses = ref<Warehouse[]>([])
  const selectedWarehouseCode = ref<string | null>(null)
  const locations = ref<Location[]>([])

  const isLoadingWarehouses = ref(false)
  const isLoadingLocations = ref(false)
  const error = ref<string | null>(null)

  const selectedWarehouse = computed<Warehouse | undefined>(() => {
    if (!selectedWarehouseCode.value) return undefined
    return warehouses.value.find((w) => w.code === selectedWarehouseCode.value)
  })

  async function fetchWarehouses() {
    isLoadingWarehouses.value = true
    error.value = null
    try {
      warehouses.value = await inventoryService.getWarehouses()
      // Si no hay almacén seleccionado y existen almacenes, seleccionar el primero por defecto
      if (!selectedWarehouseCode.value && warehouses.value.length > 0) {
        selectedWarehouseCode.value = warehouses.value[0].code
      } else if (
        selectedWarehouseCode.value &&
        !warehouses.value.some((w) => w.code === selectedWarehouseCode.value)
      ) {
        selectedWarehouseCode.value = warehouses.value[0]?.code ?? null
      }
      if (selectedWarehouseCode.value) {
        await fetchLocations(selectedWarehouseCode.value)
      } else {
        locations.value = []
      }
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al cargar los almacenes'
      throw err
    } finally {
      isLoadingWarehouses.value = false
    }
  }

  async function fetchLocations(warehouseCode?: string) {
    const targetCode = warehouseCode ?? selectedWarehouseCode.value ?? undefined
    isLoadingLocations.value = true
    error.value = null
    try {
      locations.value = await inventoryService.getLocations(targetCode)
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al cargar las localizaciones'
      throw err
    } finally {
      isLoadingLocations.value = false
    }
  }

  async function selectWarehouse(code: string | null) {
    selectedWarehouseCode.value = code
    if (code) {
      await fetchLocations(code)
    } else {
      locations.value = []
    }
  }

  async function createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    error.value = null
    try {
      const created = await inventoryService.createWarehouse(dto)
      await fetchWarehouses()
      selectedWarehouseCode.value = created.code
      await fetchLocations(created.code)
      return created
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al crear el almacén'
      throw err
    }
  }

  async function updateWarehouse(code: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    error.value = null
    try {
      const updated = await inventoryService.updateWarehouse(code, dto)
      await fetchWarehouses()
      return updated
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al actualizar el almacén'
      throw err
    }
  }

  async function deleteWarehouse(code: string): Promise<void> {
    error.value = null
    try {
      await inventoryService.deleteWarehouse(code)
      if (selectedWarehouseCode.value === code) {
        selectedWarehouseCode.value = null
      }
      await fetchWarehouses()
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al eliminar el almacén'
      throw err
    }
  }

  async function createLocation(dto: CreateLocationDto): Promise<Location> {
    error.value = null
    try {
      const created = await inventoryService.createLocation(dto)
      await fetchLocations(selectedWarehouseCode.value ?? undefined)
      await fetchWarehouses() // Para actualizar conteo de localizaciones
      return created
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al crear la localización'
      throw err
    }
  }

  async function updateLocation(code: string, dto: UpdateLocationDto): Promise<Location> {
    error.value = null
    try {
      const updated = await inventoryService.updateLocation(code, dto)
      await fetchLocations(selectedWarehouseCode.value ?? undefined)
      return updated
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al actualizar la localización'
      throw err
    }
  }

  async function deleteLocation(code: string): Promise<void> {
    error.value = null
    try {
      await inventoryService.deleteLocation(code)
      await fetchLocations(selectedWarehouseCode.value ?? undefined)
      await fetchWarehouses() // Para actualizar conteo de localizaciones
    } catch (err) {
      error.value = err instanceof ApiError ? err.message : 'Error al eliminar la localización'
      throw err
    }
  }

  return {
    warehouses,
    selectedWarehouseCode,
    selectedWarehouse,
    locations,
    isLoadingWarehouses,
    isLoadingLocations,
    error,
    fetchWarehouses,
    fetchLocations,
    selectWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    createLocation,
    updateLocation,
    deleteLocation,
  }
}
