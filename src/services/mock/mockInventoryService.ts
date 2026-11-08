import type { InventoryService } from '../interfaces/inventoryService'
import type { Id, PaginatedResponse } from '@/shared/types/api'
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
  StockTransfer,
  CreateStockTransferDto,
  StockTransferQueryParams,
  InventoryAdjustment,
  CreateInventoryAdjustmentDto,
  InventoryAdjustmentQueryParams,
  StockTransferItem,
  InventoryAdjustmentItem,
} from '@/features/inventory/types'
import type { DecimalString } from '@/shared/types/currency'
import {
  addDecimals,
  subtractDecimals,
  compareDecimals,
  normalizeDecimal,
} from '@/shared/utils/decimal'
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

/**
 * Traslados iniciales de prueba (3 documentos).
 */
const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 1,
    noDocument: 'TRF-2026-0001',
    date: '2026-10-25T14:30:00Z',
    status: 'CONFIRMED',
    reason: 'Reabastecimiento de mostrador por alta demanda',
    createdBy: 'almacenero',
    items: [
      {
        id: 1,
        productCode: '78910001',
        productName: 'Café Serrano Clásico 250g',
        quantity: '10.00',
        sourceLocationCode: 'LOC-CEN-P1',
        sourceWarehouseName: 'Almacén Central',
        targetLocationCode: 'LOC-TND-E1',
        targetWarehouseName: 'Tienda Principal',
      },
    ],
  },
  {
    id: 2,
    noDocument: 'TRF-2026-0002',
    date: '2026-10-26T10:15:00Z',
    status: 'CONFIRMED',
    reason: 'Traslado preventivo a nevera por temperatura',
    createdBy: 'almacenero',
    items: [
      {
        id: 2,
        productCode: '78910003',
        productName: 'Refresco Tukola Lata 330ml',
        quantity: '12.00',
        sourceLocationCode: 'LOC-CEN-P1',
        sourceWarehouseName: 'Almacén Central',
        targetLocationCode: 'LOC-NEV-B1',
        targetWarehouseName: 'Nevera y Frío',
      },
    ],
  },
  {
    id: 3,
    noDocument: 'TRF-2026-0003',
    date: '2026-10-27T16:45:00Z',
    status: 'CONFIRMED',
    reason: 'Reubicación de aceite por espacio en pasillo',
    createdBy: 'almacenero',
    items: [
      {
        id: 3,
        productCode: '78910002',
        productName: 'Aceite de Girasol Criollo 1L',
        quantity: '5.00',
        sourceLocationCode: 'LOC-CEN-P1',
        sourceWarehouseName: 'Almacén Central',
        targetLocationCode: 'LOC-CEN-EA',
        targetWarehouseName: 'Almacén Central',
      },
    ],
  },
]

/**
 * Ajustes iniciales de prueba (2 documentos, incluyendo conteo 0).
 */
const INITIAL_ADJUSTMENTS: InventoryAdjustment[] = [
  {
    id: 1,
    noDocument: 'AJU-2026-0001',
    date: '2026-10-25T16:00:00Z',
    status: 'CONFIRMED',
    reason: 'Ajuste por rotura de envase en exhibición',
    createdBy: 'almacenero',
    items: [
      {
        id: 1,
        productCode: '78910001',
        productName: 'Café Serrano Clásico 250g',
        locationCode: 'LOC-TND-E1',
        locationName: 'Estantería Expositora',
        warehouseName: 'Tienda Principal',
        systemQuantity: '26.00',
        countedQuantity: '24.00',
        difference: '-2.00',
      },
    ],
  },
  {
    id: 2,
    noDocument: 'AJU-2026-0002',
    date: '2026-10-26T18:00:00Z',
    status: 'CONFIRMED',
    reason: 'Baja definitiva por rotura de frío y descomposición',
    createdBy: 'almacenero',
    items: [
      {
        id: 2,
        productCode: '78910006',
        productName: 'Pollo Entero Congelado 1kg',
        locationCode: 'LOC-CONG-C1',
        locationName: 'Congelador de Cárnicos',
        warehouseName: 'Nevera y Frío',
        systemQuantity: '4.00',
        countedQuantity: '0.00',
        difference: '-4.00',
      },
    ],
  },
]

