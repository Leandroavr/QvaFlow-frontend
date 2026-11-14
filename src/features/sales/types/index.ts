import type { DecimalString, Currency } from '@/shared/types/currency'
import type { Id, PaginationParams, PaginatedResponse } from '@/shared/types/api'

export type { PaginatedResponse, PaginationParams }

/**
 * Producto disponible en el catálogo del terminal de ventas (POS).
 */
export interface PosProduct {
  id: Id
  code: string
  name: string
  category: string
  priceCUP: DecimalString
  priceUSD: DecimalString
  stock: DecimalString
  unit: string
}

/**
 * Parámetros de consulta y filtrado para el catálogo del POS.
 */
export interface PosProductQueryParams {
  search?: string
  category?: string
  warehouseId?: string
}

/**
 * Tasas de cambio de referencia del día para operaciones en mostrador.
 */
export interface ExchangeRates {
  CUP: DecimalString
  USD: DecimalString
  MLC: DecimalString
  updatedAt?: string
}

/**
 * DTO para actualización de tasas de cambio del día.
 */
export interface UpdateExchangeRatesDto {
  USD?: DecimalString
  MLC?: DecimalString
}

/**
 * Parámetros globales de configuración operativa de caja.
 */
export interface CashSettings {
  exchangeMargin: DecimalString
  updatedAt?: string
}

/**
 * DTO para actualización de configuración de caja.
 */
export interface UpdateCashSettingsDto {
  exchangeMargin: DecimalString
}

/**
 * Estados del ciclo de vida de un turno de caja.
 */
export type ShiftStatus = 'OPEN' | 'CLOSED'

/**
 * Desglose de fondos físicos duales en efectivo (CUP y USD).
 */
export interface ShiftDualFunds {
  CUP: DecimalString
  USD: DecimalString
}

/**
 * Desglose de recaudación acumulada en el turno por vía de cobro.
 */
export interface ShiftSalesTotals {
  cupCash: DecimalString
  cupTransfer: DecimalString
  USD: DecimalString
}

/**
 * Ajustes acumulados en gaveta por concepto de canje de divisas.
 */
export interface ShiftExchangeAdjustments {
  CUP: DecimalString
  USD: DecimalString
}

/**
 * Turno de caja (abierto o cerrado).
 */
export interface CashShift {
  id: string
  cashierName: string
  openedAt: string
  closedAt?: string
  status: ShiftStatus
  dailyRateUSD: DecimalString
  initialFunds: ShiftDualFunds
  salesTotals: ShiftSalesTotals
  exchangeAdjustments: ShiftExchangeAdjustments
  expectedFunds?: ShiftDualFunds
  countedFunds?: ShiftDualFunds
  differences?: ShiftDualFunds
  discrepancyReason?: string
  notes?: string
}

/**
 * DTO para apertura de turno de caja.
 */
export interface OpenShiftDto {
  cashierName: string
  initialCUP: DecimalString
  initialUSD: DecimalString
  dailyRateUSD: DecimalString
}

/**
 * DTO para cierre definitivo y arqueo físico del turno.
 */
export interface CloseShiftDto {
  countedCUP: DecimalString
  countedUSD: DecimalString
  notes?: string
}

/**
 * Resultado formal del arqueo de cierre de un turno de caja.
 */
export interface ShiftCloseResult extends CashShift {
  closedAt: string
  status: 'CLOSED'
  expectedFunds: ShiftDualFunds
  countedFunds: ShiftDualFunds
  differences: ShiftDualFunds
}

/**
 * Parámetros de consulta paginada para el historial de turnos de caja.
 */
export interface CashShiftsQuery extends PaginationParams {
  status?: ShiftStatus
  desde?: string
  hasta?: string
}

/**
 * Registro de operación de canje de divisas en mostrador.
 */
export interface CurrencyExchange {
  id: string
  shiftId: string
  timestamp: string
  currencyFrom: Currency
  amountFrom: DecimalString
  currencyTo: Currency
  effectiveRate: DecimalString
  amountTo: DecimalString
  notes?: string
}

/**
 * DTO para crear un canje de divisas en mostrador.
 */
export interface CreateCurrencyExchangeDto {
  shiftId: string
  currencyFrom: Currency
  amountFrom: DecimalString
  notes?: string
}

/**
 * Métodos de cobro soportados en el terminal POS.
 */
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD'

/**
 * Estados posibles de una transacción de venta.
 */
export type SaleStatus = 'COMPLETED' | 'CANCELLED'

/**
 * Línea de artículo para la solicitud de creación de una venta.
 */
export interface CreateSaleItemRequest {
  productCode: string
  quantity: DecimalString
}

/**
 * Línea autoritativa de artículo calculada por el servidor en una venta.
 */
export interface SaleItem {
  productCode: string
  name: string
  quantity: DecimalString
  unitPriceCUP: DecimalString
  subtotalCUP: DecimalString
}

/**
 * Solicitud de creación de venta en el terminal POS.
 */
export interface CreateSaleRequest {
  clientRequestId: string
  shiftId: string
  warehouseId: string
  items: CreateSaleItemRequest[]
  paidCurrency: Currency
  paymentMethod: PaymentMethod
  cashReceived: DecimalString
  transferGateway?: string | null
  transferReference?: string | null
}

/**
 * Venta completa emitida por el servidor.
 */
export interface Sale {
  id: string
  clientRequestId: string
  shiftId: string
  warehouseId: string
  items: SaleItem[]
  totalCUP: DecimalString
  totalUSD: DecimalString
  paidCurrency: Currency
  exchangeRateApplied: DecimalString
  totalInCurrency: DecimalString
  cashReceived: DecimalString
  changeGivenCUP: DecimalString
  paymentMethod: PaymentMethod
  transferGateway?: string | null
  transferReference?: string | null
  cashierName: string
  status: SaleStatus
  createdAt: string
  cancelledAt?: string | null
  cancellationReason?: string | null
  stockReverted?: boolean
}

/**
 * Resumen de venta para listado paginado en auditoría.
 */
export interface SaleListItem {
  id: string
  shiftId: string
  createdAt: string
  cashierName: string
  itemsCount: number
  totalCUP: DecimalString
  totalUSD: DecimalString
  paidCurrency: Currency
  paymentMethod: PaymentMethod
  status: SaleStatus
}

/**
 * Parámetros de consulta y filtrado para el historial de ventas.
 */
export interface SalesQuery extends PaginationParams {
  shiftId?: string
  desde?: string
  hasta?: string
  currency?: Currency
  search?: string
}

/**
 * DTO para anulación de una venta formalmente registrada.
 */
export interface CancelSaleDto {
  reason: string
}

/**
 * Resultado de la anulación formal de una venta.
 */
export interface CancelSaleResult {
  id: string
  status: 'CANCELLED'
  cancelledAt: string
  cancellationReason: string
  stockReverted: boolean
}

/**
 * Línea de carrito de compra en el terminal POS (solo cliente).
 */
export interface CartItem {
  product: PosProduct
  quantity: DecimalString
  subtotalCUP: DecimalString
}

/**
 * Ticket u orden en espera suspendida en el cliente (solo cliente / local).
 */
export interface HeldOrder {
  id: string
  name: string
  items: CartItem[]
  createdAt: string
  totalCUP: DecimalString
}
