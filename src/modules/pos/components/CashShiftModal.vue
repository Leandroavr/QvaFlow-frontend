<template>
  <a-modal
    :open="visible"
    :title="isClosingMode ? 'Cierre y Arqueo de Caja' : 'Apertura de Turno de Caja'"
    :confirm-loading="loading"
    :ok-text="isClosingMode ? 'Finalizar Arqueo y Cerrar' : 'Abrir Turno de Caja'"
    cancel-text="Cancelar"
    width="580px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <!-- MODO 1: APERTURA DE TURNO -->
    <div v-if="!isClosingMode" class="py-2 space-y-4">
      <div class="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
        <strong>Fondo Inicial de Caja:</strong> Ingrese el dinero en efectivo entregado al inicio del turno para cambio y operaciones iniciales.
      </div>

      <a-form layout="vertical">
        <a-form-item label="Nombre del Cajero / Responsable">
          <a-input v-model:value="openForm.cashierName" placeholder="Ej. Yadira Reyes" />
        </a-form-item>

        <a-row :gutter="16">
          <a-col :xs="24" :sm="12">
            <a-form-item label="Fondo Inicial en CUP (🇨🇺)">
              <a-input-number
                v-model:value="openForm.initialCUP"
                :min="0"
                :precision="0"
                class="w-full text-base font-bold"
                prefix="$"
                placeholder="0"
              />
              <span class="text-[11px] text-slate-400">Sin centavos (entero)</span>
            </a-form-item>
          </a-col>

          <a-col :xs="24" :sm="12">
            <a-form-item label="Fondo Inicial en USD (🇺🇸)">
              <a-input-number
                v-model:value="openForm.initialUSD"
                :min="0"
                :precision="2"
                class="w-full text-base font-bold"
                prefix="$"
                placeholder="0.00"
              />
              <span class="text-[11px] text-slate-400">Billetes extranjeros</span>
            </a-form-item>
          </a-col>
        </a-row>

        <!-- Tasa de Cambio Diaria Obligatoria -->
        <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
          <a-form-item label="Tasa de Cambio Diaria (CUP x USD)" class="mb-0">
            <a-input-number
              v-model:value="openForm.dailyRateUSD"
              :min="1"
              :precision="0"
              class="w-full text-lg font-black text-emerald-700"
              prefix="1 USD = $"
              suffix="CUP"
              placeholder="360"
            />
          </a-form-item>
          <span class="text-[11px] text-slate-500 mt-1 block">
            Fija el valor oficial del turno. El canje en mostrador aplicará automáticamente el margen de -10 CUP (tasa de canje = {{ openForm.dailyRateUSD - 10 }} CUP).
          </span>
        </div>
      </a-form>
    </div>

    <!-- MODO 2: CIERRE Y ARQUEO DE CAJA -->
    <div v-else class="py-2 space-y-4">
      <!-- Desglose de totales calculados por el sistema -->
      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
        <div class="flex justify-between text-slate-500">
          <span>Turno Activo:</span>
          <span class="font-bold text-slate-800">
            {{ shift?.id }} (Iniciado: {{ shift?.openedAt }}) • Tasa Turno: 1 USD = {{ shift?.dailyRateUSD || 360 }} CUP
          </span>
        </div>

        <div class="border-t border-slate-200 pt-2 grid grid-cols-2 gap-4">
          <!-- Columna CUP -->
          <div>
            <span class="font-bold text-slate-700 block mb-1">Pesos Cubanos (CUP):</span>
            <div class="text-[11px] text-slate-500 space-y-0.5">
              <div>Fondo Inicial: {{ formatearMoneda(shift?.initialFunds.CUP, 'CUP') }}</div>
              <div>Ventas en Efectivo: +{{ formatearMoneda(shift?.salesTotals.cupCash ?? shift?.salesTotals.CUP, 'CUP') }}</div>
              <div class="text-blue-700 font-medium">Ventas por Transf.: {{ formatearMoneda(shift?.salesTotals.cupTransfer || 0, 'CUP') }} (En cuenta banco)</div>
              <div>Canjes en Mostrador: {{ (shift?.exchangeAdjustments.CUP || 0) >= 0 ? '+' : '' }}{{ formatearMoneda(shift?.exchangeAdjustments.CUP, 'CUP') }}</div>
              <div class="font-bold text-slate-900 border-t border-slate-200 pt-0.5">
                Total Físico en Gaveta: {{ formatearMoneda(expectedCUP, 'CUP') }}
              </div>
            </div>
          </div>

          <!-- Columna USD -->
          <div>
            <span class="font-bold text-slate-700 block mb-1">Dólares (USD):</span>
            <div class="text-[11px] text-slate-500 space-y-0.5">
              <div>Fondo Inicial: ${{ Math.round(shift?.initialFunds.USD || 0) }} USD</div>
              <div>Ventas en Efectivo: +${{ Math.round(shift?.salesTotals.USD || 0) }} USD</div>
              <div>Canjes en Mostrador: {{ (shift?.exchangeAdjustments.USD || 0) >= 0 ? '+' : '' }}${{ Math.round(shift?.exchangeAdjustments.USD || 0) }} USD</div>
              <div class="font-bold text-slate-900 border-t border-slate-200 pt-0.5">
                Total Físico en Gaveta: ${{ Math.round(expectedUSD) }} USD
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario para ingresar el efectivo contado físicamente -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">
          Efectivo Físico Contado en Caja
        </h4>

        <a-row :gutter="16">
          <a-col :xs="24" :sm="12">
            <a-form-item label="Efectivo Físico CUP Contado" class="mb-0">
              <a-input-number
                v-model:value="closeForm.countedCUP"
                :min="0"
                :precision="0"
                class="w-full text-base font-bold"
                prefix="$"
              />
            </a-form-item>
            <!-- Diferencia CUP -->
            <div class="text-xs font-semibold mt-1" :class="getDiffClass(diffCUP)">
              {{ getDiffLabel(diffCUP, 'CUP') }}
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <a-form-item label="Efectivo Físico USD Contado" class="mb-0">
              <a-input-number
                v-model:value="closeForm.countedUSD"
                :min="0"
                :precision="0"
                :step="1"
                class="w-full text-base font-bold"
                prefix="$"
              />
            </a-form-item>
            <!-- Diferencia USD -->
            <div class="text-xs font-semibold mt-1" :class="getDiffClass(diffUSD)">
              {{ getDiffLabel(diffUSD, 'USD') }}
            </div>
          </a-col>
        </a-row>

        <!-- Alerta visual de Faltante o Sobrante -->
        <div
          v-if="diffCUP < 0 || diffUSD < 0"
          class="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
        >
          <span class="text-base leading-none">⚠️</span>
          <div>
            <strong>Faltante de dinero detectado en caja.</strong>
            <div>
              {{ diffCUP < 0 ? `Faltan ${Math.abs(diffCUP)} CUP. ` : '' }}
              {{ diffUSD < 0 ? `Faltan $${Math.abs(diffUSD)} USD. ` : '' }}
              Debe registrar obligatoriamente el motivo o justificación antes de proceder al cierre.
            </div>
          </div>
        </div>

        <div
          v-else-if="diffCUP > 0 || diffUSD > 0"
          class="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-start gap-2"
        >
          <span class="text-base leading-none">ℹ️</span>
          <div>
            <strong>Sobrante de efectivo en caja.</strong>
            <div>
              {{ diffCUP > 0 ? `Sobran ${diffCUP} CUP. ` : '' }}
              {{ diffUSD > 0 ? `Sobran $${diffUSD} USD. ` : '' }}
              Indique la procedencia o justificación de los fondos adicionales.
            </div>
          </div>
        </div>

        <a-form-item
          :label="diffCUP !== 0 || diffUSD !== 0 ? 'Motivo / Justificación del Descuadre (Obligatorio)' : 'Observaciones del Arqueo (Opcional)'"
          class="mt-2 mb-0"
        >
          <a-textarea
            v-model:value="closeForm.notes"
            :placeholder="diffCUP < 0 || diffUSD < 0 ? 'Explique detalladamente el motivo del faltante (ej. ajuste por cambio en vueltos, billete deteriorado...)' : 'Justificación de sobrantes/faltantes o notas para la administración...'"
            :rows="2"
          />
        </a-form-item>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { CashShift } from '../types/pos'

