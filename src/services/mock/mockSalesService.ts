import type { SalesService } from '../interfaces/salesService'
import type { InventoryService } from '../interfaces/inventoryService'
import type { MockCashService } from './mockCashService'
import type { PaginatedResponse } from '@/shared/types/api'
import { ApiError } from '@/shared/types/api'
import type {
  PosProduct,
  PosProductQueryParams,
  CreateSaleRequest,
  Sale,
  SaleListItem,
  SaleItem,
  SalesQuery,
  CancelSaleDto,
  CancelSaleResult,
} from '@/features/sales/types'
import {
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  divideDecimals,
  compareDecimals,
  normalizeDecimal,
  roundToInteger,
  ceilToInteger,
  maxDecimal,
} from '@/shared/utils/decimal'
import { MOCK_USERS } from '@/mocks/users'

function normalizeSearchText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Catálogo base del POS alineado con el inventario inicial del sistema.
 */
const INITIAL_POS_PRODUCTS: PosProduct[] = [
  {
    id: 101,
    code: '78910001',
    name: 'Café Serrano Clásico 250g',
    category: 'Alimentos',
    priceCUP: '650.00',
    priceUSD: '1.80',
    stock: '24.00',
    unit: 'pqte',
  },
  {
    id: 102,
    code: '78910002',
    name: 'Aceite de Girasol Criollo 1L',
    category: 'Alimentos',
    priceCUP: '950.00',
    priceUSD: '2.64',
    stock: '15.00',
    unit: 'botella',
  },
  {
    id: 103,
    code: '78910003',
    name: 'Refresco Tukola Lata 330ml',
    category: 'Bebidas',
    priceCUP: '280.00',
    priceUSD: '0.78',
    stock: '48.00',
    unit: 'lata',
  },
  {
    id: 104,
    code: '78910004',
    name: 'Cerveza Cristal Lata 355ml',
    category: 'Bebidas',
    priceCUP: '320.00',
    priceUSD: '0.89',
    stock: '72.00',
    unit: 'lata',
  },
  {
    id: 105,
    code: '78910005',
    name: 'Cigarros H. Upmann Selecto',
    category: 'Tabacos',
    priceCUP: '300.00',
    priceUSD: '0.83',
    stock: '8.00',
    unit: 'cajetilla',
  },
  {
    id: 106,
    code: '78910006',
    name: 'Pollo Entero Congelado 1kg',
    category: 'Cárnicos',
    priceCUP: '1350.00',
    priceUSD: '3.75',
    stock: '0.00',
    unit: 'kg',
  },
]

export class MockSalesService implements SalesService {
  private products: PosProduct[] = JSON.parse(JSON.stringify(INITIAL_POS_PRODUCTS))
  private sales: Sale[] = []
  private inventoryService?: InventoryService
  private cashService?: MockCashService

  constructor(inventoryService?: InventoryService, cashService?: MockCashService) {
    this.inventoryService = inventoryService
    this.cashService = cashService
  }

  public setDependencies(inventoryService: InventoryService, cashService: MockCashService): void {
    this.inventoryService = inventoryService
    this.cashService = cashService
  }

  public reset(): void {
    this.products = JSON.parse(JSON.stringify(INITIAL_POS_PRODUCTS))
    this.sales = []
  }

  private checkHasPermission(permission: string): boolean {
    try {
      const token = localStorage.getItem('qvaflow_token')
      if (token) {
        const match = Object.values(MOCK_USERS).find((u) => u.token === token)
        if (match) {
          return match.user.permissions.includes(permission)
        }
      }
      const rawUser = localStorage.getItem('qvaflow_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        return Array.isArray(user.permissions) && user.permissions.includes(permission)
      }
    } catch {
      // Ignorar fallo de lectura local
    }
    return false
  }

