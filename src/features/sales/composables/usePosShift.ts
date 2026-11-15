import { ref, computed } from 'vue'
import { cashService } from '@/services'
import type { CashShift, ExchangeRates, CashSettings, OpenShiftDto } from '../types'
import { subtractDecimals, maxDecimal } from '@/shared/utils/decimal'

// Estado reactivo singleton a nivel de módulo para mantener consistencia en todo el terminal POS
const currentShift = ref<CashShift | null>(null)
const rates = ref<ExchangeRates | null>(null)
const settings = ref<CashSettings | null>(null)
const isLoading = ref<boolean>(false)
const error = ref<string | null>(null)
const isOpenShiftModalOpen = ref<boolean>(false)

export function usePosShift() {
  const isShiftOpen = computed<boolean>(() => {
    return Boolean(currentShift.value && currentShift.value.status === 'OPEN')
  })

  const dailyRateUSD = computed<string>(() => {
    return currentShift.value?.dailyRateUSD || rates.value?.USD || '360.00'
  })

  const exchangeMargin = computed<string>(() => {
    return settings.value?.exchangeMargin || '10.00'
  })

  /**
   * Tasa efectiva para USD: max(1.00, dailyRateUSD - exchangeMargin)
   * Según Decisión K y Regla 10.6/10.7 del contrato de API.
   */
  const effectiveRateUSD = computed<string>(() => {
    const marginApplied = subtractDecimals(dailyRateUSD.value, exchangeMargin.value)
    return maxDecimal('1.00', marginApplied)
  })

  const loadShiftData = async (): Promise<void> => {
    isLoading.value = true
    error.value = null
    try {
      const [shiftRes, ratesRes, settingsRes] = await Promise.allSettled([
        cashService.getCurrentShift(),
        cashService.getRates(),
        cashService.getSettings(),
      ])

      if (shiftRes.status === 'fulfilled') {
        currentShift.value = shiftRes.value
      } else {
        currentShift.value = null
      }

      if (ratesRes.status === 'fulfilled') {
        rates.value = ratesRes.value
      }

      if (settingsRes.status === 'fulfilled') {
        settings.value = settingsRes.value
      }
    } catch (err: any) {
      error.value = err?.message || 'Error al consultar estado de caja'
    } finally {
      isLoading.value = false
    }
  }

  const openShift = async (dto: OpenShiftDto): Promise<CashShift> => {
    isLoading.value = true
    error.value = null
    try {
      const newShift = await cashService.openShift(dto)
      currentShift.value = newShift
      isOpenShiftModalOpen.value = false
      return newShift
    } catch (err: any) {
      error.value = err?.message || 'Error al abrir turno de caja'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const openModal = () => {
    isOpenShiftModalOpen.value = true
  }

  const closeModal = () => {
    isOpenShiftModalOpen.value = false
  }

  return {
    currentShift,
    rates,
    settings,
    isLoading,
    error,
    isOpenShiftModalOpen,
    isShiftOpen,
    dailyRateUSD,
    exchangeMargin,
    effectiveRateUSD,
    loadShiftData,
    openShift,
    openModal,
    closeModal,
  }
}
