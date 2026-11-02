import type { InventoryService } from '../interfaces/inventoryService'
import type { PaginatedResponse } from '@/shared/types/api'
import { ApiError } from '@/shared/types/api'
import type {
  Warehouse,
  Location,
  StockItem,
  StockSummary,
  StockQueryParams,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateLocationDto,
  UpdateLocationDto,
  StockStatus,
} from '@/features/inventory/types'
import { MOCK_USERS } from '@/mocks/users'

/**
 * Almacenes iniciales replicados del módulo legado.
 */
const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    code: 'ALM-CENTRAL',
    name: 'Almacén Central',
  },
  {
    code: 'ALM-TIENDA',
    name: 'Tienda Principal',
  },
  {
    code: 'ALM-FRIO',
    name: 'Nevera y Frío',
  },
]

/**
 * Localizaciones iniciales replicadas del módulo legado.
 */
const INITIAL_LOCATIONS: Location[] = [
  { code: 'LOC-CEN-P1', warehouseCode: 'ALM-CENTRAL', name: 'Pasillo 1 - Secos' },
  { code: 'LOC-CEN-EA', warehouseCode: 'ALM-CENTRAL', name: 'Estante A - Enlatados' },
  { code: 'LOC-CEN-EB', warehouseCode: 'ALM-CENTRAL', name: 'Estante B - Licores' },
  { code: 'LOC-TND-M1', warehouseCode: 'ALM-TIENDA', name: 'Mostrador de Cobro' },
  { code: 'LOC-TND-E1', warehouseCode: 'ALM-TIENDA', name: 'Estantería Expositora' },
  { code: 'LOC-NEV-B1', warehouseCode: 'ALM-FRIO', name: 'Nevera Exhibidora Bebidas' },
  { code: 'LOC-CONG-C1', warehouseCode: 'ALM-FRIO', name: 'Congelador de Cárnicos' },
]

/**
 * Catálogo inicial de 25 existencias de stock con diversidad de unidades y estados.
 * Los importes y cantidades se gestionan estrictamente como string decimal.
 */
