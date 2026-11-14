import { ref, watch, shallowRef, hasInjectionContext, type Ref } from 'vue'
import { useRouter, useRoute, type LocationQueryRaw } from 'vue-router'
import { reportsService } from '@/services'
import type { ReportsService } from '@/services/interfaces/reportsService'
import type { IdleProduct, IdleProductsResponse } from '../types'
import type { DecimalString } from '@/shared/types/currency'
import {
  useDataTableQuery,
  getEffectiveRouteQuery,
  setEffectiveRouteQuery,
} from '@/shared/composables/useDataTableQuery'

export interface UseIdleProductsOptions {
  activeTab?: Ref<string>
  service?: ReportsService
  syncUrl?: boolean
}

const DEFAULT_DAYS = 30

function isValidDays(val: unknown): val is number {
  if (typeof val === 'number') {
    return Number.isInteger(val) && val >= 1 && val <= 365
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val)
    return Number.isInteger(n) && n >= 1 && n <= 365
  }
  return false
}

export function useIdleProducts(options: UseIdleProductsOptions = {}) {
  const { activeTab, service = reportsService, syncUrl = true } = options

  let router: ReturnType<typeof useRouter> | undefined
  let route: ReturnType<typeof useRoute> | undefined

  if (hasInjectionContext()) {
    try {
      router = useRouter()
      route = useRoute()
    } catch {
      // Router no disponible en este contexto
    }
  }

  // Integración con DataTableQuery con prefix 'i' (iPage, iPerPage, iSort, iSearch)
  const {
    page,
    perPage,
    sort,
    search,
    setPage,
    setPerPage,
    setSort,
    setSearch,
    handleQueryChange,
  } = useDataTableQuery({
    initialPage: 1,
    initialPerPage: 10,
    initialSort: 'daysWithoutSale:desc',
    prefix: 'i',
    syncUrl,
  })

  // Leer e inicializar days desde la URL
  const initialDaysRaw = route?.query?.days
  const initialDays = isValidDays(initialDaysRaw) ? Number(initialDaysRaw) : DEFAULT_DAYS

  const days = ref<number>(initialDays)
  const products = ref<IdleProduct[]>([])
  const total = ref<number>(0)
  const totalTiedUpCapital = ref<DecimalString | undefined>(undefined)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  let reqId = 0
  const isUpdatingUrl = shallowRef(false)

  const syncToUrl = (newDays: number) => {
    if (!syncUrl || !router || !route) return

    const baseQuery = getEffectiveRouteQuery(route.query)
    const nextQuery: LocationQueryRaw = { ...baseQuery }

    if (newDays !== DEFAULT_DAYS) {
      nextQuery.days = String(newDays)
    } else {
      delete nextQuery.days
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

  const setDays = (val: number) => {
    const valid = isValidDays(val) ? Number(val) : DEFAULT_DAYS
    const changed = days.value !== valid
    days.value = valid
    syncToUrl(valid)
    // Cambiar days siempre vuelve a página 1
    if (page.value !== 1) {
      setPage(1)
    } else if (changed && (!activeTab || activeTab.value === 'idle')) {
      loadIdleProducts()
    }
  }

  const loadIdleProducts = async () => {
    if (activeTab && activeTab.value !== 'idle') return

    const currentReq = ++reqId
    loading.value = true
    error.value = null

    try {
      const res = await service.getIdleProducts({
        days: days.value,
        page: page.value,
        perPage: perPage.value,
        sort: sort.value || 'daysWithoutSale:desc',
      })

      if (currentReq === reqId) {
        if (Array.isArray(res)) {
          products.value = res
          total.value = (res as any).total ?? res.length
          totalTiedUpCapital.value = (res as any).totalTiedUpCapital
        } else {
          products.value = (res as IdleProductsResponse).items || []
          total.value = (res as IdleProductsResponse).total ?? products.value.length
          totalTiedUpCapital.value = (res as IdleProductsResponse).totalTiedUpCapital
        }
      }
    } catch (err: any) {
      if (currentReq === reqId) {
        error.value = err?.message || 'Error al cargar productos ociosos'
      }
    } finally {
      if (currentReq === reqId) {
        loading.value = false
      }
    }
  }

  // Si cambia la pestaña y se activa 'idle', cargar
  if (activeTab) {
    watch(
      activeTab,
      (tab) => {
        if (tab === 'idle') {
          loadIdleProducts()
        }
      },
      { immediate: true }
    )
  }

  // Al cambiar página, tamaño de página o sort, recargar si la pestaña está activa
  watch([page, perPage, sort], () => {
    if (!activeTab || activeTab.value === 'idle') {
      loadIdleProducts()
    }
  })

  // Sincronizar desde cambios externos de la URL para days (back / forward)
  if (syncUrl && route) {
    watch(
      () => route.query.days,
      (newDaysRaw) => {
        if (isUpdatingUrl.value) return
        const parsed = isValidDays(newDaysRaw) ? Number(newDaysRaw) : DEFAULT_DAYS
        if (days.value !== parsed) {
          days.value = parsed
          if (page.value !== 1) {
            setPage(1)
          } else if (!activeTab || activeTab.value === 'idle') {
            loadIdleProducts()
          }
        }
      }
    )
  }

  return {
    days,
    setDays,
    products,
    total,
    totalTiedUpCapital,
    loading,
    error,
    retry: loadIdleProducts,
    loadIdleProducts,

    // Exponer controles de paginación / orden para DataTable server
    page,
    perPage,
    sort,
    search,
    setPage,
    setPerPage,
    setSort,
    setSearch,
    handleQueryChange,
  }
}
