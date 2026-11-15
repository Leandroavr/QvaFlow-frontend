import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import PosTerminalView from '../views/PosTerminalView.vue'
import PosCheckoutDrawer from '../components/PosCheckoutDrawer.vue'
import OpenShiftModal from '../components/OpenShiftModal.vue'
import { usePosCart } from '../composables/usePosCart'
import { usePosShift } from '../composables/usePosShift'
import { routes } from '@/app/router'
import { salesService, cashService } from '@/services'
import { ApiError } from '@/shared/types/api'
import type { PosProduct, CartItem } from '../types'

describe('Punto de Venta (POS) - Turno de Caja y Drawer de Cobro', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    document.body.innerHTML = ''
    usePosCart().clearCart()

    // Usuario con permisos de ventas y caja
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'cajero',
        fullName: 'Yadira Reyes',
        permissions: ['sales.create', 'sales.view', 'cash.open_close', 'cash.manage'],
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

  it('(1) turno cerrado deshabilita cobro: botón Cobrar deshabilitado y F8 bloqueado', async () => {
    // Simular que el backend no tiene turno abierto
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

    // El aviso de turno cerrado debe ser visible en el carrito
    const closedNotice = wrapper.find('[data-testid="pos-shift-closed-notice"]')
    expect(closedNotice.exists()).toBe(true)
    expect(closedNotice.text()).toContain('Turno de caja cerrado')

    // El botón Cobrar Venta debe estar deshabilitado
    const checkoutBtn = wrapper.find('button[title="Proceder al cobro de la venta (F8)"]')
    expect(checkoutBtn.exists()).toBe(true)
    expect(checkoutBtn.attributes('disabled')).toBeDefined()

    // Pulsar F8 no debe abrir el drawer de cobro
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8' }))
    await flushPromises()

    const drawer = wrapper.findComponent(PosCheckoutDrawer)
    expect(drawer.props('open')).toBe(false)

    wrapper.unmount()
  })

  it('(2) apertura valida: modal valida campos con zod y abre turno con OpenShiftDto', async () => {
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = null

    const openShiftSpy = vi.spyOn(cashService, 'openShift')

    const wrapper = mount(OpenShiftModal, {
      props: {
        open: true,
        defaultRateUSD: '360.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Los inputs están teletransportados en document.body
    const cashierInput = document.querySelector(
      'input[placeholder="Nombre y apellidos del cajero"]'
    ) as HTMLInputElement
    const rateInput = document.querySelector('input[placeholder="360.00"]') as HTMLInputElement
    const cupInput = document.querySelector('input[placeholder="0.00"]') as HTMLInputElement
    const formEl = document.querySelector('#open-shift-form') as HTMLFormElement

    expect(cashierInput).not.toBeNull()
    expect(rateInput).not.toBeNull()

    // 1. Envío inválido (cajero vacío, tasa 0.00)
    cashierInput.value = ''
    cashierInput.dispatchEvent(new Event('input'))
    rateInput.value = '0.00'
    rateInput.dispatchEvent(new Event('input'))

    formEl.dispatchEvent(new Event('submit'))
    await flushPromises()

    // La validación Zod bloqueó el envío
    expect(openShiftSpy).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('El nombre del cajero es obligatorio')
    expect(document.body.textContent).toContain('La tasa USD debe ser un número mayor a 0.00')

    // 2. Envío válido
    cashierInput.value = 'Yadira Reyes'
    cashierInput.dispatchEvent(new Event('input'))
    rateInput.value = '360.00'
    rateInput.dispatchEvent(new Event('input'))
    cupInput.value = '5000.00'
    cupInput.dispatchEvent(new Event('input'))

    formEl.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(openShiftSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cashierName: 'Yadira Reyes',
        dailyRateUSD: '360.00',
      })
    )

    wrapper.unmount()
  })

  it('(3) estimacion USD con ceil: 1620.00 CUP a tasa efectiva 350.00 estima 4.63 y redondea a 5.00 USD', async () => {
    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [],
        totalCUP: '1620.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Cambiar a la pestaña USD Efectivo en document.body
    const usdTab = document.querySelector('[data-testid="tab-usd-cash"]') as HTMLButtonElement
    expect(usdTab).not.toBeNull()
    usdTab.click()
    await flushPromises()

    // Total estimado con ceil debe ser 5.00 USD (1620 / 350 = 4.628... -> 4.63 -> 5.00)
    const totalUsdEl = document.querySelector('[data-testid="total-charge-usd"]')
    expect(totalUsdEl?.textContent?.trim()).toBe('5.00')

    const rawEstimateEl = document.querySelector('[data-testid="raw-usd-estimate"]')
    expect(rawEstimateEl?.textContent).toContain('4.63 USD')
    expect(rawEstimateEl?.textContent).toContain('5.00 USD ceil')

    wrapper.unmount()
  })

  it('(4) vuelto en CUP: calcula el cambio exacto en CUP para cobros en CUP y USD', async () => {
    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [],
        totalCUP: '1620.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // 1. En CUP Efectivo: total 1620.00, recibido 2000.00 -> vuelto 380.00 CUP
    const cupInput = document.querySelector(
      '[data-testid="cash-received-cup-input"] input'
    ) as HTMLInputElement
    cupInput.value = '2000.00'
    cupInput.dispatchEvent(new Event('input'))
    await flushPromises()

    const changeCupEl = document.querySelector('[data-testid="change-given-cup"]')
    expect(changeCupEl?.textContent?.trim()).toBe('380.00')

    // 2. En USD Efectivo: total 1620.00 CUP (5.00 USD a tasa 350.00), recibido 10.00 USD
    // Vuelto en CUP = (10 * 350) - 1620 = 3500 - 1620 = 1880.00 CUP
    const usdTab = document.querySelector('[data-testid="tab-usd-cash"]') as HTMLButtonElement
    usdTab.click()
    await flushPromises()

    const usdInput = document.querySelector(
      '[data-testid="cash-received-usd-input"] input'
    ) as HTMLInputElement
    usdInput.value = '10.00'
    usdInput.dispatchEvent(new Event('input'))
    await flushPromises()

    const changeUsdGivenCupEl = document.querySelector('[data-testid="change-given-cup"]')
    expect(changeUsdGivenCupEl?.textContent?.trim()).toBe('1880.00')

    wrapper.unmount()
  })

  it('(5) efectivo insuficiente bloquea: botón Confirmar deshabilitado si cashReceived < totalToCharge', async () => {
    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [],
        totalCUP: '1620.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Entregar 1000.00 CUP cuando el total es 1620.00 CUP
    const cupInput = document.querySelector(
      '[data-testid="cash-received-cup-input"] input'
    ) as HTMLInputElement
    cupInput.value = '1000.00'
    cupInput.dispatchEvent(new Event('input'))
    await flushPromises()

    // Botón Confirmar deshabilitado (Decisión M)
    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-checkout"]'
    ) as HTMLButtonElement
    expect(confirmBtn.disabled).toBe(true)

    // Muestra faltante de 620.00 CUP
    const missingEl = document.querySelector('[data-testid="missing-cup"]')
    expect(missingEl?.textContent?.trim()).toBe('620.00')

    wrapper.unmount()
  })

  it('(6) Enter respeta el bloqueo: pulsar Enter con efectivo insuficiente no envía la venta', async () => {
    const createSaleSpy = vi.spyOn(salesService, 'createSale')

    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [],
        totalCUP: '1620.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    const cupInput = document.querySelector(
      '[data-testid="cash-received-cup-input"] input'
    ) as HTMLInputElement
    cupInput.value = '500.00' // Insuficiente
    cupInput.dispatchEvent(new Event('input'))
    cupInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    expect(createSaleSpy).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('(7) transferencia exige referencia: bloquea si está vacía y habilita al ingresar código de comprobante', async () => {
    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [],
        totalCUP: '1620.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    const transferTab = document.querySelector(
      '[data-testid="tab-cup-transfer"]'
    ) as HTMLButtonElement
    transferTab.click()
    await flushPromises()

    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-checkout"]'
    ) as HTMLButtonElement
    // Referencia vacía -> Confirmar deshabilitado
    expect(confirmBtn.disabled).toBe(true)

    // Ingresar referencia bancaria válida
    const refInput = document.querySelector(
      '[data-testid="transfer-reference-input"] input'
    ) as HTMLInputElement
    refInput.value = 'FT261114092837'
    refInput.dispatchEvent(new Event('input'))
    await flushPromises()

    // Confirmar se habilita
    expect(confirmBtn.disabled).toBe(false)

    wrapper.unmount()
  })

  it('(8) doble clic no duplica: reutiliza la misma clientRequestId generada al abrir el drawer', async () => {
    const createSaleSpy = vi.spyOn(salesService, 'createSale')

    const item: CartItem = {
      product: {
        id: 101,
        code: '78910001',
        name: 'Café Serrano',
        category: 'Cafetería',
        priceCUP: '650.00',
        priceUSD: '1.81',
        stock: '20.00',
        unit: 'paquete',
      },
      quantity: '1.00',
      subtotalCUP: '650.00',
    }

    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [item],
        totalCUP: '650.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Billetes exactos
    const btnExact = document.querySelector('[data-testid="btn-exact-cup"]') as HTMLButtonElement
    btnExact.click()
    await flushPromises()

    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-checkout"]'
    ) as HTMLButtonElement

    // 1er clic
    confirmBtn.click()
    await flushPromises()

    expect(createSaleSpy).toHaveBeenCalledTimes(1)
    const firstCallRequestId = createSaleSpy.mock.calls[0][0].clientRequestId
    expect(firstCallRequestId).toBeDefined()
    expect(firstCallRequestId.length).toBeGreaterThan(10)

    // 2do clic (reintento con drawer aún abierto)
    confirmBtn.click()
    await flushPromises()

    // Si se reintenta, el clientRequestId enviado es EXACTAMENTE el mismo para idempotencia
    if (createSaleSpy.mock.calls.length > 1) {
      const secondCallRequestId = createSaleSpy.mock.calls[1][0].clientRequestId
      expect(secondCallRequestId).toBe(firstCallRequestId)
    }

    wrapper.unmount()
  })

  it('(9) éxito vacía carrito y devuelve foco al buscador', async () => {
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
      category: 'Café',
      priceCUP: '650.00',
      priceUSD: '1.81',
      stock: '10.00',
      unit: 'paquete',
    }
    cart.addToCart(product, '1.00')

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Abrir drawer de cobro
    const checkoutBtn = wrapper.find('button[title="Proceder al cobro de la venta (F8)"]')
    await checkoutBtn.trigger('click')
    await flushPromises()

    const drawer = wrapper.findComponent(PosCheckoutDrawer)
    expect(drawer.props('open')).toBe(true)

    // Pagar importe exacto y confirmar
    const exactBtn = document.querySelector('[data-testid="btn-exact-cup"]') as HTMLButtonElement
    expect(exactBtn).not.toBeNull()
    exactBtn.click()
    await flushPromises()

    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-checkout"]'
    ) as HTMLButtonElement
    confirmBtn.click()
    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Carrito debe haber sido vaciado por completo
    expect(cart.isEmpty.value).toBe(true)

    // Cerrar el modal resumen
    const closeSummaryBtn = document.querySelector(
      '[data-testid="btn-close-summary"]'
    ) as HTMLButtonElement
    if (closeSummaryBtn) {
      closeSummaryBtn.click()
      await flushPromises()
    }

    // Foco debe volver al buscador
    const searchInput = wrapper.find('input')
    expect(document.activeElement).toBe(searchInput.element)

    wrapper.unmount()
  })

  it('(10) error de stock se muestra en alerta y no cierra el drawer', async () => {
    vi.spyOn(salesService, 'createSale').mockRejectedValueOnce(
      new ApiError(
        {
          code: 'STOCK_INSUFFICIENT',
          message: 'Existencias insuficientes para uno o más artículos solicitados.',
          details: {
            '78910001': ['Stock disponible: 1.00 pqte, solicitado: 2.00 pqte'],
          },
        },
        409
      )
    )

    const item: CartItem = {
      product: {
        id: 101,
        code: '78910001',
        name: 'Café Serrano',
        category: 'Cafetería',
        priceCUP: '650.00',
        priceUSD: '1.81',
        stock: '1.00',
        unit: 'paquete',
      },
      quantity: '2.00',
      subtotalCUP: '1300.00',
    }

    const wrapper = mount(PosCheckoutDrawer, {
      props: {
        open: true,
        items: [item],
        totalCUP: '1300.00',
        shiftId: 'TURNO-2026-001',
        dailyRateUSD: '360.00',
        exchangeMargin: '10.00',
        effectiveRateUSD: '350.00',
      },
      global: {
        plugins: [pinia],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Seleccionar exacto y confirmar
    const btnExact = document.querySelector('[data-testid="btn-exact-cup"]') as HTMLButtonElement
    btnExact.click()
    await flushPromises()

    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-checkout"]'
    ) as HTMLButtonElement
    confirmBtn.click()
    await flushPromises()

    // El drawer sigue abierto (:open === true)
    expect(wrapper.props('open')).toBe(true)

    // La alerta de error del servidor está visible en document.body
    const alert = document.querySelector('[data-testid="pos-checkout-error-alert"]')
    expect(alert).not.toBeNull()
    expect(alert?.textContent).toContain('Existencias insuficientes')
    expect(alert?.textContent).toContain('78910001')

    wrapper.unmount()
  })
})
