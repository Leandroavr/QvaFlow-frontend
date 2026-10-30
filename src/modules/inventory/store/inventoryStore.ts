import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import inventoryService from '../services/inventoryService'
import type {
  InventoryItem,
  InventoryMovement,
  CreateMovementDto,
  Almacen,
  Localizacion,
  ItemMovAlmacenes,
} from '../types/inventory'

/**
 * Store Pinia para la gestión del inventario, almacenes, localizaciones y movimientos.
 */
export const useInventoryStore = defineStore('inventory', () => {
  // Estado reactivo
  const items = ref<InventoryItem[]>([])
  const warehousesList = ref<Almacen[]>([])
  const movements = ref<InventoryMovement[]>([])
  const loading = ref<boolean>(false)
  const searchQuery = ref<string>('')
  const selectedWarehouse = ref<string>('all')
  const selectedLocation = ref<string>('all')
  const selectedCategory = ref<string>('all')

  // Getters computados
  const warehouses = computed(() => {
    const set = new Set<string>()
    warehousesList.value.forEach((w) => set.add(w.nombre))
    items.value.forEach((item) => {
      if (item.warehouse) set.add(item.warehouse)
    })
    return ['all', ...Array.from(set)]
  })

  // Lista aplanada de localizaciones con su almacén padre
  const allLocations = computed<Localizacion[]>(() => {
    const list: Localizacion[] = []
    warehousesList.value.forEach((w) => {
      w.localizaciones.forEach((loc) => {
        list.push({ ...loc, nombre: `${loc.nombre || loc.codigo} (${w.nombre})` })
      })
    })
    return list
  })

  const categories = computed(() => {
    const set = new Set<string>()
    items.value.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['all', ...Array.from(set)]
  })

  // Filtrado reactivo multidimensional (búsqueda, almacén, localización y categoría)
  const filteredItems = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return items.value.filter((item) => {
      const matchQuery =
        !query || item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)

      const matchWarehouse =
        selectedWarehouse.value === 'all' || item.warehouse === selectedWarehouse.value

      const matchLocation =
        selectedLocation.value === 'all' || item.location === selectedLocation.value

      const matchCategory =
        selectedCategory.value === 'all' || item.category === selectedCategory.value

      return matchQuery && matchWarehouse && matchLocation && matchCategory
    })
  })

  // Métricas financieras del inventario en almacén
  const totalStockUnits = computed(() => {
    return items.value.reduce((acc, item) => acc + item.stock, 0)
  })

  const totalCostValue = computed(() => {
    return items.value.reduce((acc, item) => acc + item.stock * item.costPrice, 0)
  })

  const totalSaleValue = computed(() => {
    return items.value.reduce((acc, item) => acc + item.stock * item.salePrice, 0)
  })

  const potentialProfit = computed(() => {
    return totalSaleValue.value - totalCostValue.value
  })

  const lowStockCount = computed(() => {
    return items.value.filter((i) => i.stock > 0 && i.stock < 10).length
  })

  const outOfStockCount = computed(() => {
    return items.value.filter((i) => i.stock === 0).length
  })

  // Acciones

  /**
   * Carga la lista de existencias del inventario y almacenes.
   */
  const fetchInventory = async () => {
    loading.value = true
    try {
      const [invItems, wList] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getWarehouses(),
      ])
      items.value = invItems
      warehousesList.value = wList
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar el inventario'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  /**
   * Crea un nuevo almacén con múltiples localizaciones dinámicas.
   */
  const createWarehouse = async (data: {
    codigo?: string
    nombre: string
    locations: { codigo?: string; nombre: string }[]
  }): Promise<boolean> => {
    loading.value = true
    try {
      const newWh = await inventoryService.createWarehouse(data)
      warehousesList.value.push(newWh)
      message.success(`Almacén "${newWh.nombre}" creado exitosamente.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear el almacén'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Registra un traslado entre dos localizaciones (Movimiento_almacenes).
   */
  const registerWarehouseMovement = async (dto: {
    items: ItemMovAlmacenes[]
    razon?: string
  }): Promise<boolean> => {
    loading.value = true
    try {
      await inventoryService.recordWarehouseMovement(dto)
      await fetchInventory()
      message.success('Traslado de mercancía entre localizaciones completado exitosamente.')
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al realizar el traslado'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Registra un movimiento manual (Entrada, Salida, Traslado o Ajuste).
   */
  const registerMovement = async (dto: CreateMovementDto): Promise<boolean> => {
    loading.value = true
    try {
      const result = await inventoryService.recordMovement(dto)

      const index = items.value.findIndex((i) => i.id === result.item.id)
      if (index !== -1) {
        items.value[index] = result.item
      }

      movements.value.unshift(result.movement)
      message.success(`Movimiento "${dto.type}" registrado correctamente.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar el movimiento'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    items,
    warehousesList,
    movements,
    loading,
    searchQuery,
    selectedWarehouse,
    selectedLocation,
    selectedCategory,
    // Getters
    warehouses,
    allLocations,
    categories,
    filteredItems,
    totalStockUnits,
    totalCostValue,
    totalSaleValue,
    potentialProfit,
    lowStockCount,
    outOfStockCount,
    // Acciones
    fetchInventory,
    createWarehouse,
    registerWarehouseMovement,
    registerMovement,
  }
})

export default useInventoryStore
