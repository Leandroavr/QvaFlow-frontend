import type { PaginatedResponse } from '@/shared/types/api'
import type {
  ReportQuery,
  FinanceSummary,
  TimeSeriesGranularity,
  FinanceTimeSeries,
  CategorySales,
  TopProduct,
  TopProductsQueryParams,
  IdleProduct,
  IdleProductsQueryParams,
  IdleProductsResponse,
  ReportMovement,
  ReportMovementQueryParams,
} from '@/features/reports/types'

export interface ReportsService {
  /**
   * Resumen financiero consolidado con KPIs agregados.
   * Si el usuario carece de products.view_cost, los campos de compras, COGS, ganancia y margen son omitidos.
   */
  getFinanceSummary(query?: Partial<ReportQuery>): Promise<FinanceSummary>

  /**
   * Evolución financiera cronológica en serie temporal (día, semana, mes) para gráficos.
   */
  getFinanceTimeSeries(
    query?: Partial<ReportQuery>,
    granularity?: TimeSeriesGranularity
  ): Promise<FinanceTimeSeries>

  /**
   * Agregado de ventas y unidades por categoría de catálogo.
   */
  getSalesByCategory(query?: Partial<ReportQuery>): Promise<CategorySales[]>

  /**
   * Ranking de productos de mayor rotación por unidades comercializadas.
   */
  getTopProducts(
    query?: TopProductsQueryParams | Partial<ReportQuery>,
    limit?: number
  ): Promise<TopProduct[]>

  /**
   * Listado paginado de productos en stock sin ventas en los últimos N días.
   */
  getIdleProducts(
    query?: IdleProductsQueryParams | Partial<ReportQuery>,
    days?: number
  ): Promise<IdleProductsResponse & IdleProduct[]>

  /**
   * Auditoría detallada y paginada de movimientos (ventas y compras).
   */
  listMovements(query?: ReportMovementQueryParams): Promise<PaginatedResponse<ReportMovement>>
}
