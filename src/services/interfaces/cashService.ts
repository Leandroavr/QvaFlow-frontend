import type { PaginatedResponse } from '@/shared/types/api'
import type {
  ExchangeRates,
  UpdateExchangeRatesDto,
  CashSettings,
  UpdateCashSettingsDto,
  CashShift,
  OpenShiftDto,
  CloseShiftDto,
  ShiftCloseResult,
  CashShiftsQuery,
  CurrencyExchange,
  CreateCurrencyExchangeDto,
} from '@/features/sales/types'

export interface CashService {
  /**
   * Tasas de cambio de referencia del día para operaciones en mostrador.
   * Requiere permiso: sales.create o cash.manage o cash.exchange
   */
  getRates(): Promise<ExchangeRates>

  /**
   * Actualización de las tasas de cambio de referencia del día.
   * Requiere permiso: cash.exchange
   */
  updateRates(dto: UpdateExchangeRatesDto): Promise<ExchangeRates>

  /**
   * Parámetros globales de configuración operativa de caja (exchangeMargin).
   * Requiere permiso: cash.manage o system.config
   */
  getSettings(): Promise<CashSettings>

  /**
   * Actualización de la configuración operativa de caja.
   * Requiere permiso: system.config
   */
  updateSettings(dto: UpdateCashSettingsDto): Promise<CashSettings>

  /**
   * Obtiene el turno de caja actualmente abierto en el terminal o estación.
   * Retorna null si no hay ningún turno activo.
   * Requiere permiso: sales.create o cash.open_close
   */
  getCurrentShift(): Promise<CashShift | null>

  /**
   * Apertura de un nuevo turno de caja fijando fondo inicial y tasa del día.
   * Requiere permiso: cash.open_close
   */
  openShift(dto: OpenShiftDto): Promise<CashShift>

  /**
   * Cierre definitivo y arqueo físico del turno comparando fondos contados vs esperados.
   * Requiere permiso: cash.open_close
   */
  closeShift(id: string, dto: CloseShiftDto): Promise<ShiftCloseResult>

  /**
   * Registro de compra de divisas extranjeras en mostrador con margen de canje.
   * Requiere permiso: cash.exchange
   */
  createExchange(dto: CreateCurrencyExchangeDto): Promise<CurrencyExchange>

  /**
   * Historial paginado de turnos de caja para auditoría y control de cuadres.
   * Requiere permiso: cash.view_history
   */
  getShifts(query?: CashShiftsQuery): Promise<PaginatedResponse<CashShift>>

  /**
   * Detalle exhaustivo de un arqueo histórico.
   * Requiere permiso: cash.view_history
   */
  getShiftById(id: string): Promise<CashShift>
}
