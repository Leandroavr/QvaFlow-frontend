import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import posService from '../services/posService'
import type {
  PosProduct,
  CartItem,
  PaymentCurrency,
  PosPaymentMode,
  ExchangeRates,
  CompletedSale,
  CashShift,
  HeldOrder,
  PaymentMethod,
  TransferGateway,
} from '../types/pos'

/**
 * Store Pinia para el Terminal POS, Control de Turnos, Canjes y Pasarelas de Pago.
 */
export const usePosStore = defineStore('pos', () => {
  // Estado Reactivo
  const products = ref<PosProduct[]>([])
  const cart = ref<CartItem[]>([])
  const heldOrders = ref<HeldOrder[]>([])
  const currentShift = ref<CashShift | null>(null)
  const loading = ref<boolean>(false)
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('all')

  // Modalidad ágil de cobro (One-Click)
  const paymentMode = ref<PosPaymentMode>('CUP_CASH')
  const usdExchangeMargin = ref<number>(10) // Descuento de 10 CUP por canje en mostrador

  // Moneda elegida por el cajero para el cobro
  const selectedCurrency = ref<PaymentCurrency>('CUP')

  // Tasas de cambio (1 unidad extranjera = X CUP)
  const exchangeRates = ref<ExchangeRates>({
    CUP: 1,
    USD: 360,
    EUR: 380,
    MLC: 275,
  })

  // Getters Computados
  const isShiftOpen = computed(() => !!currentShift.value && currentShift.value.status === 'OPEN')

  const categories = computed(() => {
    const set = new Set<string>()
    products.value.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['all', ...Array.from(set)]
  })

  // Filtrado reactivo en tiempo real
  const filteredProducts = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    return products.value.filter((p) => {
      const matchQuery =
        !query || p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)

      const matchCategory =
        selectedCategory.value === 'all' || p.category === selectedCategory.value

      return matchQuery && matchCategory
    })
  })

  // Total de unidades físicas en el carrito
  const totalUnitsInCart = computed(() => {
    return cart.value.reduce((acc, item) => acc + item.quantity, 0)
  })

  // Total base de la venta expresado en CUP (con redondeo estricto a entero sin centavos)
  const totalCUP = computed(() => {
    const rawTotal = cart.value.reduce((acc, item) => acc + item.subtotal, 0)
    // Regla estricta: en Cuba no circulan centavos de CUP en efectivo
    return Math.round(rawTotal)
  })

  // Tasa efectiva para cobro en USD (Tasa del día menos 10 CUP por margen de canje)
  const effectiveRateUSD = computed(() => {
    const base = exchangeRates.value.USD || 360
    return Math.max(1, base - usdExchangeMargin.value)
  })

  // Tasa de cambio actual para la moneda seleccionada
  const currentRate = computed(() => {
    if (paymentMode.value === 'USD_CASH') {
      return effectiveRateUSD.value
    }
    return exchangeRates.value[selectedCurrency.value] || 1
  })

  // Estado de Historial de Ventas y Cuadres de Turno
  const salesHistory = ref<CompletedSale[]>([])
  const shiftsHistory = ref<CashShift[]>([])
  const loadingHistory = ref<boolean>(false)

  // Total de la venta equivalente en USD (Moneda Principal del Negocio)
  const totalUSD = computed(() => {
    const rateUSD = exchangeRates.value.USD || 360
    if (rateUSD <= 0) return 0
    return Number((totalCUP.value / rateUSD).toFixed(2))
  })

  // Total convertido automáticamente a la moneda de cobro
  // En USD: Tasa con -10 CUP de canje y redondeo hacia arriba estricto (Math.ceil, NUNCA centavos)
  const totalInSelectedCurrency = computed(() => {
    if (paymentMode.value === 'CUP_CASH' || paymentMode.value === 'CUP_TRANSFER') {
      return totalCUP.value
    }

    if (paymentMode.value === 'USD_CASH') {
      const rate = effectiveRateUSD.value
      if (rate <= 0) return 0
      const rawUSD = totalCUP.value / rate
      // NUNCA centavos: si da 4.89 USD redondea a 5 USD
      return Math.ceil(rawUSD)
    }

    const rate = currentRate.value
    if (rate <= 0) return 0
    return Number((totalCUP.value / rate).toFixed(2))
  })

  // Vuelto en CUP a entregar al cliente si paga con el billete redondeado en USD
  const changeInCUPForRoundedUSD = computed(() => {
    if (paymentMode.value !== 'USD_CASH') return 0
    const usdCharged = totalInSelectedCurrency.value
    const equivalentCUP = usdCharged * effectiveRateUSD.value
    return Math.max(0, equivalentCUP - totalCUP.value)
  })

  // Fondos esperados en caja para el arqueo
  const expectedCUP = computed(() => {
    if (!currentShift.value) return 0
    return (
      currentShift.value.initialFunds.CUP +
      currentShift.value.salesTotals.CUP +
      currentShift.value.exchangeAdjustments.CUP
    )
  })

  const expectedUSD = computed(() => {
    if (!currentShift.value) return 0
    return (
      currentShift.value.initialFunds.USD +
      currentShift.value.salesTotals.USD +
      currentShift.value.exchangeAdjustments.USD
    )
  })

  // Acciones

  /**
   * Carga el catálogo, tasas de cambio y estado del turno actual.
   */
  const loadInitialData = async () => {
    loading.value = true
    try {
      const [prods, rates, shift] = await Promise.all([
        posService.getPosProducts(),
        posService.getExchangeRates(),
        posService.getCurrentShift(),
      ])
      products.value = prods
      if (shift?.dailyRateUSD) {
        rates.USD = shift.dailyRateUSD
      }
      exchangeRates.value = rates
      currentShift.value = shift
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar datos del POS'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  /**
   * Agrega un producto al carrito validando stock.
   */
  const addToCart = (product: PosProduct, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      message.warning(`El producto "${product.name}" no tiene existencias disponibles.`)
      return
    }

    const existingIndex = cart.value.findIndex((item) => item.product.id === product.id)

    if (existingIndex !== -1) {
      const currentItem = cart.value[existingIndex]
      const newQty = currentItem.quantity + quantityToAdd

      if (newQty > product.stock) {
        message.warning(
          `Stock máximo disponible para "${product.name}": ${product.stock} ${product.unit}`
        )
        return
      }

      currentItem.quantity = newQty
      currentItem.subtotal = currentItem.quantity * currentItem.unitPrice
    } else {
      if (quantityToAdd > product.stock) {
        message.warning(`Stock máximo disponible: ${product.stock} ${product.unit}`)
        return
      }

      cart.value.push({
        id: product.id,
        product,
        quantity: quantityToAdd,
        unitPrice: product.price,
        subtotal: quantityToAdd * product.price,
      })
    }
  }

  /**
   * Captura rápida para pistolas USB de códigos de barra.
   */
  const addByBarcode = (scannedCode: string): boolean => {
    const cleanCode = scannedCode.trim()
    if (!cleanCode) return false

    const found = products.value.find((p) => p.code.toLowerCase() === cleanCode.toLowerCase())

    if (found) {
      addToCart(found, 1)
      message.success(`+1 ${found.name}`)
      return true
    }

    message.error(`Código de barras "${cleanCode}" no encontrado.`)
    return false
  }

  /**
   * Modifica la cantidad de un artículo en el carrito.
   */
  const updateQuantity = (productId: number, newQty: number) => {
    const itemIndex = cart.value.findIndex((item) => item.product.id === productId)
    if (itemIndex === -1) return

    const item = cart.value[itemIndex]

    if (newQty <= 0) {
      removeFromCart(productId)
      return
    }

    if (newQty > item.product.stock) {
      message.warning(`Stock máximo disponible: ${item.product.stock} ${item.product.unit}`)
      return
    }

    item.quantity = newQty
    item.subtotal = item.quantity * item.unitPrice
  }

  const removeFromCart = (productId: number) => {
    cart.value = cart.value.filter((item) => item.product.id !== productId)
  }

  const clearCart = () => {
    cart.value = []
  }

  const setPaymentCurrency = (curr: PaymentCurrency) => {
    selectedCurrency.value = curr
  }

  const setPaymentMode = (mode: PosPaymentMode) => {
    paymentMode.value = mode
    if (mode === 'CUP_CASH' || mode === 'CUP_TRANSFER') {
      selectedCurrency.value = 'CUP'
    } else if (mode === 'USD_CASH') {
      selectedCurrency.value = 'USD'
    } else if (mode === 'EUR_CASH') {
      selectedCurrency.value = 'EUR'
    } else if (mode === 'MLC_TRANSFER') {
      selectedCurrency.value = 'MLC'
    }
  }

  // --- CONTROL DE TICKETS EN ESPERA (HOLD TICKETS) ---

  /**
   * Suspende el carrito actual y lo guarda en espera (F4).
   */
  const holdCurrentCart = (orderName?: string): boolean => {
    if (cart.value.length === 0) {
      message.warning('No hay artículos en el carrito para poner en espera.')
      return false
    }

    const newHeld: HeldOrder = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      name: orderName || `Ticket en espera #${heldOrders.value.length + 1}`,
      cart: [...cart.value],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalCUP: totalCUP.value,
    }

    heldOrders.value.unshift(newHeld)
    clearCart()
    message.info(`Ticket suspendido: "${newHeld.name}".`)
    return true
  }

  /**
   * Recupera un ticket en espera al carrito activo.
   */
  const restoreHeldOrder = (orderId: string) => {
    const index = heldOrders.value.findIndex((o) => o.id === orderId)
    if (index === -1) return

    if (cart.value.length > 0) {
      // Poner primero el actual en espera si tenía ítems
      holdCurrentCart(`Ticket anterior`)
    }

    const order = heldOrders.value[index]
    cart.value = [...order.cart]
    heldOrders.value.splice(index, 1)
    message.success(`Ticket "${order.name}" restaurado al carrito.`)
  }

  const deleteHeldOrder = (orderId: string) => {
    heldOrders.value = heldOrders.value.filter((o) => o.id !== orderId)
  }

  // --- CONTROL DE TURNOS DE CAJA ---

  const openCashShift = async (
    initialCUP: number,
    initialUSD: number,
    cashierName: string,
    dailyRateUSD: number = 360
  ) => {
    loading.value = true
    try {
      const shift = await posService.openShift(initialCUP, initialUSD, cashierName, dailyRateUSD)
      currentShift.value = shift
      exchangeRates.value.USD = dailyRateUSD
      await fetchShiftsHistory()
      message.success(`Turno de caja ${shift.id} aperturado con tasa 1 USD = ${dailyRateUSD} CUP.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al abrir turno'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  const closeCashShift = async (countedCUP: number, countedUSD: number, notes?: string) => {
    loading.value = true
    try {
      const closed = await posService.closeShift(countedCUP, countedUSD, notes)
      currentShift.value = null
      await fetchShiftsHistory()
      message.success(`Turno ${closed.id} cerrado y arqueado correctamente.`)
      return closed
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cerrar turno'
      message.error(errorMsg)
      return null
    } finally {
      loading.value = false
    }
  }

  // --- CANJE DE DIVISAS EN MOSTRADOR ---

  const performCurrencyExchange = async (
    currencyFrom: PaymentCurrency,
    amountFrom: number,
    currencyTo: PaymentCurrency,
    amountTo: number,
    rate: number,
    notes?: string
  ): Promise<boolean> => {
    loading.value = true
    try {
      await posService.recordExchange({
        currencyFrom,
        amountFrom,
        currencyTo,
        amountTo,
        rate,
        notes,
      })

      // Refrescar estado del turno local
      currentShift.value = await posService.getCurrentShift()
      message.success(
        `Canje registrado: Recibido ${amountFrom} ${currencyFrom} -> Entregado ${amountTo} ${currencyTo}`
      )
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar canje'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  // --- COBRO DE VENTA (EFECTIVO O QR) ---

  const processSale = async (payload: {
    cashReceived: number
    paymentMethod: PaymentMethod
    transferGateway?: TransferGateway
    transferReference?: string
  }): Promise<CompletedSale | null> => {
    if (cart.value.length === 0) {
      message.warning('El carrito está vacío.')
      return null
    }

    loading.value = true
    try {
      const totalDueInCurr = totalInSelectedCurrency.value

      // En CUP el vuelto se redondea estrictamente sin centavos
      let changeGiven = 0
      if (payload.paymentMethod === 'CASH') {
        const rawChange = Math.max(0, payload.cashReceived - totalDueInCurr)
        changeGiven =
          selectedCurrency.value === 'CUP' ? Math.round(rawChange) : Number(rawChange.toFixed(2))
      }

      // Si se cobró en USD, el total en USD es ESTRICTAMENTE el entero cobrado (sin centavos, ej. 1 USD)
      const chargedUSD =
        selectedCurrency.value === 'USD'
          ? Math.ceil(totalDueInCurr)
          : Number((totalCUP.value / (exchangeRates.value.USD || 360)).toFixed(2))

      const salePayload = {
        items: [...cart.value],
        totalCUP: totalCUP.value,
        totalUSD: chargedUSD,
        paidCurrency: selectedCurrency.value,
        exchangeRate: currentRate.value,
        totalInCurrency:
          selectedCurrency.value === 'USD' ? Math.ceil(totalDueInCurr) : totalDueInCurr,
        cashReceived: payload.cashReceived,
        changeGiven,
        paymentMethod: payload.paymentMethod,
        transferGateway: payload.transferGateway,
        transferReference: payload.transferReference,
      }

      const receipt = await posService.recordSale(salePayload)

      // Actualizar existencias locales en memoria
      cart.value.forEach((cartItem) => {
        const prod = products.value.find((p) => p.id === cartItem.product.id)
        if (prod) {
          prod.stock = Math.max(0, prod.stock - cartItem.quantity)
        }
      })

      // Refrescar totales del turno activo
      currentShift.value = await posService.getCurrentShift()

      clearCart()
      message.success(`Venta ${receipt.id} cobrada exitosamente.`)
      return receipt
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al procesar el cobro'
      message.error(errorMsg)
      return null
    } finally {
      loading.value = false
    }
  }

  // --- HISTORIAL DE VENTAS Y CUADRES DE TURNO ---

  const fetchSalesHistory = async () => {
    loadingHistory.value = true
    try {
      salesHistory.value = await posService.getSalesHistory()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar historial de ventas'
      message.error(errorMsg)
    } finally {
      loadingHistory.value = false
    }
  }

  const fetchShiftsHistory = async () => {
    loadingHistory.value = true
    try {
      shiftsHistory.value = await posService.getShiftsHistory()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar historial de turnos'
      message.error(errorMsg)
    } finally {
      loadingHistory.value = false
    }
  }

  const setDailyRates = async (newRates: Partial<ExchangeRates>) => {
    loading.value = true
    try {
      const updated = await posService.updateExchangeRates(newRates)
      exchangeRates.value = { ...updated }
      if (currentShift.value && newRates.USD) {
        currentShift.value.dailyRateUSD = newRates.USD
      }
      message.success(`Tasa de cambio del día actualizada (1 USD = ${updated.USD} CUP).`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar tasas'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    products,
    cart,
    heldOrders,
    currentShift,
    loading,
    searchQuery,
    selectedCategory,
    selectedCurrency,
    paymentMode,
    usdExchangeMargin,
    exchangeRates,
    salesHistory,
    shiftsHistory,
    loadingHistory,
    // Getters
    isShiftOpen,
    categories,
    filteredProducts,
    totalUnitsInCart,
    totalCUP,
    totalUSD,
    currentRate,
    effectiveRateUSD,
    totalInSelectedCurrency,
    changeInCUPForRoundedUSD,
    expectedCUP,
    expectedUSD,
    // Acciones
    loadInitialData,
    addToCart,
    addByBarcode,
    updateQuantity,
    removeFromCart,
    clearCart,
    setPaymentCurrency,
    setPaymentMode,
    setDailyRates,
    // Tickets en espera
    holdCurrentCart,
    restoreHeldOrder,
    deleteHeldOrder,
    // Turnos y Arqueos
    openCashShift,
    closeCashShift,
    fetchSalesHistory,
    fetchShiftsHistory,
    // Canjes
    performCurrencyExchange,
    // Ventas
    processSale,
  }
})

export default usePosStore
