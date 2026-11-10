import { ref, computed, watch, shallowRef, hasInjectionContext } from 'vue'
import { useRouter, useRoute, type LocationQueryRaw } from 'vue-router'
import { reportsService } from '@/services'
import type { ReportsService } from '@/services/interfaces/reportsService'
import type {
  ReportPeriodPreset,
  ReportQuery,
  FinanceSummary,
  FinanceTimeSeries,
  CategorySales,
  TimeSeriesGranularity,
} from '@/features/reports/types'
import { ApiError } from '@/shared/types/api'
import {
  getEffectiveRouteQuery,
  setEffectiveRouteQuery,
} from '@/shared/composables/useDataTableQuery'

/**
 * Formatea una fecha local a 'YYYY-MM-DD' sin usar conversiones UTC (evita desfases de zona horaria).
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parsea una cadena 'YYYY-MM-DD' como fecha local a medianoche.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Calcula los días entre dos fechas inclusivas 'YYYY-MM-DD'.
 */
export function calculateDaysBetween(desdeStr: string, hastaStr: string): number {
  const d1 = parseLocalDate(desdeStr)
  const d2 = parseLocalDate(hastaStr)
  const diffTime = d2.getTime() - d1.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1
}

/**
 * Determina la granularidad automática según el número de días del rango:
 * - Hasta 31 días: 'day'
 * - Hasta 120 días: 'week'
 * - Más de 120 días: 'month'
 */
export function computeGranularity(desdeStr: string, hastaStr: string): TimeSeriesGranularity {
  const days = calculateDaysBetween(desdeStr, hastaStr)
  if (days <= 31) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}

/**
 * Calcula el rango desde/hasta para un preset temporal relativo a una fecha de referencia local.
 */
export function calculatePresetRange(
  preset: ReportPeriodPreset,
  refDate: Date = new Date()
): { desde: string; hasta: string } | null {
  if (preset === 'custom') return null

  const y = refDate.getFullYear()
  const m = refDate.getMonth()
  const d = refDate.getDate()

  if (preset === 'today') {
    const todayStr = formatLocalDate(new Date(y, m, d))
    return { desde: todayStr, hasta: todayStr }
  }

  if (preset === 'last_7_days') {
    const start = new Date(y, m, d - 6)
    return { desde: formatLocalDate(start), hasta: formatLocalDate(new Date(y, m, d)) }
  }

  if (preset === 'current_month') {
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0)
    return { desde: formatLocalDate(start), hasta: formatLocalDate(end) }
  }

  if (preset === 'previous_month') {
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)
    return { desde: formatLocalDate(start), hasta: formatLocalDate(end) }
  }

  return null
}

export interface UseReportsOptions {
  service?: ReportsService
  syncUrl?: boolean
  initialPreset?: ReportPeriodPreset
  initialDesde?: string
  initialHasta?: string
  initialType?: 'ALL' | 'SALE' | 'PURCHASE'
  initialCategoryId?: string
  refDate?: Date
}