export class MockInventoryService implements InventoryService {
  private warehouses: Warehouse[] = JSON.parse(JSON.stringify(INITIAL_WAREHOUSES))
  private locations: Location[] = JSON.parse(JSON.stringify(INITIAL_LOCATIONS))
  private stock: StockItem[] = JSON.parse(JSON.stringify(INITIAL_STOCK))
  private transfers: StockTransfer[] = JSON.parse(JSON.stringify(INITIAL_TRANSFERS))
  private adjustments: InventoryAdjustment[] = JSON.parse(JSON.stringify(INITIAL_ADJUSTMENTS))

  private delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Comprueba si el usuario autenticado tiene un permiso específico.
   */
  private checkHasPermission(permission: string): boolean {
    try {
      const token = localStorage.getItem('qvaflow_token')
      if (token) {
        const match = Object.values(MOCK_USERS).find((u) => u.token === token)
        if (match) {
          return match.user.permissions.includes(permission)
        }
      }
      const rawUser = localStorage.getItem('qvaflow_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        return Array.isArray(user.permissions) && user.permissions.includes(permission)
      }
    } catch {
      // Ignorar fallo de lectura local
    }
    return false
  }

  private getCurrentUsername(): string | undefined {
    try {
      const token = localStorage.getItem('qvaflow_token')
      if (token) {
        const match = Object.values(MOCK_USERS).find((u) => u.token === token)
        if (match) return match.user.username
      }
      const rawUser = localStorage.getItem('qvaflow_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        return user.username
      }
    } catch {
      // Ignorar fallo de lectura local
    }
    return undefined
  }

  /**
   * Determina si el usuario autenticado tiene el permiso sensible products.view_cost.
   */
  private checkHasCostPermission(): boolean {
    return this.checkHasPermission('products.view_cost')
  }

