import { ref } from 'vue'
import { salesService } from '@/services'
import type { SalesService } from '@/services/interfaces/salesService'
import type { Sale, SaleListItem, SalesQuery } from '../types'
import { ApiError } from '@/shared/types/api'

export function useSalesHistory(customService?: SalesService) {
  const service = customService || salesService

  const sales = ref<SaleListItem[]>([])
  const total = ref<number>(0)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const selectedSale = ref<Sale | null>(null)
  const isLoadingDetail = ref<boolean>(false)
  const detailError = ref<string | null>(null)

  const isCancelling = ref<boolean>(false)
  const cancelError = ref<string | null>(null)

  let reqId = 0

  const fetchSales = async (query: SalesQuery = {}) => {
    const currentReq = ++reqId
    isLoading.value = true
    error.value = null

    try {
      const res = await service.getSales(query)
      if (currentReq === reqId) {
        sales.value = res.items
        total.value = res.total
      }
      return res
    } catch (err: any) {
      if (currentReq === reqId) {
        if (err instanceof ApiError) {
          error.value = err.message
        } else {
          error.value = err?.message || 'Error al cargar el historial de ventas'
        }
      }
      throw err
    } finally {
      if (currentReq === reqId) {
        isLoading.value = false
      }
    }
  }

  const fetchSaleById = async (id: string) => {
    isLoadingDetail.value = true
    detailError.value = null
    try {
      const sale = await service.getSaleById(id)
      selectedSale.value = sale
      return sale
    } catch (err: any) {
      if (err instanceof ApiError) {
        detailError.value = err.message
      } else {
        detailError.value = err?.message || 'Error al obtener el comprobante de venta'
      }
      throw err
    } finally {
      isLoadingDetail.value = false
    }
  }

  const cancelSale = async (id: string, reason: string) => {
    isCancelling.value = true
    cancelError.value = null
    try {
      const res = await service.cancelSale(id, { reason })
      if (selectedSale.value && selectedSale.value.id === id) {
        selectedSale.value.status = 'CANCELLED'
        selectedSale.value.cancelledAt = res.cancelledAt
        selectedSale.value.cancellationReason = res.cancellationReason
        selectedSale.value.stockReverted = res.stockReverted
      }
      const item = sales.value.find((s) => s.id === id)
      if (item) {
        item.status = 'CANCELLED'
      }
      return res
    } catch (err: any) {
      if (err instanceof ApiError) {
        cancelError.value = err.message
      } else {
        cancelError.value = err?.message || 'Error al anular la venta'
      }
      throw err
    } finally {
      isCancelling.value = false
    }
  }

  return {
    sales,
    total,
    isLoading,
    error,
    selectedSale,
    isLoadingDetail,
    detailError,
    isCancelling,
    cancelError,
    fetchSales,
    fetchSaleById,
    cancelSale,
  }
}
