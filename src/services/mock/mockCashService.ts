import type { CashService } from '../interfaces/cashService'
import type { InventoryService } from '../interfaces/inventoryService'
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
  CashWithdrawal,
  CreateWithdrawalDto,
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
  private withdrawals: CashWithdrawal[] = []
  private inventoryService?: InventoryService

  constructor(inventoryService?: InventoryService) {
    this.inventoryService = inventoryService
    this.seedDefaultShift()
  }

  public setInventoryService(inventoryService: InventoryService): void {
    this.inventoryService = inventoryService
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
        withdrawalsTotals: {
          CUP: '0.00',
          USD: '0.00',
        },
        withdrawalsCount: {
          cash: 0,
          product: 0,
        },
      },
    ]
    this.exchanges = []
    this.withdrawals = []
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
    return 'Cajero Principal'
  }

  async getRates(): Promise<ExchangeRates> {
    if (!this.checkAnyPermission(['sales.create', 'cash.manage', 'cash.exchange'])) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'No posee permisos para consultar las tasas de cambio.' },
        403
      )
    }
    return JSON.parse(JSON.stringify(this.rates))
  }

  async updateRates(dto: UpdateExchangeRatesDto): Promise<ExchangeRates> {
    if (!this.checkHasPermission('cash.exchange')) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'Requiere permiso cash.exchange para actualizar tasas.' },
        403
      )
    }
    if (dto.USD !== undefined) {
      if (!isPositiveDecimal(dto.USD)) {
        throw new ApiError(
          { code: 'INVALID_EXCHANGE_RATE', message: 'La tasa USD debe ser un importe positivo.' },
          400
        )
      }
      this.rates.USD = normalizeDecimal(dto.USD)
    }
    if (dto.MLC !== undefined) {
      if (!isPositiveDecimal(dto.MLC)) {
        throw new ApiError(
          { code: 'INVALID_EXCHANGE_RATE', message: 'La tasa MLC debe ser un importe positivo.' },
          400
        )
      }
      this.rates.MLC = normalizeDecimal(dto.MLC)
    }
    this.rates.updatedAt = new Date().toISOString()
    return JSON.parse(JSON.stringify(this.rates))
  }

  async getSettings(): Promise<CashSettings> {
    if (!this.checkAnyPermission(['cash.manage', 'system.config', 'sales.create'])) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'No posee permisos para consultar configuración de caja.' },
        403
      )
    }
    return JSON.parse(JSON.stringify(this.settings))
  }

  async updateSettings(dto: UpdateCashSettingsDto): Promise<CashSettings> {
    if (!this.checkHasPermission('system.config')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso system.config para modificar la configuración de caja.',
        },
        403
      )
    }
    if (compareDecimals(dto.exchangeMargin, '0.00') < 0) {
      throw new ApiError(
        { code: 'INVALID_SETTINGS_VALUE', message: 'El margen de canje no puede ser negativo.' },
        400
      )
    }
    this.settings.exchangeMargin = normalizeDecimal(dto.exchangeMargin)
    this.settings.updatedAt = new Date().toISOString()
    return JSON.parse(JSON.stringify(this.settings))
  }

  async getCurrentShift(): Promise<CashShift | null> {
    if (!this.checkAnyPermission(['sales.create', 'cash.open_close', 'sales.view'])) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'No posee permisos para consultar el turno actual.' },
        403
      )
    }
    const current = this.shifts.find((s) => s.status === 'OPEN')
    return current ? JSON.parse(JSON.stringify(current)) : null
  }

  async openShift(dto: OpenShiftDto): Promise<CashShift> {
    if (!this.checkAnyPermission(['cash.open_close', 'sales.create'])) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso cash.open_close o sales.create para abrir un turno de caja.',
        },
        403
      )
    }
    const current = this.shifts.find((s) => s.status === 'OPEN')
    if (current) {
      throw new ApiError(
        {
          code: 'SHIFT_ALREADY_OPEN',
          message:
            'Ya existe un turno de caja abierto en este terminal. Debe cerrarlo antes de iniciar uno nuevo.',
        },
        409
      )
    }
    const now = new Date().toISOString()
    const newShift: CashShift = {
      id: `TURNO-${new Date().getFullYear()}-${String(this.shifts.length + 1).padStart(3, '0')}`,
      cashierName: dto.cashierName?.trim() || this.getCurrentUsername(),
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
      withdrawalsTotals: {
        CUP: '0.00',
        USD: '0.00',
      },
      withdrawalsCount: {
        cash: 0,
        product: 0,
      },
    }
    this.shifts.unshift(newShift)
    return JSON.parse(JSON.stringify(newShift))
  }

  async closeShift(id: string, dto: CloseShiftDto): Promise<ShiftCloseResult> {
    if (!this.checkHasPermission('cash.open_close')) {
      throw new ApiError(
        { code: 'FORBIDDEN', message: 'Requiere permiso cash.open_close para cerrar el turno.' },
        403
      )
    }
    const shift = this.shifts.find((s) => s.id === id)
    if (!shift) {
      throw new ApiError(
        { code: 'SHIFT_NOT_FOUND', message: 'El turno de caja especificado no existe.' },
        404
      )
    }
    if (shift.status !== 'OPEN') {
      throw new ApiError(
        {
          code: 'SHIFT_NOT_OPEN',
          message: 'El turno de caja especificado ya se encuentra cerrado.',
        },
        409
      )
    }

    const withdrawalsCUP = shift.withdrawalsTotals?.CUP || '0.00'
    const withdrawalsUSD = shift.withdrawalsTotals?.USD || '0.00'

    const expectedCUP = subtractDecimals(
      addDecimals(
        addDecimals(shift.initialFunds.CUP, shift.salesTotals.cupCash),
        shift.exchangeAdjustments.CUP
      ),
      withdrawalsCUP
    )
    const expectedUSD = subtractDecimals(
      addDecimals(
        addDecimals(shift.initialFunds.USD, shift.salesTotals.USD),
        shift.exchangeAdjustments.USD
      ),
      withdrawalsUSD
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
          {
            code: 'REASON_REQUIRED',
            message:
              'Existe una diferencia en el arqueo físico de caja. Debe registrar obligatoriamente el motivo del descuadre con un mínimo de 10 caracteres.',
            details: {
              notes: ['La justificación de descuadre debe contener al menos 10 caracteres.'],
            },
          },
          400
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
    if (!this.checkAnyPermission(['cash.exchange', 'sales.create'])) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso cash.exchange o sales.create para registrar canje de divisas.',
        },
        403
      )
    }
    const shift = this.shifts.find((s) => s.id === dto.shiftId && s.status === 'OPEN')
    if (!shift) {
      throw new ApiError(
        {
          code: 'SHIFT_NOT_OPEN',
          message: 'No es posible registrar canjes sin un turno de caja activo.',
        },
        409
      )
    }
    if (!isPositiveDecimal(dto.amountFrom) || dto.currencyFrom !== 'USD') {
      throw new ApiError(
        {
          code: 'INVALID_EXCHANGE_DATA',
          message:
            'El importe a canjear debe ser positivo y en moneda divisa extranjera válida (USD).',
        },
        400
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

  async createWithdrawal(dto: CreateWithdrawalDto): Promise<CashWithdrawal> {
    if (!this.checkHasPermission('sales.create')) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso sales.create para registrar salidas desde el POS.',
        },
        403
      )
    }

    const existing = this.withdrawals.find((w) => w.clientRequestId === dto.clientRequestId)
    if (existing) {
      return JSON.parse(JSON.stringify(existing))
    }

    const shift = this.shifts.find((s) => s.id === dto.shiftId && s.status === 'OPEN')
    if (!shift) {
      throw new ApiError(
        {
          code: 'SHIFT_NOT_OPEN',
          message: 'No es posible registrar salidas sin un turno de caja activo en el terminal.',
        },
        409
      )
    }

    const reason = dto.reason?.trim() || ''
    if (reason.length < 10) {
      throw new ApiError(
        {
          code: 'INVALID_WITHDRAWAL_DATA',
          message: 'El motivo de la salida es obligatorio y debe contener al menos 10 caracteres.',
          details: {
            reason: ['El motivo debe contener al menos 10 caracteres.'],
          },
        },
        400
      )
    }

    if (dto.beneficiary === 'OTHER' && !dto.beneficiaryName?.trim()) {
      throw new ApiError(
        {
          code: 'INVALID_WITHDRAWAL_DATA',
          message: 'Debe especificar el nombre del beneficiario cuando no es el dueño.',
          details: {
            beneficiaryName: [
              'El nombre del beneficiario es obligatorio cuando se selecciona "Otro".',
            ],
          },
        },
        400
      )
    }

    if (dto.kind === 'CASH') {
      const currency: 'CUP' | 'USD' = dto.currency === 'USD' ? 'USD' : 'CUP'
      const amount = dto.amount ? normalizeDecimal(dto.amount) : '0.00'
      if (!isPositiveDecimal(amount)) {
        throw new ApiError(
          {
            code: 'INVALID_WITHDRAWAL_DATA',
            message: 'El importe de la salida en efectivo debe ser mayor que 0.00.',
            details: {
              amount: ['El importe debe ser mayor que 0.00.'],
            },
          },
          400
        )
      }

      const currentInitial = shift.initialFunds[currency] || '0.00'
      const currentSalesCash =
        currency === 'CUP' ? shift.salesTotals.cupCash : shift.salesTotals.USD
      const currentExchanges = shift.exchangeAdjustments[currency] || '0.00'
      const currentWithdrawals = shift.withdrawalsTotals?.[currency] || '0.00'

      const currentExpected = subtractDecimals(
        addDecimals(addDecimals(currentInitial, currentSalesCash), currentExchanges),
        currentWithdrawals
      )

      if (compareDecimals(amount, currentExpected) > 0) {
        throw new ApiError(
          {
            code: 'INSUFFICIENT_CASH_IN_DRAWER',
            message: `El importe solicitado (${amount} ${currency}) supera el efectivo esperado disponible en gaveta (${currentExpected} ${currency}).`,
            details: {
              amount: [
                `No hay suficiente efectivo en gaveta. Disponible: ${currentExpected} ${currency}`,
              ],
            },
          },
          409
        )
      }

      if (!shift.withdrawalsTotals) {
        shift.withdrawalsTotals = { CUP: '0.00', USD: '0.00' }
      }
      if (!shift.withdrawalsCount) {
        shift.withdrawalsCount = { cash: 0, product: 0 }
      }
      shift.withdrawalsTotals[currency] = addDecimals(shift.withdrawalsTotals[currency], amount)
      shift.withdrawalsCount.cash += 1
    } else if (dto.kind === 'PRODUCT') {
      const quantity = dto.quantity ? normalizeDecimal(dto.quantity) : '0.00'
      if (!isPositiveDecimal(quantity)) {
        throw new ApiError(
          {
            code: 'INVALID_WITHDRAWAL_DATA',
            message: 'La cantidad de producto a retirar debe ser mayor que 0.00.',
            details: {
              quantity: ['La cantidad debe ser mayor que 0.00.'],
            },
          },
          400
        )
      }

      const productCode = String(dto.sku || dto.productId || '')
      if (!productCode.trim()) {
        throw new ApiError(
          {
            code: 'INVALID_WITHDRAWAL_DATA',
            message: 'Debe especificar el código o identificador del producto a retirar.',
            details: {
              product: ['Debe seleccionar un producto válido.'],
            },
          },
          400
        )
      }

      const warehouseCode = 'ALM-TIENDA-01'
      if (this.inventoryService) {
        await this.inventoryService.deductStock(
          productCode,
          quantity,
          warehouseCode,
          `Salida POS: ${reason} (Beneficiario: ${dto.beneficiary === 'OWNER' ? 'Dueño' : dto.beneficiaryName})`
        )
      }

      if (!shift.withdrawalsCount) {
        shift.withdrawalsCount = { cash: 0, product: 0 }
      }
      shift.withdrawalsCount.product += 1
    }

    const now = new Date().toISOString()
    const withdrawal: CashWithdrawal = {
      id: `SAL-${now.slice(0, 10).replace(/-/g, '')}-${String(this.withdrawals.length + 1).padStart(3, '0')}`,
      clientRequestId: dto.clientRequestId,
      shiftId: shift.id,
      kind: dto.kind,
      currency: dto.kind === 'CASH' ? dto.currency || 'CUP' : undefined,
      amount: dto.kind === 'CASH' ? normalizeDecimal(dto.amount || '0.00') : undefined,
      productId: dto.kind === 'PRODUCT' ? dto.productId : undefined,
      productName: dto.kind === 'PRODUCT' ? dto.productName : undefined,
      sku: dto.kind === 'PRODUCT' ? dto.sku : undefined,
      quantity: dto.kind === 'PRODUCT' ? normalizeDecimal(dto.quantity || '0.00') : undefined,
      beneficiary: dto.beneficiary,
      beneficiaryName: dto.beneficiary === 'OTHER' ? dto.beneficiaryName?.trim() : undefined,
      reason,
      createdAt: now,
      createdBy: this.getCurrentUsername(),
    }

    this.withdrawals.unshift(withdrawal)
    return JSON.parse(JSON.stringify(withdrawal))
  }

  async getWithdrawals(
    query: { shiftId?: string } = {}
  ): Promise<PaginatedResponse<CashWithdrawal>> {
    if (!this.checkAnyPermission(['sales.create', 'cash.view_history', 'cash.open_close'])) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'No posee permisos para consultar salidas de caja.',
        },
        403
      )
    }
    let filtered = [...this.withdrawals]
    if (query.shiftId) {
      filtered = filtered.filter((w) => w.shiftId === query.shiftId)
    }
    return {
      items: JSON.parse(JSON.stringify(filtered)),
      total: filtered.length,
      page: 1,
      perPage: 100,
    }
  }

  async getShifts(query: CashShiftsQuery = {}): Promise<PaginatedResponse<CashShift>> {
    if (!this.checkAnyPermission(['cash.view_history', 'sales.view', 'cash.open_close'])) {
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message:
            'Requiere permiso cash.view_history, sales.view o cash.open_close para consultar el historial de turnos.',
        },
        403
      )
    }
    let filtered = [...this.shifts]
    if (query.status) {
      filtered = filtered.filter((s) => s.status === query.status)
    }
    if (query.cashierName) {
      const c = query.cashierName.trim().toLowerCase()
      filtered = filtered.filter((s) => s.cashierName?.trim().toLowerCase() === c)
    }
    if (query.desde) {
      filtered = filtered.filter((s) => s.openedAt >= query.desde!)
    }
    if (query.hasta) {
      filtered = filtered.filter((s) => s.openedAt <= query.hasta!)
    }

    filtered.sort((a, b) => b.openedAt.localeCompare(a.openedAt))

    const page = parseInt(String(query.page || 1), 10) || 1
    const perPage = parseInt(String(query.perPage || 10), 10) || 10
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
      throw new ApiError(
        {
          code: 'FORBIDDEN',
          message: 'Requiere permiso cash.view_history para consultar el turno.',
        },
        403
      )
    }
    const shift = this.shifts.find((s) => s.id === id)
    if (!shift) {
      throw new ApiError(
        { code: 'SHIFT_NOT_FOUND', message: 'El turno de caja especificado no existe.' },
        404
      )
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
