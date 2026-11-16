<template>
  <BaseModal
    :open="open"
    title="Canje de Divisas en Mostrador (F6)"
    size="md"
    :auto-focus-first-input="true"
    @update:open="handleOpenUpdate"
  >
    <!-- Alerta de Error del Servidor -->
    <div
      v-if="exchange.serverError.value"
      class="mb-4 flex items-start gap-2.5 rounded-lg border border-state-error-border bg-state-error-bg p-3 text-xs text-state-error sm:text-sm"
      role="alert"
      data-testid="exchange-error-alert"
    >
      <AlertCircle class="h-4 w-4 shrink-0 translate-y-0.5" />
      <span class="flex-1 font-medium">{{ exchange.serverError.value }}</span>
    </div>

    <form id="currency-exchange-form" class="space-y-4 py-1" @submit.prevent="handleSubmit">
      <!-- Selección de Moneda Origen (USD, MLC) -->
      <BaseFormField
        label="Moneda a recibir"
        required
        description="Divisa extranjera que entrega el cliente."
      >
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
            :class="
              currencyFrom === 'USD'
                ? 'bg-primary/10 shadow-xs border-primary text-primary'
                : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
            "
            data-testid="exchange-currency-usd"
            @click="currencyFrom = 'USD'"
          >
            USD ($)
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
            :class="
              currencyFrom === 'MLC'
                ? 'bg-primary/10 shadow-xs border-primary text-primary'
                : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
            "
            data-testid="exchange-currency-mlc"
            @click="currencyFrom = 'MLC'"
          >
            MLC
          </button>
        </div>
      </BaseFormField>

      <!-- Monto a Recibir -->
      <BaseFormField
        :label="`Monto en ${currencyFrom} a recibir`"
        required
        :error="amountError"
        description="Cantidad física de divisas que ingresará a la gaveta."
      >
        <BaseInput
          ref="amountInputRef"
          v-model="amountFrom"
          placeholder="0.00"
          :has-error="Boolean(amountError)"
          data-testid="exchange-amount-input"
          @keydown.enter.prevent="handleSubmit"
        >
          <template #prefix>
            <span class="text-content-tertiary text-xs font-semibold">{{ currencyFrom }}</span>
          </template>
        </BaseInput>
      </BaseFormField>

      <!-- Tasa Efectiva (Solo Lectura) -->
      <div class="bg-surface-sunken/40 rounded-lg border border-border-subtle p-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-content-secondary">Tasa efectiva aplicada:</span>
          <span
            class="font-mono font-bold text-content-primary"
            data-testid="exchange-effective-rate"
          >
            1 {{ currencyFrom }} = {{ effectiveRate }} CUP
          </span>
        </div>
        <p class="mt-1 text-[11px] text-content-muted">
          Tasa del día: {{ baseRate }} CUP &minus; Margen de canje: {{ exchangeMargin }} CUP
        </p>
      </div>

      <!-- CUP a Entregar Calculado (Solo Lectura) -->
      <div
        class="bg-state-success-bg/30 flex flex-col items-center justify-center rounded-xl border border-state-success-border p-4 text-center"
      >
        <span class="text-xs font-semibold uppercase tracking-wider text-state-success">
          Efectivo CUP a entregar
        </span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <span
            class="font-mono text-3xl font-extrabold text-content-primary"
            data-testid="exchange-amount-cup"
          >
            {{ amountToDeliver }}
          </span>
          <span class="text-content-tertiary text-sm font-bold">CUP</span>
        </div>
        <span class="mt-0.5 text-[10px] text-content-muted"
          >Redondeo exacto al entero más cercano</span
        >
      </div>

      <!-- Notas o Justificación Opcional -->
      <BaseFormField
        label="Notas / Observaciones"
        description="Detalles del billete o registro (opcional)."
      >
        <BaseInput
          v-model="notes"
          placeholder="Ej. Billete de 20 USD en buen estado"
          data-testid="exchange-notes-input"
        />
      </BaseFormField>
    </form>

    <template #actions>
      <BaseButton
        variant="secondary"
        density="compact"
        :disabled="exchange.isSubmitting.value"
        @click="handleCancel"
      >
        Cancelar (Esc)
      </BaseButton>

      <BaseButton
        variant="primary"
        density="compact"
        :disabled="!isValid || exchange.isSubmitting.value"
        :loading="exchange.isSubmitting.value"
        data-testid="btn-confirm-exchange"
        form="currency-exchange-form"
        type="submit"
      >
        Registrar Canje (Enter)
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Currency } from '@/shared/types/currency'
import type { CurrencyExchange } from '../types'
import { usePosExchange } from '../composables/usePosExchange'
import { isPositiveDecimal } from '@/shared/utils/decimal'

interface Props {
  open: boolean
  shiftId: string
  dailyRateUSD: string
  rateMLC?: string
  exchangeMargin: string
}

const props = withDefaults(defineProps<Props>(), {
  rateMLC: '275.00',
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', exchange: CurrencyExchange): void
  (e: 'close'): void
}>()

const exchange = usePosExchange()

const currencyFrom = ref<Currency>('USD')
const amountFrom = ref<string>('')
const notes = ref<string>('')
const amountError = ref<string>('')
const amountInputRef = ref<any>(null)

const baseRate = computed<string>(() => {
  return currencyFrom.value === 'USD' ? props.dailyRateUSD : props.rateMLC
})

const effectiveRate = computed<string>(() => {
  return exchange.calculateEffectiveRate(baseRate.value, props.exchangeMargin)
})

const amountToDeliver = computed<string>(() => {
  return exchange.calculateAmountToDeliver(amountFrom.value, effectiveRate.value)
})

const isValid = computed<boolean>(() => {
  return isPositiveDecimal(amountFrom.value)
})

const resetForm = () => {
  exchange.serverError.value = null
  currencyFrom.value = 'USD'
  amountFrom.value = ''
  notes.value = ''
  amountError.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      nextTick(() => {
        amountInputRef.value?.focus()
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

const handleSubmit = async () => {
  if (!isValid.value || exchange.isSubmitting.value) return

  try {
    const res = await exchange.submitExchange({
      shiftId: props.shiftId,
      currencyFrom: currencyFrom.value,
      amountFrom: amountFrom.value,
      notes: notes.value.trim() || undefined,
    })
    emit('success', res)
    emit('update:open', false)
  } catch {
    // El error queda en exchange.serverError.value y el modal NO se cierra
  }
}
</script>
