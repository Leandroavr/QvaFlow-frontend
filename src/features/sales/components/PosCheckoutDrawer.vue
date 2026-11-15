<template>
  <BaseDrawer
    :open="open"
    title="Cobro de Venta"
    size="md"
    :auto-focus-first-input="true"
    @update:open="handleOpenUpdate"
  >
    <!-- Alerta de Error del Servidor (400, 409, STOCK_INSUFFICIENT, etc.) -->
    <div
      v-if="checkout.serverError.value"
      class="mb-4 flex flex-col gap-1.5 rounded-lg border border-state-error-border bg-state-error-bg p-3 text-xs text-state-error"
      role="alert"
      data-testid="pos-checkout-error-alert"
    >
      <div class="flex items-center gap-2 font-semibold">
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span>{{ checkout.serverError.value }}</span>
      </div>
      <!-- Detalles de stock insuficiente si aplican -->
      <ul
        v-if="checkout.stockErrors.value"
        class="mt-1 list-inside list-disc space-y-0.5 text-[11px]"
      >
        <li
          v-for="(messages, code) in checkout.stockErrors.value"
          :key="code"
          data-testid="pos-stock-error-item"
        >
          <span class="font-mono font-medium">{{ code }}:</span>
          {{ messages.join(', ') }}
        </li>
      </ul>
    </div>

    <!-- Pestañas por Forma de Cobro: CUP Efectivo, CUP Transferencia, USD Efectivo -->
    <div class="flex rounded-lg border border-border-subtle bg-surface-sunken p-1">
      <button
        type="button"
        class="flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all"
        :class="
          activeTab === 'CUP_CASH'
            ? 'bg-surface-card text-primary shadow-xs'
            : 'text-content-secondary hover:text-content-primary'
        "
        data-testid="tab-cup-cash"
        @click="selectTab('CUP_CASH')"
      >
        CUP Efectivo
      </button>

      <button
        type="button"
        class="flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all"
        :class="
          activeTab === 'CUP_TRANSFER'
            ? 'bg-surface-card text-primary shadow-xs'
            : 'text-content-secondary hover:text-content-primary'
        "
        data-testid="tab-cup-transfer"
        @click="selectTab('CUP_TRANSFER')"
      >
        CUP Transferencia
      </button>

      <button
        type="button"
        class="flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition-all"
        :class="
          activeTab === 'USD_CASH'
            ? 'bg-surface-card text-primary shadow-xs'
            : 'text-content-secondary hover:text-content-primary'
        "
        data-testid="tab-usd-cash"
        @click="selectTab('USD_CASH')"
      >
        USD Efectivo
      </button>
    </div>

    <!-- CUERPO SEGÚN PESTAÑA ACTIVA -->
    <div class="mt-5 space-y-5">
      <!-- 1. Cuadro de Resumen de Total a Cobrar -->
      <div
        class="flex flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-sunken/40 p-4 text-center"
      >
        <span class="text-xs font-medium uppercase tracking-wider text-content-secondary">
          Total a Cobrar
        </span>

        <!-- Total en CUP -->
        <div v-if="activeTab !== 'USD_CASH'" class="mt-1 flex items-baseline gap-1.5">
          <span
            class="font-mono text-3xl font-extrabold text-content-primary"
            data-testid="total-charge-cup"
          >
            {{ totalCUP }}
          </span>
          <span class="text-sm font-bold text-content-tertiary">CUP</span>
        </div>

        <!-- Total en USD (con ceil) -->
        <div v-else class="mt-1 flex flex-col items-center">
          <div class="flex items-baseline gap-1.5">
            <span
              class="font-mono text-3xl font-extrabold text-content-primary"
              data-testid="total-charge-usd"
            >
              {{ totalUSD }}
            </span>
            <span class="text-sm font-bold text-content-tertiary">USD</span>
          </div>

          <div class="mt-1 flex items-center gap-2 text-[11px] text-content-muted">
            <span data-testid="raw-usd-estimate">
              (Estimación: {{ rawUSDEstimate }} USD &rarr; {{ totalUSD }} USD ceil)
            </span>
            <span>&bull;</span>
            <span data-testid="effective-rate-usd"> 1 USD = {{ effectiveRateUSD }} CUP </span>
          </div>
        </div>
      </div>

      <!-- 2. Campos de Entrada según Método -->

      <!-- OPCIÓN A: CUP EFECTIVO -->
      <div v-if="activeTab === 'CUP_CASH'" class="space-y-4">
        <BaseFormField
          label="Efectivo recibido"
          required
          description="Ingrese el monto entregado por el cliente en billetes CUP."
        >
          <BaseInput
            ref="cashInputRef"
            v-model="cashReceived"
            placeholder="0.00"
            data-testid="cash-received-cup-input"
            @keydown.enter.prevent="handleEnterConfirm"
          >
            <template #prefix>
              <span class="text-xs font-semibold text-content-tertiary">CUP</span>
            </template>
          </BaseInput>
        </BaseFormField>

        <!-- Botones de Billetes Rápidos y Exacto en CUP -->
        <div>
          <span class="text-[11px] font-medium text-content-tertiary">Billetes sugeridos:</span>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 active:scale-95"
              data-testid="btn-exact-cup"
              @click="setExactCash"
            >
              Exacto
            </button>
            <button
              v-for="bill in ['100.00', '200.00', '500.00', '1000.00']"
              :key="bill"
              type="button"
              class="rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-semibold text-content-primary hover:bg-surface-hover active:scale-95"
              @click="setBill(bill)"
            >
              ${{ bill.split('.')[0] }}
            </button>
          </div>
        </div>

        <!-- Indicador de Vuelto o Faltante en CUP -->
        <div
          class="rounded-lg border p-3"
          :class="
            isSufficient
              ? 'border-state-success-border bg-state-success-bg/30 text-state-success'
              : 'border-state-warning-border bg-state-warning-bg/30 text-state-warning'
          "
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold">
              {{ isSufficient ? 'Vuelto a entregar:' : 'Efectivo faltante:' }}
            </span>
            <div class="text-right">
              <span
                class="font-mono text-lg font-bold"
                :data-testid="isSufficient ? 'change-given-cup' : 'missing-cup'"
              >
                {{ isSufficient ? changeGivenCUP : missingAmount }}
              </span>
              <span class="ml-1 text-xs font-medium">CUP</span>
            </div>
          </div>
        </div>
      </div>

      <!-- OPCIÓN B: CUP TRANSFERENCIA -->
      <div v-else-if="activeTab === 'CUP_TRANSFER'" class="space-y-4">
        <!-- Pasarela -->
        <BaseFormField
          label="Pasarela de pago"
          required
          description="Plataforma electrónica empleada por el cliente."
        >
          <select
            v-model="transferGateway"
            class="h-9 w-full rounded-lg border border-border-subtle bg-surface-card px-3 text-xs text-content-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            data-testid="transfer-gateway-select"
          >
            <option value="Transfermóvil">Transfermóvil</option>
            <option value="EnZona">EnZona</option>
            <option value="BancaRemota">BancaRemota</option>
          </select>
        </BaseFormField>

        <!-- Referencia bancaria OBLIGATORIA -->
        <BaseFormField
          label="Número de referencia bancaria / Transacción"
          required
          :error="transferRefError"
          description="Identificador o comprobante de transferencia bancaria."
        >
          <BaseInput
            ref="transferInputRef"
            v-model="transferReference"
            placeholder="Ej. FT261114092837 o 908123"
            :has-error="Boolean(transferRefError)"
            data-testid="transfer-reference-input"
            @keydown.enter.prevent="handleEnterConfirm"
          />
        </BaseFormField>
      </div>

      <!-- OPCIÓN C: USD EFECTIVO -->
      <div v-else-if="activeTab === 'USD_CASH'" class="space-y-4">
        <BaseFormField
          label="Efectivo recibido"
          required
          description="Billetes enteros en USD entregados por el cliente."
        >
          <BaseInput
            ref="usdCashInputRef"
            v-model="cashReceived"
            placeholder="0.00"
            data-testid="cash-received-usd-input"
            @keydown.enter.prevent="handleEnterConfirm"
          >
            <template #prefix>
              <span class="text-xs font-semibold text-content-tertiary">USD</span>
            </template>
          </BaseInput>
        </BaseFormField>

        <!-- Botones de Billetes Rápidos y Exacto en USD -->
        <div>
          <span class="text-[11px] font-medium text-content-tertiary">Billetes sugeridos:</span>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 active:scale-95"
              data-testid="btn-exact-usd"
              @click="setExactCash"
            >
              Exacto
            </button>
            <button
              v-for="bill in ['5.00', '10.00', '20.00', '50.00', '100.00']"
              :key="bill"
              type="button"
              class="rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-semibold text-content-primary hover:bg-surface-hover active:scale-95"
              @click="setBill(bill)"
            >
              ${{ bill.split('.')[0] }}
            </button>
          </div>
        </div>

        <!-- Indicador de Vuelto o Faltante (Vuelto SIEMPRE en CUP según contrato) -->
        <div
          class="rounded-lg border p-3"
          :class="
            isSufficient
              ? 'border-state-success-border bg-state-success-bg/30 text-state-success'
              : 'border-state-warning-border bg-state-warning-bg/30 text-state-warning'
          "
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold">
              {{ isSufficient ? 'Vuelto a entregar (en CUP):' : 'Efectivo faltante:' }}
            </span>
            <div class="text-right">
              <span
                class="font-mono text-lg font-bold"
                :data-testid="isSufficient ? 'change-given-cup' : 'missing-usd'"
              >
                {{ isSufficient ? changeGivenCUP : missingAmount }}
              </span>
              <span class="ml-1 text-xs font-medium">
                {{ isSufficient ? 'CUP' : 'USD' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pie de Acciones del Drawer -->
    <template #actions>
      <BaseButton
        variant="secondary"
        density="compact"
        :disabled="checkout.isSubmitting.value"
        @click="handleCancel"
      >
        Cancelar (Esc)
      </BaseButton>

      <BaseButton
        variant="primary"
        density="compact"
        :disabled="!canConfirm || checkout.isSubmitting.value"
        :loading="checkout.isSubmitting.value"
        data-testid="btn-confirm-checkout"
        @click="handleConfirm"
      >
        Confirmar Cobro (Enter)
      </BaseButton>
    </template>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import BaseDrawer from '@/shared/ui/BaseDrawer.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import type { CartItem, CreateSaleRequest, Sale } from '../types'
import type { DecimalString } from '@/shared/types/currency'
import { usePosCheckout } from '../composables/usePosCheckout'
import {
  divideDecimals,
  ceilToInteger,
  subtractDecimals,
  compareDecimals,
  multiplyDecimals,
  normalizeDecimal,
} from '@/shared/utils/decimal'

type CheckoutTab = 'CUP_CASH' | 'CUP_TRANSFER' | 'USD_CASH'

interface Props {
  open: boolean
  items: CartItem[]
  totalCUP: DecimalString
  shiftId: string
  warehouseId?: string
  dailyRateUSD: string
  exchangeMargin: string
  effectiveRateUSD: string
}

const props = withDefaults(defineProps<Props>(), {
  warehouseId: 'ALM-TIENDA-01',
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', sale: Sale): void
  (e: 'close'): void
}>()

const checkout = usePosCheckout()

const activeTab = ref<CheckoutTab>('CUP_CASH')
const cashReceived = ref<string>('')
const transferGateway = ref<string>('Transfermóvil')
const transferReference = ref<string>('')
const transferRefError = ref<string>('')

const cashInputRef = ref<any>(null)
const transferInputRef = ref<any>(null)
const usdCashInputRef = ref<any>(null)

/**
 * Estimación local del total en USD con Math.ceil al entero superior según Decisión A1/Contrato 10.7
 */
const rawUSDEstimate = computed<string>(() => {
  return divideDecimals(props.totalCUP, props.effectiveRateUSD)
})

const totalUSD = computed<string>(() => {
  return ceilToInteger(rawUSDEstimate.value)
})

const totalToCharge = computed<string>(() => {
  if (activeTab.value === 'USD_CASH') return totalUSD.value
  return props.totalCUP
})

/**
 * Comprueba si el efectivo entregado cubre el total exigido (Decisión M)
 */
const isSufficient = computed<boolean>(() => {
  if (!cashReceived.value || !cashReceived.value.trim()) return false
  return compareDecimals(cashReceived.value, totalToCharge.value) >= 0
})

/**
 * Cálculo del vuelto o faltante en estimación local
 */
const changeGivenCUP = computed<string>(() => {
  if (!isSufficient.value) return '0.00'
  if (activeTab.value === 'CUP_CASH') {
    return subtractDecimals(cashReceived.value, props.totalCUP)
  }
  if (activeTab.value === 'USD_CASH') {
    const receivedInCUP = multiplyDecimals(cashReceived.value, props.effectiveRateUSD)
    return subtractDecimals(receivedInCUP, props.totalCUP)
  }
  return '0.00'
})

const missingAmount = computed<string>(() => {
  if (isSufficient.value) return '0.00'
  const current = cashReceived.value ? normalizeDecimal(cashReceived.value) : '0.00'
  return subtractDecimals(totalToCharge.value, current)
})

const canConfirm = computed<boolean>(() => {
  if (checkout.isSubmitting.value) return false
  if (activeTab.value === 'CUP_TRANSFER') {
    return Boolean(transferReference.value.trim())
  }
  return isSufficient.value
})

const setExactCash = () => {
  cashReceived.value = totalToCharge.value
}

const setBill = (bill: string) => {
  cashReceived.value = bill
}

const selectTab = (tab: CheckoutTab) => {
  activeTab.value = tab
  cashReceived.value = ''
  transferRefError.value = ''
  nextTick(() => {
    if (tab === 'CUP_CASH') cashInputRef.value?.focus()
    else if (tab === 'CUP_TRANSFER') transferInputRef.value?.focus()
    else if (tab === 'USD_CASH') usdCashInputRef.value?.focus()
  })
}

// Al abrir el drawer, generar nuevo clientRequestId (UUID) e inicializar estado
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      checkout.initSession()
      activeTab.value = 'CUP_CASH'
      cashReceived.value = ''
      transferReference.value = ''
      transferRefError.value = ''
      nextTick(() => {
        cashInputRef.value?.focus()
      })
    }
  },
  { immediate: true }
)

