import type { CashService } from '../interfaces/cashService'
import type { PaginatedResponse } from '@/shared/types/api'
import { ApiError } from '@/shared/types/api'
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
  PaymentMethod,
} from '@/features/sales/types'
import type { Currency, DecimalString } from '@/shared/types/currency'
import {
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  compareDecimals,
  normalizeDecimal,
  roundToInteger,
  maxDecimal,
  isPositiveDecimal,
} from '@/shared/utils/decimal'
import { MOCK_USERS } from '@/mocks/users'

export class MockCashService implements CashService {
  private rates: ExchangeRates = {
    CUP: '1.00',
    USD: '360.00',
    MLC: '275.00',
    updatedAt: '2026-11-14T08:00:00Z',
  }

  private settings: CashSettings = {
    exchangeMargin: '10.00',
    updatedAt: '2026-11-14T08:00:00Z',
  }

  private shifts: CashShift[] = []
  private exchanges: CurrencyExchange[] = []

  constructor() {
    this.seedDefaultShift()
  }

  /**
   * Inicializa un turno abierto semilla para pruebas y desarrollo.
   */
  public seedDefaultShift(): void {
    this.shifts = [
      {
        id: 'TURNO-2026-001',
        cashierName: 'Yadira Reyes',
        openedAt: '2026-11-14T08:00:00Z',
        status: 'OPEN',
        dailyRateUSD: '360.00',
        initialFunds: {
          CUP: '10000.00',
          USD: '100.00',
        },
        salesTotals: {
          cupCash: '0.00',
          cupTransfer: '0.00',
          USD: '0.00',
        },
        exchangeAdjustments: {
          CUP: '0.00',
          USD: '0.00',
        },
      },
    ]
    this.exchanges = []
  }

