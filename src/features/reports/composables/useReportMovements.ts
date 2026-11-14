import { ref, watch, type Ref } from 'vue'
import { reportsService } from '@/services'
import type { ReportsService } from '@/services/interfaces/reportsService'
import type { ReportMovement, ReportMovementQueryParams } from '../types'
import { useDataTableQuery } from '@/shared/composables/useDataTableQuery'

export interface UseReportMovementsOptions {
  desde: Ref<string>
  hasta: Ref<string>
  type: Ref<'ALL' | 'SALE' | 'PURCHASE'>
  categoryId: Ref<string>
  activeTab: Ref<string>
  service?: ReportsService
}

export function useReportMovements(options: UseReportMovementsOptions) {
  const { desde, hasta, type, categoryId, activeTab, service = reportsService } = options

  // Sincronización de tabla con prefijo 'm' en la URL (mPage, mPerPage, mSort, mSearch)
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
    initialSort: 'date:desc',
    prefix: 'm',
    syncUrl: true,
  })

  const movements = ref<ReportMovement[]>([])
  const total = ref<number>(0)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  let reqId = 0

  const loadMovements = async () => {
    // Solo carga si la pestaña activa es 'movements'
    if (activeTab.value !== 'movements') return

    const currentReq = ++reqId
    loading.value = true
    error.value = null

    try {
      const queryParams: ReportMovementQueryParams = {
        page: page.value,
        perPage: perPage.value,
        sort: sort.value || 'date:desc',
        search: search.value.trim() || undefined,
        desde: desde.value || undefined,
        hasta: hasta.value || undefined,
        type: type.value !== 'ALL' ? type.value : undefined,
        categoryId: categoryId.value && categoryId.value !== 'ALL' ? categoryId.value : undefined,
      }

      const res = await service.listMovements(queryParams)
      if (currentReq === reqId) {
        movements.value = res.items
        total.value = res.total
      }
    } catch (err: any) {
      if (currentReq === reqId) {
        error.value = err?.message || 'Error al cargar el detalle de movimientos'
      }
    } finally {
      if (currentReq === reqId) {
        loading.value = false
      }
    }
  }

  // Al abrir la pestaña 'movements', cargar si está activa
  watch(
    activeTab,
    (tab) => {
      if (tab === 'movements') {
        loadMovements()
      }
    },
    { immediate: true }
  )

  // Al cambiar filtros del reporte (desde, hasta, type, categoryId), vuelve a la página 1 y recarga
  watch([desde, hasta, type, categoryId], () => {
    if (page.value !== 1) {
      setPage(1)
    } else if (activeTab.value === 'movements') {
      loadMovements()
    }
  })

  // Al cambiar paginación, orden o búsqueda, recargar si la pestaña está activa
  watch([page, perPage, sort, search], () => {
    if (activeTab.value === 'movements') {
      loadMovements()
    }
  })

  const retry = () => {
    loadMovements()
  }

  return {
    movements,
    total,
    loading,
    error,
    page,
    perPage,
    sort,
    search,
    setPage,
    setPerPage,
    setSort,
    setSearch,
    handleQueryChange,
    loadMovements,
    retry,
  }
}
