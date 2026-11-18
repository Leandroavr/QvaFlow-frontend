import type { InventoryService } from '../interfaces/inventoryService'
import type { Id, PaginatedResponse } from '@/shared/types/api'
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
  StockTransfer,
  CreateStockTransferDto,
  StockTransferQueryParams,
  InventoryAdjustment,
  CreateInventoryAdjustmentDto,
  InventoryAdjustmentQueryParams,
} from '@/features/inventory/types'
import { httpClient } from '../api/httpClient'

/**
 * Implementación HTTP de InventoryService para conectar con el backend Symfony.
 *
 * GUÍA DE INTEGRACIÓN PARA EL DESARROLLADOR DE BACKEND:
 * Cada método documenta la ruta y cuerpo esperado según /docs/API_CONTRACT.md.
 */
export class HttpInventoryService implements InventoryService {
  /**
   * TODO: [Backend Symfony] Endpoint GET /warehouses
   * Response: Warehouse[]
   */
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await httpClient.get<Warehouse[]>('/warehouses')
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /warehouses/{code}
   * Response: Warehouse
   */
  async getWarehouseByCode(code: string): Promise<Warehouse> {
    const response = await httpClient.get<Warehouse>(`/warehouses/${encodeURIComponent(code)}`)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint POST /warehouses
   * Body: CreateWarehouseDto { code, name }
   * Response 201: Warehouse
   * Errors: 409 CODE_ALREADY_EXISTS, 422 VALIDATION_FAILED
   */
  async createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    const response = await httpClient.post<Warehouse>('/warehouses', dto)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint PUT /warehouses/{code}
   * Body: UpdateWarehouseDto { name }
   * Response: Warehouse
   */
  async updateWarehouse(code: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const response = await httpClient.put<Warehouse>(`/warehouses/${encodeURIComponent(code)}`, dto)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint DELETE /warehouses/{code}
   * Response: 204 No Content
   * Errors: 409 WAREHOUSE_HAS_STOCK (si tiene existencias)
   */
  async deleteWarehouse(code: string): Promise<void> {
    await httpClient.delete(`/warehouses/${encodeURIComponent(code)}`)
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /locations (o /warehouses/{code}/locations)
   * Query params opcionales: ?warehouseCode=...
   * Response: Location[]
   */
  async getLocations(warehouseCode?: string): Promise<Location[]> {
    if (warehouseCode) {
      const response = await httpClient.get<Location[]>(
        `/warehouses/${encodeURIComponent(warehouseCode)}/locations`
      )
      return response.data
    }
    const response = await httpClient.get<Location[]>('/locations')
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /locations/{code}
   * Response: Location
   */
  async getLocationByCode(code: string): Promise<Location> {
    const response = await httpClient.get<Location>(`/locations/${encodeURIComponent(code)}`)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint POST /locations
   * Body: CreateLocationDto { code, warehouseCode, name }
   * Response 201: Location
   * Errors: 409 CODE_ALREADY_EXISTS, 422 VALIDATION_FAILED
   */
  async createLocation(dto: CreateLocationDto): Promise<Location> {
    const response = await httpClient.post<Location>('/locations', dto)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint PUT /locations/{code}
   * Body: UpdateLocationDto { name }
   * Response: Location
   */
  async updateLocation(code: string, dto: UpdateLocationDto): Promise<Location> {
    const response = await httpClient.put<Location>(`/locations/${encodeURIComponent(code)}`, dto)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint DELETE /locations/{code}
   * Response: 204 No Content
   * Errors: 409 LOCATION_HAS_STOCK (si tiene existencias)
   */
  async deleteLocation(code: string): Promise<void> {
    await httpClient.delete(`/locations/${encodeURIComponent(code)}`)
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /inventory/stock
   * Query Params: { page, perPage, sort, search, warehouse, location, category, status }
   * Response: PaginatedResponse<StockItem>
   * Nota: Si el usuario carece de 'products.view_cost', el backend no incluye 'cost'.
   */
  async getStock(params?: StockQueryParams): Promise<PaginatedResponse<StockItem>> {
    const response = await httpClient.get<PaginatedResponse<StockItem>>('/inventory/stock', {
      params,
    })
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /inventory/summary
   * Response: StockSummary { totalUnits, lowStockCount, outOfStockCount, costValue? }
   * Nota: Si el usuario carece de 'products.view_cost', el backend no incluye 'costValue'.
   */
  async getStockSummary(): Promise<StockSummary> {
    const response = await httpClient.get<StockSummary>('/inventory/summary')
    return response.data
  }

  // =========================================================================
  // Traslados de Inventario (/api/inventory/transfers)
  // =========================================================================

  /**
   * TODO: [Backend Symfony] Endpoint GET /inventory/transfers
   * Query Params: { page, perPage, sort, search, desde, hasta, status }
   * Response: PaginatedResponse<StockTransfer>
   */
  async listTransfers(query?: StockTransferQueryParams): Promise<PaginatedResponse<StockTransfer>> {
    const response = await httpClient.get<PaginatedResponse<StockTransfer>>(
      '/inventory/transfers',
      { params: query }
    )
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /inventory/transfers/{id}
   * Response: StockTransfer (detalle con líneas items)
   */
  async getTransfer(id: Id): Promise<StockTransfer> {
    const response = await httpClient.get<StockTransfer>(
      `/inventory/transfers/${encodeURIComponent(String(id))}`
    )
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint POST /inventory/transfers
   * Body: CreateStockTransferDto { reason, items: [{ productCode, quantity, sourceLocationCode, targetLocationCode }] }
   * Response 201: StockTransfer
   * Errors: 400 VALIDATION_ERROR, 403 FORBIDDEN, 404 NOT_FOUND, 409 STOCK_INSUFFICIENT
   */
  async createTransfer(dto: CreateStockTransferDto): Promise<StockTransfer> {
    const response = await httpClient.post<StockTransfer>('/inventory/transfers', dto)
    return response.data
  }

  // =========================================================================
  // Ajustes de Inventario (/api/inventory/adjustments)
  // =========================================================================

  /**
   * TODO: [Backend Symfony] Endpoint GET /inventory/adjustments
   * Query Params: { page, perPage, sort, search, desde, hasta, status }
   * Response: PaginatedResponse<InventoryAdjustment>
   */
  async listAdjustments(
    query?: InventoryAdjustmentQueryParams
  ): Promise<PaginatedResponse<InventoryAdjustment>> {
    const response = await httpClient.get<PaginatedResponse<InventoryAdjustment>>(
      '/inventory/adjustments',
      { params: query }
    )
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /inventory/adjustments/{id}
   * Response: InventoryAdjustment (detalle con líneas items)
   */
  async getAdjustment(id: Id): Promise<InventoryAdjustment> {
    const response = await httpClient.get<InventoryAdjustment>(
      `/inventory/adjustments/${encodeURIComponent(String(id))}`
    )
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint POST /inventory/adjustments
   * Body: CreateInventoryAdjustmentDto { reason, items: [{ productCode, locationCode, countedQuantity }] }
   * Response 201: InventoryAdjustment
   * Errors: 400 VALIDATION_ERROR, 403 FORBIDDEN, 404 NOT_FOUND
   */
  async createAdjustment(dto: CreateInventoryAdjustmentDto): Promise<InventoryAdjustment> {
    const response = await httpClient.post<InventoryAdjustment>('/inventory/adjustments', dto)
    return response.data
  }

  async deductStock(
    _productCode: string,
    _quantity: string,
    _warehouseCode?: string,
    _reason?: string
  ): Promise<void> {
    // Delegado de manera autoritativa al backend Symfony en POST /api/sales
  }

  async restoreStock(
    _productCode: string,
    _quantity: string,
    _warehouseCode?: string
  ): Promise<void> {
    // Delegado de manera autoritativa al backend Symfony en POST /api/sales/{id}/cancel
  }
}
