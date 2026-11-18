import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import CashShiftView from '../views/CashShiftView.vue'
import { routes, setupNavigationGuard } from '@/app/router'
import { cashService } from '@/services'
import type { MockCashService } from '@/services/mock/mockCashService'
import { MockSalesService } from '@/services/mock/mockSalesService'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { APP_MENU, filterMenuByPermissions } from '@/app/navigation/menu'
import type { CashShift, ShiftCloseResult } from '@/features/sales/types'

describe('Módulo Caja - Turno y Arqueo (/cash/shift)', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    document.body.innerHTML = ''

    // Usuario con permisos de administración de caja
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'admin',
        fullName: 'Administrador General',
        permissions: ['cash.open_close', 'cash.view_history', 'sales.create', 'sales.view'],
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

  it('sin turnos abiertos: muestra estado vacío "No hay turnos abiertos" sin botón de abrir turno', async () => {
    vi.spyOn(cashService, 'getShifts').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 100,
    })

    const wrapper = mount(CashShiftView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()

    // Comprobar estado vacío
    const emptyState = wrapper.find('[data-testid="empty-shift-state"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('No hay turnos abiertos')

    // No debe existir botón de abrir turno (abrir es del POS)
    expect(wrapper.find('[data-testid="btn-open-shift"]').exists()).toBe(false)
  })

  it('con turnos abiertos: tarjeta con código, "Abierto por <cajero>", hora, almacén, fondos, ventas, esperado y botón Cerrar turno', async () => {
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

    vi.spyOn(cashService, 'getShifts').mockResolvedValue({
      items: [mockShift],
      total: 1,
      page: 1,
      perPage: 100,
    })

    const wrapper = mount(CashShiftView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()

    // Comprobar tarjeta de turno abierto
    expect(wrapper.find('[data-testid="active-shift-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="active-shift-code"]').text()).toBe('TURNO-2026-001')

    // Abierto por cajero, almacén y hora
    expect(wrapper.find('[data-testid="active-shift-cashier"]').text()).toContain(
      'Abierto por Yadira Reyes'
    )
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

    // Botón de cerrar turno presente en la tarjeta
    const btnClose = wrapper.find('[data-testid="btn-close-shift"]')
    expect(btnClose.exists()).toBe(true)
    expect(btnClose.text()).toContain('Cerrar Turno')
  })

  it('cierre con diferencia: muestra resultado de arqueo con esperado, contado y diferencia con texto e icono', async () => {
    vi.spyOn(cashService, 'getShifts').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 100,
    })

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

  // NUEVAS PRUEBAS REQUERIDAS

  it('vendedor no ve Caja en el menu', () => {
    const vendedorPermissions = ['sales.create', 'sales.view', 'products.view']
    const canVendedor = (p: string) => vendedorPermissions.includes(p)
    const filtered = filterMenuByPermissions(APP_MENU, canVendedor)

    const menuIds = filtered.map((item) => item.id)
    expect(menuIds).not.toContain('cash')
    expect(menuIds).toContain('sales')
    expect(menuIds).toContain('home')
  })

  it('vendedor abre turno en el POS', async () => {
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'vendedor',
        fullName: 'Carlos Valdés',
        permissions: ['sales.create', 'sales.view'],
      })
    )

    ;(cashService as MockCashService).reset()
    // Cerrar el turno semilla para que openShift proceda
    const current = await cashService.getCurrentShift()
    if (current) {
      // Como admin cerramos el turno actual en el mock
      localStorage.setItem(
        'qvaflow_user',
        JSON.stringify({
          username: 'admin',
          permissions: ['cash.open_close'],
        })
      )
      await cashService.closeShift(current.id, {
        countedCUP: '10000.00',
        countedUSD: '100.00',
      })
      // Restauramos usuario vendedor
      localStorage.setItem(
        'qvaflow_user',
        JSON.stringify({
          username: 'vendedor',
          fullName: 'Carlos Valdés',
          permissions: ['sales.create', 'sales.view'],
        })
      )
    }

    const newShift = await cashService.openShift({
      cashierName: 'Carlos Valdés',
      initialCUP: '5000.00',
      initialUSD: '50.00',
      dailyRateUSD: '360.00',
    })

    expect(newShift).toBeDefined()
    expect(newShift.status).toBe('OPEN')
    expect(newShift.cashierName).toBe('Carlos Valdés')
    expect(newShift.initialFunds.CUP).toBe('5000.00')
  })

  it('superadmin ve y cierra un turno abierto por otro cajero', async () => {
    const shiftFromOther: CashShift = {
      id: 'TURNO-2026-099',
      cashierName: 'Carlos Valdés',
      openedAt: '2026-11-14T08:00:00Z',
      status: 'OPEN',
      dailyRateUSD: '360.00',
      initialFunds: { CUP: '8000.00', USD: '50.00' },
      salesTotals: { cupCash: '0.00', cupTransfer: '0.00', USD: '0.00' },
      exchangeAdjustments: { CUP: '0.00', USD: '0.00' },
    }

    vi.spyOn(cashService, 'getShifts').mockResolvedValue({
      items: [shiftFromOther],
      total: 1,
      page: 1,
      perPage: 100,
    })

    const closeShiftSpy = vi.spyOn(cashService, 'closeShift').mockResolvedValue({
      ...shiftFromOther,
      status: 'CLOSED',
      closedAt: '2026-11-14T18:00:00Z',
      expectedFunds: { CUP: '8000.00', USD: '50.00' },
      countedFunds: { CUP: '8000.00', USD: '50.00' },
      differences: { CUP: '0.00', USD: '0.00' },
      discrepancyReason: '',
      notes: '',
    })

    const wrapper = mount(CashShiftView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Comprobar que ve la tarjeta con el cajero asignado
    expect(wrapper.find('[data-testid="active-shift-cashier"]').text()).toContain(
      'Abierto por Carlos Valdés'
    )

    // Pulsar botón de cerrar turno
    const btnClose = wrapper.find('[data-testid="btn-close-shift"]')
    expect(btnClose.exists()).toBe(true)
    await btnClose.trigger('click')
    await flushPromises()

    // El modal de cierre se abrió con el turno del otro cajero
    const formEl = document.querySelector('#close-shift-form') as HTMLFormElement
    expect(formEl).not.toBeNull()

    // Confirmar cierre en modal
    formEl.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(closeShiftSpy).toHaveBeenCalledWith(
      'TURNO-2026-099',
      expect.objectContaining({
        countedCUP: '8000.00',
        countedUSD: '50.00',
      })
    )

    wrapper.unmount()
  })

  it('vendedor solo ve sus ventas en el historial', async () => {
    const mockService = new MockSalesService()

    // Inyectar ventas de diferentes cajeros directamente
    ;(mockService as any).sales = [
      {
        id: 'TICK-101',
        clientRequestId: 'req-1',
        shiftId: 'TURNO-1',
        warehouseId: 'ALM-1',
        items: [],
        totalCUP: '500.00',
        totalUSD: '1.38',
        paidCurrency: 'CUP',
        exchangeRateApplied: '1.00',
        totalInCurrency: '500.00',
        cashReceived: '500.00',
        changeGivenCUP: '0.00',
        paymentMethod: 'CASH',
        cashierName: 'Carlos Valdés',
        status: 'COMPLETED',
        createdAt: '2026-11-14T10:00:00Z',
      },
      {
        id: 'TICK-102',
        clientRequestId: 'req-2',
        shiftId: 'TURNO-2',
        warehouseId: 'ALM-1',
        items: [],
        totalCUP: '1200.00',
        totalUSD: '3.33',
        paidCurrency: 'CUP',
        exchangeRateApplied: '1.00',
        totalInCurrency: '1200.00',
        cashReceived: '1200.00',
        changeGivenCUP: '0.00',
        paymentMethod: 'CASH',
        cashierName: 'Yadira Reyes',
        status: 'COMPLETED',
        createdAt: '2026-11-14T11:00:00Z',
      },
    ]

    // 1. Como vendedor (sin sales.view_all, nombre Carlos Valdés)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'vendedor',
        fullName: 'Carlos Valdés',
        permissions: ['sales.view', 'sales.create'],
      })
    )

    const vendorSales = await mockService.getSales()
    expect(vendorSales.items.length).toBe(1)
    expect(vendorSales.items[0].cashierName).toBe('Carlos Valdés')

    // 2. Como superadmin (con sales.view_all)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'superadmin',
        fullName: 'Administrador General',
        permissions: ['sales.view', 'sales.view_all'],
      })
    )

    const adminSales = await mockService.getSales()
    expect(adminSales.items.length).toBe(2)
  })
})
