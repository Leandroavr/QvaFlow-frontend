import { ref } from 'vue'
import { cashService } from '@/services'
import type { CreateWithdrawalDto, CashWithdrawal } from '../types'
import { normalizeDecimal } from '@/shared/utils/decimal'
import { ApiError } from '@/shared/types/api'

export function usePosWithdrawal() {
  const isSubmitting = ref(false)
  const serverError = ref<string | null>(null)
  const lastWithdrawal = ref<CashWithdrawal | null>(null)

  const submitWithdrawal = async (dto: CreateWithdrawalDto): Promise<CashWithdrawal> => {
    isSubmitting.value = true
    serverError.value = null
    try {
      const payload: CreateWithdrawalDto = {
        ...dto,
        amount: dto.amount ? normalizeDecimal(dto.amount) : undefined,
        quantity: dto.quantity ? normalizeDecimal(dto.quantity) : undefined,
      }
      const result = await cashService.createWithdrawal(payload)
      lastWithdrawal.value = result
      return result
    } catch (err: any) {
      if (err instanceof ApiError) {
        serverError.value = err.message
      } else {
        serverError.value = err?.message || 'Error inesperado al registrar la salida.'
      }
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    serverError,
    lastWithdrawal,
    submitWithdrawal,
  }
}
