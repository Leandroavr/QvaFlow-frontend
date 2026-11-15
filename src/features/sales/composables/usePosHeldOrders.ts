import { ref, computed } from 'vue'
import type { CartItem, PosProduct } from '../types'
import type { DecimalString } from '@/shared/types/currency'
import { compareDecimals, multiplyDecimals } from '@/shared/utils/decimal'

export interface PosHeldOrder {
  id: string
  label: string
  items: CartItem[]
  totalCUP: DecimalString
  totalLinesCount: number
  totalUnitsCount: DecimalString
  heldAt: string
}

const STORAGE_KEY = 'qvaflow_pos_held_orders'

const heldOrders = ref<PosHeldOrder[]>([])

export function usePosHeldOrders() {
  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        heldOrders.value = JSON.parse(raw)
      } else {
        heldOrders.value = []
      }
    } catch {
      heldOrders.value = []
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(heldOrders.value))
    } catch {
      // Ignorar fallos de cuota o serialización en almacenamiento local
    }
  }

  // Inicializar al cargar
  loadFromStorage()

  const hasHeldOrders = computed<boolean>(() => heldOrders.value.length > 0)
  const heldOrdersCount = computed<number>(() => heldOrders.value.length)

  /**
   * Suspende el carrito activo y lo almacena con marca de tiempo y etiqueta.
   */
  const suspendCart = (
    items: CartItem[],
    totalCUP: DecimalString,
    totalLinesCount: number,
    totalUnitsCount: DecimalString,
    customLabel?: string
  ): PosHeldOrder | null => {
    if (!items || items.length === 0) return null

    const nextNumber = heldOrders.value.length + 1
    const order: PosHeldOrder = {
      id: `HOLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: customLabel || `Ticket #${nextNumber}`,
      items: JSON.parse(JSON.stringify(items)),
      totalCUP,
      totalLinesCount,
      totalUnitsCount,
      heldAt: new Date().toISOString(),
    }

    heldOrders.value.unshift(order)
    saveToStorage()
    return order
  }

  /**
   * Descarta una orden en espera sin restaurarla al carrito.
   */
  const discardHeldOrder = (orderId: string): boolean => {
    const initialLen = heldOrders.value.length
    heldOrders.value = heldOrders.value.filter((o) => o.id !== orderId)
    if (heldOrders.value.length !== initialLen) {
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * Restaura una orden suspendida. Si el carrito activo contiene productos,
   * suspende automáticamente el carrito actual como "Ticket anterior".
   * Valida además el stock disponible de cada artículo.
   */
  const restoreHeldOrder = (
    orderId: string,
    currentCart: {
      items: CartItem[]
      totalCUP: DecimalString
      totalLinesCount: number
      totalUnitsCount: DecimalString
    },
    latestProducts?: PosProduct[]
  ): { restoredOrder: PosHeldOrder; stockWarnings: string[] } | null => {
    const targetIndex = heldOrders.value.findIndex((o) => o.id === orderId)
    if (targetIndex < 0) return null

    const targetOrder = heldOrders.value[targetIndex]

    // Si el carrito actual tiene productos, suspenderlo automáticamente como "Ticket anterior"
    if (currentCart.items.length > 0) {
      const suspended = {
        id: `HOLD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        label: 'Ticket anterior',
        items: JSON.parse(JSON.stringify(currentCart.items)),
        totalCUP: currentCart.totalCUP,
        totalLinesCount: currentCart.totalLinesCount,
        totalUnitsCount: currentCart.totalUnitsCount,
        heldAt: new Date().toISOString(),
      }
      heldOrders.value.splice(targetIndex, 1, suspended)
    } else {
      heldOrders.value.splice(targetIndex, 1)
    }

    saveToStorage()

    // Validar el stock disponible con los productos del catálogo
    const stockWarnings: string[] = []
    const validatedItems: CartItem[] = targetOrder.items.map((it) => {
      const copy = { ...it }
      if (latestProducts && latestProducts.length > 0) {
        const prod = latestProducts.find((p) => p.code === it.product.code)
        if (prod) {
          copy.product.stock = prod.stock
          if (compareDecimals(copy.quantity, prod.stock) > 0) {
            stockWarnings.push(
              `${prod.name}: cantidad ajustada de ${copy.quantity} a ${prod.stock} por existencias disponibles`
            )
            copy.quantity = prod.stock
            copy.subtotalCUP = multiplyDecimals(copy.quantity, prod.priceCUP)
          }
        }
      }
      return copy
    })

    return {
      restoredOrder: {
        ...targetOrder,
        items: validatedItems,
      },
      stockWarnings,
    }
  }

  return {
    heldOrders,
    hasHeldOrders,
    heldOrdersCount,
    loadFromStorage,
    suspendCart,
    discardHeldOrder,
    restoreHeldOrder,
  }
}
