import apiClient from '@/core/axios'
import type {
  PosProduct,
  CompletedSale,
  ExchangeRates,
  CashShift,
  CurrencyExchangeOperation,
} from '../types/pos'

// Catálogo de productos simulados para el terminal POS
const PRODUCTOS_POS_MOCK: PosProduct[] = [
  {
    id: 101,
    code: '78910001',
    name: 'Café Serrano Clásico 250g',
    category: 'Alimentos',
    price: 650,
    stock: 24,
    unit: 'pqte',
    image: '☕',
    accentColor: '#b45309',
  },
  {
    id: 102,
    code: '78910002',
    name: 'Aceite de Girasol Criollo 1L',
    category: 'Alimentos',
    price: 950,
    stock: 15,
    unit: 'botella',
    image: '🌻',
    accentColor: '#eab308',
  },
  {
    id: 103,
    code: '78910003',
    name: 'Refresco Tukola Lata 330ml',
    category: 'Bebidas',
    price: 280,
    stock: 48,
    unit: 'lata',
    image: '🥤',
    accentColor: '#dc2626',
  },
  {
    id: 104,
    code: '78910004',
    name: 'Cerveza Cristal Lata 355ml',
    category: 'Bebidas',
    price: 320,
    stock: 72,
    unit: 'lata',
    image: '🍺',
    accentColor: '#16a34a',
  },
  {
    id: 105,
    code: '78910005',
    name: 'Cigarros H. Upmann Selecto',
    category: 'Tabacos',
    price: 300,
    stock: 50,
    unit: 'cajetilla',
    image: '🚬',
    accentColor: '#78716c',
  },
  {
    id: 106,
    code: '78910006',
    name: 'Pollo Entero Congelado 1kg',
    category: 'Cárnicos',
    price: 1350,
    stock: 18,
    unit: 'kg',
    image: '🍗',
    accentColor: '#ea580c',
  },
]

// Tasas de cambio de referencia del mercado en Cuba
const TASAS_CAMBIO_DEFAULT: ExchangeRates = {
  CUP: 1,
  USD: 360,
  EUR: 380,
  MLC: 275,
}

// Turno activo inicial simulado
let activeShift: CashShift | null = {
  id: 'TURNO-2026-001',
  cashierName: 'Caja Principal (Yadira Reyes)',
  openedAt: '2026-10-27 08:00',
  status: 'OPEN',
  dailyRateUSD: 360,
  initialFunds: {
    CUP: 10000,
    USD: 100,
  },
  salesTotals: {
    CUP: 28500,
    cupCash: 25980,
    cupTransfer: 2520,
    USD: 40,
  },
  exchangeAdjustments: {
    CUP: -7200, // Entregó 7200 CUP en canjes
    USD: 20, // Recibió 20 USD
  },
}

let exchangeHistory: CurrencyExchangeOperation[] = []

