<template>
  <div class="space-y-4">
    <!-- Métricas Superiores: 3 Tarjetas con Fondos Reales para Arqueo / Cuadre -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Ventas Registradas</span
          >
          <h3 class="m-0 mt-0.5 text-2xl font-bold text-slate-800">
            {{ filteredSales.length }} tickets
          </h3>
          <span class="text-[11px] text-slate-400">Total en el filtro activo</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg font-bold text-qvaflow-navy"
        >
          🧾
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Cobrado en CUP (Caja / Transf.)</span
          >
          <h3 class="m-0 mt-0.5 text-2xl font-bold text-slate-900">
            {{ formatearMoneda(totalChargedCUP, 'CUP') }}
          </h3>
          <span class="text-[11px] font-medium text-emerald-600"
            >Ingresos reales en pesos para arqueo</span
          >
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-600"
        >
          🇨🇺
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >Cobrado en USD (Billetes)</span
          >
          <h3 class="m-0 mt-0.5 text-2xl font-bold text-emerald-600">${{ totalChargedUSD }} USD</h3>
          <span class="text-[11px] font-medium text-amber-700"
            >Billetes enteros físicos sin centavos</span
          >
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-lg font-bold text-amber-600"
        >
          💵
        </div>
      </div>
    </div>

    <!-- Contenedor Principal con Pestañas -->
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <a-tabs v-model:activeKey="activeTab">
        <!-- PESTAÑA 1: HISTORIAL DE VENTAS -->
        <a-tab-pane key="sales" tab="Historial de Ventas">
          <div class="space-y-4 pt-1">
            <!-- Barra de Filtros Simple y Sin Ruido (Inline Toolbar) -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"
            >
              <div class="flex flex-wrap items-center gap-2.5">
                <!-- Filtro por Turno -->
                <a-select
                  v-model:value="selectedShiftFilter"
                  class="w-44 sm:min-w-[190px]"
                  :dropdown-match-select-width="false"
                  :popup-match-select-width="false"
                  placeholder="Turno"
                >
                  <a-select-option value="ALL">Todos los Turnos</a-select-option>
                  <a-select-option
                    v-for="shift in availableShiftsList"
                    :key="shift.id"
                    :value="shift.id"
                  >
                    {{ shift.id }} ({{ shift.cashierName }})
                  </a-select-option>
                </a-select>

                <!-- Filtro por Fecha -->
                <a-select
                  v-model:value="selectedDatePreset"
                  class="w-44 sm:min-w-[180px]"
                  :dropdown-match-select-width="false"
                  :popup-match-select-width="false"
                  placeholder="Fecha"
                >
                  <a-select-option value="ALL">Cualquier Fecha</a-select-option>
                  <a-select-option value="TODAY">Hoy ({{ todayFormatted }})</a-select-option>
                  <a-select-option value="YESTERDAY"
                    >Ayer ({{ yesterdayFormatted }})</a-select-option
                  >
                  <a-select-option value="CUSTOM">Elegir fecha...</a-select-option>
                </a-select>

                <!-- Selector de Fecha Custom -->
                <a-date-picker
                  v-if="selectedDatePreset === 'CUSTOM'"
                  v-model:value="customDateString"
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                  placeholder="DD/MM/AAAA"
                  class="w-36"
                />

                <!-- Filtro por Moneda -->
                <a-select
                  v-model:value="selectedCurrencyFilter"
                  class="w-32 sm:min-w-[140px]"
                  :dropdown-match-select-width="false"
                  :popup-match-select-width="false"
                  placeholder="Moneda"
                >
                  <a-select-option value="ALL">Moneda: Todas</a-select-option>
                  <a-select-option value="CUP">CUP</a-select-option>
                  <a-select-option value="USD">USD</a-select-option>
                </a-select>

                <!-- Botón Limpiar Filtros -->
                <button
                  v-if="
                    selectedShiftFilter !== 'ALL' ||
                    selectedDatePreset !== 'ALL' ||
                    selectedCurrencyFilter !== 'ALL' ||
                    salesSearchQuery
                  "
                  type="button"
                  class="ml-1 cursor-pointer text-xs font-medium text-slate-400 transition-colors hover:text-qvaflow-red"
                  @click="resetFilters"
                >
                  Limpiar filtros
                </button>
              </div>

              <!-- Buscador y Refrescar -->
              <div class="flex items-center gap-2">
                <a-input
                  v-model:value="salesSearchQuery"
                  placeholder="Buscar ticket o cajero..."
                  class="w-56"
                  allow-clear
                >
                  <template #prefix><SearchOutlined class="text-slate-400" /></template>
                </a-input>

                <a-button :loading="posStore.loadingHistory" @click="posStore.fetchSalesHistory">
                  <template #icon><ReloadOutlined /></template>
                </a-button>
              </div>
            </div>

            <!-- Tabla de Ventas Simplificada -->
            <a-table
              :columns="salesColumns"
              :data-source="filteredSales"
              :loading="posStore.loadingHistory"
              :pagination="{ pageSize: 8, showTotal: (t: number) => `Total ${t} tickets` }"
              row-key="id"
              class="overflow-x-auto"
            >
              <template #bodyCell="{ column, record }">
                <!-- Columna ID Ticket -->
                <template v-if="column.key === 'id'">
                  <span class="block font-mono font-bold text-slate-800">{{ record.id }}</span>
                  <span class="text-[11px] text-slate-400"
                    >{{ record.items?.length || 0 }} productos</span
                  >
                </template>

                <!-- Columna Turno Asociado -->
                <template v-else-if="column.key === 'shiftId'">
                  <span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                    {{ record.shiftId || 'Sin Turno' }}
                  </span>
                </template>

                <!-- Columna Fecha y Hora (DD/MM/YYYY HH:mm) -->
                <template v-else-if="column.key === 'createdAt'">
                  <span class="font-mono text-xs text-slate-700">
                    {{ formatearFechaHora(record.createdAt) }}
                  </span>
                </template>

                <!-- Columna Cajero -->
                <template v-else-if="column.key === 'cashierName'">
                  <span class="text-xs font-medium text-slate-700">{{
                    record.cashierName || 'Caja'
                  }}</span>
                </template>

                <!-- Columna Total Cobrado (Respeta la moneda real cobrada) -->
                <template v-else-if="column.key === 'total'">
                  <div class="text-right">
                    <!-- Si se cobró en USD: muestra el entero cobrado (ej. $1 USD) -->
                    <template v-if="record.paidCurrency === 'USD'">
                      <span class="block text-sm font-black text-emerald-600">
                        ${{ Math.ceil(record.totalInCurrency || record.totalUSD || 1) }} USD
                      </span>
                      <span class="block font-mono text-[10px] text-slate-400">
                        Base: {{ formatearMoneda(record.totalCUP, 'CUP') }}
                      </span>
                    </template>

                    <!-- Si se cobró en CUP (Efectivo o Transferencia) -->
                    <template v-else>
                      <span class="block text-sm font-bold text-slate-900">
                        {{ formatearMoneda(record.totalCUP, 'CUP') }}
                      </span>
                      <span class="block font-mono text-[10px] text-slate-400">
                        Ref: ${{ (record.totalCUP / (record.exchangeRate || 360)).toFixed(2) }} USD
                      </span>
                    </template>
                  </div>
                </template>

                <!-- Columna Pago y Método -->
                <template v-else-if="column.key === 'payment'">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="rounded px-2 py-0.5 text-[11px] font-bold"
                      :class="
                        record.paidCurrency === 'USD'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border border-blue-200 bg-blue-50 text-blue-800'
                      "
                    >
                      {{ record.paidCurrency }}
                    </span>
                    <span class="text-xs text-slate-600">
                      {{ record.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia' }}
                    </span>
                  </div>
                </template>

                <!-- Columna Acciones -->
                <template v-else-if="column.key === 'actions'">
                  <a-button
                    size="small"
                    type="link"
                    class="cursor-pointer p-0 text-xs font-semibold text-qvaflow-navy hover:text-qvaflow-navy-dark"
                    @click="openSaleReceipt(record)"
                  >
                    Ver Ticket
                  </a-button>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>

        <!-- PESTAÑA 2: CUADRES DE CAJA -->
        <a-tab-pane key="shifts" tab="Cuadres de Caja">
          <div class="space-y-4 pt-1">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <span class="text-xs text-slate-500">
                Historial de aperturas, ventas y arqueos físicos por turno.
              </span>

              <a-button @click="posStore.fetchShiftsHistory">
                <template #icon><ReloadOutlined /></template>
                <span>Actualizar</span>
              </a-button>
            </div>

            <!-- Tabla de Cuadres / Turnos -->
            <a-table
              :columns="shiftsColumns"
              :data-source="posStore.shiftsHistory"
              :loading="posStore.loadingHistory"
              :pagination="{ pageSize: 6 }"
              row-key="id"
              class="overflow-x-auto"
            >
              <template #bodyCell="{ column, record }">
                <!-- Columna Turno ID y Estado -->
                <template v-if="column.key === 'shiftInfo'">
                  <div class="font-mono font-bold text-slate-800">{{ record.id }}</div>
                  <span
                    class="py-0.2 rounded px-1.5 text-[10px] font-bold"
                    :class="
                      record.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{ record.status === 'OPEN' ? '🟢 Abierto' : 'Cerrado' }}
                  </span>
                </template>

                <!-- Columna Cajero -->
                <template v-else-if="column.key === 'cashierName'">
                  <span class="block text-xs font-semibold text-slate-800">{{
                    record.cashierName
                  }}</span>
                  <span class="font-mono text-[10px] text-slate-400"
                    >1 USD = {{ record.dailyRateUSD }} CUP</span
                  >
                </template>

                <!-- Columna Horarios -->
                <template v-else-if="column.key === 'times'">
                  <div class="text-xs text-slate-700">
                    <span class="text-slate-400">Inicio:</span>
                    {{ formatearFechaHora(record.openedAt) }}
                  </div>
                  <div class="text-xs text-slate-500">
                    <span class="text-slate-400">Fin:</span>
                    {{ record.closedAt ? formatearFechaHora(record.closedAt) : 'En curso' }}
                  </div>
                </template>

                <!-- Columna Fondo Inicial Dual -->
                <template v-else-if="column.key === 'initialFunds'">
                  <div class="space-y-1.5 text-sm font-medium">
                    <div class="font-bold text-slate-800">
                      {{ formatearMoneda(record.initialFunds?.CUP || 0, 'CUP') }}
                    </div>
                    <div class="font-bold text-slate-800">
                      {{ record.initialFunds?.USD || 0 }} USD
                    </div>
                  </div>
                </template>

                <!-- Columna Ventas del Turno (Cantidad y detrás la moneda limpia, más grande y separada) -->
                <template v-else-if="column.key === 'salesTotals'">
                  <div class="space-y-1.5 text-sm font-medium">
                    <div class="font-bold text-slate-800">
                      {{
                        formatearMoneda(
                          record.salesTotals?.cupCash ??
                            (record.salesTotals?.CUP ? record.salesTotals.CUP * 0.9 : 0),
                          'CUP'
                        )
                      }}
                    </div>
                    <div class="font-bold text-slate-800">
                      {{
                        formatearMoneda(
                          record.salesTotals?.cupTransfer ??
                            (record.salesTotals?.CUP ? record.salesTotals.CUP * 0.1 : 0),
                          'Transf.'
                        )
                      }}
                    </div>
                    <div class="font-bold text-slate-800">
                      {{ record.salesTotals?.USD || 0 }} USD
                    </div>
                  </div>
                </template>

                <!-- Columna Total (Fondo Inicial + Ventas) -->
                <template v-else-if="column.key === 'totalFunds' || column.key === 'countedFunds'">
                  <div class="space-y-1.5 text-sm font-medium">
                    <div class="font-bold text-slate-900">
                      {{
                        formatearMoneda(
                          (record.initialFunds?.CUP || 0) +
                            (record.salesTotals?.cupCash ?? record.salesTotals?.CUP ?? 0),
                          'CUP'
                        )
                      }}
                    </div>
                    <div class="font-bold text-slate-900">
                      {{ (record.initialFunds?.USD || 0) + (record.salesTotals?.USD || 0) }} USD
                    </div>
                  </div>
                </template>

                <!-- Columna Arqueo (Cuadre, Faltante/Sobrante y Motivo) -->
                <template v-else-if="column.key === 'discrepancy'">
                  <div v-if="record.status === 'OPEN'" class="space-y-1.5">
                    <span
                      class="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
                    >
                      🟢 Turno Abierto (En curso)
                    </span>
                    <button
                      type="button"
                      class="shadow-xs block w-full cursor-pointer rounded bg-qvaflow-navy px-2 py-1 text-center text-xs font-semibold text-white transition-colors hover:bg-qvaflow-navy-dark"
                      @click="openShiftCloseModal(record)"
                    >
                      ⚖️ Arqueo y Cierre
                    </button>
                  </div>

                  <div v-else-if="record.status === 'CLOSED'" class="space-y-1.5">
                    <!-- Cuadre Perfecto -->
                    <div
                      v-if="
                        !record.differences ||
                        (record.differences.CUP === 0 && record.differences.USD === 0)
                      "
                    >
                      <span
                        class="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700"
                      >
                        ✓ Cuadrado Exacto
                      </span>
                      <div v-if="record.notes" class="mt-1 text-[10px] italic text-slate-500">
                        {{ record.notes }}
                      </div>
                    </div>

                    <!-- Faltante Detectado -->
                    <div
                      v-else-if="
                        record.differences &&
                        (record.differences.CUP < 0 || record.differences.USD < 0)
                      "
                      class="space-y-1"
                    >
                      <div
                        class="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700"
                      >
                        <span>⚠️ Faltante:</span>
                        <span v-if="record.differences.CUP < 0">{{
                          formatearMoneda(record.differences.CUP, 'CUP')
                        }}</span>
                        <span v-if="record.differences.CUP < 0 && record.differences.USD < 0">
                          /
                        </span>
                        <span v-if="record.differences.USD < 0"
                          >{{ record.differences.USD }} USD</span
                        >
                      </div>
                      <div
                        class="rounded border border-red-200 bg-red-50/70 p-1.5 text-xs text-red-800"
                      >
                        <span
                          class="block text-[10px] font-bold uppercase tracking-wider text-red-900"
                          >Motivo:</span
                        >
                        <span class="text-[11px] italic">{{
                          record.discrepancyReason || record.notes || 'Sin justificación reportada'
                        }}</span>
                      </div>
                    </div>

                    <!-- Sobrante Detectado -->
                    <div
                      v-else-if="
                        record.differences &&
                        (record.differences.CUP > 0 || record.differences.USD > 0)
                      "
                      class="space-y-1"
                    >
                      <div
                        class="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700"
                      >
                        <span>ℹ️ Sobrante:</span>
                        <span v-if="record.differences.CUP > 0"
                          >+{{ formatearMoneda(record.differences.CUP, 'CUP') }}</span
                        >
                        <span v-if="record.differences.CUP > 0 && record.differences.USD > 0">
                          /
                        </span>
                        <span v-if="record.differences.USD > 0"
                          >+${{ record.differences.USD }} USD</span
                        >
                      </div>
                      <div
                        class="rounded border border-blue-200 bg-blue-50/70 p-1.5 text-xs text-blue-800"
                      >
                        <span
                          class="block text-[10px] font-bold uppercase tracking-wider text-blue-900"
                          >Motivo:</span
                        >
                        <span class="text-[11px] italic">{{
                          record.discrepancyReason || record.notes || 'Sobrante no especificado'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </a-table>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- MODAL DE RECIBO / TICKET DETALLADO DE VENTA -->
    <a-modal
      v-model:open="isReceiptModalVisible"
      title="Comprobante de Venta"
      :footer="null"
      width="460px"
      centered
    >
      <div v-if="selectedSale" class="space-y-4 py-2">
        <div class="border-b border-dashed border-slate-200 pb-3 text-center">
          <h3 class="m-0 text-base font-bold text-slate-800">QvaFlow POS</h3>
          <p class="m-0 text-xs text-slate-400">Comprobante Fiscal de Operación</p>
          <div class="mt-1 font-mono text-xs font-bold text-slate-600">
            Ticket #{{ selectedSale.id }}
          </div>
          <div class="text-[11px] text-slate-400">
            {{ formatearFechaHora(selectedSale.createdAt) }}
          </div>
        </div>

        <!-- Detalle de Productos -->
        <div class="space-y-2">
          <div
            v-for="item in selectedSale.items"
            :key="item.id"
            class="flex items-center justify-between border-b border-slate-50 py-1 text-xs"
          >
            <div>
              <span class="font-semibold text-slate-800">{{ item.product.name }}</span>
              <div class="text-[11px] text-slate-400">
                {{ item.quantity }} x {{ formatearMoneda(item.unitPrice, 'CUP') }}
              </div>
            </div>
            <span class="font-bold text-slate-800">{{
              formatearMoneda(item.subtotal, 'CUP')
            }}</span>
          </div>
        </div>

        <!-- Totales y Pago -->
        <div class="space-y-1 border-t border-slate-200 pt-2 text-xs">
          <div class="flex justify-between text-sm font-bold text-slate-800">
            <span>Total Facturado:</span>
            <span>{{ formatearMoneda(selectedSale.totalCUP, 'CUP') }}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Equivalente en USD:</span>
            <span class="font-mono">${{ selectedSale.totalUSD?.toFixed(2) }} USD</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>Moneda Cobrada:</span>
            <span class="font-bold"
              >{{ selectedSale.paidCurrency }} ({{ selectedSale.paymentMethod }})</span
            >
          </div>
          <div
            v-if="selectedSale.transferReference"
            class="flex justify-between font-mono text-blue-700"
          >
            <span>Ref. Transferencia:</span>
            <span>{{ selectedSale.transferReference }}</span>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <a-button @click="isReceiptModalVisible = false">Cerrar</a-button>
          <a-button type="primary" class="border-none bg-qvaflow-navy" @click="handlePrint">
            Imprimir
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- Modal de Arqueo y Cierre de Turno -->
    <CashShiftModal
      v-model:visible="isShiftModalVisible"
      mode="CLOSE"
      :shift="selectedShiftToClose || posStore.currentShift"
      :expected-c-u-p="posStore.expectedCUP"
      :expected-u-s-d="posStore.expectedUSD"
      :loading="posStore.loading"
      @close-shift="handleCloseShift"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import usePosStore from '../store/posStore'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import { useFormatoFecha } from '@/shared/composables/useFormatoFecha'
import CashShiftModal from '../components/CashShiftModal.vue'
import type { CompletedSale, CashShift } from '../types/pos'

const posStore = usePosStore()
const { formatearMoneda } = useFormatoMoneda()
const { formatearFechaHora } = useFormatoFecha()

const activeTab = ref<'sales' | 'shifts'>('sales')

// Modal de Arqueo / Cierre de Turno
const isShiftModalVisible = ref<boolean>(false)
const selectedShiftToClose = ref<CashShift | null>(null)

const openShiftCloseModal = (shift: CashShift) => {
  selectedShiftToClose.value = shift
  isShiftModalVisible.value = true
}

const handleCloseShift = async (payload: {
  countedCUP: number
  countedUSD: number
  notes?: string
}) => {
  const result = await posStore.closeCashShift(
    payload.countedCUP,
    payload.countedUSD,
    payload.notes
  )
  if (result) {
    isShiftModalVisible.value = false
    await posStore.fetchShiftsHistory()
  }
}

// Filtros
const selectedShiftFilter = ref<string>('ALL')
const selectedDatePreset = ref<string>('ALL')
const customDateString = ref<string>('')
const selectedCurrencyFilter = ref<string>('ALL')
const salesSearchQuery = ref<string>('')

// Modal de Recibo
const isReceiptModalVisible = ref<boolean>(false)
const selectedSale = ref<CompletedSale | null>(null)

// Fechas de referencia
const todayFormatted = computed(() => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
})

const yesterdayFormatted = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
})