  /**
   * Calcula el estado de stock de un producto ('ok' | 'low' | 'out') evaluando
   * el TOTAL sumado de todas sus localizaciones.
   * Regla de negocio:
   * - Si no existen filas de stock para el producto o total <= 0 -> 'out'
   * - Si total <= minStock (10 por defecto si no se especifica) -> 'low'
   * - En cualquier otro caso -> 'ok'
   */
  private calculateProductStatus(productCode: string, minStockOverride?: string): StockStatus {
    const items = this.stock.filter((s) => s.productCode === productCode)
    if (items.length === 0) {
      return 'out'
    }

    const totalQty = items.reduce((acc, s) => acc + (parseFloat(s.quantity) || 0), 0)
    if (totalQty <= 0) {
      return 'out'
    }

    // Usar minStockOverride o el minStock del primer registro del producto, por defecto 10
    const rawMin = minStockOverride ?? items[0]?.minStock
    const minStock = parseFloat(rawMin || '10') || 10

    if (totalQty <= minStock) {
      return 'low'
    }

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
    const index = this.warehouses.findIndex(
      (w) => w.code.toUpperCase() === code.trim().toUpperCase()
    )
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
      throw new ApiError(
        { code: 'LOCATION_NOT_FOUND', message: 'Localización no encontrada.' },
        404
      )
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
    const index = this.locations.findIndex(
      (l) => l.code.toUpperCase() === code.trim().toUpperCase()
    )
    if (index === -1) {
      throw new ApiError(
        { code: 'LOCATION_NOT_FOUND', message: 'Localización no encontrada.' },
        404
      )
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
      throw new ApiError(
        { code: 'LOCATION_NOT_FOUND', message: 'Localización no encontrada.' },
        404
      )
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

    // 5. Filtrado por estado de stock (evaluado sobre el TOTAL del producto)
    if (params.status && params.status !== 'all') {
      items = items.filter((i) => {
        const st = this.calculateProductStatus(i.productCode, i.minStock)
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

    // Formatear items con status derivado del total del producto y omitir 'cost' si no hay permiso
    const formattedItems = paged.map((i) => {
      const itemClone: StockItem = {
        ...i,
        status: this.calculateProductStatus(i.productCode, i.minStock),
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
    let totalCostAccum = 0

    // Acumular totalUnits y costValue sobre todas las existencias físicas
    this.stock.forEach((i) => {
      const qty = parseFloat(i.quantity) || 0
      totalUnits += qty

      if (canViewCost && i.cost) {
        const cost = parseFloat(i.cost) || 0
        totalCostAccum += qty * cost
      }
    })

    // Contar PRODUCTOS únicos para lowStockCount y outOfStockCount
    const uniqueProductCodes = Array.from(new Set(this.stock.map((i) => i.productCode)))
    let lowStockCount = 0
    let outOfStockCount = 0

    uniqueProductCodes.forEach((code) => {
      const status = this.calculateProductStatus(code)
      if (status === 'low') lowStockCount += 1
      if (status === 'out') outOfStockCount += 1
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

  // =========================================================================
  // Métodos Auxiliares de Numeración
  // =========================================================================

  private generateTransferNumber(): string {
    const year = new Date().getFullYear()
    const prefix = `TRF-${year}-`
    const currentYearNums = this.transfers
      .map((t) => t.noDocument)
      .filter((doc) => doc.startsWith(prefix))
      .map((doc) => parseInt(doc.replace(prefix, ''), 10))
      .filter((n) => !isNaN(n))
    const maxNum = currentYearNums.length > 0 ? Math.max(...currentYearNums) : 0
    const nextNum = (maxNum + 1).toString().padStart(4, '0')
    return `${prefix}${nextNum}`
  }

  private generateAdjustmentNumber(): string {
    const year = new Date().getFullYear()
    const prefix = `AJU-${year}-`
    const currentYearNums = this.adjustments
      .map((a) => a.noDocument)
      .filter((doc) => doc.startsWith(prefix))
      .map((doc) => parseInt(doc.replace(prefix, ''), 10))
      .filter((n) => !isNaN(n))
    const maxNum = currentYearNums.length > 0 ? Math.max(...currentYearNums) : 0
    const nextNum = (maxNum + 1).toString().padStart(4, '0')
    return `${prefix}${nextNum}`
  }

  // =========================================================================
  // Traslados de Inventario (/api/inventory/transfers)
  // =========================================================================

  async listTransfers(query?: StockTransferQueryParams): Promise<PaginatedResponse<StockTransfer>> {
    await this.delay()

    if (
      !this.checkHasPermission('inventory.transfer') &&
      !this.checkHasPermission('inventory.view')
    ) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para consultar traslados de inventario.',
        },
        403
      )
    }

    let filtered = [...this.transfers]

    // Búsqueda por número de documento o motivo
    if (query?.search) {
      const q = query.search.trim().toLowerCase()
      filtered = filtered.filter(
        (t) => t.noDocument.toLowerCase().includes(q) || t.reason.toLowerCase().includes(q)
      )
    }

    // Filtro de fechas (desde / hasta)
    if (query?.desde) {
      const desdeStr = query.desde.slice(0, 10)
      filtered = filtered.filter((t) => t.date.slice(0, 10) >= desdeStr)
    }
    if (query?.hasta) {
      const hastaStr = query.hasta.slice(0, 10)
      filtered = filtered.filter((t) => t.date.slice(0, 10) <= hastaStr)
    }

    // Filtro por estado
    if (query?.status) {
      filtered = filtered.filter((t) => t.status === query.status)
    }

    // Ordenamiento (por defecto date:desc)
    const sortField = query?.sort || 'date:desc'
    const [field, dir] = sortField.split(':')
    const order = dir === 'asc' ? 1 : -1

    filtered.sort((a, b) => {
      let valA = (a as unknown as Record<string, unknown>)[field]
      let valB = (b as unknown as Record<string, unknown>)[field]
      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * order
      }
      return ((valA as number) - (valB as number)) * order
    })

    const page = query?.page || 1
    const perPage = query?.perPage || 10
    const start = (page - 1) * perPage
    const items = filtered.slice(start, start + perPage)

    return {
      items: JSON.parse(JSON.stringify(items)),
      total: filtered.length,
      page,
      perPage,
    }
  }

  async getTransfer(id: Id): Promise<StockTransfer> {
    await this.delay()

    if (
      !this.checkHasPermission('inventory.transfer') &&
      !this.checkHasPermission('inventory.view')
    ) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para consultar traslados de inventario.',
        },
        403
      )
    }

    const found = this.transfers.find(
      (t) => String(t.id) === String(id) || t.noDocument === String(id)
    )

    if (!found) {
      throw new ApiError(
        {
          code: 'NOT_FOUND',
          message: 'El documento de traslado solicitado no existe.',
        },
        404
      )
    }

    return JSON.parse(JSON.stringify(found))
  }

  async createTransfer(dto: CreateStockTransferDto): Promise<StockTransfer> {
    await this.delay()

    if (!this.checkHasPermission('inventory.transfer')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para registrar traslados de inventario.',
        },
        403
      )
    }

    // 1. Validar items no vacío
    if (!dto.items || dto.items.length === 0) {
      throw new ApiError(
        {
          code: 'VALIDATION_ERROR',
          message: 'El traslado debe contener al menos un producto.',
          details: {
            items: ['Debe especificar al menos una línea de producto.'],
          },
        },
        400
      )
    }

    // 2. Validar cantidad > 0 y origen distinto de destino
    for (const item of dto.items) {
      if (compareDecimals(item.quantity, '0.00') <= 0) {
        throw new ApiError(
          {
            code: 'VALIDATION_ERROR',
            message: 'La cantidad a trasladar debe ser mayor que cero.',
            details: {
              quantity: ['La cantidad debe ser un valor positivo mayor que cero.'],
            },
          },
          400
        )
      }

      if (item.sourceLocationCode === item.targetLocationCode) {
        throw new ApiError(
          {
            code: 'VALIDATION_ERROR',
            message: 'La localización de origen no puede ser igual a la de destino.',
            details: {
              targetLocationCode: ['El destino debe ser diferente al origen.'],
            },
          },
          400
        )
      }
    }

    // 3. Validar existencia en catálogo (producto y localizaciones)
    for (const item of dto.items) {
      const srcLoc = this.locations.find((l) => l.code === item.sourceLocationCode)
      const tgtLoc = this.locations.find((l) => l.code === item.targetLocationCode)
      const productExists = this.stock.some((s) => s.productCode === item.productCode)

      if (!srcLoc || !tgtLoc || !productExists) {
        throw new ApiError(
          {
            code: 'NOT_FOUND',
            message: 'Producto o localización no encontrados en el catálogo.',
          },
          404
        )
      }
    }

    // 4. Validar stock suficiente en origen acumulando líneas del mismo producto y localización
    const requestedTotals = new Map<string, DecimalString>()
    for (const item of dto.items) {
      const key = `${item.productCode}::${item.sourceLocationCode}`
      const current = requestedTotals.get(key) || '0.00'
      requestedTotals.set(key, addDecimals(current, item.quantity))
    }

    for (const [key, totalReq] of requestedTotals.entries()) {
      const [pCode, sLoc] = key.split('::')
      const sourceStock = this.stock.find((s) => s.productCode === pCode && s.locationCode === sLoc)
      const available = sourceStock ? sourceStock.quantity : '0.00'

      if (compareDecimals(totalReq, available) > 0) {
        throw new ApiError(
          {
            code: 'STOCK_INSUFFICIENT',
            message: 'Stock insuficiente en la localización de origen para completar el traslado.',
            details: {
              productCode: pCode,
              requestedQuantity: totalReq,
              availableQuantity: available,
              sourceLocationCode: sLoc,
            },
          },
          409
        )
      }
    }

    // 5. Aplicación atómica sobre las existencias
    const now = new Date().toISOString()
    const enrichedItems: StockTransferItem[] = []

    for (let idx = 0; idx < dto.items.length; idx++) {
      const item = dto.items[idx]
      const sourceLoc = this.locations.find((l) => l.code === item.sourceLocationCode)!
      const targetLoc = this.locations.find((l) => l.code === item.targetLocationCode)!
      const sourceWh = this.warehouses.find((w) => w.code === sourceLoc.warehouseCode)
      const targetWh = this.warehouses.find((w) => w.code === targetLoc.warehouseCode)

      const sourceStock = this.stock.find(
        (s) => s.productCode === item.productCode && s.locationCode === item.sourceLocationCode
      )!

      // Descontar del origen
      sourceStock.quantity = subtractDecimals(sourceStock.quantity, item.quantity)
      sourceStock.updatedAt = now

      // Aumentar en el destino
      let targetStock = this.stock.find(
        (s) => s.productCode === item.productCode && s.locationCode === item.targetLocationCode
      )

      if (targetStock) {
        targetStock.quantity = addDecimals(targetStock.quantity, item.quantity)
        targetStock.updatedAt = now
      } else {
        targetStock = {
          productCode: sourceStock.productCode,
          productName: sourceStock.productName,
          category: sourceStock.category,
          unit: sourceStock.unit,
          warehouseCode: targetLoc.warehouseCode,
          warehouseName: targetWh?.name ?? targetLoc.warehouseCode,
          locationCode: targetLoc.code,
          locationName: targetLoc.name,
          quantity: normalizeDecimal(item.quantity),
          cost: sourceStock.cost,
          price: sourceStock.price,
          minStock: sourceStock.minStock,
          updatedAt: now,
        }
        this.stock.push(targetStock)
      }

      // Recalcular estado de stock para todas las filas del producto
      const newStatus = this.calculateProductStatus(item.productCode)
      this.stock
        .filter((s) => s.productCode === item.productCode)
        .forEach((s) => {
          s.status = newStatus
        })

      enrichedItems.push({
        id: idx + 1,
        productCode: item.productCode,
        productName: sourceStock.productName,
        quantity: normalizeDecimal(item.quantity),
        sourceLocationCode: item.sourceLocationCode,
        sourceWarehouseName: sourceWh?.name ?? item.sourceLocationCode,
        targetLocationCode: item.targetLocationCode,
        targetWarehouseName: targetWh?.name ?? item.targetLocationCode,
      })
    }

    const newTransfer: StockTransfer = {
      id:
        this.transfers.length > 0
          ? Math.max(...this.transfers.map((t) => Number(t.id) || 0)) + 1
          : 1,
      noDocument: this.generateTransferNumber(),
      date: now,
      status: 'CONFIRMED',
      reason: dto.reason,
      createdBy: this.getCurrentUsername(),
      items: enrichedItems,
    }

    this.transfers.unshift(newTransfer)
    return JSON.parse(JSON.stringify(newTransfer))
  }

  // =========================================================================
  // Ajustes de Inventario (/api/inventory/adjustments)
  // =========================================================================

  async listAdjustments(
    query?: InventoryAdjustmentQueryParams
  ): Promise<PaginatedResponse<InventoryAdjustment>> {
    await this.delay()

    if (
      !this.checkHasPermission('inventory.adjust') &&
      !this.checkHasPermission('inventory.view')
    ) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para consultar ajustes de inventario.',
        },
        403
      )
    }

    let filtered = [...this.adjustments]

    // Búsqueda por número de documento o motivo
    if (query?.search) {
      const q = query.search.trim().toLowerCase()
      filtered = filtered.filter(
        (a) => a.noDocument.toLowerCase().includes(q) || a.reason.toLowerCase().includes(q)
      )
    }

    // Filtro de fechas (desde / hasta)
    if (query?.desde) {
      const desdeStr = query.desde.slice(0, 10)
      filtered = filtered.filter((a) => a.date.slice(0, 10) >= desdeStr)
    }
    if (query?.hasta) {
      const hastaStr = query.hasta.slice(0, 10)
      filtered = filtered.filter((a) => a.date.slice(0, 10) <= hastaStr)
    }

    // Filtro por estado
    if (query?.status) {
      filtered = filtered.filter((a) => a.status === query.status)
    }

    // Ordenamiento (por defecto date:desc)
    const sortField = query?.sort || 'date:desc'
    const [field, dir] = sortField.split(':')
    const order = dir === 'asc' ? 1 : -1

    filtered.sort((a, b) => {
      let valA = (a as unknown as Record<string, unknown>)[field]
      let valB = (b as unknown as Record<string, unknown>)[field]
      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * order
      }
      return ((valA as number) - (valB as number)) * order
    })

    const page = query?.page || 1
    const perPage = query?.perPage || 10
    const start = (page - 1) * perPage
    const items = filtered.slice(start, start + perPage)

    return {
      items: JSON.parse(JSON.stringify(items)),
      total: filtered.length,
      page,
      perPage,
    }
  }

  async getAdjustment(id: Id): Promise<InventoryAdjustment> {
    await this.delay()

    if (
      !this.checkHasPermission('inventory.adjust') &&
      !this.checkHasPermission('inventory.view')
    ) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para consultar ajustes de inventario.',
        },
        403
      )
    }

    const found = this.adjustments.find(
      (a) => String(a.id) === String(id) || a.noDocument === String(id)
    )

    if (!found) {
      throw new ApiError(
        {
          code: 'NOT_FOUND',
          message: 'El documento de ajuste solicitado no existe.',
        },
        404
      )
    }

    return JSON.parse(JSON.stringify(found))
  }

  async createAdjustment(dto: CreateInventoryAdjustmentDto): Promise<InventoryAdjustment> {
    await this.delay()

    if (!this.checkHasPermission('inventory.adjust')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para registrar ajustes de inventario.',
        },
        403
      )
    }

    // 1. Validar items no vacío
    if (!dto.items || dto.items.length === 0) {
      throw new ApiError(
        {
          code: 'VALIDATION_ERROR',
          message: 'El ajuste debe contener al menos un producto.',
          details: {
            items: ['Debe especificar al menos una línea de producto.'],
          },
        },
        400
      )
    }

    // 2. Validar localización obligatoria y countedQuantity >= 0 (0 es válido)
    for (const item of dto.items) {
      if (!item.locationCode) {
        throw new ApiError(
          {
            code: 'VALIDATION_ERROR',
            message: 'La localización es obligatoria para cada producto.',
            details: {
              locationCode: ['Localización no válida o requerida.'],
            },
          },
          400
        )
      }

      if (compareDecimals(item.countedQuantity, '0.00') < 0) {
        throw new ApiError(
          {
            code: 'VALIDATION_ERROR',
            message: 'La cantidad física contada no puede ser negativa.',
            details: {
              countedQuantity: ['La cantidad física contada no puede ser menor que 0.'],
            },
          },
          400
        )
      }
    }

    // 3. Validar existencia en catálogo (producto y localización)
    for (const item of dto.items) {
      const loc = this.locations.find((l) => l.code === item.locationCode)
      const productExists = this.stock.some((s) => s.productCode === item.productCode)

      if (!loc || !productExists) {
        throw new ApiError(
          {
            code: 'NOT_FOUND',
            message: 'Producto o localización no encontrados en el catálogo.',
          },
          404
        )
      }
    }

    // 4. Validar combinación duplicada producto+localización en el documento
    const seen = new Set<string>()
    for (const item of dto.items) {
      const key = `${item.productCode}::${item.locationCode}`
      if (seen.has(key)) {
        throw new ApiError(
          {
            code: 'VALIDATION_ERROR',
            message:
              'No se puede incluir la misma combinación de producto y localización más de una vez en el ajuste.',
            details: {
              items: ['Combinación producto y localización duplicada en el documento.'],
            },
          },
          400
        )
      }
      seen.add(key)
    }

    // 5. Aplicación atómica y cálculo de systemQuantity y difference
    const now = new Date().toISOString()
    const enrichedItems: InventoryAdjustmentItem[] = []

    for (let idx = 0; idx < dto.items.length; idx++) {
      const item = dto.items[idx]
      const loc = this.locations.find((l) => l.code === item.locationCode)!
      const wh = this.warehouses.find((w) => w.code === loc.warehouseCode)

      let stockRow = this.stock.find(
        (s) => s.productCode === item.productCode && s.locationCode === item.locationCode
      )
      const template = this.stock.find((s) => s.productCode === item.productCode)!

      const systemQuantity = stockRow ? stockRow.quantity : '0.00'
      const countedQuantity = normalizeDecimal(item.countedQuantity)
      const difference = subtractDecimals(countedQuantity, systemQuantity)

      if (stockRow) {
        stockRow.quantity = countedQuantity
        stockRow.updatedAt = now
      } else {
        stockRow = {
          productCode: template.productCode,
          productName: template.productName,
          category: template.category,
          unit: template.unit,
          warehouseCode: loc.warehouseCode,
          warehouseName: wh?.name ?? loc.warehouseCode,
          locationCode: loc.code,
          locationName: loc.name,
          quantity: countedQuantity,
          cost: template.cost,
          price: template.price,
          minStock: template.minStock,
          updatedAt: now,
        }
        this.stock.push(stockRow)
      }

      // Recalcular estado de stock
      const newStatus = this.calculateProductStatus(item.productCode)
      this.stock
        .filter((s) => s.productCode === item.productCode)
        .forEach((s) => {
          s.status = newStatus
        })

      enrichedItems.push({
        id: idx + 1,
        productCode: item.productCode,
        productName: template.productName,
        locationCode: loc.code,
        locationName: loc.name,
        warehouseName: wh?.name ?? loc.warehouseCode,
        systemQuantity,
        countedQuantity,
        difference,
      })
    }

    const newAdjustment: InventoryAdjustment = {
      id:
        this.adjustments.length > 0
          ? Math.max(...this.adjustments.map((a) => Number(a.id) || 0)) + 1
          : 1,
      noDocument: this.generateAdjustmentNumber(),
      date: now,
      status: 'CONFIRMED',
      reason: dto.reason,
      createdBy: this.getCurrentUsername(),
      items: enrichedItems,
    }

    this.adjustments.unshift(newAdjustment)
    return JSON.parse(JSON.stringify(newAdjustment))
  }
}
