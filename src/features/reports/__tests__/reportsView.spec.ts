import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import {
  createRouter,
  createMemoryHistory,
  type Router,
  type RouteLocationNormalized,
} from 'vue-router'

import { useAuthStore } from '@/features/auth/stores/authStore'
import ReportsDashboardView, {
  formatAxisDate,
  getDrawablePoints,
} from '../views/ReportsDashboardView.vue'
import {
  useReports,
  calculatePresetRange,
  computeGranularity,
  calculateDaysBetween,
  formatLocalDate,
} from '../composables/useReports'
import { reportsService } from '@/services'
import type { FinanceSummary } from '../types'
import { setupNavigationGuard } from '@/app/router'

// Mock de ECharts y ResizeObserver
vi.mock('@/shared/ui/BaseChart/echartsCore', () => ({
  init: vi.fn(() => ({
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  })),
}))

globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
} as any

describe('Pantalla de Reportes (/reports)', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: Router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/forbidden', name: 'forbidden', component: { template: '<div>Forbidden</div>' } },
        {
          path: '/reports',
          name: 'reports-dashboard',
          component: ReportsDashboardView,
          meta: { permission: 'reports.view' },
        },
      ],
    })

    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const waitDelay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms))

  it('(1) monta para superadmin y muestra 5 KPIs', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Reportes Financieros')

    // Verifica la presencia y etiquetas sin paréntesis de los 5 StatCards para superadmin
    expect(wrapper.find('[data-test="kpi-sales"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="kpi-purchases"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="kpi-gross-profit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="kpi-margin"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="kpi-cash-balance"]').exists()).toBe(true)

    const cardLabels = [
      (wrapper.findComponent('[data-test="kpi-sales"]') as any).props('label'),
      (wrapper.findComponent('[data-test="kpi-purchases"]') as any).props('label'),
      (wrapper.findComponent('[data-test="kpi-gross-profit"]') as any).props('label'),
      (wrapper.findComponent('[data-test="kpi-margin"]') as any).props('label'),
      (wrapper.findComponent('[data-test="kpi-cash-balance"]') as any).props('label'),
    ]
    expect(cardLabels).toEqual(['Ventas', 'Compras', 'Ganancia bruta', 'Margen', 'Balance de caja'])
    cardLabels.forEach((label) => {
      expect(label).not.toMatch(/[()]/)
    })
  })

  it('(2) para un usuario con reports.view pero SIN products.view_cost no hay tarjetas ni series sensibles ni opción Compras en el filtro', async () => {
    const authStore = useAuthStore()
    const user = {
      id: 'usr_analyst_01',
      username: 'analyst',
      fullName: 'Analista de Ventas',
      role: 'Analista',
      permissions: ['reports.view', 'products.view'],
      lastLoginAt: '2026-10-30T10:00:00Z',
    }
    localStorage.setItem('qvaflow_user', JSON.stringify(user))
    localStorage.setItem('qvaflow_token', 'custom-token')
    authStore.user = user
    authStore.token = 'custom-token'

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Solo tarjeta de ventas visible
    expect(wrapper.find('[data-test="kpi-sales"]').exists()).toBe(true)

    // Tarjetas sensibles ausentes
    expect(wrapper.find('[data-test="kpi-purchases"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="kpi-gross-profit"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="kpi-margin"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="kpi-cash-balance"]').exists()).toBe(false)

    // Gráfico de ganancia por período ausente
    expect(wrapper.find('[data-test="profit-chart-container"]').exists()).toBe(false)

    // Selector de tipo no debe incluir 'Compras'
    const typeSelect = wrapper.find('#reports-type')
    expect(typeSelect.exists()).toBe(true)
    expect(typeSelect.html()).not.toContain('Compras')
  })

  it('(3) sin reports.view da 403', async () => {
    const authStore = useAuthStore()
    // El usuario vendedor no tiene reports.view
    await authStore.login({ username: 'vendedor', password: 'password123' })

    const to = {
      name: 'reports-dashboard',
      fullPath: '/reports',
      meta: { permission: 'reports.view' },
    } as unknown as RouteLocationNormalized

    const from = {} as RouteLocationNormalized

    const guardResult = await setupNavigationGuard(to, from)
    expect(guardResult).toEqual({
      name: 'forbidden',
      query: { permission: 'reports.view' },
    })
  })

  it('(4) cambiar el preset cambia los totales mostrados', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const initialSalesText = wrapper.find('[data-test="kpi-sales"]').text()

    // Cambiar a preset 'today'
    const presetSelect = wrapper.findComponent({ name: 'BaseSelect' })
    presetSelect.vm.$emit('update:modelValue', 'today')

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const updatedSalesText = wrapper.find('[data-test="kpi-sales"]').text()
    expect(updatedSalesText).not.toEqual(initialSalesText)
  })

  it('(5) rango libre invertido muestra el error y no llama al servicio', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const getSummarySpy = vi.spyOn(reportsService, 'getFinanceSummary')

    const composable = useReports({ syncUrl: false })
    await composable.loadAll()
    getSummarySpy.mockClear()

    // Rango invertido
    composable.setRange('2026-05-20', '2026-05-10')

    expect(composable.validationError.value).toBe(
      'La fecha final no puede ser anterior a la fecha inicial'
    )
    expect(composable.isValidRange.value).toBe(false)
    expect(getSummarySpy).not.toHaveBeenCalled()
  })

  it('(6) el preset current_month calcula desde y hasta sin desfase (probar con fecha simulada a fin de mes y a las 23:30)', () => {
    // 31 de mayo de 2026 a las 23:30 (fin de mes con hora tardía)
    const endOfMonth = new Date(2026, 4, 31, 23, 30, 0)
    const rangeMay = calculatePresetRange('current_month', endOfMonth)

    expect(rangeMay).toEqual({
      desde: '2026-05-01',
      hasta: '2026-05-31',
    })

    // 31 de diciembre a las 23:59:59
    const endOfYear = new Date(2026, 11, 31, 23, 59, 59)
    const rangeDec = calculatePresetRange('current_month', endOfYear)

    expect(rangeDec).toEqual({
      desde: '2026-12-01',
      hasta: '2026-12-31',
    })

    // Verificación de formatLocalDate en hora temprana
    const earlyMorning = new Date(2026, 0, 1, 0, 15, 0)
    expect(formatLocalDate(earlyMorning)).toBe('2026-01-01')
  })

  it('(7) la respuesta obsoleta no pisa a la nueva', async () => {
    let resolveFirst: (val: any) => void
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve
    })

    let resolveSecond: (val: any) => void
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve
    })

    const customService: any = {
      getFinanceSummary: vi
        .fn()
        .mockImplementationOnce(() => firstPromise)
        .mockImplementationOnce(() => secondPromise),
      getFinanceTimeSeries: vi.fn().mockResolvedValue({ granularity: 'day', points: [] }),
      getSalesByCategory: vi.fn().mockResolvedValue([]),
    }

    const { summary, setPreset } = useReports({
      service: customService,
      syncUrl: false,
    })

    // Primera petición (current_month)
    setPreset('current_month')

    // Segunda petición rápida antes de que termine la primera (today)
    setPreset('today')

    // La segunda resuelve primero con datos más recientes
    resolveSecond!({ salesTotal: '200.00', salesCount: 5, currency: 'USD' })
    await flushPromises()

    expect(summary.value?.salesTotal).toBe('200.00')

    // La primera resuelve tardíamente (obsoleta)
    resolveFirst!({ salesTotal: '100.00', salesCount: 2, currency: 'USD' })
    await flushPromises()

    // No debe pisar la respuesta de la segunda
    expect(summary.value?.salesTotal).toBe('200.00')
  })

  it('(8) un fallo en un bloque deja los otros visibles y el reintento funciona', async () => {
    let failSummary = true
    const customService: any = {
      getFinanceSummary: vi.fn().mockImplementation(() => {
        if (failSummary) {
          return Promise.reject(new Error('Fallo de conexión al resumen'))
        }
        return Promise.resolve({
          salesTotal: '150.00',
          salesCount: 3,
          currency: 'USD',
        } as FinanceSummary)
      }),
      getFinanceTimeSeries: vi.fn().mockResolvedValue({
        granularity: 'day',
        points: [{ date: '2026-05-01', salesTotal: '150.00' }],
      }),
      getSalesByCategory: vi.fn().mockResolvedValue([
        {
          categoryId: 1,
          categoryName: 'Alimentos',
          salesTotal: '150.00',
          unitsSold: '10.00',
        },
      ]),
    }

    const { summary, summaryError, timeSeries, categories, loadAll, reloadSummary } = useReports({
      service: customService,
      syncUrl: false,
    })

    await loadAll()

    // Resumen falló
    expect(summaryError.value).toBe('Fallo de conexión al resumen')
    expect(summary.value).toBeNull()

    // Los otros dos bloques están intactos con sus datos cargados
    expect(timeSeries.value?.points.length).toBe(1)
    expect(categories.value?.length).toBe(1)

    // Reintento exitoso
    failSummary = false
    await reloadSummary()

    expect(summaryError.value).toBeNull()
    expect(summary.value?.salesTotal).toBe('150.00')
  })

  it('(9) la URL se sincroniza con los filtros', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Cambiar preset a 'today'
    const selects = wrapper.findAllComponents({ name: 'BaseSelect' })
    const presetSelect = selects[0]
    presetSelect.vm.$emit('update:modelValue', 'today')

    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(router.currentRoute.value.query.preset).toBe('today')

    // Cambiar tipo a 'SALE'
    const typeSelect = selects[1]
    typeSelect.vm.$emit('update:modelValue', 'SALE')

    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(router.currentRoute.value.query.type).toBe('SALE')
  })

  it('(10) la granularidad automática cambia con el rango', () => {
    // <= 31 días: day
    expect(calculateDaysBetween('2026-05-01', '2026-05-20')).toBe(20)
    expect(computeGranularity('2026-05-01', '2026-05-20')).toBe('day')

    expect(calculateDaysBetween('2026-05-01', '2026-05-31')).toBe(31)
    expect(computeGranularity('2026-05-01', '2026-05-31')).toBe('day')

    // <= 120 días: week
    expect(calculateDaysBetween('2026-05-01', '2026-06-30')).toBe(61)
    expect(computeGranularity('2026-05-01', '2026-06-30')).toBe('week')

    expect(calculateDaysBetween('2026-01-01', '2026-04-30')).toBe(120)
    expect(computeGranularity('2026-01-01', '2026-04-30')).toBe('week')

    // > 120 días: month
    expect(calculateDaysBetween('2026-01-01', '2026-06-30')).toBe(181)
    expect(computeGranularity('2026-01-01', '2026-06-30')).toBe('month')
  })

  it('(11) el badge de salud refleja el valor del servidor para HEALTHY, WARNING y CRITICAL', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const testHealth = async (
      health: 'HEALTHY' | 'WARNING' | 'CRITICAL',
      expectedLabel: string
    ) => {
      vi.spyOn(reportsService, 'getFinanceSummary').mockResolvedValueOnce({
        salesTotal: '1000.00',
        salesCount: 10,
        purchasesTotal: '600.00',
        purchasesCount: 5,
        grossProfit: '400.00',
        marginPercent: '40.00',
        cashBalance: '400.00',
        marginHealth: health,
        currency: 'USD',
      })

      await router.push('/reports')
      const wrapper = mount(ReportsDashboardView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      const badge = wrapper.find('[data-test="margin-health-badge"]')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe(expectedLabel)
    }

    await testHealth('HEALTHY', 'Saludable')
    await testHealth('WARNING', 'Atención')
    await testHealth('CRITICAL', 'Crítico')
  })

  it('(12) el desglose por moneda aparece en franja propia bajo los KPIs y omite monedas en 0.00', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    vi.spyOn(reportsService, 'getFinanceSummary').mockResolvedValueOnce({
      salesTotal: '1500.00',
      salesCount: 12,
      purchasesTotal: '800.00',
      purchasesCount: 4,
      grossProfit: '700.00',
      marginPercent: '46.67',
      cashBalance: '700.00',
      marginHealth: 'HEALTHY',
      currency: 'USD',
      salesByCurrency: [
        { currency: 'USD', amount: '1000.00' },
        { currency: 'CUP', amount: '50000.00' },
        { currency: 'MLC', amount: '0.00' },
        { currency: 'CUP_TRANSFER', amount: '0' },
      ],
    })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const currencyStrip = wrapper.find('[data-test="sales-by-currency"]')
    expect(currencyStrip.exists()).toBe(true)
    expect(currencyStrip.text()).toContain('Cobros por moneda (importe en cada moneda de cobro)')
    expect(currencyStrip.text()).toContain('USD')
    expect(currencyStrip.text()).toContain('CUP')
    expect(currencyStrip.text()).not.toContain('MLC')
    expect(currencyStrip.text()).not.toContain('CUP_TRANSFER')
  })

  it('(13) la opción enviada a BaseChart para la línea de ganancia tiene smooth en false', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const profitContainer = wrapper.find('[data-test="profit-chart-container"]')
    expect(profitContainer.exists()).toBe(true)

    const baseChart = profitContainer.findComponent({ name: 'BaseChart' })
    expect(baseChart.exists()).toBe(true)

    const chartOption = baseChart.props('option')
    expect(chartOption.series).toBeDefined()
    expect(chartOption.series[0].type).toBe('line')
    expect(chartOption.series[0].smooth).toBe(false)
  })

  it('(14) con 5 tarjetas la rejilla usa xl:grid-cols-5 y con 1 tarjeta usa max-w-md grid-cols-1', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const kpiGrid = wrapper.find('[data-test="kpis-grid"]')
    expect(kpiGrid.exists()).toBe(true)
    expect(kpiGrid.classes()).toContain('xl:grid-cols-5')
    expect(kpiGrid.classes()).toContain('grid-cols-2')
    expect(kpiGrid.classes()).toContain('md:grid-cols-3')

    // Con usuario sin permiso de costos (vendedor/analista)
    const analystUser = {
      id: 'usr_analyst_01',
      username: 'analyst',
      fullName: 'Analista de Ventas',
      role: 'Analista',
      permissions: ['reports.view'],
      lastLoginAt: '2026-10-30T10:00:00Z',
    }
    localStorage.setItem('qvaflow_user', JSON.stringify(analystUser))
    localStorage.setItem('qvaflow_token', 'custom-token')
    authStore.user = analystUser
    authStore.token = 'custom-token'

    const wrapperAnalyst = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const kpiGridAnalyst = wrapperAnalyst.find('[data-test="kpis-grid"]')
    expect(kpiGridAnalyst.classes()).toContain('max-w-md')
    expect(kpiGridAnalyst.classes()).toContain('grid-cols-1')
  })

  it('(15) formateador de eje X da dd/mm, "sem dd/mm", mm/aaaa y no desplaza el primer y último día del mes', () => {
    // Día: 'dd/mm' sin desplazamiento horario en primer y último día del mes
    expect(formatAxisDate('2026-05-01', 'day')).toBe('01/05')
    expect(formatAxisDate('2026-05-15', 'day')).toBe('15/05')
    expect(formatAxisDate('2026-05-31', 'day')).toBe('31/05')

    // Semana: 'sem dd/mm'
    expect(formatAxisDate('2026-05-18', 'week')).toBe('sem 18/05')
    expect(formatAxisDate('2026-01-01', 'week')).toBe('sem 01/01')

    // Mes: 'mm/aaaa'
    expect(formatAxisDate('2026-05-01', 'month')).toBe('05/2026')
    expect(formatAxisDate('2026-05', 'month')).toBe('05/2026')
    expect(formatAxisDate('2025-12-31', 'month')).toBe('12/2025')
  })

  it('(16) con rango del mes actual, la serie enviada a BaseChart no contiene fechas posteriores a hoy', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const today = new Date()
    const todayStr = formatLocalDate(today)

    vi.spyOn(reportsService, 'getFinanceTimeSeries').mockResolvedValueOnce({
      granularity: 'day',
      points: [
        { date: '2026-05-01', salesTotal: '100.00', purchasesTotal: '50.00', grossProfit: '50.00' },
        { date: todayStr, salesTotal: '200.00', purchasesTotal: '80.00', grossProfit: '120.00' },
        { date: '2099-12-31', salesTotal: '0.00', purchasesTotal: '0.00', grossProfit: '0.00' },
      ],
    })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const barChart = wrapper
      .find('[data-test="sales-vs-purchases-chart-container"]')
      .findComponent({ name: 'BaseChart' })
    expect(barChart.exists()).toBe(true)

    const barOption = barChart.props('option')
    const xLabels: string[] = barOption.xAxis?.data || []
    // Ninguna fecha en el eje X corresponde a la fecha futura '2099-12-31'
    expect(xLabels).not.toContain('2099-12-31')

    // Test directo sobre getDrawablePoints con fecha simulada a mitad de mes
    const mockRefDate = new Date(2026, 4, 15) // 15 de mayo de 2026
    const samplePoints = [
      { date: '2026-05-14', salesTotal: '100.00', purchasesTotal: '40.00', grossProfit: '60.00' },
      { date: '2026-05-15', salesTotal: '150.00', purchasesTotal: '60.00', grossProfit: '90.00' },
      { date: '2026-05-16', salesTotal: '0.00', purchasesTotal: '0.00', grossProfit: '0.00' },
      { date: '2026-05-31', salesTotal: '0.00', purchasesTotal: '0.00', grossProfit: '0.00' },
    ]
    const drawable = getDrawablePoints(samplePoints, 'day', mockRefDate)
    expect(drawable.map((p) => p.date)).toEqual(['2026-05-14', '2026-05-15'])
    expect(drawable.some((p) => p.date > '2026-05-15')).toBe(false)
  })

  it('(17) con rango pasado, la serie enviada a BaseChart va completa', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const pastPoints = [
      { date: '2025-01-01', salesTotal: '100.00', purchasesTotal: '50.00', grossProfit: '50.00' },
      { date: '2025-01-02', salesTotal: '0.00', purchasesTotal: '0.00', grossProfit: '0.00' },
      { date: '2025-01-31', salesTotal: '300.00', purchasesTotal: '120.00', grossProfit: '180.00' },
    ]

    vi.spyOn(reportsService, 'getFinanceTimeSeries').mockResolvedValueOnce({
      granularity: 'day',
      points: pastPoints,
    })

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const barChart = wrapper
      .find('[data-test="sales-vs-purchases-chart-container"]')
      .findComponent({ name: 'BaseChart' })
    const barOption = barChart.props('option')
    expect(barOption.xAxis?.data).toEqual(['2025-01-01', '2025-01-02', '2025-01-31'])

    // Verificación de getDrawablePoints en rango pasado con fecha de referencia futura
    const mockRefDate = new Date(2026, 4, 15)
    const drawable = getDrawablePoints(pastPoints, 'day', mockRefDate)
    expect(drawable.length).toBe(3)
    expect(drawable).toEqual(pastPoints)
  })
})