interface Props {
  visible: boolean
  mode: 'OPEN' | 'CLOSE'
  shift?: CashShift | null
  expectedCUP: number
  expectedUSD: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  mode: 'OPEN',
  shift: null,
  expectedCUP: 0,
  expectedUSD: 0,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (
    e: 'open-shift',
    payload: { initialCUP: number; initialUSD: number; cashierName: string; dailyRateUSD: number }
  ): void
  (e: 'close-shift', payload: { countedCUP: number; countedUSD: number; notes?: string }): void
}>()

const { formatearMoneda } = useFormatoMoneda()
const isClosingMode = computed(() => props.mode === 'CLOSE')

// Formularios
const openForm = reactive({
  initialCUP: 5000,
  initialUSD: 50,
  cashierName: 'Caja Principal',
  dailyRateUSD: 360,
})

const closeForm = reactive({
  countedCUP: 0,
  countedUSD: 0,
  notes: '',
})

// Al abrir en modo cierre, prellenamos con el valor esperado para facilitar el cotejo
watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen && props.mode === 'CLOSE') {
      closeForm.countedCUP = props.expectedCUP
      closeForm.countedUSD = props.expectedUSD
      closeForm.notes = ''
    }
  }
)

const diffCUP = computed(() => Math.round(closeForm.countedCUP - props.expectedCUP))
const diffUSD = computed(() => Math.round(closeForm.countedUSD - props.expectedUSD))

const getDiffClass = (diff: number) => {
  if (Math.abs(diff) === 0) return 'text-emerald-600'
  if (diff > 0) return 'text-blue-600'
  return 'text-red-600'
}

const getDiffLabel = (diff: number, currency: string) => {
  if (Math.abs(diff) === 0) return '✓ Cuadre perfecto (Sin diferencias)'
  if (diff > 0) return `▲ Sobrante: +${diff} ${currency}`
  return `▼ Faltante: ${diff} ${currency}`
}

const handleOk = () => {
  if (!isClosingMode.value) {
    if (!openForm.cashierName.trim()) {
      message.warning('Indique el nombre del cajero responsable.')
      return
    }
    if (!openForm.dailyRateUSD || openForm.dailyRateUSD <= 0) {
      message.warning('Debe fijar una Tasa de Cambio Diaria (CUP x USD) válida.')
      return
    }
    emit('open-shift', { ...openForm })
  } else {
    if ((diffCUP.value !== 0 || diffUSD.value !== 0) && !closeForm.notes.trim()) {
      message.error(
        diffCUP.value < 0 || diffUSD.value < 0
          ? 'Existe un faltante en caja. Debe registrar obligatoriamente el motivo del faltante antes de cerrar el turno.'
          : 'Existe una diferencia en caja. Debe registrar la justificación en las observaciones.'
      )
      return
    }
    emit('close-shift', { ...closeForm })
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