const INITIAL_STOCK: StockItem[] = [
  // 1-6: Productos del legado
  {
    productCode: '78910001',
    productName: 'Café Serrano Clásico 250g',
    category: 'Alimentos',
    unit: 'pqte',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-E1',
    locationName: 'Estantería Expositora',
    quantity: '24.00',
    cost: '450.00',
    price: '650.00',
    minStock: '10.00',
    updatedAt: '2026-10-25T10:30:00Z',
  },
  {
    productCode: '78910002',
    productName: 'Aceite de Girasol Criollo 1L',
    category: 'Alimentos',
    unit: 'botella',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-P1',
    locationName: 'Pasillo 1 - Secos',
    quantity: '15.00',
    cost: '700.00',
    price: '950.00',
    minStock: '10.00',
    updatedAt: '2026-10-24T16:15:00Z',
  },
  {
    productCode: '78910003',
    productName: 'Refresco Tukola Lata 330ml',
    category: 'Bebidas',
    unit: 'lata',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    quantity: '48.00',
    cost: '180.00',
    price: '280.00',
    minStock: '10.00',
    updatedAt: '2026-10-26T08:00:00Z',
  },
  {
    productCode: '78910004',
    productName: 'Cerveza Cristal Lata 355ml',
    category: 'Bebidas',
    unit: 'lata',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    quantity: '72.00',
    cost: '220.00',
    price: '320.00',
    minStock: '10.00',
    updatedAt: '2026-10-26T09:12:00Z',
  },
  {
    productCode: '78910005',
    productName: 'Cigarros H. Upmann Selecto',
    category: 'Tabacos',
    unit: 'cajetilla',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-M1',
    locationName: 'Mostrador de Cobro',
    quantity: '8.00', // Bajo stock
    cost: '210.00',
    price: '300.00',
    minStock: '10.00',
    updatedAt: '2026-10-23T11:45:00Z',
  },
  {
    productCode: '78910006',
    productName: 'Pollo Entero Congelado 1kg',
    category: 'Cárnicos',
    unit: 'kg',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-CONG-C1',
    locationName: 'Congelador de Cárnicos',
    quantity: '0.00', // Agotado
    cost: '980.00',
    price: '1350.00',
    minStock: '10.00',
    updatedAt: '2026-10-22T17:20:00Z',
  },
  // 7-25: Productos adicionales para simular inventario realista
  {
    productCode: '78910007',
    productName: 'Cerveza Bucanero Fuerte 355ml',
    category: 'Bebidas',
    unit: 'lata',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    quantity: '36.00',
    cost: '230.00',
    price: '340.00',
    minStock: '12.00',
    updatedAt: '2026-10-27T08:30:00Z',
  },
  {
    productCode: '78910008',
    productName: 'Agua Mineral Ciego Montero 1.5L',
    category: 'Bebidas',
    unit: 'botella',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-E1',
    locationName: 'Estantería Expositora',
    quantity: '5.00', // Bajo stock
    cost: '65.00',
    price: '120.00',
    minStock: '15.00',
    updatedAt: '2026-10-28T09:00:00Z',
  },
  {
    productCode: '78910009',
    productName: 'Arroz Grano Largo Especial 1kg',
    category: 'Alimentos',
    unit: 'kg',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-P1',
    locationName: 'Pasillo 1 - Secos',
    quantity: '120.00',
    cost: '140.00',
    price: '210.00',
    minStock: '25.00',
    updatedAt: '2026-10-28T14:10:00Z',
  },
  {
    productCode: '78910010',
    productName: 'Frijol Negro Criollo Seleccionado 1kg',
    category: 'Alimentos',
    unit: 'kg',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-P1',
    locationName: 'Pasillo 1 - Secos',
    quantity: '3.00', // Bajo stock
    cost: '170.00',
    price: '260.00',
    minStock: '20.00',
    updatedAt: '2026-10-27T16:45:00Z',
  },
  {
    productCode: '78910011',
    productName: 'Atún en Aceite Vegetal 170g',
    category: 'Alimentos',
    unit: 'lata',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-EA',
    locationName: 'Estante A - Enlatados',
    quantity: '60.00',
    cost: '210.00',
    price: '330.00',
    minStock: '10.00',
    updatedAt: '2026-10-26T11:20:00Z',
  },
  {
    productCode: '78910012',
    productName: 'Sardinas en Salsa de Tomate 425g',
    category: 'Alimentos',
    unit: 'lata',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-EA',
    locationName: 'Estante A - Enlatados',
    quantity: '0.00', // Agotado
    cost: '190.00',
    price: '290.00',
    minStock: '10.00',
    updatedAt: '2026-10-21T10:00:00Z',
  },
  {
    productCode: '78910013',
    productName: 'Ron Havana Club Añejo 7 Años 700ml',
    category: 'Bebidas',
    unit: 'botella',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-EB',
    locationName: 'Estante B - Licores',
    quantity: '18.00',
    cost: '850.00',
    price: '1450.00',
    minStock: '6.00',
    updatedAt: '2026-10-28T12:00:00Z',
  },
  {
    productCode: '78910014',
    productName: 'Ron Santiago de Cuba Carta Blanca 700ml',
    category: 'Bebidas',
    unit: 'botella',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-EB',
    locationName: 'Estante B - Licores',
    quantity: '4.00', // Bajo stock
    cost: '600.00',
    price: '950.00',
    minStock: '8.00',
    updatedAt: '2026-10-25T15:30:00Z',
  },
  {
    productCode: '78910015',
    productName: 'Cigarros Popular Auténtico',
    category: 'Tabacos',
    unit: 'cajetilla',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-M1',
    locationName: 'Mostrador de Cobro',
    quantity: '95.00',
    cost: '100.00',
    price: '170.00',
    minStock: '20.00',
    updatedAt: '2026-10-29T10:15:00Z',
  },
  {
    productCode: '78910016',
    productName: 'Picadillo de Res y Cerdo 500g',
    category: 'Cárnicos',
    unit: 'pqte',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-CONG-C1',
    locationName: 'Congelador de Cárnicos',
    quantity: '40.00',
    cost: '340.00',
    price: '520.00',
    minStock: '15.00',
    updatedAt: '2026-10-29T08:45:00Z',
  },
  {
    productCode: '78910017',
    productName: 'Salchichas Tipo Viena 10u',
    category: 'Cárnicos',
    unit: 'pqte',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-CONG-C1',
    locationName: 'Congelador de Cárnicos',
    quantity: '2.00', // Bajo stock
    cost: '210.00',
    price: '330.00',
    minStock: '10.00',
    updatedAt: '2026-10-28T17:10:00Z',
  },
  {
    productCode: '78910018',
    productName: 'Jabón de Tocador Nácar 120g',
    category: 'Aseo',
    unit: 'barra',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-E1',
    locationName: 'Estantería Expositora',
    quantity: '85.00',
    cost: '50.00',
    price: '95.00',
    minStock: '15.00',
    updatedAt: '2026-10-27T11:00:00Z',
  },
  {
    productCode: '78910019',
    productName: 'Detergente en Polvo Omo 500g',
    category: 'Aseo',
    unit: 'pqte',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-E1',
    locationName: 'Estantería Expositora',
    quantity: '18.00',
    cost: '180.00',
    price: '290.00',
    minStock: '10.00',
    updatedAt: '2026-10-26T14:30:00Z',
  },
  {
    productCode: '78910020',
    productName: 'Pasta Dental Colgate Total 100ml',
    category: 'Aseo',
    unit: 'tubo',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-E1',
    locationName: 'Estantería Expositora',
    quantity: '0.00', // Agotado
    cost: '130.00',
    price: '220.00',
    minStock: '10.00',
    updatedAt: '2026-10-20T09:15:00Z',
  },
  {
    productCode: '78910021',
    productName: 'Galletas de Sal Soda Cristal 200g',
    category: 'Alimentos',
    unit: 'pqte',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-P1',
    locationName: 'Pasillo 1 - Secos',
    quantity: '50.00',
    cost: '65.00',
    price: '120.00',
    minStock: '10.00',
    updatedAt: '2026-10-29T11:20:00Z',
  },
  {
    productCode: '78910022',
    productName: 'Leche Condensada La Lechera 395g',
    category: 'Alimentos',
    unit: 'lata',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    locationCode: 'LOC-CEN-EA',
    locationName: 'Estante A - Enlatados',
    quantity: '6.00', // Bajo stock
    cost: '240.00',
    price: '380.00',
    minStock: '12.00',
    updatedAt: '2026-10-28T16:00:00Z',
  },
  {
    productCode: '78910023',
    productName: 'Refresco Ciego Montero Naranja 330ml',
    category: 'Bebidas',
    unit: 'lata',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    quantity: '42.00',
    cost: '180.00',
    price: '280.00',
    minStock: '10.00',
    updatedAt: '2026-10-29T13:40:00Z',
  },
  {
    productCode: '78910024',
    productName: 'Cerveza Mayabe Lata 355ml',
    category: 'Bebidas',
    unit: 'lata',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    locationCode: 'LOC-NEV-B1',
    locationName: 'Nevera Exhibidora Bebidas',
    quantity: '30.00',
    cost: '190.00',
    price: '290.00',
    minStock: '10.00',
    updatedAt: '2026-10-29T15:10:00Z',
  },
  {
    productCode: '78910025',
    productName: 'Fósforos Especiales Batey',
    category: 'Tabacos',
    unit: 'cajetilla',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    locationCode: 'LOC-TND-M1',
    locationName: 'Mostrador de Cobro',
    quantity: '110.00',
    cost: '15.00',
    price: '30.00',
    minStock: '20.00',
    updatedAt: '2026-10-29T16:00:00Z',
  },
]

