import type { ReportsService } from '../interfaces/reportsService'
import type { PaginatedResponse } from '@/shared/types/api'
import { ApiError } from '@/shared/types/api'
import type {
  ReportQuery,
  FinanceSummary,
  TimeSeriesGranularity,
  TimeSeriesPoint,
  FinanceTimeSeries,
  CategorySales,
  TopProduct,
  IdleProduct,
  ReportMovement,
  ReportMovementQueryParams,
  MarginHealthStatus,
  SalesByCurrency,
} from '@/features/reports/types'
import type { Currency, DecimalString } from '@/shared/types/currency'
import {
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  calculatePercentage,
  compareDecimals,
} from '@/shared/utils/decimal'
import { MOCK_USERS } from '@/mocks/users'

/**
 * Tasas de cambio fijas del mock respecto a USD (Moneda base).
 * Documentadas en un solo lugar para cálculo de conversiones a USD.
 */
export const MOCK_EXCHANGE_RATES_TO_USD: Record<Currency, string> = {
  USD: '1.00',
  CUP: '0.003125', // 1 USD = 320.00 CUP
  CUP_TRANSFER: '0.003125', // 1 USD = 320.00 CUP_TRANSFER
  MLC: '1.00', // 1 USD = 1.00 MLC
}

/**
 * Umbrales de evaluación de rentabilidad (margen comercial en %).
 */
export const MARGIN_HEALTH_THRESHOLDS = {
  CRITICAL: '10.00',
  WARNING: '20.00',
} as const

interface SeedCatalogProduct {
  code: string
  name: string
  categoryId: number
  categoryName: string
  warehouseCode: string
  warehouseName: string
  costUSD: DecimalString
  priceUSD: DecimalString
  stock: DecimalString
}

export const SEED_CATALOG_PRODUCTS: SeedCatalogProduct[] = [
  {
    code: '78910001',
    name: 'Café Serrano Clásico 250g',
    categoryId: 1,
    categoryName: 'Alimentos',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    costUSD: '1.40',
    priceUSD: '2.00',
    stock: '24.00',
  },
  {
    code: '78910002',
    name: 'Aceite de Girasol Criollo 1L',
    categoryId: 1,
    categoryName: 'Alimentos',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    costUSD: '2.20',
    priceUSD: '3.00',
    stock: '15.00',
  },
  {
    code: '78910003',
    name: 'Refresco Tukola Lata 330ml',
    categoryId: 2,
    categoryName: 'Bebidas',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    costUSD: '0.60',
    priceUSD: '0.90',
    stock: '48.00',
  },
  {
    code: '78910004',
    name: 'Cerveza Cristal Lata 355ml',
    categoryId: 2,
    categoryName: 'Bebidas',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    costUSD: '0.70',
    priceUSD: '1.00',
    stock: '72.00',
  },
  {
    code: '78910005',
    name: 'Cigarros H. Upmann Selecto',
    categoryId: 3,
    categoryName: 'Tabacos',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    costUSD: '0.65',
    priceUSD: '0.95',
    stock: '8.00',
  },
  {
    code: '78910006',
    name: 'Pollo Entero Congelado 1kg',
    categoryId: 4,
    categoryName: 'Cárnicos',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    costUSD: '3.00',
    priceUSD: '4.20',
    stock: '0.00', // Agotado
  },
  {
    code: '78910007',
    name: 'Cerveza Bucanero Fuerte 355ml',
    categoryId: 2,
    categoryName: 'Bebidas',
    warehouseCode: 'ALM-FRIO',
    warehouseName: 'Nevera y Frío',
    costUSD: '0.75',
    priceUSD: '1.10',
    stock: '36.00',
  },
  {
    code: '78910008',
    name: 'Agua Mineral Ciego Montero 1.5L',
    categoryId: 2,
    categoryName: 'Bebidas',
    warehouseCode: 'ALM-TIENDA',
    warehouseName: 'Tienda Principal',
    costUSD: '0.20',
    priceUSD: '0.40',
    stock: '5.00',
  },
  {
    code: '78910009',
    name: 'Arroz Grano Largo Especial 1kg',
    categoryId: 1,
    categoryName: 'Alimentos',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    costUSD: '0.45',
    priceUSD: '0.65',
    stock: '120.00',
  },
  {
    code: '78910010',
    name: 'Frijol Negro Criollo Seleccionado 1kg',
    categoryId: 1,
    categoryName: 'Alimentos',
    warehouseCode: 'ALM-CENTRAL',
    warehouseName: 'Almacén Central',
    costUSD: '0.50',
    priceUSD: '0.80',
    stock: '3.00',
  },
]