  /**
   * Resetea el estado completo del servicio a valores iniciales (útil para tests).
   */
  public reset(): void {
    this.rates = {
      CUP: '1.00',
      USD: '360.00',
      MLC: '275.00',
      updatedAt: '2026-11-14T08:00:00Z',
    }
    this.settings = {
      exchangeMargin: '10.00',
      updatedAt: '2026-11-14T08:00:00Z',
    }
    this.seedDefaultShift()
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
        if (match) return match.user.name || match.user.username
      }
      const rawUser = localStorage.getItem('qvaflow_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        return user.name || user.username
      }
    } catch {
      // Ignorar fallo de lectura local
    }
    return 'Cajero Principal'
  }

  async getRates(): Promise<ExchangeRates> {
    if (!this.checkAnyPermission(['sales.create', 'cash.manage', 'cash.exchange'])) {
      throw new ApiError(403, 'FORBIDDEN', 'No posee permisos para consultar las tasas de cambio.')
    }
    return JSON.parse(JSON.stringify(this.rates))
  }

  async updateRates(dto: UpdateExchangeRatesDto): Promise<ExchangeRates> {
    if (!this.checkHasPermission('cash.exchange')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso cash.exchange para actualizar tasas.')
    }
    if (dto.USD !== undefined) {
      if (!isPositiveDecimal(dto.USD)) {
        throw new ApiError(400, 'INVALID_EXCHANGE_RATE', 'La tasa USD debe ser un importe positivo.')
      }
      this.rates.USD = normalizeDecimal(dto.USD)
    }
    if (dto.MLC !== undefined) {
      if (!isPositiveDecimal(dto.MLC)) {
        throw new ApiError(400, 'INVALID_EXCHANGE_RATE', 'La tasa MLC debe ser un importe positivo.')
      }
      this.rates.MLC = normalizeDecimal(dto.MLC)
    }
    this.rates.updatedAt = new Date().toISOString()
    return JSON.parse(JSON.stringify(this.rates))
  }

  async getSettings(): Promise<CashSettings> {
    if (!this.checkAnyPermission(['cash.manage', 'system.config'])) {
      throw new ApiError(403, 'FORBIDDEN', 'No posee permisos para consultar configuración de caja.')
    }
    return JSON.parse(JSON.stringify(this.settings))
  }

  async updateSettings(dto: UpdateCashSettingsDto): Promise<CashSettings> {
    if (!this.checkHasPermission('system.config')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso system.config para modificar la configuración de caja.')
    }
    if (compareDecimals(dto.exchangeMargin, '0.00') < 0) {
      throw new ApiError(400, 'INVALID_SETTINGS_VALUE', 'El margen de canje no puede ser negativo.')
    }
    this.settings.exchangeMargin = normalizeDecimal(dto.exchangeMargin)
    this.settings.updatedAt = new Date().toISOString()
    return JSON.parse(JSON.stringify(this.settings))
  }

  async getCurrentShift(): Promise<CashShift | null> {
    if (!this.checkAnyPermission(['sales.create', 'cash.open_close'])) {
      throw new ApiError(403, 'FORBIDDEN', 'No posee permisos para consultar el turno actual.')
    }
    const current = this.shifts.find((s) => s.status === 'OPEN')
    return current ? JSON.parse(JSON.stringify(current)) : null
  }

  async openShift(dto: OpenShiftDto): Promise<CashShift> {
    if (!this.checkHasPermission('cash.open_close')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso cash.open_close para abrir un turno de caja.')
    }
    const current = this.shifts.find((s) => s.status === 'OPEN')
    if (current) {
      throw new ApiError(
        409,
        'SHIFT_ALREADY_OPEN',
        'Ya existe un turno de caja abierto en este terminal. Debe cerrarlo antes de iniciar uno nuevo.'
      )
    }
    const now = new Date().toISOString()
    const newShift: CashShift = {
      id: `TURNO-${new Date().getFullYear()}-${String(this.shifts.length + 1).padStart(3, '0')}`,
      cashierName: dto.cashierName || this.getCurrentUsername(),
      openedAt: now,
      status: 'OPEN',
      dailyRateUSD: normalizeDecimal(dto.dailyRateUSD),
      initialFunds: {
        CUP: normalizeDecimal(dto.initialCUP),
        USD: normalizeDecimal(dto.initialUSD),
      },
      salesTotals: {
        cupCash: '0.00',
        cupTransfer: '0.00',
        USD: '0.00',
      },
      exchangeAdjustments: {
        CUP: '0.00',
        USD: '0.00',
      },
    }
    this.shifts.unshift(newShift)
    return JSON.parse(JSON.stringify(newShift))
  }

  async closeShift(id: string, dto: CloseShiftDto): Promise<ShiftCloseResult> {
    if (!this.checkHasPermission('cash.open_close')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso cash.open_close para cerrar el turno.')
    }
    const shift = this.shifts.find((s) => s.id === id)
    if (!shift) {
      throw new ApiError(404, 'SHIFT_NOT_FOUND', 'El turno de caja especificado no existe.')
    }
    if (shift.status !== 'OPEN') {
      throw new ApiError(409, 'SHIFT_NOT_OPEN', 'El turno de caja especificado ya se encuentra cerrado.')
    }

    const expectedCUP = addDecimals(
      addDecimals(shift.initialFunds.CUP, shift.salesTotals.cupCash),
      shift.exchangeAdjustments.CUP
    )
    const expectedUSD = addDecimals(
      addDecimals(shift.initialFunds.USD, shift.salesTotals.USD),
      shift.exchangeAdjustments.USD
    )

    const countedCUP = normalizeDecimal(dto.countedCUP)
    const countedUSD = normalizeDecimal(dto.countedUSD)

    const diffCUP = subtractDecimals(countedCUP, expectedCUP)
    const diffUSD = subtractDecimals(countedUSD, expectedUSD)

    const hasDifference = diffCUP !== '0.00' || diffUSD !== '0.00'
    if (hasDifference) {
      const notes = dto.notes?.trim() || ''
      if (notes.length < 10) {
        throw new ApiError(
          400,
          'REASON_REQUIRED',
          'Existe una diferencia en el arqueo físico de caja. Debe registrar obligatoriamente el motivo del descuadre con un mínimo de 10 caracteres.',
          {
            notes: ['La justificación de descuadre debe contener al menos 10 caracteres.'],
          }
        )
      }
    }

    shift.status = 'CLOSED'
    shift.closedAt = new Date().toISOString()
    shift.expectedFunds = { CUP: expectedCUP, USD: expectedUSD }
    shift.countedFunds = { CUP: countedCUP, USD: countedUSD }
    shift.differences = { CUP: diffCUP, USD: diffUSD }
    shift.discrepancyReason = dto.notes || 'Arqueo conforme sin discrepancias.'
    shift.notes = dto.notes || ''

    return JSON.parse(JSON.stringify(shift)) as ShiftCloseResult
  }

  async createExchange(dto: CreateCurrencyExchangeDto): Promise<CurrencyExchange> {
    if (!this.checkHasPermission('cash.exchange')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso cash.exchange para registrar canje de divisas.')
    }
    const shift = this.shifts.find((s) => s.id === dto.shiftId && s.status === 'OPEN')
    if (!shift) {
      throw new ApiError(409, 'SHIFT_NOT_OPEN', 'No es posible registrar canjes sin un turno de caja activo.')
    }
    if (!isPositiveDecimal(dto.amountFrom) || dto.currencyFrom !== 'USD') {
      throw new ApiError(
        400,
        'INVALID_EXCHANGE_DATA',
        'El importe a canjear debe ser positivo y en moneda divisa extranjera válida (USD).'
      )
    }

    const effectiveRate = maxDecimal(
      '1.00',
      subtractDecimals(shift.dailyRateUSD, this.settings.exchangeMargin)
    )
    const amountTo = roundToInteger(multiplyDecimals(dto.amountFrom, effectiveRate))

    // Gaveta recibe USD y entrega CUP
    shift.exchangeAdjustments.USD = addDecimals(shift.exchangeAdjustments.USD, dto.amountFrom)
    shift.exchangeAdjustments.CUP = subtractDecimals(shift.exchangeAdjustments.CUP, amountTo)

    const exchange: CurrencyExchange = {
      id: `CNJ-${Math.floor(1000 + Math.random() * 9000)}`,
      shiftId: shift.id,
      timestamp: new Date().toISOString(),
      currencyFrom: dto.currencyFrom,
      amountFrom: normalizeDecimal(dto.amountFrom),
      currencyTo: 'CUP',
      effectiveRate,
      amountTo,
      notes: dto.notes,
    }
    this.exchanges.unshift(exchange)
    return JSON.parse(JSON.stringify(exchange))
  }

  async getShifts(query: CashShiftsQuery = {}): Promise<PaginatedResponse<CashShift>> {
    if (!this.checkHasPermission('cash.view_history')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso cash.view_history para consultar el historial de turnos.')
    }
    let filtered = [...this.shifts]
    if (query.status) {
      filtered = filtered.filter((s) => s.status === query.status)
    }
    if (query.desde) {
      filtered = filtered.filter((s) => s.openedAt >= query.desde!)
    }
    if (query.hasta) {
      filtered = filtered.filter((s) => s.openedAt <= query.hasta!)
    }

    const page = Number(query.page) || 1
    const perPage = Number(query.perPage) || 10
    const start = (page - 1) * perPage
    const items = filtered.slice(start, start + perPage)

    return {
      items: JSON.parse(JSON.stringify(items)),
      total: filtered.length,
      page,
      perPage,
    }
  }

  async getShiftById(id: string): Promise<CashShift> {
    if (!this.checkHasPermission('cash.view_history')) {
      throw new ApiError(403, 'FORBIDDEN', 'Requiere permiso cash.view_history para consultar el turno.')
    }
    const shift = this.shifts.find((s) => s.id === id)
    if (!shift) {
      throw new ApiError(404, 'SHIFT_NOT_FOUND', 'El turno de caja especificado no existe.')
    }
    return JSON.parse(JSON.stringify(shift))
  }

  /**
   * Impacta las ventas recaudadas en el turno activo (invocado internamente por MockSalesService).
   */
  public recordSaleImpact(
    shiftId: string,
    method: PaymentMethod,
    currency: Currency,
    amount: DecimalString
  ): void {
    const shift = this.shifts.find((s) => s.id === shiftId)
    if (!shift) return
    if (method === 'CASH') {
      if (currency === 'CUP') {
        shift.salesTotals.cupCash = addDecimals(shift.salesTotals.cupCash, amount)
      } else if (currency === 'USD') {
        shift.salesTotals.USD = addDecimals(shift.salesTotals.USD, amount)
      }
    } else if (method === 'TRANSFER' || currency === 'CUP_TRANSFER') {
      shift.salesTotals.cupTransfer = addDecimals(shift.salesTotals.cupTransfer, amount)
    }
  }

  /**
   * Revierte el impacto recaudado en el turno tras la anulación de una venta.
   */
  public revertSaleImpact(
    shiftId: string,
    method: PaymentMethod,
    currency: Currency,
    amount: DecimalString
  ): void {
    const shift = this.shifts.find((s) => s.id === shiftId)
    if (!shift) return
    if (method === 'CASH') {
      if (currency === 'CUP') {
        shift.salesTotals.cupCash = subtractDecimals(shift.salesTotals.cupCash, amount)
      } else if (currency === 'USD') {
        shift.salesTotals.USD = subtractDecimals(shift.salesTotals.USD, amount)
      }
    } else if (method === 'TRANSFER' || currency === 'CUP_TRANSFER') {
      shift.salesTotals.cupTransfer = subtractDecimals(shift.salesTotals.cupTransfer, amount)
    }
  }
}