export class MockInventoryService implements InventoryService {
  private warehouses: Warehouse[] = JSON.parse(JSON.stringify(INITIAL_WAREHOUSES))
  private locations: Location[] = JSON.parse(JSON.stringify(INITIAL_LOCATIONS))
  private stock: StockItem[] = JSON.parse(JSON.stringify(INITIAL_STOCK))

  private delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Determina si el usuario autenticado tiene el permiso sensible products.view_cost.
   */
  private checkHasCostPermission(): boolean {
    try {
      const token = localStorage.getItem('qvaflow_token')
      if (token) {
        const match = Object.values(MOCK_USERS).find((u) => u.token === token)
        if (match) {
          return match.user.permissions.includes('products.view_cost')
        }
      }
      const rawUser = localStorage.getItem('qvaflow_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        return Array.isArray(user.permissions) && user.permissions.includes('products.view_cost')
      }
    } catch {
      // Ignorar fallo de lectura local
    }
    return false
  }

  /**
   * Calcula el estado de stock ('ok' | 'low' | 'out') según cantidad y minStock.
   */
  private calculateStatus(quantityStr: string, minStockStr?: string): StockStatus {
    const qty = parseFloat(quantityStr) || 0
    const min = parseFloat(minStockStr || '10') || 10

    if (qty <= 0) return 'out'
    if (qty < min) return 'low'
    return 'ok'
  }

