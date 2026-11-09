import type { ReportsService } from '../interfaces/reportsService'
import type { PaginatedResponse } from '@/shared/types/api'
import type {
  ReportQuery,
  FinanceSummary,
  TimeSeriesGranularity,
  FinanceTimeSeries,
  CategorySales,
  TopProduct,
  IdleProduct,
  ReportMovement,
  ReportMovementQueryParams,
} from '@/features/reports/types'
import { httpClient } from '../api/httpClient'

/**
 * Implementación HTTP de ReportsService para conectar con el backend Symfony.
 *
 * GUÍA DE INTEGRACIÓN PARA EL DESARROLLADOR DE BACKEND:
 * Cada método documenta la ruta y parámetros esperados según docs/API_CONTRACT.md (Sección 9).
 */
export class HttpReportsService implements ReportsService {
  /**
   * TODO: [Backend Symfony] Endpoint GET /reports/finance-summary
   * Query params: { desde?, hasta?, warehouseCode? }
   * Response: FinanceSummary
   * Errors: 400 INVALID_DATE_RANGE / DATE_RANGE_EXCEEDED, 403 FORBIDDEN
   */
  async getFinanceSummary(query?: Partial<ReportQuery>): Promise<FinanceSummary> {
    const response = await httpClient.get<FinanceSummary>('/reports/finance-summary', {
      params: query,
    })
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /reports/finance-timeseries
   * Query params: { desde?, hasta?, granularity?, type?, categoryId?, warehouseCode? }
   * Response: FinanceTimeSeries
   * Errors: 400 INVALID_DATE_RANGE / DATE_RANGE_EXCEEDED, 403 FORBIDDEN
   */
  async getFinanceTimeSeries(
    query?: Partial<ReportQuery>,
    granularity: TimeSeriesGranularity = 'day'
  ): Promise<FinanceTimeSeries> {
    const response = await httpClient.get<FinanceTimeSeries>('/reports/finance-timeseries', {
      params: { ...query, granularity },
    })
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /reports/sales-by-category
   * Query params: { desde?, hasta?, warehouseCode? }
   * Response: CategorySales[]
   * Errors: 400 INVALID_DATE_RANGE / DATE_RANGE_EXCEEDED, 403 FORBIDDEN
   */
  async getSalesByCategory(query?: Partial<ReportQuery>): Promise<CategorySales[]> {
    const response = await httpClient.get<CategorySales[]>('/reports/sales-by-category', {
      params: query,
    })
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /reports/top-products
   * Query params: { desde?, hasta?, limit?, warehouseCode? }
   * Response: TopProduct[]
   * Errors: 400 INVALID_DATE_RANGE / DATE_RANGE_EXCEEDED, 403 FORBIDDEN
   */
  async getTopProducts(query?: Partial<ReportQuery>, limit = 5): Promise<TopProduct[]> {
    const response = await httpClient.get<TopProduct[]>('/reports/top-products', {
      params: { ...query, limit },
    })
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /reports/idle-products
   * Query params: { days?, warehouseCode? }
   * Response: IdleProduct[]
   * Errors: 403 FORBIDDEN
   */
  async getIdleProducts(query?: Partial<ReportQuery>, days = 30): Promise<IdleProduct[]> {
    const response = await httpClient.get<IdleProduct[]>('/reports/idle-products', {
      params: { ...query, days },
    })
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /reports/movements
   * Query params: { page?, perPage?, sort?, search?, desde?, hasta?, type?, categoryId?, warehouseCode? }
   * Response: PaginatedResponse<ReportMovement>
   * Errors: 400 INVALID_DATE_RANGE, 403 FORBIDDEN
   */
  async listMovements(
    query?: ReportMovementQueryParams
  ): Promise<PaginatedResponse<ReportMovement>> {
    const response = await httpClient.get<PaginatedResponse<ReportMovement>>('/reports/movements', {
      params: query,
    })
    return response.data
  }
}
