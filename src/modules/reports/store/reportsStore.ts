import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import reportsService from '../services/reportsService'
import type {
  MonthlyKpis,
  TopProduct,
  IdleProduct,
  MonthlyFinanceRecord,
  FinancialMovement,
  MonthOption,
} from '../types/reports'

/**
 * Store Pinia para el módulo de Reportes, Analíticas y Balances Financieros (Ventas vs Compras).
 */
export const useReportsStore = defineStore('reports', () => {
  // Estado Reactivo
  const kpis = ref<MonthlyKpis | null>(null)
  const topProducts = ref<TopProduct[]>([])
  const idleProducts = ref<IdleProduct[]>([])
  const loading = ref<boolean>(false)

  // Filtro Principal Mensual y Secundarios
  const selectedMonth = ref<string>('2026-10')
  const availableMonths = ref<MonthOption[]>([])
  const monthlyFinance = ref<MonthlyFinanceRecord | null>(null)
  const movements = ref<FinancialMovement[]>([])

  const selectedMovementType = ref<string>('ALL') // 'ALL' | 'VENTA' | 'COMPRA'
  const selectedCategory = ref<string>('ALL')
  const selectedWarehouse = ref<string>('ALL')

  // Getters Computados
  const totalIdleCapital = computed(() => {
    return idleProducts.value.reduce((acc, p) => acc + p.tiedUpCapital, 0)
  })

  // Categorías y Almacenes únicos para los selectores secundarios
  const availableCategories = computed(() => {
    const set = new Set<string>()
    movements.value.forEach((m) => {
      if (m.category) set.add(m.category)
    })
    return ['ALL', ...Array.from(set)]
  })

  const availableWarehouses = computed(() => {
    const set = new Set<string>()
    movements.value.forEach((m) => {
      if (m.warehouse) set.add(m.warehouse)
    })
    return ['ALL', ...Array.from(set)]
  })

  // Movimientos filtrados reactivamente
  const filteredMovements = computed(() => {
    return movements.value.filter((m) => {
      const matchType =
        selectedMovementType.value === 'ALL' || m.type === selectedMovementType.value
      const matchCategory =
        selectedCategory.value === 'ALL' || m.category === selectedCategory.value
      const matchWarehouse =
        selectedWarehouse.value === 'ALL' || m.warehouse === selectedWarehouse.value

      return matchType && matchCategory && matchWarehouse
    })
  })

  // Acciones
  const fetchReportsData = async () => {
    loading.value = true
    try {
      const [monthsList, financeSummary, movementsList, kpisRes, topRes, idleRes] =
        await Promise.all([
          reportsService.getAvailableMonths(),
          reportsService.getMonthlyFinanceSummary(selectedMonth.value),
          reportsService.getFinancialMovements(selectedMonth.value),
          reportsService.getMonthlyKpis(),
          reportsService.getTopSellingProducts(),
          reportsService.getIdleProducts(),
        ])

      availableMonths.value = monthsList
      monthlyFinance.value = financeSummary
      movements.value = movementsList
      kpis.value = kpisRes
      topProducts.value = topRes
      idleProducts.value = idleRes
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar analíticas'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cambia el mes principal y recarga los cálculos y movimientos de ese mes.
   */
  const setMonthFilter = async (monthKey: string) => {
    selectedMonth.value = monthKey
    loading.value = true
    try {
      const [financeSummary, movementsList] = await Promise.all([
        reportsService.getMonthlyFinanceSummary(monthKey),
        reportsService.getFinancialMovements(monthKey),
      ])

      monthlyFinance.value = financeSummary
      movements.value = movementsList
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al filtrar por mes'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    kpis,
    topProducts,
    idleProducts,
    loading,
    selectedMonth,
    availableMonths,
    monthlyFinance,
    movements,
    selectedMovementType,
    selectedCategory,
    selectedWarehouse,
    // Getters
    totalIdleCapital,
    availableCategories,
    availableWarehouses,
    filteredMovements,
    // Acciones
    fetchReportsData,
    setMonthFilter,
  }
})

export default useReportsStore