  /**
   * Obtiene la cantidad de existencias asociadas a un almacén.
   */
  private getWarehouseStockUnits(warehouseCode: string): number {
    return this.stock
      .filter((s) => s.warehouseCode === warehouseCode)
      .reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0)
  }

  /**
   * Obtiene la cantidad de existencias asociadas a una localización.
   */
  private getLocationStockUnits(locationCode: string): number {
    return this.stock
      .filter((s) => s.locationCode === locationCode)
      .reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0)
  }

  // ==========================================
  // ALMACENES
  // ==========================================

  async getWarehouses(): Promise<Warehouse[]> {
    await this.delay(180)
    return this.warehouses.map((w) => ({
      ...w,
      locationsCount: this.locations.filter((l) => l.warehouseCode === w.code).length,
      stockUnits: this.getWarehouseStockUnits(w.code),
    }))
  }

  async getWarehouseByCode(code: string): Promise<Warehouse> {
    await this.delay(150)
    const found = this.warehouses.find((w) => w.code.toUpperCase() === code.trim().toUpperCase())
    if (!found) {
      throw new ApiError({ code: 'WAREHOUSE_NOT_FOUND', message: 'Almacén no encontrado.' }, 404)
    }
    return {
      ...found,
      locationsCount: this.locations.filter((l) => l.warehouseCode === found.code).length,
      stockUnits: this.getWarehouseStockUnits(found.code),
    }
  }

  async createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    await this.delay(220)
    const cleanCode = dto.code.trim().toUpperCase()
    const cleanName = dto.name.trim()

    // Validar duplicado
    if (this.warehouses.some((w) => w.code.toUpperCase() === cleanCode)) {
      throw new ApiError(
        {
          code: 'CODE_ALREADY_EXISTS',
          message: `Ya existe un almacén con el código "${cleanCode}".`,
          details: { code: ['El código de almacén ya está en uso.'] },
        },
        409
      )
    }

    const newWarehouse: Warehouse = {
      code: cleanCode,
      name: cleanName,
      locationsCount: 0,
      stockUnits: 0,
    }

    this.warehouses.push(newWarehouse)
    return { ...newWarehouse }
  }

  async updateWarehouse(code: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    await this.delay(200)
    const index = this.warehouses.findIndex((w) => w.code.toUpperCase() === code.trim().toUpperCase())
    if (index === -1) {
      throw new ApiError({ code: 'WAREHOUSE_NOT_FOUND', message: 'Almacén no encontrado.' }, 404)
    }

    this.warehouses[index].name = dto.name.trim()

    // Sincronizar nombre en stockItems
    this.stock.forEach((s) => {
      if (s.warehouseCode === this.warehouses[index].code) {
        s.warehouseName = this.warehouses[index].name
      }
    })

    return {
      ...this.warehouses[index],
      locationsCount: this.locations.filter((l) => l.warehouseCode === code).length,
      stockUnits: this.getWarehouseStockUnits(code),
    }
  }

  async deleteWarehouse(code: string): Promise<void> {
    await this.delay(200)
    const cleanCode = code.trim().toUpperCase()
    const index = this.warehouses.findIndex((w) => w.code.toUpperCase() === cleanCode)
    if (index === -1) {
      throw new ApiError({ code: 'WAREHOUSE_NOT_FOUND', message: 'Almacén no encontrado.' }, 404)
    }

    // Regla de integridad 409: no se puede borrar si contiene existencias
    const stockUnits = this.getWarehouseStockUnits(cleanCode)
    if (stockUnits > 0) {
      throw new ApiError(
        {
          code: 'WAREHOUSE_HAS_STOCK',
          message: 'No se puede eliminar el almacén porque contiene existencias asignadas.',
        },
        409
      )
    }

    // Eliminar también las localizaciones vacías vinculadas
    this.locations = this.locations.filter((l) => l.warehouseCode !== cleanCode)
    this.warehouses.splice(index, 1)
  }

  // ==========================================
  // LOCALIZACIONES
  // ==========================================

  async getLocations(warehouseCode?: string): Promise<Location[]> {
    await this.delay(180)
    let list = this.locations
    if (warehouseCode) {
      const cleanW = warehouseCode.trim().toUpperCase()
      list = list.filter((l) => l.warehouseCode.toUpperCase() === cleanW)
    }

    return list.map((loc) => ({
      ...loc,
      stockUnits: this.getLocationStockUnits(loc.code),
    }))
  }

  async getLocationByCode(code: string): Promise<Location> {
    await this.delay(150)
    const found = this.locations.find((l) => l.code.toUpperCase() === code.trim().toUpperCase())
    if (!found) {
      throw new ApiError({ code: 'LOCATION_NOT_FOUND', message: 'Localización no encontrada.' }, 404)
    }
    return {
      ...found,
      stockUnits: this.getLocationStockUnits(found.code),
    }
  }

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    await this.delay(220)
    const cleanCode = dto.code.trim().toUpperCase()
    const cleanWCode = dto.warehouseCode.trim().toUpperCase()

    // Validar almacén padre
    if (!this.warehouses.some((w) => w.code.toUpperCase() === cleanWCode)) {
      throw new ApiError(
        {
          code: 'WAREHOUSE_NOT_FOUND',
          message: 'El almacén especificado para la localización no existe.',
        },
        404
      )
    }

    // Validar duplicado
    if (this.locations.some((l) => l.code.toUpperCase() === cleanCode)) {
      throw new ApiError(
        {
          code: 'CODE_ALREADY_EXISTS',
          message: `Ya existe una localización con el código "${cleanCode}".`,
          details: { code: ['El código de localización ya está en uso.'] },
        },
        409
      )
    }

    const newLocation: Location = {
      code: cleanCode,
      warehouseCode: cleanWCode,
      name: dto.name?.trim() || cleanCode,
      stockUnits: 0,
    }

    this.locations.push(newLocation)
    return { ...newLocation }
  }

  async updateLocation(code: string, dto: UpdateLocationDto): Promise<Location> {
    await this.delay(200)
    const index = this.locations.findIndex((l) => l.code.toUpperCase() === code.trim().toUpperCase())
    if (index === -1) {
      throw new ApiError({ code: 'LOCATION_NOT_FOUND', message: 'Localización no encontrada.' }, 404)
    }

    if (dto.name !== undefined) {
      this.locations[index].name = dto.name.trim()
    }

    // Sincronizar nombre en stockItems
    this.stock.forEach((s) => {
      if (s.locationCode === this.locations[index].code) {
        s.locationName = this.locations[index].name
      }
    })

    return {
      ...this.locations[index],
      stockUnits: this.getLocationStockUnits(code),
    }
  }

  async deleteLocation(code: string): Promise<void> {
    await this.delay(200)
    const cleanCode = code.trim().toUpperCase()
    const index = this.locations.findIndex((l) => l.code.toUpperCase() === cleanCode)
    if (index === -1) {
      throw new ApiError({ code: 'LOCATION_NOT_FOUND', message: 'Localización no encontrada.' }, 404)
    }

    // Regla de integridad 409: no se puede borrar si tiene stock
    const stockUnits = this.getLocationStockUnits(cleanCode)
    if (stockUnits > 0) {
      throw new ApiError(
        {
          code: 'LOCATION_HAS_STOCK',
          message: 'No se puede eliminar la localización porque contiene existencias de productos.',
        },
        409
      )
    }

    this.locations.splice(index, 1)
  }

  // ==========================================
  // EXISTENCIAS Y STOCK
  // ==========================================

  async getStock(params: StockQueryParams = {}): Promise<PaginatedResponse<StockItem>> {
    await this.delay(220)
    const canViewCost = this.checkHasCostPermission()

    let items = [...this.stock]

    // 1. Filtrado por búsqueda
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim()
      items = items.filter(
        (i) => i.productCode.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q)
      )
    }

    // 2. Filtrado por almacén
    if (params.warehouse && params.warehouse !== 'all') {
      const w = params.warehouse.trim().toUpperCase()
      items = items.filter((i) => i.warehouseCode.toUpperCase() === w)
    }

    // 3. Filtrado por localización
    if (params.location && params.location !== 'all') {
      const loc = params.location.trim().toUpperCase()
      items = items.filter((i) => i.locationCode.toUpperCase() === loc)
    }

    // 4. Filtrado por categoría
    if (params.category && params.category !== 'all') {
      const cat = params.category.trim().toLowerCase()
      items = items.filter((i) => i.category.toLowerCase() === cat)
    }

    // 5. Filtrado por estado de stock
    if (params.status && params.status !== 'all') {
      items = items.filter((i) => {
        const st = this.calculateStatus(i.quantity, i.minStock)
        return st === params.status
      })
    }

    // 6. Ordenación según formato "campo:asc|desc"
    if (params.sort) {
      const [field, dir] = params.sort.split(':')
      const isDesc = dir === 'desc'

      items.sort((a: any, b: any) => {
        let valA = a[field]
        let valB = b[field]

        if (field === 'quantity' || field === 'cost' || field === 'price' || field === 'minStock') {
          valA = parseFloat(valA || '0')
          valB = parseFloat(valB || '0')
        } else if (typeof valA === 'string') {
          return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB)
        }

        if (valA < valB) return isDesc ? 1 : -1
        if (valA > valB) return isDesc ? -1 : 1
        return 0
      })
    }

    const total = items.length
    const page = Math.max(1, params.page || 1)
    const perPage = Math.max(1, params.perPage || 10)
    const start = (page - 1) * perPage
    const paged = items.slice(start, start + perPage)

    // Formatear items con status derivado y omitir 'cost' si no hay permiso
    const formattedItems = paged.map((i) => {
      const itemClone: StockItem = {
        ...i,
        status: this.calculateStatus(i.quantity, i.minStock),
      }

      if (!canViewCost) {
        delete itemClone.cost
      }

      return itemClone
    })

    return {
      items: formattedItems,
      total,
      page,
      perPage,
    }
  }

  async getStockSummary(): Promise<StockSummary> {
    await this.delay(180)
    const canViewCost = this.checkHasCostPermission()

    let totalUnits = 0
    let lowStockCount = 0
    let outOfStockCount = 0
    let totalCostAccum = 0

    this.stock.forEach((i) => {
      const qty = parseFloat(i.quantity) || 0
      totalUnits += qty

      const status = this.calculateStatus(i.quantity, i.minStock)
      if (status === 'low') lowStockCount += 1
      if (status === 'out') outOfStockCount += 1

      if (canViewCost && i.cost) {
        const cost = parseFloat(i.cost) || 0
        totalCostAccum += qty * cost
      }
    })

    const summary: StockSummary = {
      totalUnits,
      lowStockCount,
      outOfStockCount,
    }

    if (canViewCost) {
      summary.costValue = totalCostAccum.toFixed(2)
    }

    return summary
  }
}
