<template>
  <a-modal
    :open="visible"
    title="Operación de Canje de Divisas en Mostrador (F6)"
    :confirm-loading="loading"
    ok-text="Registrar Canje en Caja"
    cancel-text="Cancelar"
    width="540px"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="py-2 space-y-4">
      <!-- Tarjeta Resumen de Tasa con Margen -->
      <div class="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span class="font-bold block text-sm">Canje Oficial de Mostrador</span>
          <span class="text-[11px] opacity-80">Compra de divisas al cliente para fondo de caja</span>
        </div>
        <div class="text-right">
          <span class="text-[11px] text-slate-500 block">Tasa Fija Canje:</span>
          <span class="font-mono font-black text-emerald-700 text-base">
            1 {{ currencyFrom }} = {{ effectiveExchangeRate }} CUP
          </span>
        </div>
      </div>

      <!-- Dirección del Canje -->
      <a-row :gutter="16">
        <a-col :span="12">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
            Moneda Recibida (Cliente entrega):
          </label>
          <a-select
            v-model:value="currencyFrom"
            class="w-full font-bold"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
          >
            <a-select-option value="USD">🇺🇸 Dólar (USD)</a-select-option>
            <a-select-option value="EUR">🇪🇺 Euro (EUR)</a-select-option>
            <a-select-option value="MLC">💳 MLC</a-select-option>
          </a-select>
        </a-col>

        <a-col :span="12">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
            Moneda a Entregar (Caja paga):
          </label>
          <a-input value="🇨🇺 Peso Cubano (CUP)" disabled class="font-bold bg-slate-100 text-slate-800" />
        </a-col>
      </a-row>

      <!-- Campo de Tasa de Canje (Estrictamente de Solo Lectura con Margen de -10 CUP) -->
      <div>
        <label class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
          Tasa de Canje Aplicada (Solo Lectura):
        </label>
        <a-input
          :value="`1 ${currencyFrom} = ${effectiveExchangeRate} CUP`"
          disabled
          class="font-mono font-black text-emerald-800 bg-slate-100 text-base"
        />
        <div class="mt-1 p-2 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-800 leading-snug">
          📌 <strong>Regla de Margen Fijo:</strong> Se toma la Tasa Diaria Oficial ({{ dailyBaseRate }} CUP) y se descuenta automáticamente el margen operativo fijo de <strong>-10 CUP</strong> ({{ dailyBaseRate }} - 10 = <strong>{{ effectiveExchangeRate }} CUP</strong>).
        </div>
      </div>

      <!-- Importe a recibir del cliente -->
      <div>
        <label class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
          Importe Recibido del Cliente (en {{ currencyFrom }}):
        </label>
        <a-input-number
          v-model:value="amountFrom"
          :min="1"
          :precision="2"
          class="w-full text-lg font-bold"
          size="large"
          placeholder="0.00"
          prefix="$"
        />

        <!-- Botones de billetes comunes -->
        <div class="flex gap-2 mt-2">
          <button
            v-for="quick in [10, 20, 50, 100]"
            :key="quick"
            type="button"
            class="px-2.5 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
            @click="amountFrom = quick"
          >
            {{ quick }} {{ currencyFrom }}
          </button>
        </div>
      </div>

      <!-- Cálculo Automático a Entregar en CUP (Estricto sin centavos) -->
      <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>Fórmula de Conversión:</span>
          <span class="font-mono font-bold text-slate-700">{{ amountFrom || 0 }} {{ currencyFrom }} × {{ effectiveExchangeRate }} CUP</span>
        </div>

        <div class="flex items-baseline justify-between pt-2 border-t border-slate-200">
          <div>
            <span class="text-xs font-bold text-slate-700 block">Monto a Entregar al Cliente (CUP):</span>
            <span class="text-[11px] text-slate-400">Redondeado sin centavos</span>
          </div>
          <span class="text-2xl font-black text-emerald-600">
            {{ formatearMoneda(amountToCUP, 'CUP') }}
          </span>
        </div>
      </div>

      <!-- Impacto en Caja -->
      <div class="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-600 space-y-1 border border-slate-200">
        <span class="font-bold text-slate-700 block">Impacto en el Arqueo de Caja del Turno:</span>
        <div class="flex justify-between text-[11px]">
          <span class="text-emerald-700 font-bold">+{{ amountFrom || 0 }} {{ currencyFrom }} (Ingresa a caja)</span>
          <span class="text-red-700 font-bold">-{{ amountToCUP }} CUP (Sale de caja)</span>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { PaymentCurrency, ExchangeRates } from '../types/pos'

interface Props {
  visible: boolean
  exchangeRates: ExchangeRates
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (
    e: 'submit',
    payload: {
      currencyFrom: PaymentCurrency
      amountFrom: number
      currencyTo: PaymentCurrency
      amountTo: number
      rate: number
    }
  ): void
}>()

const { formatearMoneda } = useFormatoMoneda()

const currencyFrom = ref<PaymentCurrency>('USD')
const amountFrom = ref<number>(20)

// Tasa base oficial fijada en la apertura del turno
const dailyBaseRate = computed(() => {
  return props.exchangeRates[currencyFrom.value] || 360
})

// REGLA DE NEGOCIO ESTRICTA: Tasa de canje = Tasa Diaria - 10 CUP (margen operativo fijo)
const effectiveExchangeRate = computed(() => {
  const base = dailyBaseRate.value
  return Math.max(1, base - 10)
})

// Cálculo de CUP a entregar (estricto sin centavos)
const amountToCUP = computed(() => {
  const raw = (amountFrom.value || 0) * effectiveExchangeRate.value
  return Math.round(raw)
})

const handleConfirm = () => {
  if (!amountFrom.value || amountFrom.value <= 0) {
    message.warning('Ingrese un monto válido para el canje.')
    return
  }

  emit('submit', {
    currencyFrom: currencyFrom.value,
    amountFrom: amountFrom.value,
    currencyTo: 'CUP',
    amountTo: amountToCUP.value,
    rate: effectiveExchangeRate.value,
  })
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
