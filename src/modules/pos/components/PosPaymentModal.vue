<template>
  <a-modal
    :open="visible"
    title="Finalizar Venta y Cobro"
    :confirm-loading="loading"
    ok-text="Confirmar Cobro"
    cancel-text="Cancelar"
    width="520px"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="space-y-4 py-2">
      <!-- Resumen del Total a Pagar -->
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-1 flex items-center justify-between">
          <span class="text-xs font-medium uppercase tracking-wide text-slate-500"
            >Total en Moneda Base</span
          >
          <span class="text-sm font-semibold text-slate-700">
            {{ formatearMoneda(totalCUP, 'CUP') }}
          </span>
        </div>

        <div class="flex items-baseline justify-between border-t border-slate-200 pt-2">
          <div>
            <span class="block text-xs text-slate-500">Total a Pagar ({{ currency }})</span>
            <span v-if="currency !== 'CUP'" class="font-mono text-[11px] text-emerald-600">
              Tasa: 1 {{ currency }} = {{ exchangeRate }} CUP
            </span>
          </div>

          <div class="text-right">
            <span class="text-2xl font-black tracking-tight text-emerald-600">
              {{ formatearMoneda(totalInCurrency, currency) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Importe entregado por el cliente -->
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-700">
          Efectivo Recibido (en {{ currency }}):
        </label>
        <a-input-number
          v-model:value="cashReceived"
          :min="0"
          :precision="2"
          class="w-full text-lg"
          size="large"
          placeholder="0.00"
          :prefix="currencySymbol"
        />

        <!-- Botones de monto rápido -->
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
            @click="setExactCash"
          >
            Exacto ({{ totalInCurrency }})
          </button>
          <button
            v-for="quickAmount in quickCashOptions"
            :key="quickAmount"
            type="button"
            class="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
            @click="cashReceived = quickAmount"
          >
            {{ quickAmount }} {{ currency }}
          </button>
        </div>
      </div>

      <!-- Cálculo de Vuelto / Cambio -->
      <div
        class="flex items-center justify-between rounded-lg border p-3.5"
        :class="[
          isPaymentSufficient
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800',
        ]"
      >
        <div>
          <span class="block text-xs font-semibold">
            {{ isPaymentSufficient ? 'Vuelto / Cambio a entregar:' : 'Falta para completar pago:' }}
          </span>
          <span v-if="isPaymentSufficient && currency !== 'CUP'" class="text-[11px] opacity-75">
            Equivalente en CUP: {{ formatearMoneda(changeInCUP, 'CUP') }}
          </span>
        </div>

        <div class="text-right">
          <span class="text-lg font-bold">
            {{ formatearMoneda(Math.abs(changeAmount), currency) }}
          </span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { PaymentCurrency } from '../types/pos'

interface Props {
  visible: boolean
  totalCUP: number
  totalInCurrency: number
  currency: PaymentCurrency
  exchangeRate: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'confirm', cashReceived: number): void
}>()

const { formatearMoneda } = useFormatoMoneda()

const cashReceived = ref<number>(0)

// Inicializar el monto recibido con el total exacto cuando se abre el modal
watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      cashReceived.value = props.totalInCurrency
    }
  }
)

const currencySymbol = computed(() => {
  if (props.currency === 'EUR') return '€'
  return '$'
})

const changeAmount = computed(() => {
  return Number((cashReceived.value - props.totalInCurrency).toFixed(2))
})

const isPaymentSufficient = computed(() => {
  return changeAmount.value >= -0.001
})

const changeInCUP = computed(() => {
  if (props.currency === 'CUP') return changeAmount.value
  return Number((changeAmount.value * props.exchangeRate).toFixed(2))
})

// Opciones de redondeo rápido para efectivo según la moneda
const quickCashOptions = computed(() => {
  const current = props.totalInCurrency
  if (props.currency === 'CUP') {
    return [500, 1000, 2000, 5000].filter((val) => val > current).slice(0, 3)
  }
  return [10, 20, 50, 100].filter((val) => val > current).slice(0, 3)
})

const setExactCash = () => {
  cashReceived.value = props.totalInCurrency
}

const handleConfirm = () => {
  if (!isPaymentSufficient.value) {
    message.warning('El importe recibido es menor que el total de la venta.')
    return
  }
  emit('confirm', cashReceived.value)
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