export function useReports(options: UseReportsOptions = {}) {
  const service = options.service || reportsService
  const syncUrl = options.syncUrl !== false
  const refDate = options.refDate || new Date()

  // Soporte seguro para vue-router
  let router: ReturnType<typeof useRouter> | undefined
  let route: ReturnType<typeof useRoute> | undefined

  if (hasInjectionContext()) {
    try {
      router = useRouter()
      route = useRoute()
    } catch {
      // Router no disponible
    }
  }

  const query = route?.query || {}

  // 1. Determinar preset inicial
  const validPresets: ReportPeriodPreset[] = [
    'today',
    'last_7_days',
    'current_month',
    'previous_month',
    'custom',
  ]
  let initialPreset: ReportPeriodPreset = options.initialPreset || 'current_month'
  if (syncUrl && query.preset && validPresets.includes(query.preset as ReportPeriodPreset)) {
    initialPreset = query.preset as ReportPeriodPreset
  }

  // 2. Determinar fechas iniciales según preset o URL
  let parsedDesde = options.initialDesde || ''
  let parsedHasta = options.initialHasta || ''

  if (initialPreset !== 'custom') {
    const range = calculatePresetRange(initialPreset, refDate)
    if (range) {
      parsedDesde = range.desde
      parsedHasta = range.hasta
    }
  } else {
    if (syncUrl && typeof query.desde === 'string' && query.desde) {
      parsedDesde = query.desde
    }
    if (syncUrl && typeof query.hasta === 'string' && query.hasta) {
      parsedHasta = query.hasta
    }
    if (!parsedDesde || !parsedHasta) {
      const fallback = calculatePresetRange('current_month', refDate)!
      parsedDesde = parsedDesde || fallback.desde
      parsedHasta = parsedHasta || fallback.hasta
    }
  }

  // 3. Determinar tipo y categoría inicial
  let initialType: 'ALL' | 'SALE' | 'PURCHASE' = options.initialType || 'ALL'
  if (syncUrl && (query.type === 'ALL' || query.type === 'SALE' || query.type === 'PURCHASE')) {
    initialType = query.type as 'ALL' | 'SALE' | 'PURCHASE'
  }

  let initialCategoryId = options.initialCategoryId || 'ALL'
  if (syncUrl && query.categoryId !== undefined && query.categoryId !== '') {
    initialCategoryId = String(query.categoryId)
  }

  // Estado reactivo de filtros
  const preset = ref<ReportPeriodPreset>(initialPreset)
  const desde = ref<string>(parsedDesde)
  const hasta = ref<string>(parsedHasta)
  const type = ref<'ALL' | 'SALE' | 'PURCHASE'>(initialType)
  const categoryId = ref<string>(initialCategoryId)

  // Validación de rango
  const validationError = ref<string | null>(null)
  const fieldErrors = ref<Record<string, string>>({})

  const validateRange = (): boolean => {
    validationError.value = null
    fieldErrors.value = {}

    if (!desde.value || !hasta.value) {
      validationError.value = 'Debe especificar el rango de fechas'
      return false
    }

    const d1 = parseLocalDate(desde.value)
    const d2 = parseLocalDate(hasta.value)

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      validationError.value = 'Las fechas deben tener el formato válido YYYY-MM-DD'
      return false
    }

    if (d2.getTime() < d1.getTime()) {
      validationError.value = 'La fecha final no puede ser anterior a la fecha inicial'
      fieldErrors.value = {
        hasta: 'La fecha final no puede ser anterior a la fecha inicial',
      }
      return false
    }

    const days = calculateDaysBetween(desde.value, hasta.value)
    if (days > 366) {
      validationError.value = 'El rango de consulta no puede superar los 366 días'
      fieldErrors.value = {
        hasta: 'El rango de consulta no puede superar los 366 días',
      }
      return false
    }

    return true
  }

  const isValidRange = computed(() => {
    if (!desde.value || !hasta.value) return false
    const d1 = parseLocalDate(desde.value)
    const d2 = parseLocalDate(hasta.value)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false
    if (d2.getTime() < d1.getTime()) return false
    if (calculateDaysBetween(desde.value, hasta.value) > 366) return false
    return true
  })

  // Granularidad automática computada
  const granularity = computed<TimeSeriesGranularity>(() => {
    if (!isValidRange.value) return 'day'
    return computeGranularity(desde.value, hasta.value)
  })

  // Estados de datos independientes
  const summary = ref<FinanceSummary | null>(null)
  const summaryLoading = ref(false)
  const summaryError = ref<string | null>(null)

  const timeSeries = ref<FinanceTimeSeries | null>(null)
  const timeSeriesLoading = ref(false)
  const timeSeriesError = ref<string | null>(null)

  const categories = ref<CategorySales[] | null>(null)
  const categoriesLoading = ref(false)
  const categoriesError = ref<string | null>(null)

  // Flag derivado por presencia de datos (no por nombre de rol)
  const canSeeCosts = computed(() => {
    return Boolean(
      summary.value &&
      'purchasesTotal' in summary.value &&
      summary.value.purchasesTotal !== undefined
    )
  })

  // Si se detecta que no puede ver costos, ajustar el tipo si era PURCHASE
  watch(canSeeCosts, (allowed) => {
    if (!allowed && type.value === 'PURCHASE') {
      type.value = 'ALL'
    }
  })

  // Identificador de petición para descartar respuestas obsoletas (race conditions)
  let activeRequestId = 0

  const buildQuery = (): Partial<ReportQuery> => {
    const q: Partial<ReportQuery> = {
      desde: desde.value,
      hasta: hasta.value,
    }
    if (type.value && type.value !== 'ALL') {
      q.type = type.value
    }
    if (categoryId.value && categoryId.value !== 'ALL') {
      q.categoryId = categoryId.value
    }
    return q
  }

  // Cargas individuales
  const loadSummary = async (reqId = activeRequestId) => {
    summaryLoading.value = true
    summaryError.value = null

    try {
      const res = await service.getFinanceSummary(buildQuery())
      if (reqId === activeRequestId) {
        summary.value = res
      }
    } catch (err: any) {
      if (reqId === activeRequestId) {
        summaryError.value = err.message || 'Error al cargar el resumen financiero'
        if (err instanceof ApiError && err.details) {
          const normalized: Record<string, string> = {}
          Object.entries(err.details).forEach(([k, v]) => {
            normalized[k] = Array.isArray(v) ? v.join(', ') : String(v)
          })
          fieldErrors.value = { ...fieldErrors.value, ...normalized }
        }
      }
    } finally {
      if (reqId === activeRequestId) {
        summaryLoading.value = false
      }
    }
  }

  const loadTimeSeries = async (reqId = activeRequestId) => {
    timeSeriesLoading.value = true
    timeSeriesError.value = null

    try {
      const res = await service.getFinanceTimeSeries(buildQuery(), granularity.value)
      if (reqId === activeRequestId) {
        timeSeries.value = res
      }
    } catch (err: any) {
      if (reqId === activeRequestId) {
        timeSeriesError.value = err.message || 'Error al cargar la evolución temporal'
      }
    } finally {
      if (reqId === activeRequestId) {
        timeSeriesLoading.value = false
      }
    }
  }

  const loadCategories = async (reqId = activeRequestId) => {
    categoriesLoading.value = true
    categoriesError.value = null

    try {
      const res = await service.getSalesByCategory(buildQuery())
      if (reqId === activeRequestId) {
        categories.value = res
      }
    } catch (err: any) {
      if (reqId === activeRequestId) {
        categoriesError.value = err.message || 'Error al cargar las ventas por categoría'
      }
    } finally {
      if (reqId === activeRequestId) {
        categoriesLoading.value = false
      }
    }
  }

  // Carga paralela con protección de peticiones obsoletas
  const loadAll = async () => {
    if (!validateRange()) {
      return
    }

    const currentReqId = ++activeRequestId

    // Ejecución paralela independiente (Promise.allSettled)
    await Promise.allSettled([
      loadSummary(currentReqId),
      loadTimeSeries(currentReqId),
      loadCategories(currentReqId),
    ])
  }

  // Sincronización hacia la URL
  const isUpdatingUrl = shallowRef(false)

  const syncToUrl = () => {
    if (!syncUrl || !router || !route) return

    // Preservar parámetros de la tabla, pestañas o de otras capas
    const baseQuery = getEffectiveRouteQuery(route.query)
    const nextQuery: LocationQueryRaw = { ...baseQuery }

    delete nextQuery.preset
    delete nextQuery.desde
    delete nextQuery.hasta
    delete nextQuery.type
    delete nextQuery.categoryId

    if (preset.value !== 'current_month') {
      nextQuery.preset = preset.value
    }

    if (preset.value === 'custom') {
      if (desde.value) nextQuery.desde = desde.value
      if (hasta.value) nextQuery.hasta = hasta.value
    }

    if (type.value && type.value !== 'ALL') {
      nextQuery.type = type.value
    }

    if (categoryId.value && categoryId.value !== 'ALL') {
      nextQuery.categoryId = categoryId.value
    }

    const currentQuery = route.query
    const isDifferent =
      Object.keys(nextQuery).length !== Object.keys(currentQuery).length ||
      Object.entries(nextQuery).some(([k, v]) => currentQuery[k] !== v)

    if (isDifferent) {
      isUpdatingUrl.value = true
      setEffectiveRouteQuery(nextQuery)
      router.replace({ query: nextQuery }).finally(() => {
        isUpdatingUrl.value = false
        setEffectiveRouteQuery(null)
      })
    }
  }

  // Sincronizar preset y fechas
  const setPreset = (newPreset: ReportPeriodPreset) => {
    preset.value = newPreset
    if (newPreset !== 'custom') {
      const range = calculatePresetRange(newPreset, new Date())
      if (range) {
        desde.value = range.desde
        hasta.value = range.hasta
      }
    }
    loadAll()
  }

  const setRange = (newDesde: string, newHasta: string) => {
    preset.value = 'custom'
    desde.value = newDesde
    hasta.value = newHasta
    loadAll()
  }

  const setType = (newType: 'ALL' | 'SALE' | 'PURCHASE') => {
    type.value = newType
    loadAll()
  }

  const setCategoryId = (newCategoryId: string) => {
    categoryId.value = newCategoryId
    loadAll()
  }

  const resetFilters = () => {
    preset.value = 'current_month'
    const range = calculatePresetRange('current_month', new Date())!
    desde.value = range.desde
    hasta.value = range.hasta
    type.value = 'ALL'
    categoryId.value = 'ALL'
    loadAll()
  }

  // Vigilar filtros para sincronización en URL
  watch([preset, desde, hasta, type, categoryId], () => {
    if (!isUpdatingUrl.value) {
      syncToUrl()
    }
  })

  return {
    // Filtros
    preset,
    desde,
    hasta,
    type,
    categoryId,
    granularity,
    canSeeCosts,
    validationError,
    fieldErrors,
    isValidRange,

    // Datos y estados
    summary,
    summaryLoading,
    summaryError,
    timeSeries,
    timeSeriesLoading,
    timeSeriesError,
    categories,
    categoriesLoading,
    categoriesError,

    // Acciones
    setPreset,
    setRange,
    setType,
    setCategoryId,
    resetFilters,
    loadAll,
    reloadSummary: () => loadSummary(activeRequestId),
    reloadTimeSeries: () => loadTimeSeries(activeRequestId),
    reloadCategories: () => loadCategories(activeRequestId),
  }
}
