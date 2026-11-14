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

export interface SalesService {
  /**
   * Catálogo de productos disponibles en el terminal POS con existencias y precios vigentes.
   * Requiere permiso: sales.create
   */
  getPosProducts(query?: PosProductQueryParams): Promise<PosProduct[]>

  /**
   * Búsqueda rápida optimizada por código de barras o SKU para pistolas lectoras.
   * Requiere permiso: sales.create
   */
  getPosProductByCode(code: string, warehouseId?: string): Promise<PosProduct>

  /**
   * Emisión autoritativa de una venta en el terminal POS con idempotencia estricta.
   * Requiere permiso: sales.create
   */
  createSale(request: CreateSaleRequest): Promise<Sale>

  /**
   * Listado paginado y filtrado de ventas para auditoría comercial.
   * Requiere permiso: sales.view
   */
  getSales(query?: SalesQuery): Promise<PaginatedResponse<SaleListItem>>

  /**
   * Detalle exhaustivo de una venta individual y líneas de comprobante.
   * Requiere permiso: sales.view
   */
  getSaleById(id: string): Promise<Sale>

  /**
   * Anulación formal de una venta con reposición de existencias al almacén emisor.
   * Requiere permiso: sales.cancel
   */
  cancelSale(id: string, dto: CancelSaleDto): Promise<CancelSaleResult>
}
