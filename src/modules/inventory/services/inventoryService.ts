import apiClient from '@/core/axios'
import type {
  InventoryItem,
  InventoryMovement,
  CreateMovementDto,
  Almacen,
  Localizacion,
  ItemMovAlmacenes,
  MovimientoAlmacenes,
} from '../types/inventory'

// Almacenes iniciales con sus respectivas localizaciones (relación 1 a N)
const ALMACENES_MOCK: Almacen[] = [
  {
    codigo: 'ALM-CENTRAL',
    nombre: 'Almacén Central',
    localizaciones: [
      { codigo: 'LOC-CEN-P1', almacen: 'ALM-CENTRAL', nombre: 'Pasillo 1 - Secos' },
      { codigo: 'LOC-CEN-EA', almacen: 'ALM-CENTRAL', nombre: 'Estante A - Enlatados' },
      { codigo: 'LOC-CEN-EB', almacen: 'ALM-CENTRAL', nombre: 'Estante B - Licores' },
    ],
  },
  {
    codigo: 'ALM-TIENDA',
    nombre: 'Tienda Principal',
    localizaciones: [
      { codigo: 'LOC-TND-M1', almacen: 'ALM-TIENDA', nombre: 'Mostrador de Cobro' },
      { codigo: 'LOC-TND-E1', almacen: 'ALM-TIENDA', nombre: 'Estantería Expositora' },
    ],
  },
  {
    codigo: 'ALM-FRIO',
    nombre: 'Nevera y Frío',
    localizaciones: [
      { codigo: 'LOC-NEV-B1', almacen: 'ALM-FRIO', nombre: 'Nevera Exhibidora Bebidas' },
      { codigo: 'LOC-CONG-C1', almacen: 'ALM-FRIO', nombre: 'Congelador de Cárnicos' },
    ],
  },
]

// Coherencia con los 6 productos de POS y Catálogo, incorporando almacén y localización
const INVENTARIO_MOCK: InventoryItem[] = [
  {
    id: 101,
    code: '78910001',
    name: 'Café Serrano Clásico 250g',
    category: 'Alimentos',
    costPrice: 450,
    salePrice: 650,
    currency: 'CUP',
    warehouse: 'Tienda Principal',
    location: 'LOC-TND-E1',
    locationName: 'Estantería Expositora',
    stock: 24,
    minStock: 10,
    unit: 'pqte',
    lastUpdated: '2026-10-25 10:30',
  },
  {
    id: 102,
    code: '78910002',
    name: 'Aceite de Girasol Criollo 1L',
    category: 'Alimentos',
    costPrice: 700,
    salePrice: 950,
    currency: 'CUP',
    warehouse: 'Almacén Central',
    location: 'LOC-CEN-P1',
    locationName: 'Pasillo 1 - Secos',
    stock: 15,
    minStock: 10,
    unit: 'botella',
    lastUpdated: '2026-10-24 16:15',
  },
  {
    id: 103,
    code: '78910003',
    name: 'Refresco Tukola Lata 330ml',
    category: 'Bebidas',
    costPrice: 180,
    salePrice: 280,
    currency: 'CUP',
    warehouse: 'Nevera y Frío',
    location: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    stock: 48,
    minStock: 10,
    unit: 'lata',
    lastUpdated: '2026-10-26 08:00',
  },
  {
    id: 104,
    code: '78910004',
    name: 'Cerveza Cristal Lata 355ml',
    category: 'Bebidas',
    costPrice: 220,
    salePrice: 320,
    currency: 'CUP',
    warehouse: 'Nevera y Frío',
    location: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    stock: 72,
    minStock: 10,
    unit: 'lata',
    lastUpdated: '2026-10-26 09:12',
  },
  {
    id: 105,
    code: '78910005',
    name: 'Cigarros H. Upmann Selecto',
    category: 'Tabacos',
    costPrice: 210,
    salePrice: 300,
    currency: 'CUP',
    warehouse: 'Tienda Principal',
    location: 'LOC-TND-M1',
    locationName: 'Mostrador de Cobro',
    stock: 8, // Bajo stock (< 10)
    minStock: 10,
    unit: 'cajetilla',
    lastUpdated: '2026-10-23 11:45',
  },
  {
    id: 106,
    code: '78910006',
    name: 'Pollo Entero Congelado 1kg',
    category: 'Cárnicos',
    costPrice: 980,
    salePrice: 1350,
    currency: 'CUP',
    warehouse: 'Nevera y Frío',
    location: 'LOC-CONG-C1',
    locationName: 'Congelador de Cárnicos',
    stock: 0, // Agotado
    minStock: 10,
    unit: 'kg',
    lastUpdated: '2026-10-22 17:20',
  },
]