// Historial simulado de ventas realizadas
let salesHistory: CompletedSale[] = [
  {
    id: 'TICK-908123',
    shiftId: 'TURNO-2026-001',
    items: [
      {
        id: 1,
        product: PRODUCTOS_POS_MOCK[0],
        quantity: 2,
        unitPrice: 650,
        subtotal: 1300,
      },
      {
        id: 2,
        product: PRODUCTOS_POS_MOCK[2],
        quantity: 3,
        unitPrice: 280,
        subtotal: 840,
      },
    ],
    totalCUP: 2140,
    totalUSD: 5.94,
    paidCurrency: 'CUP',
    exchangeRate: 360,
    totalInCurrency: 2140,
    cashReceived: 2500,
    changeGiven: 360,
    paymentMethod: 'CASH',
    cashierName: 'Yadira Reyes',
    createdAt: '2026-10-27 09:15',
  },
  {
    id: 'TICK-908124',
    shiftId: 'TURNO-2026-001',
    items: [
      {
        id: 3,
        product: PRODUCTOS_POS_MOCK[1],
        quantity: 1,
        unitPrice: 950,
        subtotal: 950,
      },
    ],
    totalCUP: 950,
    totalUSD: 3,
    paidCurrency: 'USD',
    exchangeRate: 350,
    totalInCurrency: 3,
    cashReceived: 5,
    changeGiven: 2,
    paymentMethod: 'CASH',
    cashierName: 'Yadira Reyes',
    createdAt: '2026-10-27 09:22',
  },
  {
    id: 'TICK-908125',
    shiftId: 'TURNO-2026-001',
    items: [
      {
        id: 4,
        product: PRODUCTOS_POS_MOCK[3],
        quantity: 6,
        unitPrice: 320,
        subtotal: 1920,
      },
      {
        id: 5,
        product: PRODUCTOS_POS_MOCK[4],
        quantity: 2,
        unitPrice: 300,
        subtotal: 600,
      },
    ],
    totalCUP: 2520,
    totalUSD: 7.0,
    paidCurrency: 'CUP',
    exchangeRate: 360,
    totalInCurrency: 2520,
    cashReceived: 2520,
    changeGiven: 0,
    paymentMethod: 'TRANSFER_QR',
    transferGateway: 'TRANSFERMOVIL',
    transferReference: 'TRF-8812901',
    cashierName: 'Yadira Reyes',
    createdAt: '2026-10-27 09:30',
  },
  {
    id: 'TICK-908119',
    shiftId: 'TURNO-2026-000',
    items: [
      {
        id: 6,
        product: PRODUCTOS_POS_MOCK[5],
        quantity: 2,
        unitPrice: 1350,
        subtotal: 2700,
      },
    ],
    totalCUP: 2700,
    totalUSD: 7.54,
    paidCurrency: 'CUP',
    exchangeRate: 358,
    totalInCurrency: 2700,
    cashReceived: 3000,
    changeGiven: 300,
    paymentMethod: 'CASH',
    cashierName: 'Marcos Peña',
    createdAt: '2026-10-26 18:40',
  },
  {
    id: 'TICK-908118',
    shiftId: 'TURNO-2026-000',
    items: [
      {
        id: 7,
        product: PRODUCTOS_POS_MOCK[0],
        quantity: 4,
        unitPrice: 650,
        subtotal: 2600,
      },
    ],
    totalCUP: 2600,
    totalUSD: 7.26,
    paidCurrency: 'USD',
    exchangeRate: 358,
    totalInCurrency: 7.26,
    cashReceived: 10,
    changeGiven: 2.74,
    paymentMethod: 'CASH',
    cashierName: 'Marcos Peña',
    createdAt: '2026-10-26 16:15',
  },
]

// Historial simulado de turnos y cuadres de caja
let shiftsHistory: CashShift[] = [
  activeShift as CashShift,
  {
    id: 'TURNO-2026-000',
    cashierName: 'Marcos Peña (Turno Tarde)',
    openedAt: '2026-10-26 14:00',
    closedAt: '2026-10-26 21:30',
    status: 'CLOSED',
    dailyRateUSD: 358,
    initialFunds: { CUP: 8000, USD: 50 },
    salesTotals: { CUP: 45200, cupCash: 38200, cupTransfer: 7000, USD: 85 },
    exchangeAdjustments: { CUP: -3580, USD: 10 },
    countedFunds: { CUP: 49620, USD: 145 },
    differences: { CUP: 0, USD: 0 },
    discrepancyReason: 'Arqueo perfecto. Todo el efectivo en caja coincide exactamente con el sistema.',
    notes: 'Arqueo perfecto. Todo el efectivo en caja coincide exactamente con el sistema.',
  },
  {
    id: 'TURNO-2026-999',
    cashierName: 'Yadira Reyes (Turno Mañana)',
    openedAt: '2026-10-26 08:00',
    closedAt: '2026-10-26 14:00',
    status: 'CLOSED',
    dailyRateUSD: 358,
    initialFunds: { CUP: 10000, USD: 100 },
    salesTotals: { CUP: 32400, cupCash: 28400, cupTransfer: 4000, USD: 30 },
    exchangeAdjustments: { CUP: 0, USD: 0 },
    countedFunds: { CUP: 42350, USD: 130 },
    differences: { CUP: -50, USD: 0 },
    discrepancyReason: 'Faltante de 50 CUP por redondeo y falta de billetes fraccionarios para cambio en vueltos.',
    notes: 'Faltante de 50 CUP por redondeo y falta de billetes fraccionarios para cambio en vueltos.',
  },
  {
    id: 'TURNO-2026-998',
    cashierName: 'Marcos Peña (Turno Fin de Semana)',
    openedAt: '2026-10-25 10:00',
    closedAt: '2026-10-25 18:00',
    status: 'CLOSED',
    dailyRateUSD: 355,
    initialFunds: { CUP: 5000, USD: 50 },
    salesTotals: { CUP: 21500, cupCash: 16500, cupTransfer: 5000, USD: 25 },
    exchangeAdjustments: { CUP: 0, USD: 0 },
    countedFunds: { CUP: 26500, USD: 73 },
    differences: { CUP: 0, USD: -2 },
    discrepancyReason: 'Faltante de $2 USD por billete manchado rechazado al arqueo final.',
    notes: 'Faltante de $2 USD por billete manchado rechazado al arqueo final.',
  },
]

