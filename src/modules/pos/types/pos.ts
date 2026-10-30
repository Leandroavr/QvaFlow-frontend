/**
 * Definiciones de tipos para el Punto de Venta (POS) y Turnos de Caja en QvaFlow.
 */

export type PaymentCurrency = 'CUP' | 'USD' | 'MLC' | 'EUR'
export type PaymentMethod = 'CASH' | 'TRANSFER_QR'
export type TransferGateway = 'TRANSFERMOVIL' | 'ENZONA'
export type PosPaymentMode = 'CUP_CASH' | 'CUP_TRANSFER' | 'USD_CASH' | 'EUR_CASH' | 'MLC_TRANSFER'

export interface PosProduct {
  id: number
  code: string
  name: string
  category: string
  price: number // Precio base de venta en CUP
  priceUSD?: number // Precio de venta en USD
  costUSD?: number // Costo de adquisición en USD
  costCUP?: number // Costo de adquisición en CUP
  stock: number
  unit: string
  image?: string
  accentColor?: string
}

export interface CartItem {
  id: number
  product: PosProduct
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ExchangeRates {
  CUP: number
  USD: number
  MLC: number
  EUR: number
}

export interface CompletedSale {
  id: string
  shiftId?: string
  items: CartItem[]
  totalCUP: number
  totalUSD?: number
  paidCurrency: PaymentCurrency
  exchangeRate: number
  totalInCurrency: number
  cashReceived: number
  changeGiven: number
  paymentMethod: PaymentMethod
  transferGateway?: TransferGateway
  transferReference?: string
  cashierName?: string
  createdAt: string
}

// Control y Arqueo de Turnos de Caja
export interface CashShift {
  id: string
  cashierName: string
  openedAt: string
  closedAt?: string
  status: 'OPEN' | 'CLOSED'
  dailyRateUSD: number // Tasa diaria fijada en la apertura (CUP x USD)
  initialFunds: {
    CUP: number
    USD: number
  }
  salesTotals: {
    CUP: number
    cupCash?: number
    cupTransfer?: number
    USD: number
  }
  exchangeAdjustments: {
    CUP: number
    USD: number
  }
  countedFunds?: {
    CUP: number
    USD: number
  }
  differences?: {
    CUP: number // > 0 sobrante, < 0 faltante
    USD: number
  }
  discrepancyReason?: string
  notes?: string
}

// Operaciones de Canje de Moneda en Mostrador
export interface CurrencyExchangeOperation {
  id: string
  timestamp: string
  currencyFrom: PaymentCurrency
  amountFrom: number
  currencyTo: PaymentCurrency
  amountTo: number
  rate: number
  notes?: string
}

// Órdenes en Espera (Tickets en Hold)
export interface HeldOrder {
  id: string
  name: string
  cart: CartItem[]
  createdAt: string
  totalCUP: number
}
