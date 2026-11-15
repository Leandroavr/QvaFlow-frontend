import { ref } from 'vue'
import { salesService } from '@/services'
import type { CreateSaleRequest, Sale } from '../types'
import { ApiError } from '@/shared/types/api'

export function usePosCheckout() {
  const isSubmitting = ref<boolean>(false)
  const serverError = ref<string | null>(null)
  const stockErrors = ref<Record<string, string[]> | null>(null)
  const completedSale = ref<Sale | null>(null)
  const clientRequestId = ref<string>('')

  const initSession = () => {
    clientRequestId.value = crypto.randomUUID()
    serverError.value = null
    stockErrors.value = null
    completedSale.value = null
  }

  const submitSale = async (request: CreateSaleRequest): Promise<Sale> => {
    isSubmitting.value = true
    serverError.value = null
    stockErrors.value = null

    try {
      const sale = await salesService.createSale(request)
      completedSale.value = sale
      return sale
    } catch (err: any) {
      if (err instanceof ApiError) {
        serverError.value = err.message
        if (err.code === 'STOCK_INSUFFICIENT' && err.details) {
          stockErrors.value = err.details as Record<string, string[]>
        }
      } else {
        serverError.value = err?.message || 'Error inesperado al procesar la venta.'
      }
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  const clearSession = () => {
    clientRequestId.value = ''
    serverError.value = null
    stockErrors.value = null
    completedSale.value = null
    isSubmitting.value = false
  }

  return {
    isSubmitting,
    serverError,
    stockErrors,
    completedSale,
    clientRequestId,
    initSession,
    submitSale,
    clearSession,
  }
}