let localWarehouses: Almacen[] = [...ALMACENES_MOCK]
let localInventory: InventoryItem[] = [...INVENTARIO_MOCK]
let localMovements: InventoryMovement[] = []

/**
 * Servicio para la gestión de almacenes, localizaciones, existencias y movimientos.
 */
export const inventoryService = {
  /**
   * Obtiene la lista actual de existencias del inventario.
   */
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const response = await apiClient.get<InventoryItem[]>('/inventory')
      return response.data
    } catch {
      return Promise.resolve([...localInventory])
    }
  },

  /**
   * Obtiene la lista de almacenes con sus localizaciones.
   */
  async getWarehouses(): Promise<Almacen[]> {
    try {
      const response = await apiClient.get<Almacen[]>('/warehouses')
      return response.data
    } catch {
      return Promise.resolve([...localWarehouses])
    }
  },

  /**
   * Obtiene la lista aplanada de todas las localizaciones del sistema.
   */
  async getAllLocations(): Promise<Localizacion[]> {
    const list: Localizacion[] = []
    localWarehouses.forEach((w) => {
      w.localizaciones.forEach((loc) => {
        list.push({ ...loc })
      })
    })
    return Promise.resolve(list)
  },

  /**
   * Crea un nuevo almacén con múltiples localizaciones dinámicas.
   */
  async createWarehouse(dto: {
    codigo?: string
    nombre: string
    locations: { codigo?: string; nombre: string }[]
  }): Promise<Almacen> {
    try {
      const response = await apiClient.post<Almacen>('/warehouses', dto)
      return response.data
    } catch {
      const generatedCode = dto.codigo?.trim().toUpperCase() || `ALM-${Date.now().toString().slice(-4)}`
      const newLocations: Localizacion[] = dto.locations.map((loc, idx) => ({
        codigo: loc.codigo?.trim().toUpperCase() || `LOC-${generatedCode}-${idx + 1}`,
        almacen: generatedCode,
        nombre: loc.nombre.trim(),
      }))

      const newWarehouse: Almacen = {
        codigo: generatedCode,
        nombre: dto.nombre.trim(),
        localizaciones: newLocations,
      }

      localWarehouses.push(newWarehouse)
      return Promise.resolve({ ...newWarehouse })
    }
  },

  /**
   * Registra un traslado entre dos localizaciones (Items_Mov_almacenes / Movimiento_almacenes).
   */
  async recordWarehouseMovement(dto: {
    items: ItemMovAlmacenes[]
    razon?: string
  }): Promise<MovimientoAlmacenes> {
    try {
      const response = await apiClient.post<MovimientoAlmacenes>('/inventory/warehouse-movements', dto)
      return response.data
    } catch {
      const docNo = `MOV-ALM-${Date.now().toString().slice(-6)}`
      const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

      // Ejecutar traslados en el inventario local
      dto.items.forEach((item) => {
        const productItem = localInventory.find(
          (p) => p.code === item.producto || p.id.toString() === item.producto
        )

        if (productItem) {
          if (productItem.stock < item.cantidad) {
            throw new Error(`Stock insuficiente de "${productItem.name}" para realizar el traslado.`)
          }
          productItem.stock -= item.cantidad
          productItem.location = item.localizacion2
          productItem.stock += item.cantidad
          productItem.lastUpdated = now

          // Historial de auditoría
          localMovements.unshift({
            id: `TRF-${Date.now().toString().slice(-4)}`,
            productId: productItem.id,
            productName: productItem.name,
            type: 'TRASLADO',
            quantity: item.cantidad,
            warehouse: productItem.warehouse,
            location: item.localizacion1,
            targetLocation: item.localizacion2,
            reason: dto.razon || `Traslado de ${item.localizacion1} hacia ${item.localizacion2}`,
            createdAt: now,
          })
        }
      })

      const movDoc: MovimientoAlmacenes = {
        noDocument: docNo,
        fechaMovimiento: now,
        estado: '1',
        activo: '1',
        items: [...dto.items],
        razon: dto.razon,
      }

      return Promise.resolve(movDoc)
    }
  },

  /**
   * Registra un movimiento general (Entrada, Salida, Traslado o Ajuste).
   */
  async recordMovement(dto: CreateMovementDto): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
    try {
      const response = await apiClient.post<{ item: InventoryItem; movement: InventoryMovement }>(
        '/inventory/movements',
        dto
      )
      return response.data
    } catch {
      const itemIndex = localInventory.findIndex((i) => i.id === dto.productId)
      if (itemIndex === -1) {
        throw new Error('Producto no encontrado en inventario')
      }

      const currentItem = localInventory[itemIndex]

      if (dto.type === 'ENTRADA') {
        currentItem.stock += dto.quantity
      } else if (dto.type === 'SALIDA') {
        if (currentItem.stock < dto.quantity) {
          throw new Error(`Stock insuficiente (${currentItem.stock} disponibles) para realizar la salida.`)
        }
        currentItem.stock -= dto.quantity
      } else if (dto.type === 'TRASLADO') {
        if (currentItem.stock < dto.quantity) {
          throw new Error(`Stock insuficiente para trasladar ${dto.quantity} unidades.`)
        }
        currentItem.stock -= dto.quantity
        if (dto.targetWarehouse) {
          currentItem.warehouse = dto.targetWarehouse
        }
        if (dto.targetLocation) {
          currentItem.location = dto.targetLocation
        }
        currentItem.stock += dto.quantity
      } else if (dto.type === 'AJUSTE') {
        currentItem.stock = dto.quantity
      }

      currentItem.lastUpdated = new Date().toISOString().replace('T', ' ').slice(0, 16)

      const movement: InventoryMovement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        productId: currentItem.id,
        productName: currentItem.name,
        type: dto.type,
        quantity: dto.quantity,
        warehouse: dto.warehouse,
        location: dto.location,
        targetWarehouse: dto.targetWarehouse,
        targetLocation: dto.targetLocation,
        reason: dto.reason,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      }

      localMovements.unshift(movement)
      return Promise.resolve({ item: { ...currentItem }, movement })
    }
  },

  /**
   * Obtiene el historial de movimientos registrados.
   */
  async getMovements(): Promise<InventoryMovement[]> {
    try {
      const response = await apiClient.get<InventoryMovement[]>('/inventory/movements')
      return response.data
    } catch {
      return Promise.resolve([...localMovements])
    }
  },

  /**
   * Confirma la entrada real de mercancías de una Factura de Compra
   * sumando el stock en la localización específica indicada por cada ítem.
   */
  confirmPurchaseStock(
    items: {
      producto: string
      productName?: string
      quantity: number
      unitCost: number
      localizacion: string
    }[]
  ): void {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

    items.forEach((item) => {
      let currentItem = localInventory.find(
        (i) => i.code === item.producto || i.id.toString() === item.producto
      )

      if (currentItem) {
        currentItem.stock += item.quantity
        currentItem.costPrice = item.unitCost
        currentItem.location = item.localizacion
        currentItem.lastUpdated = now

        localMovements.unshift({
          id: `MOV-CMP-${Date.now().toString().slice(-4)}`,
          productId: currentItem.id,
          productName: currentItem.name,
          type: 'ENTRADA',
          quantity: item.quantity,
          warehouse: currentItem.warehouse,
          location: item.localizacion,
          reason: `Recepción confirmada de Factura de Compra (Costo: $${item.unitCost})`,
          createdAt: now,
        })
      }
    })
  },
}

export default inventoryService
