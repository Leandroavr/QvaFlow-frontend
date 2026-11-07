import type { DecimalString } from '@/shared/types/currency'
import type { Id, PaginationParams } from '@/shared/types/api'

export interface Warehouse {
  code: string
  name: string
  locationsCount?: number
  stockUnits?: number
}

export interface Location {
  code: string
  warehouseCode: string
  name?: string
  stockUnits?: number
}

export type StockStatus = 'ok' | 'low' | 'out'

export interface StockItem {
  productCode: string
  productName: string
  category: string
  unit: string
  warehouseCode: string
  warehouseName?: string
  locationCode: string
  locationName?: string
  quantity: DecimalString
  cost?: DecimalString
  price: DecimalString
  minStock?: DecimalString
  updatedAt: string
  status?: StockStatus
}

export interface StockSummary {
  totalUnits: number
  lowStockCount: number
  outOfStockCount: number
  costValue?: DecimalString
}

export interface StockQueryParams {
  page?: number
  perPage?: number
  sort?: string
  search?: string
  warehouse?: string
  location?: string
  category?: string
  status?: StockStatus | string
}

export interface CreateWarehouseDto {
  code: string
  name: string
}

export interface UpdateWarehouseDto {
  name: string
}

export interface CreateLocationDto {
  code: string
  warehouseCode: string
  name?: string
}

export interface UpdateLocationDto {
  name?: string
}

/**
 * Estado operativo del documento de inventario (traslados y ajustes).
 * Por defecto en esta fase de desarrollo el mock genera y asienta de inmediato 'CONFIRMED'.
 * 'DRAFT' y 'CANCELLED' son estados opcionales en el contrato, sujetos a confirmación del backend.
 */
export type DocumentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

/**
 * Parámetros de consulta y filtrado paginado para el listado de documentos de inventario.
 * Reutiliza PaginationParams (page, perPage, sort, search) y añade rangos de fecha y estado.
 */
export interface InventoryDocumentQueryParams extends PaginationParams {
  pageSize?: number
  desde?: string
  hasta?: string
  dateFrom?: string
  dateTo?: string
  status?: DocumentStatus | string
}

export type StockTransferQueryParams = InventoryDocumentQueryParams
export type InventoryAdjustmentQueryParams = InventoryDocumentQueryParams

/**
 * Línea de detalle de un documento de traslado de stock.
 */
export interface StockTransferItem {
  id?: Id
  productCode: string
  productName: string
  quantity: DecimalString
  sourceLocationCode: string
  targetLocationCode: string
  sourceWarehouseName: string
  targetWarehouseName: string
}

/**
 * Documento de traslado de mercancía entre localizaciones físicas.
 */
export interface StockTransfer {
  id: Id
  noDocument: string
  date: string
  status?: DocumentStatus
  reason: string
  createdBy?: string
  items: StockTransferItem[]
}

/**
 * Línea de detalle para la creación de un traslado de stock.
 */
export interface CreateStockTransferItemDto {
  productCode: string
  quantity: DecimalString
  sourceLocationCode: string
  targetLocationCode: string
}

/**
 * Carga útil para registrar un nuevo documento de traslado de stock.
 */
export interface CreateStockTransferDto {
  reason: string
  items: CreateStockTransferItemDto[]
}

/**
 * Línea de detalle de un ajuste de inventario con cuadratura física vs sistema.
 */
export interface InventoryAdjustmentItem {
  id?: Id
  productCode: string
  productName: string
  locationCode: string
  warehouseName: string
  systemQuantity: DecimalString
  countedQuantity: DecimalString
  difference: DecimalString
}

/**
 * Documento de ajuste de inventario por conteo físico o corrección de stock.
 */
export interface InventoryAdjustment {
  id: Id
  noDocument: string
  date: string
  status?: DocumentStatus
  reason: string
  createdBy?: string
  items: InventoryAdjustmentItem[]
}

/**
 * Línea de detalle para la creación de un ajuste de inventario.
 * El frontend solo envía countedQuantity; systemQuantity y difference son calculados por el servidor.
 */
export interface CreateInventoryAdjustmentItemDto {
  productCode: string
  locationCode: string
  countedQuantity: DecimalString
}

/**
 * Carga útil para registrar un nuevo documento de ajuste de inventario.
 */
export interface CreateInventoryAdjustmentDto {
  reason: string
  items: CreateInventoryAdjustmentItemDto[]
}
