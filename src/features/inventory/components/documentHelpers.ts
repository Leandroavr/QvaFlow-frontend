import type { Location, Warehouse, StockItem } from '../types'

/**
 * Obtiene el nombre formateado de una localización junto con su almacén:
 * ej. "Pasillo 1 - Secos (Almacén Central)"
 */
export function getLocationDisplayName(
  locationCode: string,
  locations: Location[],
  warehouses: Warehouse[]
): string {
  const loc = locations.find((l) => l.code === locationCode)
  if (!loc) return locationCode
  const wh = warehouses.find((w) => w.code === loc.warehouseCode)
  return `${loc.name || loc.code} (${wh ? wh.name : loc.warehouseCode})`
}

/**
 * Obtiene el nombre del producto dado su código en el catálogo de existencias.
 */
export function getProductName(productCode: string, availableStock: StockItem[]): string {
  const match = availableStock.find((s) => s.productCode === productCode)
  return match ? match.productName : productCode
}

/**
 * Obtiene el stock disponible como DecimalString para un producto y localización dados.
 */
export function getStockAtLocation(
  productCode: string,
  locationCode: string,
  availableStock: StockItem[]
): string {
  if (!productCode || !locationCode) return '0.00'
  const match = availableStock.find(
    (s) => s.productCode === productCode && s.locationCode === locationCode
  )
  return match ? match.quantity : '0.00'
}