  private checkAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.checkHasPermission(p))
  }

  private getCurrentUsername(): string {
    try {
      const token = localStorage.getItem('qvaflow_token')
      if (token) {
        const match = Object.values(MOCK_USERS).find((u) => u.token === token)
        if (match) return match.user.fullName || match.user.username
      }
      const rawUser = localStorage.getItem('qvaflow_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        return user.fullName || user.name || user.username
      }
    } catch {
      // Ignorar fallo de lectura local
    }
    return 'Yadira Reyes'
  }

  async getPosProducts(query: PosProductQueryParams = {}): Promise<PosProduct[]> {
    if (!this.checkHasPermission('sales.create')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso sales.create para consultar el catálogo del POS.',
        },
        403
      )
    }

    // Si hay inventario disponible, sincronizamos el stock en tiempo real
    if (this.inventoryService) {
      try {
        const stockRes = await this.inventoryService.getStock({
          perPage: 100,
          warehouse: query.warehouseId,
        })
        for (const p of this.products) {
          const matched = stockRes.items.find((s) => s.productCode === p.code)
          if (matched) {
            p.stock = matched.quantity
            p.priceCUP = matched.price
          }
        }
      } catch {
        // Fallback a stock local del catálogo si inventoryService no está disponible
      }
    }

    let result = [...this.products]
    if (query.category) {
      result = result.filter((p) => p.category.toLowerCase() === query.category!.toLowerCase())
    }
    if (query.search) {
      const q = query.search.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      )
    }

    return JSON.parse(JSON.stringify(result))
  }

  async getPosProductByCode(code: string, warehouseId?: string): Promise<PosProduct> {
    if (!this.checkHasPermission('sales.create')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso sales.create para buscar productos en el POS.',
        },
        403
      )
    }

    let prod = this.products.find((p) => p.code === code)

    if (this.inventoryService) {
      try {
        const stockRes = await this.inventoryService.getStock({
          search: code,
          warehouse: warehouseId,
        })
        const match = stockRes.items.find((s) => s.productCode === code)
        if (match) {
          if (!prod) {
            prod = {
              id: parseInt(match.productCode, 10) || 999,
              code: match.productCode,
              name: match.productName,
              category: match.category,
              priceCUP: match.price,
              priceUSD: divideDecimals(match.price, '360.00'),
              stock: match.quantity,
              unit: match.unit,
            }
            this.products.push(prod)
          } else {
            prod.stock = match.quantity
            prod.priceCUP = match.price
          }
        }
      } catch {
        // Ignorar
      }
    }

    if (!prod) {
      throw new ApiError(
        {
          code: 'PRODUCT_NOT_FOUND',
          message: 'No existe ningún producto con el código de barras especificado.',
        },
        404
      )
    }

    return JSON.parse(JSON.stringify(prod))
  }

  async createSale(request: CreateSaleRequest): Promise<Sale> {
    if (!this.checkHasPermission('sales.create')) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'Requiere permiso sales.create para registrar ventas.' },
        403
      )
    }

    // 1. Idempotencia estricta por clientRequestId
    const existingSale = this.sales.find((s) => s.clientRequestId === request.clientRequestId)
    if (existingSale) {
      return JSON.parse(JSON.stringify(existingSale))
    }

    // 2. Exigencia de turno abierto
    if (this.cashService) {
      const currentShift = await this.cashService.getCurrentShift()
      if (!currentShift || currentShift.status !== 'OPEN') {
        throw new ApiError(
          {
            code: 'SHIFT_NOT_OPEN',
            message: 'No es posible registrar ventas sin un turno de caja activo en el terminal.',
          },
          409
        )
      }
    }

    // 3. Validación de ítems
    if (!request.items || request.items.length === 0) {
      throw new ApiError(
        {
          code: 'INVALID_SALE_DATA',
          message: 'Debe incluir al menos un artículo para registrar la venta.',
        },
        400
      )
    }

    // 4. Comprobante de transferencia bancaria obligatorio
    if (request.paidCurrency === 'CUP_TRANSFER' || request.paymentMethod === 'TRANSFER') {
      if (!request.transferReference || !request.transferReference.trim()) {
        throw new ApiError(
          {
            code: 'TRANSFER_REFERENCE_REQUIRED',
            message:
              'Debe proporcionar obligatoriamente el número de referencia o ID de transacción de la transferencia bancaria.',
          },
          400
        )
      }
    }

    // 5. Verificación de catálogo y stock
    const saleItems: SaleItem[] = []
    let totalCUP = '0.00'
    const stockErrors: Record<string, string[]> = {}

    for (const itemReq of request.items) {
      const prod = await this.getPosProductByCode(itemReq.productCode, request.warehouseId)
      if (compareDecimals(itemReq.quantity, prod.stock) > 0) {
        stockErrors[itemReq.productCode] = [
          `Stock disponible: ${prod.stock} ${prod.unit}, solicitado: ${itemReq.quantity} ${prod.unit}`,
        ]
      }
      const lineSubtotal = multiplyDecimals(itemReq.quantity, prod.priceCUP)
      totalCUP = addDecimals(totalCUP, lineSubtotal)
      saleItems.push({
        productCode: prod.code,
        name: prod.name,
        quantity: normalizeDecimal(itemReq.quantity),
        unitPriceCUP: prod.priceCUP,
        subtotalCUP: lineSubtotal,
      })
    }

    if (Object.keys(stockErrors).length > 0) {
      throw new ApiError(
        {
          code: 'STOCK_INSUFFICIENT',
          message: 'Existencias insuficientes para uno o más artículos solicitados.',
          details: stockErrors,
        },
        409
      )
    }

    // 6. Tasas y parámetros económicos
    let dailyRateUSD = '360.00'
    let exchangeMargin = '10.00'
    let mlcRate = '275.00'

    if (this.cashService) {
      const shift = await this.cashService.getCurrentShift()
      if (shift) dailyRateUSD = shift.dailyRateUSD
      const settings = await this.cashService.getSettings()
      exchangeMargin = settings.exchangeMargin
      const rates = await this.cashService.getRates()
      mlcRate = rates.MLC
    }

    const effectiveRateUSD = maxDecimal('1.00', subtractDecimals(dailyRateUSD, exchangeMargin))

    let exchangeRateApplied = '1.00'
    let totalInCurrency = totalCUP
    let totalUSD = ceilToInteger(divideDecimals(totalCUP, effectiveRateUSD))
    let totalToCharge = totalCUP
    let changeGivenCUP = '0.00'

    if (request.paidCurrency === 'CUP' && request.paymentMethod === 'CASH') {
      exchangeRateApplied = '1.00'
      totalToCharge = roundToInteger(totalCUP)
      totalInCurrency = totalToCharge
      if (compareDecimals(request.cashReceived, totalToCharge) < 0) {
        throw new ApiError(
          {
            code: 'CASH_INSUFFICIENT',
            message:
              'El importe en efectivo entregado por el cliente es inferior al total adeudado de la venta.',
          },
          400
        )
      }
      changeGivenCUP = subtractDecimals(request.cashReceived, totalToCharge)
    } else if (request.paidCurrency === 'USD' && request.paymentMethod === 'CASH') {
      exchangeRateApplied = effectiveRateUSD
      totalToCharge = ceilToInteger(divideDecimals(totalCUP, effectiveRateUSD))
      totalInCurrency = totalToCharge
      totalUSD = totalToCharge
      if (compareDecimals(request.cashReceived, totalToCharge) < 0) {
        throw new ApiError(
          {
            code: 'CASH_INSUFFICIENT',
            message:
              'El importe en efectivo entregado por el cliente es inferior al total adeudado de la venta.',
          },
          400
        )
      }
      // Vuelto siempre en CUP: (cashReceived * effectiveRateUSD) - totalCUP
      const equivCUP = multiplyDecimals(request.cashReceived, effectiveRateUSD)
      changeGivenCUP = roundToInteger(subtractDecimals(equivCUP, totalCUP))
    } else if (request.paidCurrency === 'CUP_TRANSFER' || request.paymentMethod === 'TRANSFER') {
      exchangeRateApplied = '1.00'
      totalInCurrency = totalCUP
      totalToCharge = totalCUP
      changeGivenCUP = '0.00'
    } else if (request.paidCurrency === 'MLC') {
      exchangeRateApplied = mlcRate
      totalInCurrency = divideDecimals(totalCUP, mlcRate)
      totalToCharge = totalInCurrency
      changeGivenCUP = '0.00'
    }

    // 7. Descontar existencias físicas en el mock de inventario
    for (const item of saleItems) {
      if (this.inventoryService) {
        await this.inventoryService.deductStock(
          item.productCode,
          item.quantity,
          request.warehouseId
        )
      }
      const p = this.products.find((prod) => prod.code === item.productCode)
      if (p) {
        p.stock = subtractDecimals(p.stock, item.quantity)
      }
    }

    // 8. Impactar la recaudación en el turno activo
    if (this.cashService) {
      this.cashService.recordSaleImpact(
        request.shiftId,
        request.paymentMethod,
        request.paidCurrency,
        totalToCharge
      )
    }

    const sale: Sale = {
      id: `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
      clientRequestId: request.clientRequestId,
      shiftId: request.shiftId,
      warehouseId: request.warehouseId,
      items: saleItems,
      totalCUP,
      totalUSD,
      paidCurrency: request.paidCurrency,
      exchangeRateApplied,
      totalInCurrency,
      cashReceived: normalizeDecimal(request.cashReceived),
      changeGivenCUP,
      paymentMethod: request.paymentMethod,
      transferGateway: request.transferGateway || null,
      transferReference: request.transferReference || null,
      cashierName: this.getCurrentUsername(),
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    }

    this.sales.unshift(sale)
    return JSON.parse(JSON.stringify(sale))
  }

  async getSales(query: SalesQuery = {}): Promise<PaginatedResponse<SaleListItem>> {
    if (!this.checkHasPermission('sales.view')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso sales.view para consultar el historial de ventas.',
        },
        403
      )
    }

    let filtered = [...this.sales]
    if (query.shiftId) {
      filtered = filtered.filter((s) => s.shiftId === query.shiftId)
    }
    const canViewAll = this.checkAnyPermission(['sales.view_all', 'cash.manage'])
    if (!canViewAll) {
      const currentCashier = normalizeSearchText(this.getCurrentUsername())
      filtered = filtered.filter((s) => normalizeSearchText(s.cashierName) === currentCashier)
    } else if (query.cashierName) {
      const c = normalizeSearchText(query.cashierName)
      filtered = filtered.filter((s) => normalizeSearchText(s.cashierName) === c)
    }
    if (query.currency) {
      filtered = filtered.filter((s) => s.paidCurrency === query.currency)
    }
    if (query.desde) {
      filtered = filtered.filter((s) => s.createdAt >= query.desde!)
    }
    if (query.hasta) {
      filtered = filtered.filter((s) => s.createdAt <= query.hasta!)
    }
    if (query.search) {
      const q = normalizeSearchText(query.search)
      if (q) {
        filtered = filtered.filter((s) => {
          if (normalizeSearchText(s.id).includes(q)) return true
          if (normalizeSearchText(s.cashierName).includes(q)) return true
          return s.items.some((item) => {
            const nameMatch = normalizeSearchText(item.name).includes(q)
            const codeMatch = normalizeSearchText(item.productCode).includes(q)
            return nameMatch || codeMatch
          })
        })
      }
    }

    const page = parseInt(String(query.page || 1), 10) || 1
    const perPage = parseInt(String(query.perPage || 10), 10) || 10
    const start = (page - 1) * perPage
    const paged = filtered.slice(start, start + perPage)

    const items: SaleListItem[] = paged.map((s) => ({
      id: s.id,
      shiftId: s.shiftId,
      createdAt: s.createdAt,
      cashierName: s.cashierName,
      itemsCount: s.items.length,
      totalCUP: s.totalCUP,
      totalUSD: s.totalUSD,
      paidCurrency: s.paidCurrency,
      paymentMethod: s.paymentMethod,
      status: s.status,
    }))

    return {
      items: JSON.parse(JSON.stringify(items)),
      total: filtered.length,
      page,
      perPage,
    }
  }

  async getCashiers(): Promise<string[]> {
    if (!this.checkHasPermission('sales.view')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso sales.view para consultar los cajeros.',
        },
        403
      )
    }

    const canViewAll = this.checkAnyPermission(['sales.view_all', 'cash.manage'])
    if (!canViewAll) {
      return [this.getCurrentUsername()]
    }

    const set = new Set<string>()
    for (const s of this.sales) {
      if (s.cashierName?.trim()) {
        set.add(s.cashierName.trim())
      }
    }
    if (this.cashService) {
      try {
        const shifts = await this.cashService.getShifts({ perPage: 100 })
        for (const sh of shifts.items) {
          if (sh.cashierName?.trim()) {
            set.add(sh.cashierName.trim())
          }
        }
      } catch {
        // Ignorar si no hay turnos
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }

  async getSaleById(id: string): Promise<Sale> {
    if (!this.checkHasPermission('sales.view')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso sales.view para consultar el detalle de venta.',
        },
        403
      )
    }
    const sale = this.sales.find((s) => s.id === id)
    if (!sale) {
      throw new ApiError(
        { code: 'SALE_NOT_FOUND', message: 'El ticket de venta especificado no existe.' },
        404
      )
    }
    return JSON.parse(JSON.stringify(sale))
  }

  async cancelSale(id: string, dto: CancelSaleDto): Promise<CancelSaleResult> {
    if (!this.checkHasPermission('sales.cancel')) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'Requiere permiso sales.cancel para anular ventas.' },
        403
      )
    }
    const sale = this.sales.find((s) => s.id === id)
    if (!sale) {
      throw new ApiError(
        { code: 'SALE_NOT_FOUND', message: 'El ticket de venta especificado no existe.' },
        404
      )
    }
    if (sale.status === 'CANCELLED') {
      throw new ApiError(
        {
          code: 'SALE_ALREADY_CANCELLED',
          message: 'La venta indicada ya ha sido cancelada anteriormente.',
        },
        409
      )
    }

    // Reponer existencias al inventario
    for (const item of sale.items) {
      if (this.inventoryService) {
        await this.inventoryService.restoreStock(item.productCode, item.quantity, sale.warehouseId)
      }
      const p = this.products.find((prod) => prod.code === item.productCode)
      if (p) {
        p.stock = addDecimals(p.stock, item.quantity)
      }
    }

    // Revertir recaudación del turno si está disponible
    if (this.cashService) {
      this.cashService.revertSaleImpact(
        sale.shiftId,
        sale.paymentMethod,
        sale.paidCurrency,
        sale.totalInCurrency
      )
    }

    sale.status = 'CANCELLED'
    sale.cancelledAt = new Date().toISOString()
    sale.cancellationReason = dto.reason
    sale.stockReverted = true

    return {
      id: sale.id,
      status: 'CANCELLED',
      cancelledAt: sale.cancelledAt,
      cancellationReason: sale.cancellationReason,
      stockReverted: true,
    }
  }
}
