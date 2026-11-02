import type { DecimalString } from '@/shared/types/currency'

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
