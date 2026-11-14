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

  // Traslados de Inventario
  listTransfers(query?: StockTransferQueryParams): Promise<PaginatedResponse<StockTransfer>>
  getTransfer(id: Id): Promise<StockTransfer>
  createTransfer(dto: CreateStockTransferDto): Promise<StockTransfer>

  // Ajustes de Inventario
  listAdjustments(
    query?: InventoryAdjustmentQueryParams
  ): Promise<PaginatedResponse<InventoryAdjustment>>
  getAdjustment(id: Id): Promise<InventoryAdjustment>
  createAdjustment(dto: CreateInventoryAdjustmentDto): Promise<InventoryAdjustment>

  // Operaciones de existencias desde Ventas
  deductStock(productCode: string, quantity: DecimalString, warehouseCode?: string): Promise<void>
  restoreStock(productCode: string, quantity: DecimalString, warehouseCode?: string): Promise<void>
}
