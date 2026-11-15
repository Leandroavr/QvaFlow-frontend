import { ref, computed } from 'vue'
import type { PosProduct, CartItem } from '../types'
import type { DecimalString } from '@/shared/types/currency'
import {
  addDecimals,
  subtractDecimals,
  multiplyDecimals,
  compareDecimals,
  normalizeDecimal,
} from '@/shared/utils/decimal'

// Estado del carrito a nivel de módulo para consistencia en todo el terminal POS
const items = ref<CartItem[]>([])

export function usePosCart() {
  const isEmpty = computed<boolean>(() => items.value.length === 0)

  const totalLinesCount = computed<number>(() => items.value.length)

  const totalUnitsCount = computed<DecimalString>(() => {
    return items.value.reduce((acc, item) => addDecimals(acc, item.quantity), '0.00')
  })

  const totalCUP = computed<DecimalString>(() => {
    return items.value.reduce((acc, item) => addDecimals(acc, item.subtotalCUP), '0.00')
  })

  /**
   * Agrega un producto al carrito respetando el límite estricto de existencias (stock).
   * Si ya existe en el carrito, incrementa su cantidad.
   */
  const addToCart = (product: PosProduct, quantityToAdd: DecimalString = '1.00'): boolean => {
    // Si no hay stock disponible, no se permite agregar
    if (compareDecimals(product.stock, '0.00') <= 0) {
      return false
    }

    const existingIndex = items.value.findIndex((i) => i.product.code === product.code)

    if (existingIndex >= 0) {
      const existing = items.value[existingIndex]
      const targetQty = addDecimals(existing.quantity, quantityToAdd)

      // Comprobación de límite de stock
      if (compareDecimals(targetQty, product.stock) > 0) {
        // Fijar al máximo disponible si no lo ha alcanzado ya
        if (compareDecimals(existing.quantity, product.stock) < 0) {
          existing.quantity = product.stock
          existing.subtotalCUP = multiplyDecimals(existing.quantity, product.priceCUP)
          return true
        }
        return false // Ya está al tope de existencias
      }

      existing.quantity = targetQty
      existing.subtotalCUP = multiplyDecimals(existing.quantity, product.priceCUP)
      return true
    }

    // Nuevo ítem en carrito
    const initialQty =
      compareDecimals(quantityToAdd, product.stock) > 0 ? product.stock : quantityToAdd

    items.value.push({
      product: { ...product },
      quantity: normalizeDecimal(initialQty),
      subtotalCUP: multiplyDecimals(initialQty, product.priceCUP),
    })

    return true
  }

  const updateQuantity = (productCode: string, newQuantity: DecimalString): void => {
    const index = items.value.findIndex((i) => i.product.code === productCode)
    if (index === -1) return

    const line = items.value[index]

    if (compareDecimals(newQuantity, '0.00') <= 0) {
      items.value.splice(index, 1)
      return
    }

    let clamped = newQuantity
    if (compareDecimals(newQuantity, line.product.stock) > 0) {
      clamped = line.product.stock
    }

    line.quantity = normalizeDecimal(clamped)
    line.subtotalCUP = multiplyDecimals(line.quantity, line.product.priceCUP)
  }

  const increment = (productCode: string): boolean => {
    const item = items.value.find((i) => i.product.code === productCode)
    if (!item) return false

    const nextQty = addDecimals(item.quantity, '1.00')
    if (compareDecimals(nextQty, item.product.stock) > 0) {
      return false // Límite de stock alcanzado
    }

    updateQuantity(productCode, nextQty)
    return true
  }

  const decrement = (productCode: string): void => {
    const item = items.value.find((i) => i.product.code === productCode)
    if (!item) return

    if (compareDecimals(item.quantity, '1.00') <= 0) {
      removeItem(productCode)
    } else {
      updateQuantity(productCode, subtractDecimals(item.quantity, '1.00'))
    }
  }

  const removeItem = (productCode: string): void => {
    const index = items.value.findIndex((i) => i.product.code === productCode)
    if (index >= 0) {
      items.value.splice(index, 1)
    }
  }

  const clearCart = (): void => {
    items.value = []
  }

  const setItems = (newItems: CartItem[]): void => {
    items.value = JSON.parse(JSON.stringify(newItems))
  }

  return {
    items,
    isEmpty,
    totalLinesCount,
    totalUnitsCount,
    totalCUP,
    addToCart,
    updateQuantity,
    increment,
    decrement,
    removeItem,
    clearCart,
    setItems,
  }
}
