import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import PosTerminalView from '../views/PosTerminalView.vue'
import CurrencyExchangeModal from '../components/CurrencyExchangeModal.vue'
import CloseShiftModal from '../components/CloseShiftModal.vue'
import WithdrawalModal from '../components/WithdrawalModal.vue'
import { usePosCart } from '../composables/usePosCart'
import { usePosShift } from '../composables/usePosShift'
import { usePosHeldOrders } from '../composables/usePosHeldOrders'
import { routes } from '@/app/router'
import { cashService, inventoryService } from '@/services'
import { addDecimals, subtractDecimals } from '@/shared/utils/decimal'
import type { PosProduct, CashShift } from '../types'

describe('Punto de Venta (POS) - Canje, Espera y Cierre de Turno', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    document.body.innerHTML = ''
    usePosCart().clearCart()
    ;(cashService as any).reset?.()

    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'cajero',
        fullName: 'Yadira Reyes',
        permissions: [
          'sales.create',
          'sales.view',
          'cash.open_close',
          'cash.exchange',
          'cash.manage',
        ],
      })
    )

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/sales/pos')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    usePosCart().clearCart()
  })

  it('(1) canje calcula CUP con margen: 20 USD con tasa 360 y margen 10 entrega 7000 CUP', async () => {
    const wrapper = mount(CurrencyExchangeModal, {
      props: {
        open: true,
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Tasa efectiva calculada: 360 - 10 = 350.00 CUP
    const effectiveRateEl = document.querySelector('[data-testid="exchange-effective-rate"]')
    expect(effectiveRateEl?.textContent).toContain('1 USD = 350.00 CUP')

    // Ingresar 20.00 USD a canjear
    const amountInput = document.querySelector(
      '[data-testid="exchange-amount-input"] input'
    ) as HTMLInputElement
    expect(amountInput).not.toBeNull()
    amountInput.value = '20.00'
    amountInput.dispatchEvent(new Event('input'))
    await flushPromises()

    // Importe en CUP calculado: 20 * 350 = 7000.00 CUP
    const amountCupEl = document.querySelector('[data-testid="exchange-amount-cup"]')
    expect(amountCupEl?.textContent?.trim()).toBe('7000.00')

    wrapper.unmount()
  })

  it('(2) F6 bloqueado sin turno: con turno cerrado pulsar F6 no abre el modal de canje', async () => {
    vi.spyOn(cashService, 'getCurrentShift').mockResolvedValue(null)
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = null

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Pulsar F6 con turno cerrado
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6' }))
    await flushPromises()

    const exchangeModal = wrapper.findComponent(CurrencyExchangeModal)
    expect(exchangeModal.props('open')).toBe(false)

    wrapper.unmount()
  })

  it('(3) suspender vacia y guarda: pulsar F4 con artículos suspende y persiste en localStorage', async () => {
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '1000.00', USD: '10.00' },
      salesTotals: { cupCash: '0.00', cupTransfer: '0.00', USD: '0.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    }

    const cart = usePosCart()
    const product: PosProduct = {
      id: 101,
      code: '78910001',
      name: 'Café Serrano',
      category: 'Cafetería',
      priceCUP: '650.00',
      priceUSD: '1.81',
      stock: '20.00',
      unit: 'paquete',
    }
    cart.addToCart(product, '2.00')
    expect(cart.isEmpty.value).toBe(false)

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Pulsar F4 para suspender venta
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F4' }))
    await flushPromises()

    // El carrito se vacía
    expect(cart.isEmpty.value).toBe(true)

    // Se persistió en localStorage bajo la clave 'qvaflow_pos_held_orders'
    const stored = localStorage.getItem('qvaflow_pos_held_orders')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored || '[]')
    expect(parsed.length).toBe(1)
    expect(parsed[0].totalCUP).toBe('1300.00')
    expect(parsed[0].items[0].product.code).toBe('78910001')

    wrapper.unmount()
  })

  it('(3b) botón Suspender en la cabecera del carrito suspende y guarda orden activa', async () => {
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '1000.00', USD: '10.00' },
      salesTotals: { cupCash: '0.00', cupTransfer: '0.00', USD: '0.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    }

    const cart = usePosCart()
    const product: PosProduct = {
      id: 101,
      code: '78910001',
      name: 'Café Serrano',
      category: 'Cafetería',
      priceCUP: '650.00',
      priceUSD: '1.81',
      stock: '20.00',
      unit: 'paquete',
    }
    cart.addToCart(product, '1.00')
    expect(cart.isEmpty.value).toBe(false)

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Hacer clic en el botón "Suspender" de la cabecera del carrito
    const suspendBtn = wrapper.find('[data-testid="btn-suspend-cart"]')
    expect(suspendBtn.exists()).toBe(true)
    expect(suspendBtn.text()).toContain('Suspender')
    await suspendBtn.trigger('click')
    await flushPromises()

    // El carrito se vacía y el botón queda deshabilitado
    expect(cart.isEmpty.value).toBe(true)
    expect(suspendBtn.attributes('disabled')).toBeDefined()

    // Se persistió en localStorage
    const stored = localStorage.getItem('qvaflow_pos_held_orders')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored || '[]')
    expect(parsed.length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('(3c) botón En espera de la cabecera muestra badge solo si hay tickets y abre la lista', async () => {
    const heldComposable = usePosHeldOrders()
    const product: PosProduct = {
      id: 101,
      code: '78910001',
      name: 'Café Serrano',
      category: 'Cafetería',
      priceCUP: '650.00',
      priceUSD: '1.81',
      stock: '20.00',
      unit: 'paquete',
    }
    heldComposable.suspendCart(
      [{ product, quantity: '1.00', subtotalCUP: '650.00' }],
      '650.00',
      1,
      '1.00',
      'Ticket #1'
    )

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    const heldBtn = wrapper.find('[data-testid="header-held-orders-btn"]')
    expect(heldBtn.exists()).toBe(true)
    expect(heldBtn.text()).toContain('En espera')

    const badge = wrapper.find('[data-testid="header-held-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('1')

    await heldBtn.trigger('click')
    await flushPromises()

    // El modal de órdenes en espera debe abrirse
    expect(wrapper.findComponent({ name: 'HeldOrdersModal' }).props('open')).toBe(true)

    wrapper.unmount()
  })

  it('(4) restaurar suspende el actual: al restaurar con carrito activo guarda el actual como "Ticket anterior"', async () => {
    const heldComposable = usePosHeldOrders()
    const cart = usePosCart()

    // 1. Guardar una orden inicial en espera
    const oldProduct: PosProduct = {
      id: 102,
      code: '78910002',
      name: 'Refresco TuKola 355ml',
      category: 'Bebidas',
      priceCUP: '250.00',
      priceUSD: '0.69',
      stock: '15.00',
      unit: 'lata',
    }
    const initialOrder = heldComposable.suspendCart(
      [{ product: oldProduct, quantity: '1.00', subtotalCUP: '250.00' }],
      '250.00',
      1,
      '1.00',
      'Ticket Cliente Esperando'
    )
    expect(initialOrder).not.toBeNull()

    // 2. Llenar el carrito con otra venta activa
    const currentProduct: PosProduct = {
      id: 101,
      code: '78910001',
      name: 'Café Serrano',
      category: 'Cafetería',
      priceCUP: '650.00',
      priceUSD: '1.81',
      stock: '20.00',
      unit: 'paquete',
    }
    cart.addToCart(currentProduct, '1.00')

    // 3. Restaurar la orden anterior mientras el carrito actual tiene productos
    const res = heldComposable.restoreHeldOrder(initialOrder!.id, {
      items: cart.items.value,
      totalCUP: cart.totalCUP.value,
      totalLinesCount: cart.totalLinesCount.value,
      totalUnitsCount: cart.totalUnitsCount.value,
    })

    expect(res).not.toBeNull()
    expect(res?.restoredOrder.items[0].product.code).toBe('78910002')

    // La lista de espera ahora contiene el ticket que estaba activo guardado como "Ticket anterior"
    expect(heldComposable.heldOrders.value.length).toBe(1)
    expect(heldComposable.heldOrders.value[0].label).toBe('Ticket anterior')
    expect(heldComposable.heldOrders.value[0].items[0].product.code).toBe('78910001')
  })

  it('(5) persistencia tras recarga: usePosHeldOrders recarga órdenes guardadas en localStorage', () => {
    const sampleHeld = [
      {
        id: 'HOLD-TEST-1',
        label: 'Ticket #1',
        items: [],
        totalCUP: '500.00',
        totalLinesCount: 1,
        totalUnitsCount: '1.00',
        heldAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem('qvaflow_pos_held_orders', JSON.stringify(sampleHeld))

    const heldComposable = usePosHeldOrders()
    heldComposable.loadFromStorage()

    expect(heldComposable.heldOrders.value.length).toBe(1)
    expect(heldComposable.heldOrders.value[0].id).toBe('HOLD-TEST-1')
    expect(heldComposable.heldOrders.value[0].totalCUP).toBe('500.00')
  })

  it('(6) cierre con diferencia exige motivo: rechaza si notes < 10 caracteres y aprueba con >= 10', async () => {
    const shiftMock: CashShift = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '10000.00', USD: '100.00' },
      salesTotals: { cupCash: '5000.00', cupTransfer: '0.00', USD: '50.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    }

    const closeShiftSpy = vi.spyOn(cashService, 'closeShift')

    const wrapper = mount(CloseShiftModal, {
      props: {
        open: true,
        shift: shiftMock,
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Fondos esperados: CUP 15000.00, USD 150.00.
    // Conteo con faltante de 500 CUP: 14500.00
    const countedCupInput = document.querySelector(
      '[data-testid="close-counted-cup-input"] input'
    ) as HTMLInputElement
    countedCupInput.value = '14500.00'
    countedCupInput.dispatchEvent(new Event('input'))
    await flushPromises()

    // 1. Envío sin motivo o con menos de 10 caracteres
    const notesInput = document.querySelector(
      '[data-testid="close-notes-input"] input'
    ) as HTMLInputElement
    notesInput.value = 'Faltó'
    notesInput.dispatchEvent(new Event('input'))

    const formEl = document.querySelector('#close-shift-form') as HTMLFormElement
    formEl.dispatchEvent(new Event('submit'))
    await flushPromises()

    // Bloqueado en cliente
    expect(closeShiftSpy).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('al menos 10 caracteres')

    // 2. Envío con motivo válido (>= 10 caracteres)
    notesInput.value = 'Faltante de 500 CUP por billete deteriorado retirado de circulación'
    notesInput.dispatchEvent(new Event('input'))

    formEl.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(closeShiftSpy).toHaveBeenCalledWith(
      'TURNO-2026-001',
      expect.objectContaining({
        countedCUP: '14500.00',
        countedUSD: '150.00',
        notes: expect.stringContaining('Faltante de 500 CUP'),
      })
    )

    wrapper.unmount()
  })

  it('(7) cierre exacto no lo exige: arqueo sin diferencias no requiere motivo obligatorio', async () => {
    const shiftMock: CashShift = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '10000.00', USD: '100.00' },
      salesTotals: { cupCash: '5000.00', cupTransfer: '0.00', USD: '50.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    }

    const closeShiftSpy = vi.spyOn(cashService, 'closeShift')

    const wrapper = mount(CloseShiftModal, {
      props: {
        open: true,
        shift: shiftMock,
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Fondos esperados: CUP 15000.00, USD 150.00.
    // Conteo exacto: 15000.00 CUP, 150.00 USD
    const countedCupInput = document.querySelector(
      '[data-testid="close-counted-cup-input"] input'
    ) as HTMLInputElement
    countedCupInput.value = '15000.00'
    countedCupInput.dispatchEvent(new Event('input'))

    const countedUsdInput = document.querySelector(
      '[data-testid="close-counted-usd-input"] input'
    ) as HTMLInputElement
    countedUsdInput.value = '150.00'
    countedUsdInput.dispatchEvent(new Event('input'))
    await flushPromises()

    // Sin motivo
    const notesInput = document.querySelector(
      '[data-testid="close-notes-input"] input'
    ) as HTMLInputElement
    notesInput.value = ''
    notesInput.dispatchEvent(new Event('input'))

    const formEl = document.querySelector('#close-shift-form') as HTMLFormElement
    formEl.dispatchEvent(new Event('submit'))
    await flushPromises()

    // Se procesa exitosamente sin exigir motivo obligatorio
    expect(closeShiftSpy).toHaveBeenCalledWith(
      'TURNO-2026-001',
      expect.objectContaining({
        countedCUP: '15000.00',
        countedUSD: '150.00',
      })
    )

    wrapper.unmount()
  })

  it('(8) Escape cierra solo el modal abierto: con modal abierto Escape no sale del POS', async () => {
    vi.spyOn(cashService, 'getCurrentShift').mockResolvedValue({
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '1000.00', USD: '10.00' },
      salesTotals: { cupCash: '0.00', cupTransfer: '0.00', USD: '0.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    })

    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Abrir modal de canje F6
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F6' }))
    await flushPromises()

    const exchangeModal = wrapper.findComponent(CurrencyExchangeModal)
    expect(exchangeModal.props('open')).toBe(true)

    // Pulsar Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    // No debe haber navegado hacia '/'
    expect(pushSpy).not.toHaveBeenCalledWith('/')

    wrapper.unmount()
  })

  it('(9) Enter seguro en CurrencyExchangeModal: Enter no confirma si el monto es 0 o vacío, ni si el foco está en notas', async () => {
    const createExchangeSpy = vi.spyOn(cashService, 'createExchange')

    const wrapper = mount(CurrencyExchangeModal, {
      props: {
        open: true,
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    const amountInput = document.querySelector(
      '[data-testid="exchange-amount-input"] input'
    ) as HTMLInputElement
    const notesInput = document.querySelector(
      '[data-testid="exchange-notes-input"] input'
    ) as HTMLInputElement

    expect(amountInput).not.toBeNull()
    expect(notesInput).not.toBeNull()

    // Caso 1: Monto vacío
    amountInput.value = ''
    amountInput.dispatchEvent(new Event('input'))
    amountInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(createExchangeSpy).not.toHaveBeenCalled()

    // Caso 2: Monto 0
    amountInput.value = '0.00'
    amountInput.dispatchEvent(new Event('input'))
    amountInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(createExchangeSpy).not.toHaveBeenCalled()

    // Caso 3: Monto válido pero foco en notas
    amountInput.value = '20.00'
    amountInput.dispatchEvent(new Event('input'))
    notesInput.focus()
    expect(document.activeElement).toBe(notesInput)

    notesInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(createExchangeSpy).not.toHaveBeenCalled()

    // Caso 4: Monto válido con foco en el input de monto confirma el canje
    amountInput.focus()
    expect(document.activeElement).toBe(amountInput)

    amountInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(createExchangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amountFrom: '20.00',
        currencyFrom: 'USD',
      })
    )

    wrapper.unmount()
  })

  it('(10) Enter seguro en CloseShiftModal: Enter no confirma si el monto es 0 o vacío, ni si el foco está en notas', async () => {
    const shiftMock: CashShift = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: new Date().toISOString(),
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '10000.00', USD: '100.00' },
      salesTotals: { cupCash: '5000.00', cupTransfer: '0.00', USD: '50.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    }

    const closeShiftSpy = vi.spyOn(cashService, 'closeShift')

    const wrapper = mount(CloseShiftModal, {
      props: {
        open: true,
        shift: shiftMock,
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    const cupInput = document.querySelector(
      '[data-testid="close-counted-cup-input"] input'
    ) as HTMLInputElement
    const usdInput = document.querySelector(
      '[data-testid="close-counted-usd-input"] input'
    ) as HTMLInputElement
    const notesInput = document.querySelector(
      '[data-testid="close-notes-input"] input'
    ) as HTMLInputElement

    expect(cupInput).not.toBeNull()
    expect(usdInput).not.toBeNull()
    expect(notesInput).not.toBeNull()

    // Caso 1: Monto vacío en CUP
    cupInput.value = ''
    cupInput.dispatchEvent(new Event('input'))
    cupInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(closeShiftSpy).not.toHaveBeenCalled()

    // Caso 2: Montos en 0.00
    cupInput.value = '0.00'
    cupInput.dispatchEvent(new Event('input'))
    usdInput.value = '0.00'
    usdInput.dispatchEvent(new Event('input'))
    cupInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(closeShiftSpy).not.toHaveBeenCalled()

    // Caso 3: Montos válidos pero foco en notas
    cupInput.value = '15000.00'
    cupInput.dispatchEvent(new Event('input'))
    usdInput.value = '150.00'
    usdInput.dispatchEvent(new Event('input'))
    notesInput.focus()
    expect(document.activeElement).toBe(notesInput)

    notesInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(closeShiftSpy).not.toHaveBeenCalled()

    // Caso 4: Montos válidos con foco en input de conteo confirma el cierre exacto
    cupInput.focus()
    expect(document.activeElement).toBe(cupInput)

    cupInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(closeShiftSpy).toHaveBeenCalledWith(
      'TURNO-2026-001',
      expect.objectContaining({
        countedCUP: '15000.00',
        countedUSD: '150.00',
      })
    )

    wrapper.unmount()
  })

  it('(11) mock rechaza motivo corto (< 10 caracteres) con error 400', async () => {
    await expect(
      cashService.createWithdrawal({
        clientRequestId: 'test-req-1',
        shiftId: 'TURNO-2026-001',
        kind: 'CASH',
        currency: 'CUP',
        amount: '100.00',
        beneficiary: 'OWNER',
        reason: 'Corto',
      })
    ).rejects.toThrow()
  })

  it('(12) mock rechaza salida de efectivo que supera el disponible en gaveta con 409', async () => {
    let caughtError: any = null
    try {
      await cashService.createWithdrawal({
        clientRequestId: 'test-req-2',
        shiftId: 'TURNO-2026-001',
        kind: 'CASH',
        currency: 'CUP',
        amount: '99999999.00',
        beneficiary: 'OWNER',
        reason: 'Retiro excesivo para el dueño del negocio',
      })
    } catch (err: any) {
      caughtError = err
    }
    expect(caughtError).not.toBeNull()
    expect(caughtError?.statusCode).toBe(409)
    expect(caughtError?.code).toBe('INSUFFICIENT_CASH_IN_DRAWER')
  })

  it('(13) salida de efectivo reduce el efectivo esperado del turno', async () => {
    const activeShift = await cashService.getCurrentShift()
    expect(activeShift).not.toBeNull()
    const initialWithdrawals = activeShift?.withdrawalsTotals?.CUP || '0.00'

    const withdrawal = await cashService.createWithdrawal({
      clientRequestId: 'test-req-3',
      shiftId: activeShift!.id,
      kind: 'CASH',
      currency: 'CUP',
      amount: '500.00',
      beneficiary: 'OWNER',
      reason: 'Retiro de efectivo para compra menor de suministros',
    })

    expect(withdrawal.id).toBeDefined()
    expect(withdrawal.amount).toBe('500.00')

    const updatedShift = await cashService.getCurrentShift()
    expect(updatedShift?.withdrawalsTotals?.CUP).toBe(addDecimals(initialWithdrawals, '500.00'))
    expect(updatedShift?.withdrawalsCount?.cash).toBeGreaterThan(0)
  })

  it('(14) salida de producto descuenta stock en inventario y genera movimiento', async () => {
    const activeShift = await cashService.getCurrentShift()
    expect(activeShift).not.toBeNull()

    const stockBefore = await inventoryService.getStock({ search: '78910001' })
    const prodBefore = stockBefore.items[0]
    expect(prodBefore).toBeDefined()
    const prevQty = prodBefore.quantity

    const withdrawal = await cashService.createWithdrawal({
      clientRequestId: 'test-req-4',
      shiftId: activeShift!.id,
      kind: 'PRODUCT',
      productId: 1,
      productName: prodBefore.productName,
      sku: prodBefore.productCode,
      quantity: '2.00',
      beneficiary: 'OWNER',
      reason: 'Muestra comercial autorizada para el dueño',
    })

    expect(withdrawal.id).toBeDefined()
    expect(withdrawal.kind).toBe('PRODUCT')

    const stockAfter = await inventoryService.getStock({ search: '78910001' })
    const prodAfter = stockAfter.items[0]
    expect(prodAfter.quantity).toBe(subtractDecimals(prevQty, '2.00'))
  })

  it('(15) vendedor registra salida desde el POS con atajo F7 o botón Salida', async () => {
    // Usuario vendedor: solo sales.create y sales.view (sin permisos cash.*)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'vendedor',
        fullName: 'Carlos Valdés',
        permissions: ['sales.create', 'sales.view'],
      })
    )

    const shiftComposable = usePosShift()
    await shiftComposable.loadShiftData()

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Verificar botón Salida en el header del POS
    const withdrawalBtn = wrapper.find('[data-testid="header-withdrawal-btn"]')
    expect(withdrawalBtn.exists()).toBe(true)

    // Abrir modal con click
    await withdrawalBtn.trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(WithdrawalModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('open')).toBe(true)

    wrapper.unmount()
  })
})