const handleCancel = () => {
  emit('update:open', false)
  emit('close')
}

const handleOpenUpdate = (val: boolean) => {
  emit('update:open', val)
  if (!val) {
    emit('close')
  }
}

const handleConfirm = async () => {
  if (!canConfirm.value || checkout.isSubmitting.value) return

  if (activeTab.value === 'CUP_TRANSFER' && !transferReference.value.trim()) {
    transferRefError.value = 'El número de comprobante o referencia es obligatorio.'
    return
  }

  const request: CreateSaleRequest = {
    clientRequestId: checkout.clientRequestId.value,
    shiftId: props.shiftId,
    warehouseId: props.warehouseId,
    items: props.items.map((it) => ({
      productCode: it.product.code,
      quantity: it.quantity,
    })),
    paidCurrency:
      activeTab.value === 'CUP_CASH'
        ? 'CUP'
        : activeTab.value === 'USD_CASH'
          ? 'USD'
          : 'CUP_TRANSFER',
    paymentMethod: activeTab.value === 'CUP_TRANSFER' ? 'TRANSFER' : 'CASH',
    cashReceived:
      activeTab.value === 'CUP_TRANSFER' ? props.totalCUP : normalizeDecimal(cashReceived.value),
    transferGateway: activeTab.value === 'CUP_TRANSFER' ? transferGateway.value : null,
    transferReference: activeTab.value === 'CUP_TRANSFER' ? transferReference.value.trim() : null,
  }

  try {
    const sale = await checkout.submitSale(request)
    emit('success', sale)
    emit('update:open', false)
  } catch {
    // Los errores del servidor quedan en checkout.serverError.value y el drawer NO se cierra
  }
}

const handleEnterConfirm = () => {
  if (canConfirm.value) {
    handleConfirm()
  }
}
</script>
