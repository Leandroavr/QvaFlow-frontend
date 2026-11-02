import { ref, computed, watch, shallowRef, hasInjectionContext } from 'vue'
import { useRouter, useRoute, type LocationQueryRaw } from 'vue-router'

export interface DataTableQueryOptions<TFilters extends Record<string, any> = Record<string, any>> {
  initialPage?: number
  initialPerPage?: number
  initialSort?: string
  initialSearch?: string
  initialFilters?: TFilters
  syncUrl?: boolean
}

export function useDataTableQuery<TFilters extends Record<string, any> = Record<string, any>>(
  options: DataTableQueryOptions<TFilters> = {}
) {
  const {
    initialPage = 1,
    initialPerPage = 10,
    initialSort = '',
    initialSearch = '',
    initialFilters = {} as TFilters,
    syncUrl = true,
  } = options

  // Detección segura de vue-router (compatible con entornos de prueba unitaria sin router)
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

  // Leer estado inicial desde la URL si syncUrl está activado y hay ruta
  const query = route?.query || {}

  const parsedInitialPage =
    query.page && !isNaN(Number(query.page)) ? Math.max(1, Number(query.page)) : initialPage
  const parsedInitialPerPage =
    query.perPage && !isNaN(Number(query.perPage))
      ? Math.max(1, Number(query.perPage))
      : initialPerPage
  const parsedInitialSort = typeof query.sort === 'string' ? query.sort : initialSort
  const parsedInitialSearch = typeof query.search === 'string' ? query.search : initialSearch

  // Estado reactivo principal
  const page = ref<number>(parsedInitialPage)
  const perPage = ref<number>(parsedInitialPerPage)
  const sort = ref<string>(parsedInitialSort)
  const search = ref<string>(parsedInitialSearch)

  // Filtros adicionales tipados
  const filtersState: Record<string, any> = { ...initialFilters }
  if (syncUrl && query) {
    Object.keys(initialFilters).forEach((key) => {
      if (query[key] !== undefined) {
        filtersState[key] = query[key]
      }
    })
  }
  const filters = ref<TFilters>(filtersState as TFilters)

  // Parámetros formateados exactamente para el contrato de la API
  const queryParams = computed(() => {
    const params: Record<string, any> = {
      page: page.value,
      perPage: perPage.value,
    }

    if (sort.value) {
      params.sort = sort.value
    }

    const cleanSearch = search.value.trim()
    if (cleanSearch) {
      params.search = cleanSearch
    }

    // Incluir filtros personalizados que tengan valor válido
    Object.entries(filters.value).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params[k] = v
      }
    })

    return params
  })

  // Detección de filtros activos
  const hasActiveFilters = computed(() => {
    if (search.value.trim().length > 0) return true

    return Object.entries(filters.value).some(([key, val]) => {
      const initialVal = (initialFilters as any)[key]
      return val !== undefined && val !== null && val !== '' && val !== initialVal
    })
  })

  const activeFiltersCount = computed(() => {
    let count = search.value.trim().length > 0 ? 1 : 0
    Object.entries(filters.value).forEach(([key, val]) => {
      const initialVal = (initialFilters as any)[key]
      if (val !== undefined && val !== null && val !== '' && val !== initialVal) {
        count += 1
      }
    })
    return count
  })

  // Sincronización con la URL (hash router compatible)
  const isUpdatingUrl = shallowRef(false)

  const syncToUrl = () => {
    if (!syncUrl || !router || !route) return

    const nextQuery: LocationQueryRaw = {}

    if (page.value > 1) {
      nextQuery.page = String(page.value)
    }
    if (perPage.value !== initialPerPage) {
      nextQuery.perPage = String(perPage.value)
    }
    if (sort.value) {
      nextQuery.sort = sort.value
    }
    if (search.value.trim()) {
      nextQuery.search = search.value.trim()
    }

    Object.entries(filters.value).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        nextQuery[k] = String(v)
      }
    })

    // Evitar bucles de navegación si la query es idéntica
    const currentQuery = route.query
    const isDifferent =
      Object.keys(nextQuery).length !== Object.keys(currentQuery).length ||
      Object.entries(nextQuery).some(([k, v]) => currentQuery[k] !== v)

    if (isDifferent) {
      isUpdatingUrl.value = true
      router.replace({ query: nextQuery }).finally(() => {
        isUpdatingUrl.value = false
      })
    }
  }

  // Vigilar cambios reactivos para sincronizar en URL
  watch(
    [page, perPage, sort, search, filters],
    () => {
      if (!isUpdatingUrl.value) {
        syncToUrl()
      }
    },
    { deep: true }
  )

  // Manejo de eventos emitidos por DataTable
  const handleQueryChange = (params: { page: number; perPage: number; sort: string }) => {
    page.value = params.page
    perPage.value = params.perPage
    sort.value = params.sort
  }

  // Modificadores de estado
  const setPage = (newPage: number) => {
    page.value = Math.max(1, newPage)
  }

  const setPerPage = (newPerPage: number) => {
    perPage.value = newPerPage
    page.value = 1
  }

  const setSort = (newSort: string) => {
    sort.value = newSort
  }

  const setSearch = (newSearch: string) => {
    search.value = newSearch
    page.value = 1
  }

  const setFilter = <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    ;(filters.value as any)[key] = value
    page.value = 1
  }

  const setFilters = (newFilters: Partial<TFilters>) => {
    filters.value = {
      ...filters.value,
      ...newFilters,
    }
    page.value = 1
  }

  const resetFilters = () => {
    search.value = ''
    filters.value = { ...initialFilters }
    page.value = 1
  }

  const resetAll = () => {
    page.value = initialPage
    perPage.value = initialPerPage
    sort.value = initialSort
    search.value = initialSearch
    filters.value = { ...initialFilters }
  }

  return {
    page,
    perPage,
    sort,
    search,
    filters,
    queryParams,
    hasActiveFilters,
    activeFiltersCount,
    setPage,
    setPerPage,
    setSort,
    setSearch,
    setFilter,
    setFilters,
    resetFilters,
    resetAll,
    handleQueryChange,
  }
}
