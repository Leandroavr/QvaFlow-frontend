import { ref, watch, shallowRef, hasInjectionContext, type Ref } from 'vue'
import { useRouter, useRoute, type LocationQueryRaw } from 'vue-router'
import { reportsService } from '@/services'
import type { ReportsService } from '@/services/interfaces/reportsService'
import type { TopProduct } from '../types'
import {
  getEffectiveRouteQuery,
  setEffectiveRouteQuery,
} from '@/shared/composables/useDataTableQuery'

export interface UseTopProductsOptions {
  desde?: Ref<string>
  hasta?: Ref<string>
  categoryId?: Ref<string>
  activeTab?: Ref<string>
  service?: ReportsService
  syncUrl?: boolean
}

const DEFAULT_LIMIT = 5

function isValidLimit(val: unknown): val is number {
  if (typeof val === 'number') {
    return Number.isInteger(val) && val >= 1 && val <= 50
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const n = Number(val)
    return Number.isInteger(n) && n >= 1 && n <= 50
  }
  return false
}

export function useTopProducts(options: UseTopProductsOptions = {}) {
  const { desde, hasta, categoryId, activeTab, service = reportsService, syncUrl = true } = options

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

  // Leer e inicializar limit desde la URL
  const initialLimitRaw = route?.query?.limit
  const initialLimit = isValidLimit(initialLimitRaw) ? Number(initialLimitRaw) : DEFAULT_LIMIT

  const limit = ref<number>(initialLimit)
  const products = ref<TopProduct[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  let reqId = 0
  const isUpdatingUrl = shallowRef(false)

  const syncToUrl = (newLimit: number) => {
    if (!syncUrl || !router || !route) return

    const baseQuery = getEffectiveRouteQuery(route.query)
    const nextQuery: LocationQueryRaw = { ...baseQuery }

    if (newLimit !== DEFAULT_LIMIT) {
      nextQuery.limit = String(newLimit)
    } else {
      delete nextQuery.limit
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

  const setLimit = (val: number) => {
    const valid = isValidLimit(val) ? Number(val) : DEFAULT_LIMIT
    if (limit.value !== valid) {
      limit.value = valid
      syncToUrl(valid)
      loadTopProducts()
    }
  }

  const loadTopProducts = async () => {
    if (activeTab && activeTab.value !== 'top-selling') return

    const currentReq = ++reqId
    loading.value = true
    error.value = null

    try {
      const res = await service.getTopProducts({
        desde: desde?.value || undefined,
        hasta: hasta?.value || undefined,
        categoryId: categoryId?.value && categoryId.value !== 'ALL' ? categoryId.value : undefined,
        limit: limit.value,
      })
      if (currentReq === reqId) {
        products.value = res
      }
    } catch (err: any) {
      if (currentReq === reqId) {
        error.value = err?.message || 'Error al cargar productos más vendidos'
      }
    } finally {
      if (currentReq === reqId) {
        loading.value = false
      }
    }
  }

  // Si cambia la pestaña y se activa 'top-selling', cargar
  if (activeTab) {
    watch(
      activeTab,
      (tab) => {
        if (tab === 'top-selling') {
          loadTopProducts()
        }
      },
      { immediate: true }
    )
  }

  // Si cambian los filtros del reporte (desde, hasta, categoryId), recargar si la pestaña está activa
  if (desde && hasta) {
    watch([desde, hasta, () => categoryId?.value], () => {
      if (!activeTab || activeTab.value === 'top-selling') {
        loadTopProducts()
      }
    })
  }

  // Sincronizar desde cambios externos de la URL (back / forward)
  if (syncUrl && route) {
    watch(
      () => route.query.limit,
      (newLimitRaw) => {
        if (isUpdatingUrl.value) return
        const parsed = isValidLimit(newLimitRaw) ? Number(newLimitRaw) : DEFAULT_LIMIT
        if (limit.value !== parsed) {
          limit.value = parsed
          if (!activeTab || activeTab.value === 'top-selling') {
            loadTopProducts()
          }
        }
      }
    )
  }

  return {
    limit,
    setLimit,
    products,
    loading,
    error,
    retry: loadTopProducts,
    loadTopProducts,
  }
}
