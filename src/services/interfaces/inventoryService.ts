import type { PaginatedResponse } from '@/shared/types/api'
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
} from '@/features/inventory/types'

export interface InventoryService {
  // Almacenes
  getWarehouses(): Promise<Warehouse[]>
  getWarehouseByCode(code: string): Promise<Warehouse>
  createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse>
  updateWarehouse(code: string, dto: UpdateWarehouseDto): Promise<Warehouse>
  deleteWarehouse(code: string): Promise<void>

  // Localizaciones
  getLocations(warehouseCode?: string): Promise<Location[]>
  getLocationByCode(code: string): Promise<Location>
  createLocation(dto: CreateLocationDto): Promise<Location>
  updateLocation(code: string, dto: UpdateLocationDto): Promise<Location>
  deleteLocation(code: string): Promise<void>

  // Existencias / Stock
  getStock(params?: StockQueryParams): Promise<PaginatedResponse<StockItem>>
  getStockSummary(): Promise<StockSummary>
}
