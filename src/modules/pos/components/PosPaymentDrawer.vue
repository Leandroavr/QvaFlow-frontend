<template>
  <a-drawer
    :open="visible"
    title="Cobro y Pasarelas de Pago (F8)"
    placement="right"
    width="540"
    :body-style="{ paddingBottom: '90px' }"
    @close="handleClose"
  >
    <div class="space-y-4">
      <!-- RESUMEN DEL TOTAL A COBRAR -->
      <div class="rounded-xl bg-slate-900 p-4 text-white shadow-md">
        <div class="mb-1 flex items-center justify-between text-xs text-slate-300">
          <span>Total en Moneda Base (CUP):</span>
          <span class="font-mono font-bold text-white">{{ formatearMoneda(totalCUP, 'CUP') }}</span>
        </div>

        <div class="flex items-baseline justify-between border-t border-slate-700 pt-2">
          <div>
            <span class="block text-xs text-slate-300">Total a Pagar en {{ currency }}:</span>
            <span v-if="currency !== 'CUP'" class="font-mono text-[11px] text-emerald-400">
              Tasa: 1 {{ currency }} = {{ exchangeRate }} CUP
            </span>
          </div>

          <div class="text-right">
            <span class="text-3xl font-black tracking-tight text-emerald-400">
              {{ formatearMoneda(effectiveTotalDue, currency) }}
            </span>
          </div>
        </div>
      </div>

      <!-- TABS DE MÉTODOS DE PAGO: EFECTIVO VS TRANSFERENCIA / QR -->
      <a-tabs v-model:activeKey="paymentMethod" class="payment-tabs">
        <!-- PESTAÑA 1: PAGO EN EFECTIVO -->
        <a-tab-pane key="CASH" tab="💵 Efectivo y Vuelto">
          <div class="space-y-4 pt-1">
            <!-- Entrada de Efectivo Recibido -->
            <div>
              <label class="mb-1.5 block text-xs font-bold uppercase text-slate-700">
                Efectivo Recibido (en {{ currency }}):
              </label>
              <a-input-number
                v-model:value="cashReceived"
                :min="0"
                :precision="currency === 'CUP' || currency === 'USD' ? 0 : 2"
                class="w-full text-xl font-bold"
                size="large"
                placeholder="0"
                :prefix="currency === 'EUR' ? '€' : '$'"
              />

              <!-- Calculadora de Denominaciones Rápidas -->
              <div class="mt-2.5">
                <span class="mb-1.5 block text-[11px] font-semibold uppercase text-slate-400">
                  Billetes Rápidos:
                </span>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                    @click="setExactCash"
                  >
                    Exacto ({{ effectiveTotalDue }})
                  </button>

                  <button
                    v-for="quick in quickCashDenominations"
                    :key="quick"
                    type="button"
                    class="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    @click="addCash(quick)"
                  >
                    +{{ quick }} {{ currency }}
                  </button>

                  <button
                    type="button"
                    class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600"
                    @click="cashReceived = 0"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            <!-- Panel de Cálculo de Vuelto (Estricto sin centavos en CUP) -->
            <div
              class="rounded-xl border p-4 transition-all"
              :class="[
                isCashSufficient
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm'
                  : 'border-amber-300 bg-amber-50 text-amber-900',
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="block text-xs font-bold uppercase tracking-wider">
                    {{ isCashSufficient ? 'Vuelto / Cambio a Entregar:' : 'Falta por Pagar:' }}
                  </span>
                  <span v-if="currency === 'CUP'" class="text-[11px] text-slate-500">
                    Regla de arqueo: Sin centavos
                  </span>
                  <div v-else-if="isCashSufficient" class="mt-0.5 space-y-0.5">
                    <span
                      v-if="currency === 'USD'"
                      class="block text-[11px] font-bold text-emerald-700"
                    >
                      💵 Vuelto a entregar al cliente en CUP:
                      {{ formatearMoneda(changeInCUP, 'CUP') }}
                    </span>
                    <span v-else class="block text-[11px] opacity-80">
                      Equivalente en CUP: {{ formatearMoneda(changeInCUP, 'CUP') }}
                    </span>
                    <span class="block text-[10px] text-slate-500">
                      (Tasa aplicada: 1 {{ currency }} = {{ exchangeRate }} CUP)
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-2xl font-black">
                    {{ formatearMoneda(Math.abs(changeDue), currency) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- PESTAÑA 2: PASARELA QR CUBANA (Transfermóvil / EnZona) -->
        <a-tab-pane key="TRANSFER_QR" tab="📱 Transferencia / QR">
          <div class="space-y-4 pt-1">
            <!-- Selector de Pasarela -->
            <div class="grid grid-cols-2 gap-3">
              <div
                class="cursor-pointer select-none rounded-xl border-2 p-3 text-center transition-all"
                :class="[
                  selectedGateway === 'TRANSFERMOVIL'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ]"
                @click="selectedGateway = 'TRANSFERMOVIL'"
              >
                <div class="mb-0.5 text-xl">📲</div>
                <div class="text-xs font-bold">Transfermóvil</div>
                <div class="text-[10px] opacity-75">BPA / BANDEC / BM</div>
              </div>

              <div
                class="cursor-pointer select-none rounded-xl border-2 p-3 text-center transition-all"
                :class="[
                  selectedGateway === 'ENZONA'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                ]"
                @click="selectedGateway = 'ENZONA'"
              >
                <div class="mb-0.5 text-xl">💳</div>
                <div class="text-xs font-bold">EnZona</div>
                <div class="text-[10px] opacity-75">Pasarela XETID</div>
              </div>
            </div>

            <!-- Código QR Estático Simulado -->
            <div
              class="shadow-xs flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center"
            >
              <div
                class="mb-2 flex h-36 w-36 items-center justify-center rounded-lg bg-slate-900 p-2.5 text-white shadow-inner"
              >
                <!-- Gráfico de Código QR -->
                <div class="flex h-full w-full flex-col justify-between rounded bg-white p-1">
                  <div class="flex justify-between">
                    <div class="rounded-xs h-7 w-7 bg-black"></div>
                    <div class="rounded-xs h-7 w-7 bg-black"></div>
                  </div>
                  <div class="text-center font-mono text-[9px] font-extrabold text-black">
                    QvaFlow-PAY
                  </div>
                  <div class="flex items-end justify-between">
                    <div class="rounded-xs h-7 w-7 bg-black"></div>
                    <div class="rounded-xs h-4 w-4 bg-black"></div>
                  </div>
                </div>
              </div>

              <span class="text-xs font-bold text-slate-800">
                Escanee con {{ selectedGateway === 'TRANSFERMOVIL' ? 'Transfermóvil' : 'EnZona' }}
              </span>
              <span class="mt-0.5 text-xs font-extrabold text-emerald-600">
                Monto: {{ formatearMoneda(totalCUP, 'CUP') }}
              </span>
            </div>

            <!-- Campo Obligatorio: Número de Referencia / Transacción Bancaria -->
            <div>
              <label class="mb-1 block text-xs font-bold text-slate-700">
                Número de Referencia / ID Transacción: <span class="text-red-500">*</span>
              </label>
              <a-input
                v-model:value="transferReference"
                placeholder="Ej. FT2629812450 o ID de Operación"
                size="large"
                class="font-mono"
                allow-clear
              />
              <span class="mt-1 block text-[11px] text-slate-400">
                Verifique en el móvil del cliente el mensaje bancario antes de confirmar.
              </span>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>

    <!-- FOOTER FIJO DEL DRAWER -->
    <div
      class="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5 shadow-lg"
    >
      <a-button size="large" @click="handleClose">Cancelar</a-button>

      <a-button
        type="primary"
        size="large"
        :loading="loading"
        :disabled="isConfirmDisabled"
        class="flex items-center gap-1.5 border-none bg-emerald-600 font-bold shadow-md hover:bg-emerald-500"
        @click="handleConfirm"
      >
        <span>Confirmar Cobro e Imprimir</span>
      </a-button>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { PaymentCurrency, PaymentMethod, TransferGateway } from '../types/pos'

