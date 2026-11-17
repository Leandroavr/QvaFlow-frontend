import { ref, computed } from 'vue'
import type { CashShift } from '../types'
import { cashService as defaultCashService, salesService as defaultSalesService } from '@/services'
import type { CashService } from '@/services/interfaces/cashService'
import type { SalesService } from '@/services/interfaces/salesService'
import type { SelectOption } from '@/shared/ui/BaseSelect.vue'

/**
 * Extrae partes numéricas de una fecha ISO en texto sin desfase de zona horaria.
 */
export function parseIsoDateParts(isoString?: string) {
  if (!isoString) return null
  const m = isoString.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (!m) return null
  return {
    year: m[1],
    month: m[2],
    day: m[3],
    hours: m[4] ?? '00',
    minutes: m[5] ?? '00',
  }
}

/**
 * Genera la etiqueta legible estándar del turno:
 * "dd/mm/aaaa · Nombre del cajero · HH:mm–HH:mm" (o "HH:mm–abierto" si sigue abierto).
 */
export function formatShiftOptionLabel(shift: CashShift): string {
  const startParts = parseIsoDateParts(shift.openedAt)
  const dateStr = startParts ? `${startParts.day}/${startParts.month}/${startParts.year}` : '—'
  const startH = startParts ? `${startParts.hours}:${startParts.minutes}` : '—'
  const endParts = shift.closedAt ? parseIsoDateParts(shift.closedAt) : null
  const endH = endParts ? `${endParts.hours}:${endParts.minutes}` : 'abierto'
  return `${dateStr} · ${shift.cashierName} · ${startH}–${endH}`
}

export interface UseSalesFiltersOptions {
  salesService?: SalesService
  cashService?: CashService
  initialCashier?: string
  initialShiftId?: string
}

export function useSalesFilters(options: UseSalesFiltersOptions = {}) {
  const salesSvc = options.salesService || defaultSalesService
  const cashSvc = options.cashService || defaultCashService

  const cashiers = ref<string[]>([])
  const shifts = ref<CashShift[]>([])
  const isLoadingFilters = ref<boolean>(false)

  const selectedCashier = ref<string>(options.initialCashier || '')
  const selectedShiftId = ref<string>(options.initialShiftId || '')

  const loadFilterData = async () => {
    isLoadingFilters.value = true
    try {
      const [cashiersList, shiftsRes] = await Promise.all([
        salesSvc.getCashiers().catch(() => []),
        cashSvc
          .getShifts({ perPage: 100, sort: 'openedAt:desc' })
          .catch(() => ({ items: [], total: 0, page: 1, perPage: 100 })),
      ])
      cashiers.value = cashiersList
      shifts.value = shiftsRes.items || []
      validateAndCleanShift()
    } finally {
      isLoadingFilters.value = false
    }
  }

  const availableShifts = computed<CashShift[]>(() => {
    if (!selectedCashier.value || selectedCashier.value === 'ALL') {
      return shifts.value
    }
    const cNorm = selectedCashier.value.trim().toLowerCase()
    return shifts.value.filter((s) => s.cashierName?.trim().toLowerCase() === cNorm)
  })

  const validateAndCleanShift = () => {
    if (!selectedShiftId.value || selectedShiftId.value === 'ALL') return
    const exists = availableShifts.value.some((s) => s.id === selectedShiftId.value)
    if (!exists) {
      selectedShiftId.value = ''
    }
  }

  const setCashier = (cashier: string) => {
    selectedCashier.value = cashier === 'ALL' ? '' : cashier
    validateAndCleanShift()
  }

  const setShiftId = (shiftId: string) => {
    selectedShiftId.value = shiftId === 'ALL' ? '' : shiftId
  }

  const cashierOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [{ label: 'Todos los cajeros', value: 'ALL' }]
    for (const c of cashiers.value) {
      list.push({ label: c, value: c })
    }
    return list
  })

  const shiftOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [{ label: 'Todos los turnos', value: 'ALL' }]
    const openShift = availableShifts.value.find((s) => s.status === 'OPEN')
    if (openShift) {
      list.push({ label: 'Turno actual (abierto)', value: openShift.id })
    }
    const remaining = availableShifts.value.filter((s) => s.id !== openShift?.id)
    const sorted = [...remaining].sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    for (const s of sorted) {
      list.push({
        label: formatShiftOptionLabel(s),
        value: s.id,
      })
    }
    return list
  })

  return {
    cashiers,
    shifts,
    selectedCashier,
    selectedShiftId,
    availableShifts,
    shiftOptions,
    cashierOptions,
    isLoadingFilters,
    loadFilterData,
    setCashier,
    setShiftId,
    validateAndCleanShift,
    formatShiftOptionLabel,
  }
}
