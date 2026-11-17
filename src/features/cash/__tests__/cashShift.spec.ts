import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import CashShiftView from '../views/CashShiftView.vue'
import { usePosShift } from '@/features/sales/composables/usePosShift'
import { routes, setupNavigationGuard } from '@/app/router'
import { cashService } from '@/services'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { CashShift, ShiftCloseResult } from '@/features/sales/types'

describe('Módulo Caja - Turno y Arqueo (/cash/shift)', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    document.body.innerHTML = ''

    // Usuario con permiso cash.open_close
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'cajero',
        fullName: 'Yadira Reyes',
        permissions: ['cash.open_close', 'sales.create', 'sales.view'],
      })
    )

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/cash/shift')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('sin turno: muestra estado vacío con almacén, fondo inicial por divisa y botón Abrir turno', async () => {
    vi.spyOn(cashService, 'getCurrentShift').mockResolvedValue(null)
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = null

    const wrapper = mount(CashShiftView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()

    // Comprobar estado vacío
    const emptyState = wrapper.find('[data-testid="empty-shift-state"]')
    expect(emptyState.exists()).toBe(true)

    // Almacén y fondos iniciales
    expect(wrapper.find('[data-testid="default-warehouse"]').text()).toContain('ALM-TIENDA-01')
    expect(wrapper.find('[data-testid="default-initial-cup"]').text()).toContain('10,000.00 CUP')
    expect(wrapper.find('[data-testid="default-initial-usd"]').text()).toContain('100.00 USD')

    // Botón abrir turno presente
    const btnOpen = wrapper.find('[data-testid="btn-open-shift"]')
    expect(btnOpen.exists()).toBe(true)
    expect(btnOpen.text()).toContain('Abrir Turno')
  })

  it('con turno: tarjeta con código legible del turno, cajero, hora, almacén, fondos y botón Cerrar turno', async () => {
    const mockShift: CashShift = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: '2026-11-14T08:00:00Z',
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: {
        CUP: '10000.00',
        USD: '100.00',
      },
      salesTotals: {
        cupCash: '25980.00',
        cupTransfer: '2520.00',
        USD: '40.00',
      },
      exchangeAdjustments: {
        CUP: '-7200.00',
        USD: '20.00',
      },
    }

    vi.spyOn(cashService, 'getCurrentShift').mockResolvedValue(mockShift)
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = mockShift

    const wrapper = mount(CashShiftView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()

    // Comprobar que se muestra la tarjeta de turno activo
    expect(wrapper.find('[data-testid="active-shift-card"]').exists()).toBe(true)

    // Código legible del turno
    expect(wrapper.find('[data-testid="active-shift-code"]').text()).toBe('TURNO-2026-001')

    // Cajero, almacén y hora
    expect(wrapper.find('[data-testid="active-shift-cashier"]').text()).toBe('Yadira Reyes')
    expect(wrapper.find('[data-testid="active-shift-warehouse"]').text()).toContain('ALM-TIENDA-01')
    expect(wrapper.find('[data-testid="active-shift-opened-at"]').text()).toContain('14/11/2026')

    // Fondo inicial
    expect(wrapper.find('[data-testid="initial-funds-cup"]').text()).toBe('10,000.00 CUP')
    expect(wrapper.find('[data-testid="initial-funds-usd"]').text()).toBe('100.00 USD')

    // Ventas cobradas
    expect(wrapper.find('[data-testid="sales-cup-cash"]').text()).toContain('25,980.00 CUP')
    expect(wrapper.find('[data-testid="sales-cup-transfer"]').text()).toContain('2,520.00 CUP')
    expect(wrapper.find('[data-testid="sales-usd"]').text()).toContain('40.00 USD')

    // Efectivo esperado en gaveta:
    // CUP: 10000.00 + 25980.00 - 7200.00 = 28780.00 CUP
    // USD: 100.00 + 40.00 + 20.00 = 160.00 USD
    expect(wrapper.find('[data-testid="expected-cash-cup"]').text()).toBe('28,780.00 CUP')
    expect(wrapper.find('[data-testid="expected-cash-usd"]').text()).toBe('160.00 USD')

    // Botón de cerrar turno presente
    const btnClose = wrapper.find('[data-testid="btn-close-shift"]')
    expect(btnClose.exists()).toBe(true)
    expect(btnClose.text()).toContain('Cerrar Turno')
  })

  it('cierre con diferencia: muestra resultado de arqueo con esperado, contado y diferencia con texto e icono', async () => {
    vi.spyOn(cashService, 'getCurrentShift').mockResolvedValue(null)
    const shiftComposable = usePosShift()
    shiftComposable.currentShift.value = null

    const closeResultWithDiff: ShiftCloseResult = {
      id: 'TURNO-2026-001',
      cashierName: 'Yadira Reyes',
      openedAt: '2026-11-14T08:00:00Z',
      closedAt: '2026-11-14T19:30:00Z',
      status: 'CLOSED',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '10000.00', USD: '100.00' },
      salesTotals: { cupCash: '25980.00', cupTransfer: '0.00', USD: '40.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
      expectedFunds: { CUP: '35980.00', USD: '140.00' },
      countedFunds: { CUP: '35880.00', USD: '150.00' },
      differences: { CUP: '-100.00', USD: '10.00' },
      discrepancyReason: 'Faltante de 100 CUP por cambio y sobrante de 10 USD',
      notes: 'Faltante de 100 CUP por cambio y sobrante de 10 USD',
    }

    const wrapper = mount(CashShiftView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()

    // Invocar el callback de éxito de cierre
    wrapper.vm.handleCloseShiftSuccess(closeResultWithDiff)
    await flushPromises()

    // Debe mostrar la sección de resultado de arqueo
    expect(wrapper.find('[data-testid="close-arqueo-result"]').exists()).toBe(true)

    // Verificación CUP (Faltante -100.00)
    expect(wrapper.find('[data-testid="arqueo-expected-cup"]').text()).toBe('35,980.00 CUP')
    expect(wrapper.find('[data-testid="arqueo-counted-cup"]').text()).toBe('35,880.00 CUP')
    const diffCupEl = wrapper.find('[data-testid="arqueo-diff-cup-indicator"]')
    expect(diffCupEl.text()).toContain('Faltante: -100.00 CUP')
    expect(diffCupEl.classes()).toContain('text-state-error')

    // Verificación USD (Sobrante +10.00)
    expect(wrapper.find('[data-testid="arqueo-expected-usd"]').text()).toBe('140.00 USD')
    expect(wrapper.find('[data-testid="arqueo-counted-usd"]').text()).toBe('150.00 USD')
    const diffUsdEl = wrapper.find('[data-testid="arqueo-diff-usd-indicator"]')
    expect(diffUsdEl.text()).toContain('Sobrante: +10.00 USD')
    expect(diffUsdEl.classes()).toContain('text-state-warning')

    // Justificación registrada
    expect(wrapper.find('[data-testid="arqueo-reason-box"]').text()).toContain(
      'Faltante de 100 CUP por cambio y sobrante de 10 USD'
    )
  })

  it('vendedor sin cash.open_close no accede (redirección a /forbidden según el router)', async () => {
    const authStore = useAuthStore()
    // Configurar vendedor sin permiso cash.open_close
    authStore.user = {
      id: 'usr_vendedor_junior',
      username: 'vendedor_junior',
      fullName: 'Carlos Valdés (Vendedor sin Caja)',
      role: 'Vendedor',
      permissions: ['sales.create', 'sales.view'],
      lastLoginAt: '2026-11-14T08:00:00Z',
    }
    authStore.token = 'mock-jwt-token'
    authStore.isInitialized = true

    const to = {
      name: 'cash-shift',
      fullPath: '/cash/shift',
      meta: { permission: 'cash.open_close' },
    } as any

    const from = {} as any

    const guardResult = await setupNavigationGuard(to, from)

    expect(guardResult).toEqual({
      name: 'forbidden',
      query: { permission: 'cash.open_close' },
    })
  })
})
