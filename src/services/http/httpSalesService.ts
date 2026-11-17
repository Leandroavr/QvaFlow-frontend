import type { SalesService } from '../interfaces/salesService'
import type { PaginatedResponse } from '@/shared/types/api'
import type {
  PosProduct,
  PosProductQueryParams,
  CreateSaleRequest,
  Sale,
  SaleListItem,
  SalesQuery,
  CancelSaleDto,
  CancelSaleResult,
} from '@/features/sales/types'
import { httpClient } from '../api/httpClient'

export class HttpSalesService implements SalesService {
  async getPosProducts(query?: PosProductQueryParams): Promise<PosProduct[]> {
    const response = await httpClient.get<PosProduct[]>('/pos/products', {
      params: query,
    })
    return response.data
  }

  async getPosProductByCode(code: string, warehouseId?: string): Promise<PosProduct> {
    const response = await httpClient.get<PosProduct>(
      `/pos/products/by-code/${encodeURIComponent(code)}`,
      {
        params: { warehouseId },
      }
    )
    return response.data
  }

  async createSale(request: CreateSaleRequest): Promise<Sale> {
    const response = await httpClient.post<Sale>('/sales', request)
    return response.data
  }

  async getSales(query?: SalesQuery): Promise<PaginatedResponse<SaleListItem>> {
    const response = await httpClient.get<PaginatedResponse<SaleListItem>>('/sales', {
      params: query,
    })
    return response.data
  }

  async getSaleById(id: string): Promise<Sale> {
    const response = await httpClient.get<Sale>(`/sales/${encodeURIComponent(id)}`)
    return response.data
  }

  async cancelSale(id: string, dto: CancelSaleDto): Promise<CancelSaleResult> {
    const response = await httpClient.post<CancelSaleResult>(
      `/sales/${encodeURIComponent(id)}/cancel`,
      dto
    )
    return response.data
  }

  async getCashiers(): Promise<string[]> {
    const response = await httpClient.get<string[]>('/sales/cashiers')
    return response.data
  }
}
