import { describe, it, expect, beforeEach } from 'vitest'
import { MockSalesService } from '@/services/mock/mockSalesService'
import { MockCashService } from '@/services/mock/mockCashService'
import { MockInventoryService } from '@/services/mock/mockInventoryService'
import { ApiError } from '@/shared/types/api'
import type { CreateSaleRequest } from '@/features/sales/types'

describe('Servicios de Ventas y Caja (SalesService y CashService)', () => {
  let inventoryService: MockInventoryService
  let cashService: MockCashService
  let salesService: MockSalesService

  beforeEach(() => {
    localStorage.clear()
    // Autenticar por defecto con todos los permisos del módulo de ventas y caja
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'cajero',
        name: 'Yadira Reyes',
        permissions: [
          'sales.create',
          'sales.view',
          'sales.cancel',
          'cash.manage',
          'cash.open_close',
          'cash.exchange',
          'cash.view_history',
          'system.config',
        ],
      })
    )

    inventoryService = new MockInventoryService()
    cashService = new MockCashService()
    salesService = new MockSalesService(inventoryService, cashService)
  })

  it('(1) venta CUP con vuelto calcula el importe exacto, el vuelto y descuenta stock', async () => {
    const request: CreateSaleRequest = {
      clientRequestId: 'req-cup-001',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001', // Café Serrano: 650.00 CUP, stock 24.00
          quantity: '1.00',
        },
      ],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '1000.00',
    }

    const sale = await salesService.createSale(request)

    expect(sale.status).toBe('COMPLETED')
    expect(sale.totalCUP).toBe('650.00')
    expect(sale.totalInCurrency).toBe('650.00')
    expect(sale.cashReceived).toBe('1000.00')
    expect(sale.changeGivenCUP).toBe('350.00')
    expect(sale.items).toHaveLength(1)
    expect(sale.items[0].subtotalCUP).toBe('650.00')

    // Stock de Café Serrano baja de 24 a 23
    const prod = await salesService.getPosProductByCode('78910001', 'ALM-TIENDA')
    expect(prod.stock).toBe('23.00')

    // Caja registra la venta en cupCash
    const shift = await cashService.getCurrentShift()
    expect(shift?.salesTotals.cupCash).toBe('650.00')
  })

  it('(2) venta USD con ceil y vuelto en CUP (4.63 -> 5 USD, pagando 10 USD)', async () => {
    // 2 Café (2 * 650 = 1300) + 1 Cerveza Cristal (320) = 1620.00 CUP
    // Tasa diaria 360 - Margen 10 = Tasa efectiva 350.00
    // 1620.00 / 350.00 = 4.6285... ceil -> 5.00 USD
    // Recibido: 10.00 USD -> Equiv: 3500.00 CUP - 1620.00 CUP = 1880.00 CUP de vuelto
    const request: CreateSaleRequest = {
      clientRequestId: 'req-usd-ceil-001',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001',
          quantity: '2.00',
        },
        {
          productCode: '78910004',
          quantity: '1.00',
        },
      ],
      paidCurrency: 'USD',
      paymentMethod: 'CASH',
      cashReceived: '10.00',
    }

    const sale = await salesService.createSale(request)

    expect(sale.status).toBe('COMPLETED')
    expect(sale.totalCUP).toBe('1620.00')
    expect(sale.exchangeRateApplied).toBe('350.00')
    expect(sale.totalInCurrency).toBe('5.00')
    expect(sale.totalUSD).toBe('5.00')
    expect(sale.cashReceived).toBe('10.00')
    expect(sale.changeGivenCUP).toBe('1880.00')

    // Gaveta en USD suma 5.00
    const shift = await cashService.getCurrentShift()
    expect(shift?.salesTotals.USD).toBe('5.00')
  })

  it('(3) venta por CUP_TRANSFER sin vuelto incrementa cupTransfer y fija changeGivenCUP en 0.00', async () => {
    const request: CreateSaleRequest = {
      clientRequestId: 'req-transfer-001',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001',
          quantity: '1.00',
        },
      ],
      paidCurrency: 'CUP_TRANSFER',
      paymentMethod: 'TRANSFER',
      cashReceived: '650.00',
      transferGateway: 'EnZona',
      transferReference: 'ENZ-88991122',
    }

    const sale = await salesService.createSale(request)

    expect(sale.status).toBe('COMPLETED')
    expect(sale.totalCUP).toBe('650.00')
    expect(sale.changeGivenCUP).toBe('0.00')
    expect(sale.transferReference).toBe('ENZ-88991122')

    // Las transferencias bancarias se registran en cupTransfer y no en efectivo físico
    const shift = await cashService.getCurrentShift()
    expect(shift?.salesTotals.cupTransfer).toBe('650.00')
    expect(shift?.salesTotals.cupCash).toBe('0.00')
  })

  it('(4) idempotencia: misma clientRequestId devuelve la misma venta sin descontar stock otra vez', async () => {
    const request: CreateSaleRequest = {
      clientRequestId: 'idem-uuid-unique-123',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001', // Stock inicial 24.00
          quantity: '2.00',
        },
      ],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '1300.00',
    }

    const firstSale = await salesService.createSale(request)
    expect(firstSale.clientRequestId).toBe('idem-uuid-unique-123')

    // Stock tras la primera venta debe ser 22.00
    const prod1 = await salesService.getPosProductByCode('78910001', 'ALM-TIENDA')
    expect(prod1.stock).toBe('22.00')

    // Reintento idéntico por duplicidad de clic o red
    const retrySale = await salesService.createSale(request)
    expect(retrySale.id).toBe(firstSale.id)

    // Stock NO se descuenta nuevamente: sigue en 22.00
    const prod2 = await salesService.getPosProductByCode('78910001', 'ALM-TIENDA')
    expect(prod2.stock).toBe('22.00')

    // El listado de ventas contiene solo 1 venta
    const salesList = await salesService.getSales()
    expect(salesList.total).toBe(1)
  })

  it('(5) rechaza con 409 STOCK_INSUFFICIENT si la cantidad solicitada supera el stock disponible', async () => {
    const request: CreateSaleRequest = {
      clientRequestId: 'req-stock-exceeded',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001', // Stock 24.00
          quantity: '50.00',
        },
      ],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '32500.00',
    }

    await expect(salesService.createSale(request)).rejects.toThrow(ApiError)
    try {
      await salesService.createSale(request)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(409)
      expect(apiErr.code).toBe('STOCK_INSUFFICIENT')
      expect(apiErr.details?.['78910001']).toBeDefined()
    }

    // Stock permanece intacto en 24.00
    const prod = await salesService.getPosProductByCode('78910001', 'ALM-TIENDA')
    expect(prod.stock).toBe('24.00')
  })

  it('(6) rechaza con 409 SHIFT_NOT_OPEN si no hay un turno de caja abierto', async () => {
    // Cerramos el turno existente
    await cashService.closeShift('TURNO-2026-001', {
      countedCUP: '10000.00',
      countedUSD: '100.00',
      notes: 'Cierre previo para test',
    })

    const request: CreateSaleRequest = {
      clientRequestId: 'req-without-shift',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001',
          quantity: '1.00',
        },
      ],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '1000.00',
    }

    await expect(salesService.createSale(request)).rejects.toThrow(ApiError)
    try {
      await salesService.createSale(request)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(409)
      expect(apiErr.code).toBe('SHIFT_NOT_OPEN')
    }
  })

  it('(7) rechaza con 400 CASH_INSUFFICIENT si el efectivo recibido es menor al total a cobrar', async () => {
    const request: CreateSaleRequest = {
      clientRequestId: 'req-cash-insufficient',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001', // Total 650.00 CUP
          quantity: '1.00',
        },
      ],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '500.00', // Menor que 650.00
    }

    await expect(salesService.createSale(request)).rejects.toThrow(ApiError)
    try {
      await salesService.createSale(request)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(400)
      expect(apiErr.code).toBe('CASH_INSUFFICIENT')
    }
  })

  it('(8) rechaza con 400 TRANSFER_REFERENCE_REQUIRED si falta la referencia en pago por transferencia', async () => {
    const request: CreateSaleRequest = {
      clientRequestId: 'req-no-ref-transfer',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001',
          quantity: '1.00',
        },
      ],
      paidCurrency: 'CUP_TRANSFER',
      paymentMethod: 'TRANSFER',
      cashReceived: '650.00',
      transferReference: '   ', // Vacío
    }

    await expect(salesService.createSale(request)).rejects.toThrow(ApiError)
    try {
      await salesService.createSale(request)
    } catch (err: unknown) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(400)
      expect(apiErr.code).toBe('TRANSFER_REFERENCE_REQUIRED')
    }
  })

  it('(9) cierre con descuadre exige obligatoriamente motivo (>= 10 caracteres)', async () => {
    // Esperado en turno inicial: CUP 10000.00, USD 100.00
    // Contamos con faltante: CUP 9500.00 (diferencia -500.00 CUP)
    // Sin motivo o con motivo menor a 10 caracteres debe fallar con 400 REASON_REQUIRED
    await expect(
      cashService.closeShift('TURNO-2026-001', {
        countedCUP: '9500.00',
        countedUSD: '100.00',
        notes: 'error', // 5 caracteres < 10
      })
    ).rejects.toThrow(ApiError)

    try {
      await cashService.closeShift('TURNO-2026-001', {
        countedCUP: '9500.00',
        countedUSD: '100.00',
        notes: 'corto',
      })
    } catch (err: unknown) {
      const apiErr = err as ApiError
      expect(apiErr.statusCode).toBe(400)
      expect(apiErr.code).toBe('REASON_REQUIRED')
      expect(apiErr.details?.notes).toBeDefined()
    }

    // Con motivo válido >= 10 caracteres se cierra exitosamente
    const closed = await cashService.closeShift('TURNO-2026-001', {
      countedCUP: '9500.00',
      countedUSD: '100.00',
      notes: 'Faltante de 500 CUP por entrega errónea de vuelto al cliente.',
    })

    expect(closed.status).toBe('CLOSED')
    expect(closed.differences.CUP).toBe('-500.00')
    expect(closed.differences.USD).toBe('0.00')
  })

  it('(10) cierre sin diferencia no exige motivo y se completa exitosamente', async () => {
    // Esperado inicial: CUP 10000.00, USD 100.00
    const closed = await cashService.closeShift('TURNO-2026-001', {
      countedCUP: '10000.00',
      countedUSD: '100.00',
      notes: '', // Vacío permitido al ser exacto
    })

    expect(closed.status).toBe('CLOSED')
    expect(closed.differences.CUP).toBe('0.00')
    expect(closed.differences.USD).toBe('0.00')
  })

  it('(11) canje de divisas ajusta los fondos esperados de la gaveta', async () => {
    // Tasa diaria: 360.00, Margen: 10.00 -> Tasa efectiva: 350.00
    // Canje de 20.00 USD -> 20 * 350 = 7000.00 CUP entregados al cliente
    const exchange = await cashService.createExchange({
      shiftId: 'TURNO-2026-001',
      currencyFrom: 'USD',
      amountFrom: '20.00',
      notes: 'Canje de billete de 20 USD',
    })

    expect(exchange.effectiveRate).toBe('350.00')
    expect(exchange.amountTo).toBe('7000.00')

    const shift = await cashService.getCurrentShift()
    expect(shift?.exchangeAdjustments.USD).toBe('20.00')
    expect(shift?.exchangeAdjustments.CUP).toBe('-7000.00')

    // Al cerrar, el esperado contempla el canje
    const closed = await cashService.closeShift('TURNO-2026-001', {
      countedCUP: '3000.00', // 10000 - 7000 = 3000
      countedUSD: '120.00', // 100 + 20 = 120
    })

    expect(closed.expectedFunds.CUP).toBe('3000.00')
    expect(closed.expectedFunds.USD).toBe('120.00')
    expect(closed.differences.CUP).toBe('0.00')
    expect(closed.differences.USD).toBe('0.00')
  })

  it('(12) anulación de venta repone existencias al inventario y revierte la venta', async () => {
    // Stock inicial Café Serrano: 24.00
    const sale = await salesService.createSale({
      clientRequestId: 'req-to-cancel-001',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [
        {
          productCode: '78910001',
          quantity: '3.00',
        },
      ],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '2000.00',
    })

    const prodAfterSale = await salesService.getPosProductByCode('78910001', 'ALM-TIENDA')
    expect(prodAfterSale.stock).toBe('21.00')

    // Anular venta
    const cancelRes = await salesService.cancelSale(sale.id, {
      reason: 'Cliente devolvió el producto por empaque deteriorado.',
    })

    expect(cancelRes.status).toBe('CANCELLED')
    expect(cancelRes.stockReverted).toBe(true)

    // Stock restaurado a 24.00
    const prodRestored = await salesService.getPosProductByCode('78910001', 'ALM-TIENDA')
    expect(prodRestored.stock).toBe('24.00')

    // No permite anular nuevamente (409)
    await expect(
      salesService.cancelSale(sale.id, { reason: 'Intento de anulación repetida' })
    ).rejects.toThrow(ApiError)
  })

  it('(13) sin permisos correspondientes rechaza con 403 FORBIDDEN en todas las operaciones', async () => {
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'observador',
        permissions: [], // Sin ningún permiso
      })
    )

    await expect(salesService.getPosProducts()).rejects.toThrow(ApiError)
    await expect(
      salesService.createSale({
        clientRequestId: 'req-403',
        shiftId: 'TURNO-2026-001',
        warehouseId: 'ALM-TIENDA',
        items: [{ productCode: '78910001', quantity: '1.00' }],
        paidCurrency: 'CUP',
        paymentMethod: 'CASH',
        cashReceived: '1000.00',
      })
    ).rejects.toThrow(ApiError)
    await expect(salesService.getSales()).rejects.toThrow(ApiError)
    await expect(salesService.cancelSale('TICK-000', { reason: 'Sin permiso' })).rejects.toThrow(
      ApiError
    )
    await expect(
      cashService.openShift({
        cashierName: 'test',
        initialCUP: '1000.00',
        initialUSD: '10.00',
        dailyRateUSD: '360.00',
      })
    ).rejects.toThrow(ApiError)
    await expect(
      cashService.closeShift('TURNO-2026-001', { countedCUP: '1000.00', countedUSD: '10.00' })
    ).rejects.toThrow(ApiError)
    await expect(
      cashService.createExchange({
        shiftId: 'TURNO-2026-001',
        currencyFrom: 'USD',
        amountFrom: '10.00',
      })
    ).rejects.toThrow(ApiError)
    await expect(cashService.getShifts()).rejects.toThrow(ApiError)
  })

  it('(14) historial de ventas pagina y filtra adecuadamente por moneda y turno', async () => {
    // Generar dos ventas en CUP y una en USD
    await salesService.createSale({
      clientRequestId: 'sale-page-1',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [{ productCode: '78910001', quantity: '1.00' }],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '1000.00',
    })
    await salesService.createSale({
      clientRequestId: 'sale-page-2',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [{ productCode: '78910003', quantity: '1.00' }],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '500.00',
    })
    await salesService.createSale({
      clientRequestId: 'sale-page-3',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [{ productCode: '78910004', quantity: '1.00' }],
      paidCurrency: 'USD',
      paymentMethod: 'CASH',
      cashReceived: '5.00',
    })

    const allSales = await salesService.getSales({ page: 1, perPage: 2 })
    expect(allSales.total).toBe(3)
    expect(allSales.items).toHaveLength(2)

    const usdSales = await salesService.getSales({ currency: 'USD' })
    expect(usdSales.total).toBe(1)
    expect(usdSales.items[0].paidCurrency).toBe('USD')

    const cupSales = await salesService.getSales({ currency: 'CUP' })
    expect(cupSales.total).toBe(2)
  })

  it('(15) cambio en el margen de canje (exchangeMargin) altera la tasa efectiva aplicada', async () => {
    // Ajustar margen a 25.00 CUP con system.config
    await cashService.updateSettings({ exchangeMargin: '25.00' })
    const settings = await cashService.getSettings()
    expect(settings.exchangeMargin).toBe('25.00')

    // Tasa diaria 360.00 - Margen 25.00 = Tasa efectiva 335.00
    const exchange = await cashService.createExchange({
      shiftId: 'TURNO-2026-001',
      currencyFrom: 'USD',
      amountFrom: '10.00',
    })

    expect(exchange.effectiveRate).toBe('335.00')
    expect(exchange.amountTo).toBe('3350.00') // 10 * 335 = 3350 CUP
  })

  it('(16) búsqueda en getSales filtra por ticket, cajero, nombre de producto, SKU, sin acentos y sin resultados', async () => {
    // Venta 1 con Yadira Reyes y Café Serrano (SKU 78910001)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        fullName: 'Yadira Reyes',
        permissions: ['sales.create', 'sales.view', 'cash.manage'],
      })
    )
    const sale1 = await salesService.createSale({
      clientRequestId: 'search-test-sale-1',
      shiftId: 'TURNO-2026-001',
      warehouseId: 'ALM-TIENDA',
      items: [{ productCode: '78910001', quantity: '1.00' }],
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      cashReceived: '1000.00',
    })

    // Venta 2 con Carlos Gómez y Cerveza Cristal (SKU 78910004)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        fullName: 'Carlos Gómez',
        permissions: ['sales.create', 'sales.view', 'cash.manage'],
      })
    )
    const sale2 = await salesService.createSale({
      clientRequestId: 'search-test-sale-2',
      shiftId: 'TURNO-2026-002',
      warehouseId: 'ALM-TIENDA',
      items: [{ productCode: '78910004', quantity: '1.00' }],
      paidCurrency: 'USD',
      paymentMethod: 'CASH',
      cashReceived: '5.00',
    })

    // (a) Búsqueda por folio de ticket
    const resTicket = await salesService.getSales({ search: sale1.id })
    expect(resTicket.items).toHaveLength(1)
    expect(resTicket.items[0].id).toBe(sale1.id)

    // (b) Búsqueda por nombre de cajero
    const resCashier = await salesService.getSales({ search: 'Carlos' })
    expect(resCashier.items.some((s) => s.id === sale2.id)).toBe(true)

    // (c) Búsqueda por nombre de producto
    const resProduct = await salesService.getSales({ search: 'Cristal' })
    expect(resProduct.items.some((s) => s.id === sale2.id)).toBe(true)

    // (d) Búsqueda por SKU / productCode
    const resSKU = await salesService.getSales({ search: '78910001' })
    expect(resSKU.items.some((s) => s.id === sale1.id)).toBe(true)

    // (e) Búsqueda sin acentos ("cafe" debe coincidir con "Café")
    const resAccent = await salesService.getSales({ search: 'cafe' })
    expect(resAccent.items.some((s) => s.id === sale1.id)).toBe(true)

    // (f) Búsqueda sin resultados
    const resEmpty = await salesService.getSales({ search: 'producto_inexistente_xyz' })
    expect(resEmpty.items).toHaveLength(0)
    expect(resEmpty.total).toBe(0)
  })
})
