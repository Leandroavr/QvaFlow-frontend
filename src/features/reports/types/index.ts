import type { DecimalString, Currency } from '@/shared/types/currency'
import type { Id, PaginationParams, PaginatedResponse } from '@/shared/types/api'

export type { PaginatedResponse, PaginationParams }

/**
 * Atajos temporales predefinidos para la selección rápida de períodos en la UI.
 */
export type ReportPeriodPreset =
  'today' | 'last_7_days' | 'current_month' | 'previous_month' | 'custom'

/**
 * Parámetros comunes de filtrado temporal y dimensional para reportes.
 */
export interface ReportQuery {
  /** Fecha inicial del período en formato ISO 8601 (YYYY-MM-DD) */
  desde: string
  /** Fecha final del período en formato ISO 8601 (YYYY-MM-DD) */
  hasta: string
  /** Tipo de operación a incluir en el análisis */
  type?: 'ALL' | 'SALE' | 'PURCHASE'
  /** Filtro opcional por identificador de categoría de producto */
  categoryId?: string | number
  /** Filtro opcional por código de almacén */
  warehouseCode?: string
}

/**
 * Desglose de importe monetario por divisa real de cobro/liquidación.
 */
export interface SalesByCurrency {
  currency: Currency
  amount: DecimalString
}

/**
 * Indicador del estado de salud comercial según umbral configurado en el backend.
 */
export type MarginHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL'

/**
 * Resumen consolidado de indicadores financieros clave (KPIs) para un período.
 * Nota de seguridad / RBAC: Los campos sensibles (purchasesTotal, purchasesCount,
 * cogsTotal, grossProfit, marginPercent, cashBalance, marginHealth) son omitidos
 * por el backend si el usuario carece del permiso `products.view_cost`.
 */
export interface FinanceSummary {
  /** Total de ingresos por ventas en moneda base contable */
  salesTotal: DecimalString
  /** Cantidad total de tickets u operaciones de venta */
  salesCount: number

  // --- Campos sensibles condicionados al permiso products.view_cost ---
  /** Total de egresos por compras a proveedores (opcional, requiere products.view_cost) */
  purchasesTotal?: DecimalString
  /** Cantidad total de facturas de compra procesadas (opcional, requiere products.view_cost) */
  purchasesCount?: number
  /** Costo total de las mercancías efectivamente vendidas (COGS) */
  cogsTotal?: DecimalString
  /** Ganancia comercial bruta calculada (salesTotal - cogsTotal) */
  grossProfit?: DecimalString
  /** Porcentaje de rentabilidad comercial sobre ventas */
  marginPercent?: DecimalString
  /** Balance neto de caja por flujo directo (salesTotal - purchasesTotal) */
  cashBalance?: DecimalString
  /** Evaluación cualitativa de rentabilidad según umbrales del backend */
  marginHealth?: MarginHealthStatus

  /** Moneda contable base del reporte (por defecto 'USD') */
  currency: Currency
  /** Desglose opcional de ventas por moneda real de cobro */
  salesByCurrency?: SalesByCurrency[]
}

/**
 * Granularidad temporal para series cronológicas de evolución financiera.
 */
export type TimeSeriesGranularity = 'day' | 'week' | 'month'

/**
 * Punto de datos individual en la serie temporal financiera.
 * Los campos purchasesTotal y grossProfit son opcionales y solo se incluyen
 * con el permiso `products.view_cost`.
 */
export interface TimeSeriesPoint {
  /** Marca temporal o fecha representativa del punto (ISO 8601: YYYY-MM-DD o YYYY-MM) */
  date: string
  /** Total de ventas acumuladas en el punto */
  salesTotal: DecimalString
  /** Total de compras a proveedores en el punto (opcional, sensible) */
  purchasesTotal?: DecimalString
  /** Ganancia bruta generada en el punto (opcional, sensible) */
  grossProfit?: DecimalString
}

/**
 * Serie temporal de evolución financiera para gráficos de línea o barras.
 */
export interface FinanceTimeSeries {
  /** Granularidad temporal aplicada a los datos */
  granularity: TimeSeriesGranularity
  /** Puntos cronológicos de la serie */
  points: TimeSeriesPoint[]
}

/**
 * Distribución de volumen de venta e ingresos por categoría de catálogo.
 */
export interface CategorySales {
  categoryId: string | number
  categoryName: string
  salesTotal: DecimalString
  unitsSold: DecimalString
}

/**
 * Registro de rendimiento para los productos de mayor rotación / recaudación.
 */
export interface TopProduct {
  productId: string
  code: string
  name: string
  category: string
  unitsSold: DecimalString
  revenue: DecimalString
  rotationPercent: DecimalString // 0-100 decimal string (ej: '100.00', '75.50')

  // Compatibilidad con contratos previos
  productCode?: string
  productName?: string
  categoryName?: string
}

/**
 * Parámetros de consulta para el ranking de productos más vendidos.
 */
export interface TopProductsQueryParams {
  from?: string
  to?: string
  limit?: number
  // Aliases de compatibilidad
  desde?: string
  hasta?: string
  categoryId?: string | number
  warehouseCode?: string
}

/**
 * Producto inmovilizado o sin ventas recientes en almacenes.
 * El campo tiedUpCapital es sensible y solo se incluye con `products.view_cost`.
 */
export interface IdleProduct {
  productId: string
  code: string
  name: string
  category: string
  stockQuantity: DecimalString
  lastSaleDate: string | null
  daysWithoutSale: number | null
  /** Capital retenido en stock calculado como stock * costPrice en USD (opcional, sensible) */
  tiedUpCapital?: DecimalString

  // Compatibilidad con contratos previos
  stock?: DecimalString
  productCode?: string
  productName?: string
  warehouseName?: string
}

/**
 * Parámetros de consulta para productos ociosos.
 */
export interface IdleProductsQueryParams {
  days?: number
  page?: number
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
  warehouseCode?: string
  categoryId?: string | number
  // Aliases de compatibilidad
  perPage?: number
}

/**
 * Respuesta paginada del endpoint de productos ociosos.
 */
export interface IdleProductsResponse {
  items: IdleProduct[]
  total: number
  page?: number
  pageSize?: number
  /** Suma del capital retenido de todos los productos ociosos (opcional, requiere products.view_cost) */
  totalTiedUpCapital?: DecimalString
}

/**
 * Movimiento individual en la auditoría del detalle financiero.
 * Los movimientos de tipo 'PURCHASE' solo son retornados por la API
 * para usuarios que cuenten con el permiso `products.view_cost`.
 */
export interface ReportMovement {
  id: Id
  /** Fecha y hora exacta de la operación en formato ISO 8601 */
  date: string
  type: 'SALE' | 'PURCHASE'
  reference: string
  description: string
  categoryName: string
  warehouseName: string
  amount: DecimalString
  currency: Currency
  paymentMethod: string
}

/**
 * Parámetros de consulta paginada para el listado de movimientos de auditoría financiera.
 */
export interface ReportMovementQueryParams extends PaginationParams, Partial<ReportQuery> {}
