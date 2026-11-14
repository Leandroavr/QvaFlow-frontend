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
import { ref } from 'vue'
import ReportsDashboardView, {
  formatAxisDate,
  getDrawablePoints,
  formatMovementDateTime,
  formatDecimalAmount,
} from '../views/ReportsDashboardView.vue'
import { useReportMovements } from '../composables/useReportMovements'
import {
  useReports,
  calculatePresetRange,
  computeGranularity,
  calculateDaysBetween,
  formatLocalDate,
} from '../composables/useReports'
import { setEffectiveRouteQuery } from '@/shared/composables/useDataTableQuery'
import { formatPaymentMethod } from '../constants'
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
    setEffectiveRouteQuery(null)
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

  it('(18) la pestaña Movimientos carga y muestra las filas del mock y el contador', async () => {
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

    const movementsTable = wrapper.find('[data-test="movements-table"]')
    expect(movementsTable.exists()).toBe(true)

    const rows = wrapper.findAll('[data-test="movements-table"] tbody tr')
    expect(rows.length).toBeGreaterThan(0)

    const countLabel = wrapper.find('[data-test="movements-count"]')
    expect(countLabel.exists()).toBe(true)
    expect(countLabel.text()).toMatch(/\d+ movimientos?/)
  })

  it('(19) sin costos no hay filas de compra ni opción Compras en el filtro', async () => {
    const authStore = useAuthStore()
    const analystUser = {
      id: 'usr_analyst_02',
      username: 'analyst2',
      fullName: 'Analista 2',
      role: 'Analista',
      permissions: ['reports.view'],
      lastLoginAt: '2026-10-30T10:00:00Z',
    }
    localStorage.setItem('qvaflow_user', JSON.stringify(analystUser))
    localStorage.setItem('qvaflow_token', 'custom-token-2')
    authStore.user = analystUser
    authStore.token = 'custom-token-2'

    await router.push('/reports')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // 1. En el filtro de tipo de operación, no aparece Compras
    const selects = wrapper.findAllComponents({ name: 'BaseSelect' })
    const typeSelect = selects.find((s) =>
      (s.props('options') || []).some((o: any) => o.value === 'SALE')
    )
    expect(typeSelect).toBeDefined()
    const options = (typeSelect?.props('options') || []) as any[]
    expect(options.some((o) => o.value === 'PURCHASE')).toBe(false)

    // 2. En la tabla de movimientos, no hay ninguna fila con Tipo "Compra"
    const badges = wrapper.findAllComponents({ name: 'BaseBadge' })
    const purchaseBadges = badges.filter((b) => b.text().includes('Compra'))
    expect(purchaseBadges.length).toBe(0)
  })

  it('(20) búsqueda, orden y página se reflejan en la URL sin borrar los filtros del reporte, y viceversa', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?preset=last_7_days&type=SALE')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Comprobar que los filtros del reporte se cargaron
    expect(router.currentRoute.value.query.preset).toBe('last_7_days')
    expect(router.currentRoute.value.query.type).toBe('SALE')

    // Escribir búsqueda en la barra de movimientos
    const searchInput = wrapper.find('[data-test="movements-filter-bar"] input')
    await searchInput.setValue('TR-001')
    await flushPromises()
    await waitDelay(350)
    await flushPromises()

    // Se refleja mSearch en la URL sin borrar preset ni type
    expect(router.currentRoute.value.query.mSearch).toBe('TR-001')
    expect(router.currentRoute.value.query.preset).toBe('last_7_days')
    expect(router.currentRoute.value.query.type).toBe('SALE')

    // Ahora simular que la URL ya traía parámetros de tabla y reporte
    await router.push(
      '/reports?preset=previous_month&type=ALL&mPage=2&mSort=amount:asc&mSearch=cerveza'
    )
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(router.currentRoute.value.query.preset).toBe('previous_month')
    expect(router.currentRoute.value.query.mPage).toBe('2')
    expect(router.currentRoute.value.query.mSort).toBe('amount:asc')
    expect(router.currentRoute.value.query.mSearch).toBe('cerveza')
  })

  it('(21) cambiar el preset vuelve a la página 1 en los movimientos', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?preset=current_month&mPage=2')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(router.currentRoute.value.query.mPage).toBe('2')

    // Cambiar preset a 'last_7_days'
    const selects = wrapper.findAllComponents({ name: 'BaseSelect' })
    const presetSelect = selects[0]
    presetSelect.vm.$emit('update:modelValue', 'last_7_days')

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // La página de movimientos vuelve a 1 (se elimina mPage o se resetea a 1)
    expect(router.currentRoute.value.query.mPage).toBeUndefined()
    expect(router.currentRoute.value.query.preset).toBe('last_7_days')
  })

  it('(22) una respuesta obsoleta no pisa a la nueva en useReportMovements', async () => {
    const desde = ref('2026-05-01')
    const hasta = ref('2026-05-31')
    const type = ref<'ALL' | 'SALE' | 'PURCHASE'>('ALL')
    const categoryId = ref('ALL')
    const activeTab = ref('movements')

    let resolveSlow: any
    let resolveFast: any

    const mockService = {
      listMovements: vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveSlow = resolve
            })
        )
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFast = resolve
            })
        ),
    } as any

    // Al montar con activeTab = 'movements', el watch immediate dispara la primera llamada (lenta)
    const composable = useReportMovements({
      desde,
      hasta,
      type,
      categoryId,
      activeTab,
      service: mockService,
    })

    // Segunda llamada (rápida, manual)
    const p2 = composable.loadMovements()

    // Resuelve la segunda primero
    resolveFast({
      items: [{ id: 'fast', reference: 'FAST-001', amount: '99.00', type: 'SALE' }],
      total: 1,
    })
    await p2

    expect(composable.movements.value[0]?.id).toBe('fast')

    // Resuelve la primera después
    resolveSlow({
      items: [{ id: 'slow', reference: 'SLOW-001', amount: '1.00', type: 'SALE' }],
      total: 100,
    })
    await flushPromises()

    // No debe pisar la respuesta más reciente
    expect(composable.movements.value[0]?.id).toBe('fast')
  })

  it('(23) error con reintento en el detalle de movimientos', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    vi.spyOn(reportsService, 'listMovements')
      .mockRejectedValueOnce(new Error('Fallo de red en movimientos'))
      .mockResolvedValueOnce({
        items: [
          {
            id: 'm1',
            date: '2026-05-15T10:00:00Z',
            type: 'SALE',
            reference: 'T-OK',
            description: 'Test OK',
            categoryName: 'General',
            warehouseName: 'Central',
            amount: '50.00',
            currency: 'USD',
            paymentMethod: 'Efectivo',
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
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

    // Comprobar que DataTable recibe el error
    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    expect(dataTable.props('error')).toBeTruthy()

    // Ejecutar reintento
    dataTable.vm.$emit('retry')
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(dataTable.props('error')).toBeNull()
    expect(wrapper.text()).toContain('T-OK')
  })

  it('(24) importes con separador de miles, signo y 2 decimales (formatMovementDateTime y formatDecimalAmount)', () => {
    // Helper de fecha y hora
    expect(formatMovementDateTime('2026-05-15T14:30:00Z')).toBe('15/05/2026 14:30')
    expect(formatMovementDateTime('2026-01-02T09:05:22')).toBe('02/01/2026 09:05')
    expect(formatMovementDateTime('')).toBe('')

    // Helper de importe decimal con miles y signo explícito
    expect(formatDecimalAmount('10')).toBe('10.00')
    expect(formatDecimalAmount('25.5')).toBe('25.50')
    expect(formatDecimalAmount('120.99')).toBe('120.99')
    expect(formatDecimalAmount('3200', 'SALE')).toBe('+3,200.00')
    expect(formatDecimalAmount('1280', 'PURCHASE')).toBe('-1,280.00')
    expect(formatDecimalAmount('-1280.00')).toBe('-1,280.00')
    expect(formatDecimalAmount('1000000.5', 'SALE')).toBe('+1,000,000.50')
    expect(formatDecimalAmount('0')).toBe('0.00')
    expect(formatDecimalAmount('')).toBe('0.00')
    expect(formatDecimalAmount(null)).toBe('0.00')
  })

  it('(25) ambas pestañas existen siempre y la URL tab las selecciona', async () => {
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

    const baseTabs = wrapper.findComponent({ name: 'BaseTabs' })
    expect(baseTabs.exists()).toBe(true)
    const items = baseTabs.props('items') as any[]

    expect(items.map((i: any) => i.id)).toEqual(['movements', 'top-selling', 'idle'])

    await router.push('/reports?tab=top-selling')
    await flushPromises()
    expect(baseTabs.props('modelValue')).toBe('top-selling')

    await router.push('/reports?tab=idle')
    await flushPromises()
    expect(baseTabs.props('modelValue')).toBe('idle')
  })

  it('(26) la forma de pago se muestra en español y un valor desconocido sale tal cual', () => {
    expect(formatPaymentMethod('CASH')).toBe('Efectivo')
    expect(formatPaymentMethod('CARD')).toBe('Tarjeta')
    expect(formatPaymentMethod('TRANSFER')).toBe('Transferencia')
    expect(formatPaymentMethod('CRYPTO')).toBe('CRYPTO')
    expect(formatPaymentMethod('DESCONOCIDO')).toBe('DESCONOCIDO')
    expect(formatPaymentMethod(null)).toBe('')
    expect(formatPaymentMethod(undefined)).toBe('')
  })

  it('(27) la columna Importe no es ordenable y Fecha y Referencia sí son ordenables', async () => {
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

    const dataTable = wrapper.findComponent({ name: 'DataTable' })
    expect(dataTable.exists()).toBe(true)

    const columns = dataTable.props('columns') as any[]
    const amountCol = columns.find((c) => c.key === 'amount')
    const dateCol = columns.find((c) => c.key === 'date')
    const refCol = columns.find((c) => c.key === 'reference')

    expect(amountCol?.sortable).toBeFalsy()
    expect(dateCol?.sortable).toBe(true)
    expect(refCol?.sortable).toBe(true)
  })

  it('(28) vista Top muestra barras con aria-valuenow', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?tab=top-selling')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const bars = wrapper.findAll('[role="progressbar"]')
    expect(bars.length).toBeGreaterThan(0)
    expect(bars[0].attributes('aria-valuenow')).toBe('100.00')
    expect(bars[0].attributes('aria-valuemin')).toBe('0')
    expect(bars[0].attributes('aria-valuemax')).toBe('100')
    expect(bars[0].attributes('aria-label')).toBeDefined()
  })

  it('(29) cambiar Top 5 a 10 cambia las filas y la URL', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?tab=top-selling')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const select = wrapper.findComponent('[data-test="top-products-limit-select"]') as any
    expect(select.exists()).toBe(true)

    select.vm.$emit('update:modelValue', 10)
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(router.currentRoute.value.query.limit).toBe('10')
    const topTable = wrapper.findComponent('[data-test="top-products-table"]') as any
    expect(topTable.exists()).toBe(true)
    const data = topTable.props('data') as any[]
    expect(data.length).toBeGreaterThan(5)
  })

  it('(30) vista Ociosos oculta la columna y la StatCard sin costos', async () => {
    const authStore = useAuthStore()
    const user = {
      id: 'seller-user',
      username: 'vendedor',
      roles: ['SELLER'],
      permissions: ['reports.view'],
    }
    localStorage.setItem('qvaflow_user', JSON.stringify(user))
    localStorage.setItem('qvaflow_token', 'mock-token-vendedor')
    authStore.user = user as any
    authStore.token = 'mock-token-vendedor'

    await router.push('/reports?tab=idle')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(wrapper.find('[data-test="idle-tied-up-card"]').exists()).toBe(false)

    const idleTable = wrapper.findComponent('[data-test="idle-products-table"]') as any
    expect(idleTable.exists()).toBe(true)
    const columns = idleTable.props('columns') as any[]
    expect(columns.some((c: any) => c.key === 'tiedUpCapital')).toBe(false)
  })

  it('(31) cambiar days vuelve a pagina 1', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?tab=idle&iPage=2')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const select = wrapper.findComponent('[data-test="idle-days-select"]') as any
    expect(select.exists()).toBe(true)

    select.vm.$emit('update:modelValue', 60)
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(router.currentRoute.value.query.days).toBe('60')
    expect(router.currentRoute.value.query.iPage).toBeUndefined()
  })

  it('(32) error con reintento en pestaña más vendidos', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    let failOnce = true
    const origGetTop = reportsService.getTopProducts.bind(reportsService)
    vi.spyOn(reportsService, 'getTopProducts').mockImplementation(async (...args) => {
      if (failOnce) {
        failOnce = false
        throw new Error('Fallo simulado en top-products')
      }
      return origGetTop(...args)
    })

    await router.push('/reports?tab=top-selling')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const topTable = wrapper.findComponent('[data-test="top-products-table"]') as any
    expect(topTable.exists()).toBe(true)
    expect(topTable.props('error')).toBe('Fallo simulado en top-products')

    topTable.vm.$emit('retry')
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(topTable.props('error')).toBeNull()
    const data = topTable.props('data') as any[]
    expect(data.length).toBeGreaterThan(0)
  })

  it('(33) error con reintento en pestaña productos ociosos', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    let failOnce = true
    const origGetIdle = reportsService.getIdleProducts.bind(reportsService)
    vi.spyOn(reportsService, 'getIdleProducts').mockImplementation(async (...args) => {
      if (failOnce) {
        failOnce = false
        throw new Error('Fallo simulado en idle-products')
      }
      return origGetIdle(...args)
    })

    await router.push('/reports?tab=idle')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const idleTable = wrapper.findComponent('[data-test="idle-products-table"]') as any
    expect(idleTable.exists()).toBe(true)
    expect(idleTable.props('error')).toBe('Fallo simulado en idle-products')

    idleTable.vm.$emit('retry')
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(idleTable.props('error')).toBeNull()
    const data = idleTable.props('data') as any[]
    expect(data.length).toBeGreaterThan(0)
  })

  it('(34) la celda de Producto de Ociosos tiene clase truncate y atributo title con el nombre completo', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?tab=idle')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const idleTable = wrapper.findComponent('[data-test="idle-products-table"]')
    expect(idleTable.exists()).toBe(true)

    const nameCells = idleTable.findAll('.truncate')
    expect(nameCells.length).toBeGreaterThan(0)

    const firstNameCell = nameCells[0]
    expect(firstNameCell.classes()).toContain('truncate')
    const titleAttr = firstNameCell.attributes('title')
    expect(titleAttr).toBeDefined()
    expect(titleAttr!.length).toBeGreaterThan(0)
    expect(firstNameCell.text()).toBe(titleAttr)
  })

  it('(35) StatCard de capital inmovilizado muestra la divisa explícita USD', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    await router.push('/reports?tab=idle')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const card = wrapper.find('[data-test="idle-tied-up-card"]')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('USD')
    expect(card.text()).toMatch(/\d+(\.\d{2})?\s+USD/)
  })

  it('(36) daysWithoutSale null renderiza "—" en la columna Días sin venta', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    vi.spyOn(reportsService, 'getIdleProducts').mockResolvedValueOnce({
      items: [
        {
          productId: 'prod-null-sales',
          code: 'PRD-TEST-NULL',
          name: 'Producto Nunca Vendido',
          category: 'Varios',
          stockQuantity: '10.00',
          lastSaleDate: null,
          daysWithoutSale: null,
          tiedUpCapital: '50.00',
        },
      ],
      total: 1,
      totalTiedUpCapital: '50.00',
    } as any)

    await router.push('/reports?tab=idle')
    const wrapper = mount(ReportsDashboardView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const idleTable = wrapper.findComponent('[data-test="idle-products-table"]')
    expect(idleTable.exists()).toBe(true)

    const rows = idleTable.findAll('tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    const firstRow = rows[0]
    expect(firstRow.text()).toContain('PRD-TEST-NULL')
    expect(firstRow.text()).toContain('Producto Nunca Vendido')
    expect(firstRow.text()).toContain('Sin ventas')
    expect(firstRow.text()).toContain('—')
  })
})