interface Props {
  visible: boolean
  totalCUP: number
  totalInCurrency: number
  currency: PaymentCurrency
  exchangeRate: number
  loading?: boolean
  initialPaymentMethod?: PaymentMethod
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
  initialPaymentMethod: 'CASH',
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (
    e: 'confirm',
    payload: {
      cashReceived: number
      paymentMethod: PaymentMethod
      transferGateway?: TransferGateway
      transferReference?: string
    }
  ): void
}>()

const { formatearMoneda } = useFormatoMoneda()

const paymentMethod = ref<PaymentMethod>('CASH')
const selectedGateway = ref<TransferGateway>('TRANSFERMOVIL')
const transferReference = ref<string>('')
const cashReceived = ref<number>(0)

// Total a cobrar ajustado (en CUP estrictamente sin centavos; en USD redondeado hacia arriba entero)
const effectiveTotalDue = computed(() => {
  if (props.currency === 'CUP') {
    return Math.round(props.totalCUP)
  }
  if (props.currency === 'USD') {
    return Math.ceil(props.totalInCurrency)
  }
  return props.totalInCurrency
})

// Al abrir el drawer, inicializamos el efectivo recibido con el monto exacto
watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      paymentMethod.value = props.initialPaymentMethod || 'CASH'
      transferReference.value = ''
      setExactCash()
    }
  }
)

