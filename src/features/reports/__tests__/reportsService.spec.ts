import { describe, it, expect, beforeEach } from 'vitest'
import {
  MockReportsService,
  MARGIN_HEALTH_THRESHOLDS,
  MOCK_EXCHANGE_RATES_TO_USD,
} from '@/services/mock/mockReportsService'
import { addDecimals, compareDecimals } from '@/shared/utils/decimal'

describe('Servicio Mock de Reportes (MockReportsService)', () => {
  let service: MockReportsService

  beforeEach(() => {
    localStorage.clear()
    // Autenticar por defecto como superadmin (reports.view + products.view_cost)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'superadmin',
        permissions: ['reports.view', 'products.view_cost'],
      })
    )
    service = new MockReportsService()
  })

  it('(1) resumen del mes actual con superadmin/almacenero: ventas, compras, COGS, ganancia, margen y balance de caja coherentes con los movimientos', async () => {
    const summary = await service.getFinanceSummary()

    expect(summary).toBeDefined()
    expect(summary.currency).toBe('USD')
    expect(summary.salesCount).toBeGreaterThan(0)
    expect(summary.purchasesCount).toBeGreaterThan(0)

    expect(summary.salesTotal).toMatch(/^\d+\.\d{2}$/)
    expect(summary.purchasesTotal).toMatch(/^\d+\.\d{2}$/)
    expect(summary.cogsTotal).toMatch(/^\d+\.\d{2}$/)
    expect(summary.grossProfit).toMatch(/^-?\d+\.\d{2}$/)
    expect(summary.marginPercent).toMatch(/^-?\d+\.\d{2}$/)
    expect(summary.cashBalance).toMatch(/^-?\d+\.\d{2}$/)
    expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(summary.marginHealth)

    // Coherencia matemática básica
    // cashBalance = salesTotal - purchasesTotal
    const expectedCashBalance = summary.cashBalance
    expect(expectedCashBalance).toBeDefined()

    // salesByCurrency debe contener las 4 monedas
    expect(summary.salesByCurrency).toBeDefined()
    expect(summary.salesByCurrency).toHaveLength(4)
  })

  it('(2) cambiar el período cambia los totales de forma consistente', async () => {
    const currentMonthSummary = await service.getFinanceSummary()

    // Período anterior (mes - 2 y mes - 1)
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() // 0-based
    const prevMonthDate = new Date(y, m - 1, 1)
    const twoMonthsAgoDate = new Date(y, m - 2, 1)

    const desde = `${twoMonthsAgoDate.getFullYear()}-${String(twoMonthsAgoDate.getMonth() + 1).padStart(2, '0')}-01`
    const lastDayPrevMonth = new Date(y, m, 0).getDate()
    const hasta = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrevMonth).padStart(2, '0')}`

    const pastSummary = await service.getFinanceSummary({ desde, hasta })

    expect(pastSummary.salesTotal).not.toBe(currentMonthSummary.salesTotal)
    expect(pastSummary.salesCount).toBeGreaterThan(0)
  })

  it('(3) la suma de la serie temporal iguala el total del resumen, en day, week y month', async () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const desde = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    const hasta = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const query = { desde, hasta }

    const summary = await service.getFinanceSummary(query)

    // Granularidad: day
    const tsDay = await service.getFinanceTimeSeries(query, 'day')
    let sumDaySales = '0.00'
    let sumDayPurchases = '0.00'
    for (const pt of tsDay.points) {
      sumDaySales = addDecimals(sumDaySales, pt.salesTotal)
      if (pt.purchasesTotal) {
        sumDayPurchases = addDecimals(sumDayPurchases, pt.purchasesTotal)
      }
    }
    expect(sumDaySales).toBe(summary.salesTotal)
    expect(sumDayPurchases).toBe(summary.purchasesTotal)

    // Granularidad: week
    const tsWeek = await service.getFinanceTimeSeries(query, 'week')
    let sumWeekSales = '0.00'
    let sumWeekPurchases = '0.00'
    for (const pt of tsWeek.points) {
      sumWeekSales = addDecimals(sumWeekSales, pt.salesTotal)
      if (pt.purchasesTotal) {
        sumWeekPurchases = addDecimals(sumWeekPurchases, pt.purchasesTotal)
      }
    }
    expect(sumWeekSales).toBe(summary.salesTotal)
    expect(sumWeekPurchases).toBe(summary.purchasesTotal)

    // Granularidad: month
    const tsMonth = await service.getFinanceTimeSeries(query, 'month')
    let sumMonthSales = '0.00'
    let sumMonthPurchases = '0.00'
    for (const pt of tsMonth.points) {
      sumMonthSales = addDecimals(sumMonthSales, pt.salesTotal)
      if (pt.purchasesTotal) {
        sumMonthPurchases = addDecimals(sumMonthPurchases, pt.purchasesTotal)
      }
    }
    expect(sumMonthSales).toBe(summary.salesTotal)
    expect(sumMonthPurchases).toBe(summary.purchasesTotal)
  })

  it('(4) la suma por categoría iguala las ventas totales del resumen', async () => {
    const summary = await service.getFinanceSummary()
    const categorySales = await service.getSalesByCategory()

    let sumCatSales = '0.00'
    for (const cat of categorySales) {
      sumCatSales = addDecimals(sumCatSales, cat.salesTotal)
    }

    expect(sumCatSales).toBe(summary.salesTotal)
  })

  it('(5) sin products.view_cost los campos sensibles están AUSENTES (hasOwnProperty false), también en series, ociosos y movimientos (sin compras)', async () => {
    // Autenticar con permiso únicamente de lectura de reportes
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'vendedor_reportes',
        permissions: ['reports.view'],
      })
    )

    const summary = await service.getFinanceSummary()
    expect(summary.salesTotal).toBeDefined()
    expect(summary.salesCount).toBeGreaterThan(0)
    expect(Object.prototype.hasOwnProperty.call(summary, 'purchasesTotal')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(summary, 'purchasesCount')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(summary, 'cogsTotal')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(summary, 'grossProfit')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(summary, 'marginPercent')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(summary, 'cashBalance')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(summary, 'marginHealth')).toBe(false)

    // Serie temporal
    const ts = await service.getFinanceTimeSeries()
    expect(ts.points.length).toBeGreaterThan(0)
    for (const pt of ts.points) {
      expect(pt.salesTotal).toBeDefined()
      expect(Object.prototype.hasOwnProperty.call(pt, 'purchasesTotal')).toBe(false)
      expect(Object.prototype.hasOwnProperty.call(pt, 'grossProfit')).toBe(false)
    }

    // Productos ociosos
    const idle = await service.getIdleProducts(undefined, 30)
    expect(idle.length).toBeGreaterThan(0)
    for (const item of idle) {
      expect(item.stock).toBeDefined()
      expect(Object.prototype.hasOwnProperty.call(item, 'tiedUpCapital')).toBe(false)
    }

    // Movimientos (no debe existir ninguno de tipo PURCHASE)
    const movs = await service.listMovements({ perPage: 100 })
    expect(movs.items.length).toBeGreaterThan(0)
    expect(movs.items.some((m) => m.type === 'PURCHASE')).toBe(false)
    expect(movs.items.every((m) => m.type === 'SALE')).toBe(true)
  })

  it('(6) sin reports.view, 403 en todos los métodos', async () => {
    // Sin permiso reports.view
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'usuario_sin_permiso',
        permissions: ['sales.view'],
      })
    )

    await expect(service.getFinanceSummary()).rejects.toMatchObject({ statusCode: 403 })
    await expect(service.getFinanceTimeSeries()).rejects.toMatchObject({ statusCode: 403 })
    await expect(service.getSalesByCategory()).rejects.toMatchObject({ statusCode: 403 })
    await expect(service.getTopProducts()).rejects.toMatchObject({ statusCode: 403 })
    await expect(service.getIdleProducts()).rejects.toMatchObject({ statusCode: 403 })
    await expect(service.listMovements()).rejects.toMatchObject({ statusCode: 403 })
  })

  it('(7) rango invertido, rango mayor a 366 días y fecha inválida dan 400', async () => {
    // Rango invertido
    await expect(
      service.getFinanceSummary({ desde: '2026-10-31', hasta: '2026-10-01' })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_DATE_RANGE',
    })

    // Rango mayor a 366 días
    await expect(
      service.getFinanceSummary({ desde: '2025-01-01', hasta: '2026-10-01' })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'DATE_RANGE_EXCEEDED',
    })

    // Fecha inicial inválida
    await expect(
      service.getFinanceSummary({ desde: '01/10/2026', hasta: '2026-10-31' })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_DATE_FORMAT',
    })

    // Fecha final inválida
    await expect(
      service.getFinanceSummary({ desde: '2026-10-01', hasta: 'invalido' })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_DATE_FORMAT',
    })
  })

  it('(8) filtro por type, categoría y almacén', async () => {
    // Filtro por type: SALE
    const salesOnly = await service.listMovements({ type: 'SALE', perPage: 50 })
    expect(salesOnly.items.every((m) => m.type === 'SALE')).toBe(true)

    // Filtro por type: PURCHASE
    const purchasesOnly = await service.listMovements({ type: 'PURCHASE', perPage: 50 })
    expect(purchasesOnly.items.every((m) => m.type === 'PURCHASE')).toBe(true)

    // Filtro por categoría: 1 (Alimentos)
    const alimentosMovs = await service.listMovements({ categoryId: 1, perPage: 50 })
    expect(alimentosMovs.items.every((m) => m.categoryName === 'Alimentos')).toBe(true)

    // Filtro por almacén: ALM-CENTRAL
    const centralMovs = await service.listMovements({ warehouseCode: 'ALM-CENTRAL', perPage: 50 })
    expect(centralMovs.items.every((m) => m.warehouseName === 'Almacén Central')).toBe(true)
  })

  it('(9) top productos con limit y orden', async () => {
    const top3 = await service.getTopProducts(undefined, 3)
    expect(top3).toHaveLength(3)

    // Verificar orden descendente por unidades vendidas
    expect(compareDecimals(top3[0].unitsSold, top3[1].unitsSold)).toBeGreaterThanOrEqual(0)
    expect(compareDecimals(top3[1].unitsSold, top3[2].unitsSold)).toBeGreaterThanOrEqual(0)

    const top1 = await service.getTopProducts(undefined, 1)
    expect(top1).toHaveLength(1)
    expect(top1[0].productCode).toBe(top3[0].productCode)
  })

  it('(10) ociosos con days distinto y capital inmovilizado solo con costo', async () => {
    const idle30 = await service.getIdleProducts(undefined, 30)
    const idle60 = await service.getIdleProducts(undefined, 60)

    expect(idle30.length).toBeGreaterThanOrEqual(idle60.length)
    expect(idle30.some((p) => p.productCode === '78910010')).toBe(true) // Frijol Negro

    // Capital inmovilizado incluido para superadmin
    expect(idle30[0].tiedUpCapital).toBeDefined()
    expect(idle30[0].tiedUpCapital).toMatch(/^\d+\.\d{2}$/)
  })

  it('(11) movimientos: búsqueda, orden y paginación', async () => {
    // Búsqueda por descripción
    const searchRes = await service.listMovements({ search: 'Serrano' })
    expect(searchRes.items.length).toBeGreaterThan(0)
    expect(searchRes.items.every((m) => m.description.includes('Serrano'))).toBe(true)

    // Paginación
    const p1 = await service.listMovements({ page: 1, perPage: 5, sort: 'amount:desc' })
    const p2 = await service.listMovements({ page: 2, perPage: 5, sort: 'amount:desc' })

    expect(p1.items).toHaveLength(5)
    expect(p2.items).toHaveLength(5)
    expect(p1.items[0].id).not.toBe(p2.items[0].id)
    expect(p1.page).toBe(1)
    expect(p1.perPage).toBe(5)
    expect(p1.total).toBeGreaterThan(10)

    // Orden descendente por importe
    expect(compareDecimals(p1.items[0].amount, p1.items[1].amount)).toBeGreaterThanOrEqual(0)
  })

  it('(12) marginHealth cambia según el margen (HEALTHY, WARNING, CRITICAL)', () => {
    expect(MARGIN_HEALTH_THRESHOLDS.CRITICAL).toBe('10.00')
    expect(MARGIN_HEALTH_THRESHOLDS.WARNING).toBe('20.00')

    // Verificación de constantes y tasas de cambio
    expect(MOCK_EXCHANGE_RATES_TO_USD.USD).toBe('1.00')
    expect(MOCK_EXCHANGE_RATES_TO_USD.CUP).toBe('0.003125')
    expect(MOCK_EXCHANGE_RATES_TO_USD.CUP_TRANSFER).toBe('0.003125')
    expect(MOCK_EXCHANGE_RATES_TO_USD.MLC).toBe('1.00')
  })

  it('(13) sin ventas el margen es 0.00 y no hay división por cero', async () => {
    // Consultar una categoría o almacén sin ventas (o rango futuro)
    const summary = await service.getFinanceSummary({
      desde: '2026-11-29',
      hasta: '2026-11-30',
      categoryId: 9999, // Inexistente
    })

    expect(summary.salesTotal).toBe('0.00')
    expect(summary.salesCount).toBe(0)
    expect(summary.marginPercent).toBe('0.00')
  })

  it('(14) los importes son strings decimales con 2 decimales', async () => {
    const summary = await service.getFinanceSummary()

    expect(summary.salesTotal).toMatch(/^\d+\.\d{2}$/)
    expect(summary.purchasesTotal).toMatch(/^\d+\.\d{2}$/)
    expect(summary.cogsTotal).toMatch(/^\d+\.\d{2}$/)
    expect(summary.grossProfit).toMatch(/^-?\d+\.\d{2}$/)
    expect(summary.marginPercent).toMatch(/^-?\d+\.\d{2}$/)
    expect(summary.cashBalance).toMatch(/^-?\d+\.\d{2}$/)

    for (const c of summary.salesByCurrency || []) {
      expect(c.amount).toMatch(/^\d+\.\d{2}$/)
    }
  })

  it('(15) con fecha simulada, ningún movimiento ni punto de serie es posterior a ahora, y la suma de la serie iguala el resumen', async () => {
    // Simular fecha fija: 10 de noviembre de 2026 a las 14:30:00
    const fakeNow = new Date(2026, 10, 10, 14, 30, 0)
    const testService = new MockReportsService(fakeNow)

    // 1. Verificar movimientos generados en los 3 meses calendario
    const movementsRes = await testService.listMovements({
      desde: '2026-09-01',
      hasta: '2026-11-30',
      perPage: 100,
    })
    expect(movementsRes.items.length).toBeGreaterThanOrEqual(60)

    const fakeNowIsoDate = '2026-11-10'
    for (const m of movementsRes.items) {
      const mDate = m.date.slice(0, 10)
      expect(mDate <= fakeNowIsoDate).toBe(true)
      if (mDate === fakeNowIsoDate) {
        const timePart = m.date.slice(11, 16)
        expect(timePart <= '14:30').toBe(true)
      }
    }

    // 2. Verificar que los puntos con datos en el mes actual no superen hoy
    const currentMonthSummary = await testService.getFinanceSummary({
      desde: '2026-11-01',
      hasta: '2026-11-30',
    })
    const ts = await testService.getFinanceTimeSeries(
      { desde: '2026-11-01', hasta: '2026-11-30' },
      'day'
    )

    const pointsWithData = ts.points.filter(
      (p) =>
        compareDecimals(p.salesTotal, '0.00') > 0 ||
        (p.purchasesTotal && compareDecimals(p.purchasesTotal, '0.00') > 0)
    )
    for (const p of pointsWithData) {
      expect(p.date <= fakeNowIsoDate).toBe(true)
    }

    // 3. Suma de la serie temporal iguala el total del resumen
    let sumSales = '0.00'
    let sumPurchases = '0.00'
    for (const p of ts.points) {
      sumSales = addDecimals(sumSales, p.salesTotal)
      if (p.purchasesTotal) {
        sumPurchases = addDecimals(sumPurchases, p.purchasesTotal)
      }
    }
    expect(sumSales).toBe(currentMonthSummary.salesTotal)
    expect(sumPurchases).toBe(currentMonthSummary.purchasesTotal)
  })

  it('(16) mock top respeta limit y rango y calcula rotationPercent', async () => {
    const top3 = await service.getTopProducts({ from: '2026-10-01', to: '2026-10-31', limit: 3 })
    expect(top3).toHaveLength(3)
    expect(top3[0].rotationPercent).toBe('100.00')
    expect(compareDecimals(top3[1].rotationPercent, '100.00')).toBeLessThanOrEqual(0)
    expect(top3[0].productId).toBeDefined()
    expect(top3[0].code).toBeDefined()
    expect(top3[0].name).toBeDefined()
    expect(top3[0].category).toBeDefined()
  })

  it('(17) limit inválido da 400', async () => {
    await expect(service.getTopProducts({ limit: 0 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(service.getTopProducts({ limit: 51 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(service.getTopProducts({ limit: 3.5 })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('(18) mock ociosos filtra por days y ordena por daysWithoutSale desc', async () => {
    const idle30 = await service.getIdleProducts({ days: 30 })
    const idle60 = await service.getIdleProducts({ days: 60 })
    expect(idle30.total).toBeGreaterThanOrEqual(idle60.total)
    expect(idle30.items.length).toBeGreaterThanOrEqual(1)

    for (let i = 0; i < idle30.items.length - 1; i++) {
      const a = idle30.items[i].daysWithoutSale
      const b = idle30.items[i + 1].daysWithoutSale
      if (a !== null && b !== null) {
        expect(a).toBeGreaterThanOrEqual(b)
      }
    }
  })

  it('(19) days inválido da 400', async () => {
    await expect(service.getIdleProducts({ days: 0 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(service.getIdleProducts({ days: 366 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(service.getIdleProducts({ days: 20.5 })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('(20) sin costos no hay tiedUpCapital ni totalTiedUpCapital en mock ociosos', async () => {
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'vendedor_sin_costos',
        permissions: ['reports.view'],
      })
    )
    const idleRes = await service.getIdleProducts({ days: 30 })
    expect(idleRes.totalTiedUpCapital).toBeUndefined()
    expect(Object.prototype.hasOwnProperty.call(idleRes, 'totalTiedUpCapital')).toBe(false)
    for (const item of idleRes.items) {
      expect(Object.prototype.hasOwnProperty.call(item, 'tiedUpCapital')).toBe(false)
    }
  })
})