export interface InternalMockMovement extends ReportMovement {
  productCode: string
  categoryId: number
  warehouseCode: string
  quantity: DecimalString
  amountUSD: DecimalString
  cogsUSD: DecimalString
}

/**
 * Genera al menos 60 movimientos semilla distribuidos en los últimos 3 meses calendario
 * respecto a la fecha actual, con cantidades, monedas e importes consistentes.
 */
export function generateSeedMovements(referenceDate = new Date()): InternalMockMovement[] {
  const movements: InternalMockMovement[] = []
  const y = referenceDate.getFullYear()
  const m = referenceDate.getMonth() // 0-indexed

  const currencies: Currency[] = ['USD', 'CUP', 'CUP_TRANSFER', 'MLC']
  const paymentMethods = {
    USD: 'CASH',
    CUP: 'CASH',
    CUP_TRANSFER: 'TRANSFER',
    MLC: 'CARD',
  }

  let counter = 1

  // Distribuir en 3 meses: Month -2, Month -1, y Month 0 (actual)
  const monthConfigs = [
    { offset: -2, days: [3, 5, 8, 11, 14, 17, 20, 23, 26, 28], count: 22 },
    { offset: -1, days: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28], count: 24 },
    { offset: 0, days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], count: 20 },
  ]

  for (const cfg of monthConfigs) {
    const targetMonthDate = new Date(y, m + cfg.offset, 1)
    const targetYear = targetMonthDate.getFullYear()
    const targetMonth = targetMonthDate.getMonth()

    for (let i = 0; i < cfg.count; i++) {
      const day = cfg.days[i % cfg.days.length]
      const hour = 9 + (i % 9)
      const min = (i * 13) % 60
      const isoDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00Z`

      // 1 de cada 4 es compra de reabastecimiento (PURCHASE), el resto venta (SALE)
      const isPurchase = i % 4 === 1
      const type: 'SALE' | 'PURCHASE' = isPurchase ? 'PURCHASE' : 'SALE'

      // Seleccionar producto rotativo
      // Nota: El producto 78910010 (Frijol) solo tiene venta en Month -2 (para quedar ocioso con days=30)
      // El producto 78910008 (Agua) solo tiene venta en Month -1 (ocioso para days=30 pero no para days=60)
      let prodIndex: number
      if (cfg.offset === 0) {
        // En mes actual: productos 0 a 6 (excluyendo 7 y 9)
        prodIndex = i % 7
      } else if (cfg.offset === -1) {
        // En mes anterior: incluir producto 7 (Agua) una vez
        prodIndex = i === 0 ? 7 : i % 7
      } else {
        // En mes -2: incluir producto 9 (Frijol) una vez
        prodIndex = i === 0 ? 9 : i % 8
      }

      const prod = SEED_CATALOG_PRODUCTS[prodIndex]
      const currency = currencies[(i + cfg.offset + 4) % currencies.length]
      const quantityList = ['2.00', '4.00', '5.00', '10.00', '15.00', '20.00']
      const quantity = quantityList[(i + prodIndex) % quantityList.length]

      let amountUSD: DecimalString
      let cogsUSD: DecimalString

      if (type === 'SALE') {
        amountUSD = multiplyDecimals(quantity, prod.priceUSD)
        cogsUSD = multiplyDecimals(quantity, prod.costUSD)
      } else {
        amountUSD = multiplyDecimals(quantity, prod.costUSD)
        cogsUSD = '0.00'
      }

      // Convertir a moneda local según tasa de cambio
      let amount: DecimalString
      if (currency === 'USD' || currency === 'MLC') {
        amount = amountUSD
      } else {
        // CUP / CUP_TRANSFER: 1 USD = 320 CUP
        amount = multiplyDecimals(amountUSD, '320.00')
      }

      const idStr = `MOV-${String(counter).padStart(4, '0')}`
      const ref =
        type === 'SALE'
          ? `TKT-${targetYear}${String(targetMonth + 1).padStart(2, '0')}-${String(counter).padStart(3, '0')}`
          : `FAC-${targetYear}${String(targetMonth + 1).padStart(2, '0')}-${String(counter).padStart(3, '0')}`

      const desc =
        type === 'SALE' ? `Venta POS - ${prod.name}` : `Compra proveedor - Suministro ${prod.name}`

      movements.push({
        id: idStr,
        date: isoDate,
        type,
        reference: ref,
        description: desc,
        productCode: prod.code,
        categoryId: prod.categoryId,
        categoryName: prod.categoryName,
        warehouseCode: prod.warehouseCode,
        warehouseName: prod.warehouseName,
        quantity,
        amount,
        currency,
        paymentMethod: paymentMethods[currency],
        amountUSD,
        cogsUSD,
      })

      counter++
    }
  }

  return movements
}

export class MockReportsService implements ReportsService {
  private movements: InternalMockMovement[] = generateSeedMovements()

  private delay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Comprueba si el usuario autenticado tiene un permiso específico.
   */
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

  private ensureViewPermission(): void {
    if (!this.checkHasPermission('reports.view')) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'No tiene permisos suficientes para acceder a reportes (requiere reports.view)'
      )
    }
  }

  private hasCostPermission(): boolean {
    return this.checkHasPermission('products.view_cost')
  }

  /**
   * Normaliza y valida el rango de fechas [desde, hasta].
   * Por defecto: mes en curso.
   * Errores 400: formato inválido, rango invertido, rango > 366 días.
   */
  private parseDateRange(desde?: string, hasta?: string): { desde: string; hasta: string } {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    const now = new Date()

    if (!desde && !hasta) {
      const y = now.getFullYear()
      const m = now.getMonth()
      const firstDayStr = `${y}-${String(m + 1).padStart(2, '0')}-01`
      const lastDay = new Date(y, m + 1, 0).getDate()
      const lastDayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      return { desde: firstDayStr, hasta: lastDayStr }
    }

    if (desde && !dateRegex.test(desde)) {
      throw new ApiError(
        400,
        'INVALID_DATE_FORMAT',
        'Formato de fecha inicial inválido. Se requiere YYYY-MM-DD',
        { desde: ['Formato debe ser YYYY-MM-DD'] }
      )
    }
    if (hasta && !dateRegex.test(hasta)) {
      throw new ApiError(
        400,
        'INVALID_DATE_FORMAT',
        'Formato de fecha final inválido. Se requiere YYYY-MM-DD',
        { hasta: ['Formato debe ser YYYY-MM-DD'] }
      )
    }

    const y = now.getFullYear()
    const m = now.getMonth()
    const finalDesde = desde || `${y}-${String(m + 1).padStart(2, '0')}-01`
    const finalHasta = hasta || finalDesde

    if (finalHasta < finalDesde) {
      throw new ApiError(
        400,
        'INVALID_DATE_RANGE',
        'La fecha final (hasta) no puede ser anterior a la fecha inicial (desde)',
        { hasta: ['La fecha final debe ser posterior o igual a la inicial'] }
      )
    }

    const dStart = new Date(`${finalDesde}T00:00:00Z`).getTime()
    const dEnd = new Date(`${finalHasta}T00:00:00Z`).getTime()
    const diffDays = Math.round((dEnd - dStart) / (1000 * 60 * 60 * 24))
    if (diffDays > 366) {
      throw new ApiError(
        400,
        'DATE_RANGE_EXCEEDED',
        'El rango de consulta no puede superar 366 días (un año calendario)',
        { rango: ['Rango temporal excede 366 días'] }
      )
    }

    return { desde: finalDesde, hasta: finalHasta }
  }

  /**
   * Filtra los movimientos en base a las dimensiones de consulta.
   */
  private filterMovements(
    query?: Partial<ReportQuery>,
    dateRange?: { desde: string; hasta: string }
  ): InternalMockMovement[] {
    const range = dateRange || this.parseDateRange(query?.desde, query?.hasta)
    const canViewCost = this.hasCostPermission()

    return this.movements.filter((m) => {
      // Control de datos sensibles: excluir PURCHASE si carece de products.view_cost
      if (!canViewCost && m.type === 'PURCHASE') {
        return false
      }

      // Rango de fechas inclusivo [desde, hasta]
      const movDate = m.date.slice(0, 10)
      if (movDate < range.desde || movDate > range.hasta) {
        return false
      }

      // Filtro dimensional type
      if (query?.type && query.type !== 'ALL') {
        if (m.type !== query.type) return false
      }

      // Filtro categoryId
      if (query?.categoryId !== undefined && query.categoryId !== '') {
        if (String(m.categoryId) !== String(query.categoryId)) return false
      }

      // Filtro warehouseCode
      if (query?.warehouseCode) {
        if (m.warehouseCode !== query.warehouseCode) return false
      }

      return true
    })
  }

  /**
   * Resumen consolidado de indicadores financieros clave (KPIs).
   */
  async getFinanceSummary(query?: Partial<ReportQuery>): Promise<FinanceSummary> {
    await this.delay()
    this.ensureViewPermission()

    const range = this.parseDateRange(query?.desde, query?.hasta)
    const filtered = this.filterMovements(query, range)
    const canViewCost = this.hasCostPermission()

    let salesTotal = '0.00'
    let salesCount = 0
    let purchasesTotal = '0.00'
    let purchasesCount = 0
    let cogsTotal = '0.00'

    const salesByCurrMap: Record<Currency, string> = {
      USD: '0.00',
      CUP: '0.00',
      CUP_TRANSFER: '0.00',
      MLC: '0.00',
    }

    for (const mov of filtered) {
      if (mov.type === 'SALE') {
        salesTotal = addDecimals(salesTotal, mov.amountUSD)
        salesCount++
        cogsTotal = addDecimals(cogsTotal, mov.cogsUSD)
        salesByCurrMap[mov.currency] = addDecimals(salesByCurrMap[mov.currency], mov.amount)
      } else if (mov.type === 'PURCHASE' && canViewCost) {
        purchasesTotal = addDecimals(purchasesTotal, mov.amountUSD)
        purchasesCount++
      }
    }

    const salesByCurrency: SalesByCurrency[] = (
      ['USD', 'CUP', 'CUP_TRANSFER', 'MLC'] as Currency[]
    ).map((currency) => ({
      currency,
      amount: salesByCurrMap[currency],
    }))

    if (!canViewCost) {
      // Omitir estrictamente todos los campos sensibles
      return {
        currency: 'USD',
        salesTotal,
        salesCount,
        salesByCurrency,
      }
    }

    const grossProfit = subtractDecimals(salesTotal, cogsTotal)
    const marginPercent = calculatePercentage(grossProfit, salesTotal)
    const cashBalance = subtractDecimals(salesTotal, purchasesTotal)

    let marginHealth: MarginHealthStatus = 'HEALTHY'
    if (compareDecimals(marginPercent, MARGIN_HEALTH_THRESHOLDS.CRITICAL) < 0) {
      marginHealth = 'CRITICAL'
    } else if (compareDecimals(marginPercent, MARGIN_HEALTH_THRESHOLDS.WARNING) < 0) {
      marginHealth = 'WARNING'
    }

    return {
      currency: 'USD',
      salesTotal,
      salesCount,
      purchasesTotal,
      purchasesCount,
      cogsTotal,
      grossProfit,
      marginPercent,
      cashBalance,
      marginHealth,
      salesByCurrency,
    }
  }

  /**
   * Serie temporal histórica para gráficos temporales.
   */
  async getFinanceTimeSeries(
    query?: Partial<ReportQuery>,
    granularity: TimeSeriesGranularity = 'day'
  ): Promise<FinanceTimeSeries> {
    await this.delay()
    this.ensureViewPermission()

    const range = this.parseDateRange(query?.desde, query?.hasta)
    const filtered = this.filterMovements(query, range)
    const canViewCost = this.hasCostPermission()

    // 1. Generar todos los puntos cronológicos continuos (sin huecos)
    const bucketMap = new Map<
      string,
      { salesTotal: string; purchasesTotal: string; cogsTotal: string }
    >()

    if (granularity === 'day') {
      const cur = new Date(`${range.desde}T00:00:00Z`)
      const end = new Date(`${range.hasta}T00:00:00Z`)
      while (cur.getTime() <= end.getTime()) {
        const key = cur.toISOString().slice(0, 10)
        bucketMap.set(key, { salesTotal: '0.00', purchasesTotal: '0.00', cogsTotal: '0.00' })
        cur.setUTCDate(cur.getUTCDate() + 1)
      }
    } else if (granularity === 'month') {
      const startY = Number(range.desde.slice(0, 4))
      const startM = Number(range.desde.slice(5, 7)) - 1
      const endY = Number(range.hasta.slice(0, 4))
      const endM = Number(range.hasta.slice(5, 7)) - 1

      const cur = new Date(Date.UTC(startY, startM, 1))
      const end = new Date(Date.UTC(endY, endM, 1))
      while (cur.getTime() <= end.getTime()) {
        const key = cur.toISOString().slice(0, 7)
        bucketMap.set(key, { salesTotal: '0.00', purchasesTotal: '0.00', cogsTotal: '0.00' })
        cur.setUTCMonth(cur.getUTCMonth() + 1)
      }
    } else if (granularity === 'week') {
      // Semanas lunes-domingo cubriendo el intervalo
      const cur = new Date(`${range.desde}T00:00:00Z`)
      const day = cur.getUTCDay()
      const diff = (day === 0 ? -6 : 1) - day
      cur.setUTCDate(cur.getUTCDate() + diff) // Ir al lunes de esa semana

      const end = new Date(`${range.hasta}T00:00:00Z`)
      while (cur.getTime() <= end.getTime() + 6 * 24 * 60 * 60 * 1000) {
        const key = cur.toISOString().slice(0, 10)
        bucketMap.set(key, { salesTotal: '0.00', purchasesTotal: '0.00', cogsTotal: '0.00' })
        cur.setUTCDate(cur.getUTCDate() + 7)
      }
    }

    // 2. Acumular movimientos en los buckets
    for (const mov of filtered) {
      const movIso = mov.date.slice(0, 10)
      let bucketKey: string

      if (granularity === 'day') {
        bucketKey = movIso
      } else if (granularity === 'month') {
        bucketKey = movIso.slice(0, 7)
      } else {
        // week
        const d = new Date(`${movIso}T00:00:00Z`)
        const day = d.getUTCDay()
        const diff = (day === 0 ? -6 : 1) - day
        d.setUTCDate(d.getUTCDate() + diff)
        bucketKey = d.toISOString().slice(0, 10)
      }

      let bucket = bucketMap.get(bucketKey)
      if (!bucket) {
        bucket = { salesTotal: '0.00', purchasesTotal: '0.00', cogsTotal: '0.00' }
        bucketMap.set(bucketKey, bucket)
      }

      if (mov.type === 'SALE') {
        bucket.salesTotal = addDecimals(bucket.salesTotal, mov.amountUSD)
        bucket.cogsTotal = addDecimals(bucket.cogsTotal, mov.cogsUSD)
      } else if (mov.type === 'PURCHASE' && canViewCost) {
        bucket.purchasesTotal = addDecimals(bucket.purchasesTotal, mov.amountUSD)
      }
    }

    // 3. Formatear la serie respetando RBAC
    const points: TimeSeriesPoint[] = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        if (!canViewCost) {
          return {
            date,
            salesTotal: data.salesTotal,
          }
        }
        return {
          date,
          salesTotal: data.salesTotal,
          purchasesTotal: data.purchasesTotal,
          grossProfit: subtractDecimals(data.salesTotal, data.cogsTotal),
        }
      })

    return {
      granularity,
      points,
    }
  }

  /**
   * Ventas y unidades por categoría de catálogo.
   */
  async getSalesByCategory(query?: Partial<ReportQuery>): Promise<CategorySales[]> {
    await this.delay()
    this.ensureViewPermission()

    const range = this.parseDateRange(query?.desde, query?.hasta)
    const filtered = this.filterMovements(query, range)

    // Agrupar todas las ventas por categoría existente
    const catMap = new Map<
      number,
      { categoryId: number; categoryName: string; salesTotal: string; unitsSold: string }
    >()

    // Inicializar categorías base
    const baseCategories = [
      { id: 1, name: 'Alimentos' },
      { id: 2, name: 'Bebidas' },
      { id: 3, name: 'Tabacos' },
      { id: 4, name: 'Cárnicos' },
    ]
    for (const c of baseCategories) {
      catMap.set(c.id, {
        categoryId: c.id,
        categoryName: c.name,
        salesTotal: '0.00',
        unitsSold: '0.00',
      })
    }

    for (const mov of filtered) {
      if (mov.type !== 'SALE') continue
      const cat = catMap.get(mov.categoryId)
      if (cat) {
        cat.salesTotal = addDecimals(cat.salesTotal, mov.amountUSD)
        cat.unitsSold = addDecimals(cat.unitsSold, mov.quantity)
      }
    }

    return Array.from(catMap.values()).sort((a, b) => compareDecimals(b.salesTotal, a.salesTotal))
  }

  /**
   * Ranking de productos más vendidos.
   */
  async getTopProducts(query?: Partial<ReportQuery>, limit = 5): Promise<TopProduct[]> {
    await this.delay()
    this.ensureViewPermission()

    const range = this.parseDateRange(query?.desde, query?.hasta)
    const filtered = this.filterMovements(query, range)

    const prodMap = new Map<
      string,
      {
        productCode: string
        productName: string
        categoryName: string
        unitsSold: string
        revenue: string
      }
    >()

    for (const mov of filtered) {
      if (mov.type !== 'SALE') continue
      let entry = prodMap.get(mov.productCode)
      if (!entry) {
        entry = {
          productCode: mov.productCode,
          productName: mov.description.replace(/^Venta POS - /, ''),
          categoryName: mov.categoryName,
          unitsSold: '0.00',
          revenue: '0.00',
        }
        prodMap.set(mov.productCode, entry)
      }
      entry.unitsSold = addDecimals(entry.unitsSold, mov.quantity)
      entry.revenue = addDecimals(entry.revenue, mov.amountUSD)
    }

    const sorted = Array.from(prodMap.values()).sort((a, b) => {
      const cmpUnits = compareDecimals(b.unitsSold, a.unitsSold)
      if (cmpUnits !== 0) return cmpUnits
      return compareDecimals(b.revenue, a.revenue)
    })

    return sorted.slice(0, Math.max(1, limit))
  }

  /**
   * Productos inmovilizados o sin ventas recientes con stock > 0.
   */
  async getIdleProducts(query?: Partial<ReportQuery>, days = 30): Promise<IdleProduct[]> {
    await this.delay()
    this.ensureViewPermission()

    const canViewCost = this.hasCostPermission()
    const nowTime = query?.hasta
      ? new Date(`${query.hasta}T23:59:59Z`).getTime()
      : new Date().getTime()

    const idleProducts: IdleProduct[] = []

    for (const prod of SEED_CATALOG_PRODUCTS) {
      // Condición: stock > 0
      if (compareDecimals(prod.stock, '0.00') <= 0) {
        continue
      }

      // Buscar la venta más reciente de este producto anterior o igual a nowTime
      const sales = this.movements.filter(
        (m) =>
          m.productCode === prod.code && m.type === 'SALE' && new Date(m.date).getTime() <= nowTime
      )

      let daysWithoutSale = 999
      if (sales.length > 0) {
        // Ordenar fecha descendente
        sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const lastSaleTime = new Date(sales[0].date).getTime()
        daysWithoutSale = Math.max(0, Math.floor((nowTime - lastSaleTime) / (1000 * 60 * 60 * 24)))
      }

      if (daysWithoutSale >= days) {
        if (!canViewCost) {
          idleProducts.push({
            productCode: prod.code,
            productName: prod.name,
            warehouseName: prod.warehouseName,
            stock: prod.stock,
            daysWithoutSale,
          })
        } else {
          idleProducts.push({
            productCode: prod.code,
            productName: prod.name,
            warehouseName: prod.warehouseName,
            stock: prod.stock,
            daysWithoutSale,
            tiedUpCapital: multiplyDecimals(prod.stock, prod.costUSD),
          })
        }
      }
    }

    return idleProducts.sort((a, b) => b.daysWithoutSale - a.daysWithoutSale)
  }

  /**
   * Auditoría paginada de transacciones financieras individuales.
   */
  async listMovements(
    query?: ReportMovementQueryParams
  ): Promise<PaginatedResponse<ReportMovement>> {
    await this.delay()
    this.ensureViewPermission()

    const filtered = this.filterMovements(query)

    // Búsqueda por referencia o descripción
    let results = filtered
    if (query?.search?.trim()) {
      const s = query.search.trim().toLowerCase()
      results = results.filter(
        (m) =>
          m.reference.toLowerCase().includes(s) ||
          m.description.toLowerCase().includes(s) ||
          m.categoryName.toLowerCase().includes(s)
      )
    }

    // Ordenación
    const sortParam = query?.sort || 'date:desc'
    const [field, direction] = sortParam.split(':')
    const isDesc = direction === 'desc'

    results.sort((a, b) => {
      let cmp = 0
      if (field === 'amount') {
        cmp = compareDecimals(a.amountUSD, b.amountUSD)
      } else if (field === 'reference') {
        cmp = a.reference.localeCompare(b.reference)
      } else {
        // Por defecto: date
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      return isDesc ? -cmp : cmp
    })

    // Paginación
    const page = Math.max(1, query?.page || 1)
    const perPage = Math.max(1, query?.perPage || 10)
    const total = results.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const start = (page - 1) * perPage
    const paginatedItems = results.slice(start, start + perPage)

    // Mapear a ReportMovement público
    const data: ReportMovement[] = paginatedItems.map((m) => ({
      id: m.id,
      date: m.date,
      type: m.type,
      reference: m.reference,
      description: m.description,
      categoryName: m.categoryName,
      warehouseName: m.warehouseName,
      amount: m.amount,
      currency: m.currency,
      paymentMethod: m.paymentMethod,
    }))

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages,
      },
    }
  }
}