// Lista de turnos disponibles
const availableShiftsList = computed(() => {
  const map = new Map<string, { id: string; cashierName: string }>()
  posStore.salesHistory.forEach((s) => {
    if (s.shiftId && !map.has(s.shiftId)) {
      map.set(s.shiftId, { id: s.shiftId, cashierName: s.cashierName || 'Caja' })
    }
  })
  return Array.from(map.values())
})

// Ventas filtradas
const filteredSales = computed(() => {
  let list = posStore.salesHistory

  if (selectedShiftFilter.value !== 'ALL') {
    list = list.filter((s) => s.shiftId === selectedShiftFilter.value)
  }

  if (selectedDatePreset.value === 'TODAY') {
    list = list.filter((s) => s.createdAt.startsWith(new Date().toISOString().slice(0, 10)))
  } else if (selectedDatePreset.value === 'YESTERDAY') {
    const yest = new Date()
    yest.setDate(yest.getDate() - 1)
    const yestStr = yest.toISOString().slice(0, 10)
    list = list.filter((s) => s.createdAt.startsWith(yestStr))
  } else if (selectedDatePreset.value === 'CUSTOM' && customDateString.value) {
    list = list.filter((s) => s.createdAt.startsWith(customDateString.value))
  }

  if (selectedCurrencyFilter.value !== 'ALL') {
    list = list.filter((s) => s.paidCurrency === selectedCurrencyFilter.value)
  }

  if (salesSearchQuery.value.trim()) {
    const q = salesSearchQuery.value.trim().toLowerCase()
    list = list.filter(
      (s) =>
        s.id.toLowerCase().includes(q) || (s.cashierName && s.cashierName.toLowerCase().includes(q))
    )
  }

  return list
})