const setExactCash = () => {
  cashReceived.value = effectiveTotalDue.value
}

const addCash = (amount: number) => {
  cashReceived.value = (cashReceived.value || 0) + amount
}

// Denominaciones rápidas según la moneda (en USD billetes comunes de 1, 5, 10, 20, 50, 100)
const quickCashDenominations = computed(() => {
  if (props.currency === 'CUP') {
    return [500, 1000, 2000, 5000]
  }
  if (props.currency === 'USD') {
    return [1, 5, 10, 20, 50, 100]
  }
  return [10, 20, 50, 100]
})

// Cálculo de vuelto con regla estricta (en CUP y USD números enteros de billetes)
const changeDue = computed(() => {
  const diff = (cashReceived.value || 0) - effectiveTotalDue.value
  if (props.currency === 'CUP' || props.currency === 'USD') {
    return Math.round(diff)
  }
  return Number(diff.toFixed(2))
})

const isCashSufficient = computed(() => {
  return changeDue.value >= -0.001
})

// Vuelto exacto en CUP a entregar al cliente considerando la tasa real de canje
const changeInCUP = computed(() => {
  if (props.currency === 'CUP') return changeDue.value
  // Calculamos el valor en CUP de todo el efectivo extranjero entregado menos el costo en CUP
  const cashReceivedInCUP = (cashReceived.value || 0) * props.exchangeRate
  return Math.max(0, Math.round(cashReceivedInCUP - props.totalCUP))
})

const isConfirmDisabled = computed(() => {
  if (paymentMethod.value === 'CASH') {
    return !isCashSufficient.value
  }
  // En transferencia QR, el número de referencia es obligatorio
  return !transferReference.value.trim()
})

const handleConfirm = () => {
  if (paymentMethod.value === 'CASH') {
    if (!isCashSufficient.value) {
      message.warning('El efectivo recibido es menor al total a cobrar.')
      return
    }

    emit('confirm', {
      cashReceived: cashReceived.value,
      paymentMethod: 'CASH',
    })
  } else {
    if (!transferReference.value.trim()) {
      message.warning('Debe registrar el número de referencia o ID de la transferencia bancaria.')
      return
    }

    emit('confirm', {
      cashReceived: effectiveTotalDue.value,
      paymentMethod: 'TRANSFER_QR',
      transferGateway: selectedGateway.value,
      transferReference: transferReference.value.trim(),
    })
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
:deep(.payment-tabs .ant-tabs-nav) {
  margin-bottom: 12px;
}
</style>
