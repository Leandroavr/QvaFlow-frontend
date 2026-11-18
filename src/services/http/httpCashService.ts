import type { CashService } from '../interfaces/cashService'
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
  CashWithdrawal,
  CreateWithdrawalDto,
  CashWithdrawalsQuery,
} from '@/features/sales/types'
import { httpClient } from '../api/httpClient'

export class HttpCashService implements CashService {
  async getRates(): Promise<ExchangeRates> {
    const response = await httpClient.get<ExchangeRates>('/cash/rates')
    return response.data
  }

  async updateRates(dto: UpdateExchangeRatesDto): Promise<ExchangeRates> {
    const response = await httpClient.put<ExchangeRates>('/cash/rates', dto)
    return response.data
  }

  async getSettings(): Promise<CashSettings> {
    const response = await httpClient.get<CashSettings>('/cash/settings')
    return response.data
  }

  async updateSettings(dto: UpdateCashSettingsDto): Promise<CashSettings> {
    const response = await httpClient.put<CashSettings>('/cash/settings', dto)
    return response.data
  }

  async getCurrentShift(): Promise<CashShift | null> {
    const response = await httpClient.get<CashShift | null>('/cash/shifts/current')
    return response.data
  }

  async openShift(dto: OpenShiftDto): Promise<CashShift> {
    const response = await httpClient.post<CashShift>('/cash/shifts/open', dto)
    return response.data
  }

  async closeShift(id: string, dto: CloseShiftDto): Promise<ShiftCloseResult> {
    const response = await httpClient.post<ShiftCloseResult>(
      `/cash/shifts/${encodeURIComponent(id)}/close`,
      dto
    )
    return response.data
  }

  async createExchange(dto: CreateCurrencyExchangeDto): Promise<CurrencyExchange> {
    const response = await httpClient.post<CurrencyExchange>('/cash/exchanges', dto)
    return response.data
  }

  async createWithdrawal(dto: CreateWithdrawalDto): Promise<CashWithdrawal> {
    const response = await httpClient.post<CashWithdrawal>('/cash/withdrawals', dto)
    return response.data
  }

  async getWithdrawals(
    query: CashWithdrawalsQuery = {}
  ): Promise<PaginatedResponse<CashWithdrawal>> {
    const response = await httpClient.get<PaginatedResponse<CashWithdrawal>>('/cash/withdrawals', {
      params: query,
    })
    return response.data
  }

  async getShifts(query?: CashShiftsQuery): Promise<PaginatedResponse<CashShift>> {
    const response = await httpClient.get<PaginatedResponse<CashShift>>('/cash/shifts', {
      params: query,
    })
    return response.data
  }

  async getShiftById(id: string): Promise<CashShift> {
    const response = await httpClient.get<CashShift>(`/cash/shifts/${encodeURIComponent(id)}`)
    return response.data
  }
}