/**
 * Servicio para operaciones del Punto de Venta (POS), Turnos y Canjes.
 */
export const posService = {
  /**
   * Obtiene los productos disponibles para la venta en el terminal.
   */
  async getPosProducts(): Promise<PosProduct[]> {
    try {
      const response = await apiClient.get<PosProduct[]>('/pos/products')
      return response.data
    } catch {
      return Promise.resolve([...PRODUCTOS_POS_MOCK])
    }
  },

  /**
   * Obtiene las tasas de cambio activas del negocio.
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    try {
      const response = await apiClient.get<ExchangeRates>('/pos/exchange-rates')
      return response.data
    } catch {
      return Promise.resolve({ ...TASAS_CAMBIO_DEFAULT })
    }
  },

  /**
   * Obtiene el turno de caja actualmente activo.
   */
  async getCurrentShift(): Promise<CashShift | null> {
    try {
      const response = await apiClient.get<CashShift | null>('/pos/shifts/current')
      return response.data
    } catch {
      return Promise.resolve(activeShift ? { ...activeShift } : null)
    }
  },

  /**
   * Realiza la apertura de un nuevo turno de caja con fondo dual inicial y tasa diaria.
   */
  async openShift(
    initialCUP: number,
    initialUSD: number,
    cashierName: string,
    dailyRateUSD: number = 360
  ): Promise<CashShift> {
    try {
      const response = await apiClient.post<CashShift>('/pos/shifts/open', {
        initialFunds: { CUP: initialCUP, USD: initialUSD },
        cashierName,
        dailyRateUSD,
      })
      return response.data
    } catch {
      activeShift = {
        id: `TURNO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        cashierName,
        openedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'OPEN',
        dailyRateUSD,
        initialFunds: { CUP: initialCUP, USD: initialUSD },
        salesTotals: { CUP: 0, cupCash: 0, cupTransfer: 0, USD: 0 },
        exchangeAdjustments: { CUP: 0, USD: 0 },
      }
      shiftsHistory.unshift(activeShift)
      return Promise.resolve({ ...activeShift })
    }
  },

  /**
   * Cierra y arquea el turno actual comparando lo esperado vs lo contado.
   */
  async closeShift(
    countedCUP: number,
    countedUSD: number,
    notes?: string
  ): Promise<CashShift> {
    try {
      const response = await apiClient.post<CashShift>('/pos/shifts/close', {
        countedFunds: { CUP: countedCUP, USD: countedUSD },
        notes,
      })
      return response.data
    } catch {
      if (!activeShift) throw new Error('No hay turno abierto para cerrar.')

      const expectedCUP =
        activeShift.initialFunds.CUP +
        (activeShift.salesTotals.cupCash ?? activeShift.salesTotals.CUP) +
        activeShift.exchangeAdjustments.CUP

      const expectedUSD =
        activeShift.initialFunds.USD +
        activeShift.salesTotals.USD +
        activeShift.exchangeAdjustments.USD

      activeShift.status = 'CLOSED'
      activeShift.closedAt = new Date().toISOString().replace('T', ' ').slice(0, 16)
      activeShift.countedFunds = { CUP: countedCUP, USD: countedUSD }
      const diffCUP = countedCUP - expectedCUP
      const diffUSD = countedUSD - expectedUSD
      activeShift.differences = {
        CUP: diffCUP,
        USD: diffUSD,
      }
      activeShift.notes = notes
      activeShift.discrepancyReason =
        diffCUP !== 0 || diffUSD !== 0
          ? notes || 'Sin justificación especificada'
          : 'Arqueo exacto sin diferencias'

      const closed = { ...activeShift }
      activeShift = null

      const idx = shiftsHistory.findIndex((s) => s.id === closed.id)
      if (idx !== -1) {
        shiftsHistory[idx] = { ...closed }
      } else {
        shiftsHistory.unshift({ ...closed })
      }
      return Promise.resolve(closed)
    }
  },

  /**
   * Obtiene el historial de turnos y cuadres de caja.
   */
  async getShiftsHistory(): Promise<CashShift[]> {
    try {
      const response = await apiClient.get<CashShift[]>('/pos/shifts/history')
      return response.data
    } catch {
      return Promise.resolve([...shiftsHistory])
    }
  },

  /**
   * Obtiene el historial de ventas realizadas en el negocio.
   */
  async getSalesHistory(): Promise<CompletedSale[]> {
    try {
      const response = await apiClient.get<CompletedSale[]>('/pos/sales/history')
      return response.data
    } catch {
      return Promise.resolve([...salesHistory])
    }
  },

  /**
   * Actualiza las tasas de cambio de referencia del día.
   */
  async updateExchangeRates(rates: Partial<ExchangeRates>): Promise<ExchangeRates> {
    try {
      const response = await apiClient.put<ExchangeRates>('/pos/exchange-rates', rates)
      return response.data
    } catch {
      Object.assign(TASAS_CAMBIO_DEFAULT, rates)
      if (activeShift && rates.USD) {
        activeShift.dailyRateUSD = rates.USD
      }
      return Promise.resolve({ ...TASAS_CAMBIO_DEFAULT })
    }
  },

  /**
   * Registra una operación de canje de divisas en mostrador.
   */
  async recordExchange(
    op: Omit<CurrencyExchangeOperation, 'id' | 'timestamp'>
  ): Promise<CurrencyExchangeOperation> {
    try {
      const response = await apiClient.post<CurrencyExchangeOperation>('/pos/exchanges', op)
      return response.data
    } catch {
      const operation: CurrencyExchangeOperation = {
        ...op,
        id: `CNJ-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      }

      exchangeHistory.unshift(operation)

      // Afectar el saldo en el turno activo si está abierto
      if (activeShift) {
        if (op.currencyFrom === 'USD' && op.currencyTo === 'CUP') {
          activeShift.exchangeAdjustments.USD += op.amountFrom
          activeShift.exchangeAdjustments.CUP -= op.amountTo
        } else if (op.currencyFrom === 'CUP' && op.currencyTo === 'USD') {
          activeShift.exchangeAdjustments.CUP += op.amountFrom
          activeShift.exchangeAdjustments.USD -= op.amountTo
        }
      }

      return Promise.resolve(operation)
    }
  },

  /**
   * Registra una venta completada en el backend Symfony.
   */
  async recordSale(sale: Omit<CompletedSale, 'id' | 'createdAt'>): Promise<CompletedSale> {
    try {
      const response = await apiClient.post<CompletedSale>('/pos/sales', sale)
      return response.data
    } catch {
      const completed: CompletedSale = {
        ...sale,
        id: `TICK-${Date.now().toString().slice(-6)}`,
        shiftId: activeShift ? activeShift.id : undefined,
        createdAt: new Date().toISOString(),
      }

      // Sumar venta al turno activo discriminando efectivo y transferencia
      if (activeShift) {
        if (!activeShift.salesTotals.cupCash) activeShift.salesTotals.cupCash = 0
        if (!activeShift.salesTotals.cupTransfer) activeShift.salesTotals.cupTransfer = 0

        if (sale.paidCurrency === 'CUP') {
          activeShift.salesTotals.CUP += sale.totalCUP
          if (sale.paymentMethod === 'TRANSFER_QR') {
            activeShift.salesTotals.cupTransfer += sale.totalCUP
          } else {
            activeShift.salesTotals.cupCash += sale.totalCUP
          }
        } else if (sale.paidCurrency === 'USD') {
          activeShift.salesTotals.USD += Math.ceil(sale.totalInCurrency)
        }
      }

      salesHistory.unshift(completed)
      return Promise.resolve(completed)
    }
  },
}

export default posService
