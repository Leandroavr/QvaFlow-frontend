import { ref, computed } from 'vue'
import { cashService } from '@/services'
import type { CreateCurrencyExchangeDto, CurrencyExchange } from '../types'
import type { Currency } from '@/shared/types/currency'
import {
  subtractDecimals,
  maxDecimal,
  multiplyDecimals,
  roundToInteger,
  isPositiveDecimal,
  normalizeDecimal,
} from '@/shared/utils/decimal'
import { ApiError } from '@/shared/types/api'

export function usePosExchange() {
  const isSubmitting = ref(false)
  const serverError = ref<string | null>(null)
  const lastExchange = ref<CurrencyExchange | null>(null)

  /**
   * Calcula la tasa efectiva de canje: max(1.00, dailyRate - exchangeMargin)
   */
  const calculateEffectiveRate = (dailyRate: string, margin: string): string => {
    const diff = subtractDecimals(dailyRate || '1.00', margin || '0.00')
    return maxDecimal('1.00', diff)
  }

  /**
   * Calcula el importe en CUP a entregar: roundToInteger(amountFrom * effectiveRate)
   */
  const calculateAmountToDeliver = (amountFrom: string, effectiveRate: string): string => {
    if (!isPositiveDecimal(amountFrom)) return '0.00'
    return roundToInteger(multiplyDecimals(amountFrom, effectiveRate))
  }

  const submitExchange = async (dto: CreateCurrencyExchangeDto): Promise<CurrencyExchange> => {
    isSubmitting.value = true
    serverError.value = null
    try {
      const result = await cashService.createExchange({
        ...dto,
        amountFrom: normalizeDecimal(dto.amountFrom),
      })
      lastExchange.value = result
      return result
    } catch (err: any) {
      if (err instanceof ApiError) {
        serverError.value = err.message
      } else {
        serverError.value = err?.message || 'Error inesperado al registrar el canje de divisas.'
      }
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    serverError,
    lastExchange,
    calculateEffectiveRate,
    calculateAmountToDeliver,
    submitExchange,
  }
}
