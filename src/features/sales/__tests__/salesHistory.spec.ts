import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import SalesHistoryView from '../views/SalesHistoryView.vue'
import SaleDetailDrawer from '../components/SaleDetailDrawer.vue'
import { routes, setupNavigationGuard } from '@/app/router'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { salesService } from '@/services'
import { ApiError } from '@/shared/types/api'
import type { Sale, SaleListItem } from '../types'

describe('Historial de Ventas (/sales/history)', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  const mockSaleList: SaleListItem[] = [
    {
      id: 'TICK-908126',
      shiftId: 'TURNO-2026-001',
      createdAt: '2026-11-14T19:45:00Z',
      cashierName: 'Yadira Reyes',
      itemsCount: 2,
      totalCUP: '1620.00',
      totalUSD: '5.00',
      paidCurrency: 'USD',
      paymentMethod: 'CASH',
      status: 'COMPLETED',
    },
    {
      id: 'TICK-908127',
      shiftId: 'TURNO-2026-001',
      createdAt: '2026-11-14T20:10:00Z',
      cashierName: 'Yadira Reyes',
      itemsCount: 1,
      totalCUP: '650.00',
      totalUSD: '2.00',
      paidCurrency: 'CUP',
      paymentMethod: 'CASH',
      status: 'COMPLETED',
    },
  ]

  const mockSaleDetail: Sale = {
    id: 'TICK-908126',
    clientRequestId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    shiftId: 'TURNO-2026-001',
    warehouseId: 'ALM-TIENDA-01',
    items: [
      {
        productCode: '78910001',
        name: 'Café Serrano Clásico 250g',
        quantity: '2.00',
        unitPriceCUP: '650.00',
        subtotalCUP: '1300.00',
      },
      {
        productCode: '78910004',
        name: 'Cerveza Cristal Lata 355ml',
        quantity: '1.00',
        unitPriceCUP: '320.00',
        subtotalCUP: '320.00',
      },
    ],
    totalCUP: '1620.00',
    totalUSD: '5.00',
    paidCurrency: 'USD',
    exchangeRateApplied: '350.00',
    totalInCurrency: '5.00',
    cashReceived: '10.00',
    changeGivenCUP: '1880.00',
    paymentMethod: 'CASH',
    transferGateway: null,
    transferReference: null,
    cashierName: 'Yadira Reyes',
    status: 'COMPLETED',
    createdAt: '2026-11-14T19:45:00Z',
  }

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    document.body.innerHTML = ''

    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'supervisor',
        fullName: 'Supervisor Comercial',
        permissions: ['sales.view', 'sales.create', 'sales.cancel', 'cash.manage'],
      })
    )

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/sales/history')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('(1) filtros en URL: los parámetros de búsqueda se reflejan en URL y se envían al servicio', async () => {
    const getSalesSpy = vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: mockSaleList,
      total: 2,
      page: 1,
      perPage: 10,
    })

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()
    expect(getSalesSpy).toHaveBeenCalled()

    // Cambiar filtros en URL
    await router.push({
      path: '/sales/history',
      query: {
        search: 'TICK-908',
        currency: 'USD',
        shiftId: 'TURNO-2026-001',
        desde: '2026-11-01',
        hasta: '2026-11-30',
      },
    })
    await flushPromises()

    expect(getSalesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'TICK-908',
        currency: 'USD',
        shiftId: 'TURNO-2026-001',
        desde: '2026-11-01',
        hasta: '2026-11-30',
      })
    )

    wrapper.unmount()
  })

  it('(2) página 2: cambiar de página navega y envía page 2 al servicio', async () => {
    const getSalesSpy = vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: mockSaleList,
      total: 25,
      page: 1,
      perPage: 10,
    })

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Navegar a página 2 vía URL
    await router.push({
      path: '/sales/history',
      query: { page: '2' },
    })
    await flushPromises()

    expect(getSalesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
      })
    )

    wrapper.unmount()
  })

  it('(3) orden: actualizar orden solicita el ordenamiento correcto al servicio', async () => {
    const getSalesSpy = vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: mockSaleList,
      total: 2,
      page: 1,
      perPage: 10,
    })

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Actualizar parámetro de orden en la URL
    await router.push({
      path: '/sales/history',
      query: { sort: 'createdAt:asc' },
    })
    await flushPromises()

    expect(getSalesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sort: 'createdAt:asc',
      })
    )

    wrapper.unmount()
  })

  it('(4) estado vacío: muestra EmptyState si no hay registros', async () => {
    vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 10,
    })

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    expect(wrapper.text()).toContain('No se encontraron ventas')
    expect(wrapper.text()).toContain(
      'No existen tickets de venta registrados que coincidan con los filtros seleccionados.'
    )

    wrapper.unmount()
  })

  it('(5) error con reintento: renderiza mensaje de fallo y el botón reintentar recarga los datos', async () => {
    const getSalesSpy = vi
      .spyOn(salesService, 'getSales')
      .mockRejectedValueOnce(
        new ApiError({ code: 'DB_ERROR', message: 'Fallo temporal en la base de datos' }, 500)
      )
      .mockResolvedValueOnce({
        items: mockSaleList,
        total: 2,
        page: 1,
        perPage: 10,
      })

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Renderiza el mensaje de error
    expect(wrapper.text()).toContain('Fallo temporal en la base de datos')

    // Pulsar botón de reintento
    const retryBtn = wrapper.findAll('button').find((b) => b.text().includes('Reintentar'))
    expect(retryBtn).toBeDefined()
    await retryBtn!.trigger('click')
    await flushPromises()

    // Tras el reintento se cargaron los items y desapareció el error
    expect(getSalesSpy).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('TICK-908126')

    wrapper.unmount()
  })

  it('(6) Anular oculto sin sales.cancel: usuario sin permiso no visualiza el botón de anulación', async () => {
    // Configurar usuario con solo sales.view (sin sales.cancel)
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'auditor',
        fullName: 'Auditor Sin Permiso Cancelar',
        permissions: ['sales.view'],
      })
    )

    vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: mockSaleList,
      total: 2,
      page: 1,
      perPage: 10,
    })
    vi.spyOn(salesService, 'getSaleById').mockResolvedValue(mockSaleDetail)

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Abrir detalle del primer ticket
    const viewBtn = wrapper.find('[data-testid="btn-view-sale"]')
    await viewBtn.trigger('click')
    await flushPromises()

    // El drawer de detalle está abierto
    const drawer = wrapper.findComponent(SaleDetailDrawer)
    expect(drawer.props('open')).toBe(true)

    // El botón Anular Ticket NO debe existir en el DOM
    const cancelBtn = document.querySelector('[data-testid="btn-start-cancel"]')
    expect(cancelBtn).toBeNull()

    wrapper.unmount()
  })

  it('(7) motivo corto bloquea: confirmación rechaza justificación menor a 10 caracteres', async () => {
    vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: mockSaleList,
      total: 2,
      page: 1,
      perPage: 10,
    })
    vi.spyOn(salesService, 'getSaleById').mockResolvedValue(mockSaleDetail)
    const cancelSpy = vi.spyOn(salesService, 'cancelSale')

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Abrir drawer
    const viewBtn = wrapper.find('[data-testid="btn-view-sale"]')
    await viewBtn.trigger('click')
    await flushPromises()

    // Iniciar anulación
    const startCancelBtn = document.querySelector(
      '[data-testid="btn-start-cancel"]'
    ) as HTMLButtonElement
    expect(startCancelBtn).not.toBeNull()
    startCancelBtn.click()
    await flushPromises()

    // Ingresar motivo de 5 caracteres
    const reasonInput = document.querySelector(
      '[data-testid="input-cancel-reason"] input'
    ) as HTMLInputElement
    expect(reasonInput).not.toBeNull()
    reasonInput.value = 'error'
    reasonInput.dispatchEvent(new Event('input'))

    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-cancel"]'
    ) as HTMLButtonElement
    confirmBtn.click()
    await flushPromises()

    // La llamada fue prevenida y se muestra la validación
    expect(cancelSpy).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(
      'El motivo de anulación debe tener al menos 10 caracteres'
    )

    wrapper.unmount()
  })

  it('(8) anular cambia el estado: anulación válida actualiza el comprobante a CANCELLED y muestra aviso de existencias', async () => {
    vi.spyOn(salesService, 'getSales').mockResolvedValue({
      items: mockSaleList,
      total: 2,
      page: 1,
      perPage: 10,
    })
    vi.spyOn(salesService, 'getSaleById').mockResolvedValue(mockSaleDetail)
    const cancelSpy = vi.spyOn(salesService, 'cancelSale').mockResolvedValue({
      id: 'TICK-908126',
      status: 'CANCELLED',
      cancelledAt: '2026-11-14T20:00:00Z',
      cancellationReason: 'Devolución de cliente por empaque defectuoso comprobado',
      stockReverted: true,
    })

    const wrapper = mount(SalesHistoryView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // Abrir drawer
    const viewBtn = wrapper.find('[data-testid="btn-view-sale"]')
    await viewBtn.trigger('click')
    await flushPromises()

    // Iniciar anulación
    const startCancelBtn = document.querySelector(
      '[data-testid="btn-start-cancel"]'
    ) as HTMLButtonElement
    startCancelBtn.click()
    await flushPromises()

    // Ingresar motivo válido (>= 10 caracteres)
    const reasonInput = document.querySelector(
      '[data-testid="input-cancel-reason"] input'
    ) as HTMLInputElement
    reasonInput.value = 'Devolución de cliente por empaque defectuoso comprobado'
    reasonInput.dispatchEvent(new Event('input'))

    const confirmBtn = document.querySelector(
      '[data-testid="btn-confirm-cancel"]'
    ) as HTMLButtonElement
    confirmBtn.click()
    await flushPromises()

    expect(cancelSpy).toHaveBeenCalledWith(
      'TICK-908126',
      expect.objectContaining({
        reason: 'Devolución de cliente por empaque defectuoso comprobado',
      })
    )

    // El drawer muestra el estado CANCELLED / Anulada
    expect(document.body.textContent).toContain('Comprobante Anulado')
    expect(document.body.textContent).toContain('Devolución de cliente por empaque defectuoso')
    expect(document.body.textContent).toContain('Existencias de mercancía repuestas al inventario')

    wrapper.unmount()
  })

  it('(9) sin sales.view da 403: navegación bloqueada redirige a /forbidden y servicio rechaza', async () => {
    localStorage.setItem('qvaflow_token', 'mock_token')
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'invitado',
        fullName: 'Usuario Sin Permisos',
        permissions: ['products.view'],
      })
    )
    const authStore = useAuthStore()
    authStore.user = {
      username: 'invitado',
      fullName: 'Usuario Sin Permisos',
      permissions: ['products.view'],
    } as any
    authStore.token = 'mock_token'

    const freshRouter = createRouter({
      history: createMemoryHistory(),
      routes,
    })
    freshRouter.beforeEach(setupNavigationGuard)

    await freshRouter.push('/sales/history')
    await freshRouter.isReady()

    // El Navigation Guard redirigió a /forbidden
    expect(freshRouter.currentRoute.value.path).toBe('/forbidden')

    // El servicio lanza 403 sin sales.view
    await expect(salesService.getSales()).rejects.toThrow()
  })
})