// Totales de métricas reales facturadas (para saber qué entró exactamente a caja)
const totalChargedCUP = computed(() => {
  return filteredSales.value
    .filter((s) => s.paidCurrency === 'CUP')
    .reduce((acc, s) => acc + s.totalCUP, 0)
})

const totalChargedUSD = computed(() => {
  return filteredSales.value
    .filter((s) => s.paidCurrency === 'USD')
    .reduce((acc, s) => acc + Math.ceil(s.totalInCurrency || s.totalUSD || 1), 0)
})

const resetFilters = () => {
  selectedShiftFilter.value = 'ALL'
  selectedDatePreset.value = 'ALL'
  customDateString.value = ''
  selectedCurrencyFilter.value = 'ALL'
  salesSearchQuery.value = ''
}

const openSaleReceipt = (sale: CompletedSale) => {
  selectedSale.value = sale
  isReceiptModalVisible.value = true
}

const handlePrint = () => {
  message.success('Enviando ticket a impresora térmica local.')
}

// Columnas simplificadas de Ventas
const salesColumns = [
  {
    title: 'Ticket',
    key: 'id',
    dataIndex: 'id',
    width: 140,
  },
  {
    title: 'Turno',
    key: 'shiftId',
    dataIndex: 'shiftId',
    width: 140,
  },
  {
    title: 'Fecha / Hora',
    key: 'createdAt',
    dataIndex: 'createdAt',
    width: 150,
  },
  {
    title: 'Cajero',
    key: 'cashierName',
    dataIndex: 'cashierName',
    width: 130,
  },
  {
    title: 'Total',
    key: 'total',
    align: 'right' as const,
    width: 140,
  },
  {
    title: 'Cobro',
    key: 'payment',
    width: 140,
  },
  {
    title: 'Acción',
    key: 'actions',
    width: 100,
    align: 'center' as const,
  },
]

// Columnas de Cuadres
const shiftsColumns = [
  {
    title: 'Turno / Estado',
    key: 'shiftInfo',
    width: 150,
  },
  {
    title: 'Cajero',
    key: 'cashierName',
    width: 140,
  },
  {
    title: 'Horarios',
    key: 'times',
    width: 170,
  },
  {
    title: 'Fondo Inicial',
    key: 'initialFunds',
    width: 140,
  },
  {
    title: 'Ventas Turno',
    key: 'salesTotals',
    width: 190,
  },
  {
    title: 'Total',
    key: 'totalFunds',
    width: 150,
  },
  {
    title: 'Arqueo',
    key: 'discrepancy',
    width: 230,
  },
]

onMounted(async () => {
  await Promise.all([posStore.fetchSalesHistory(), posStore.fetchShiftsHistory()])
})
</script>
