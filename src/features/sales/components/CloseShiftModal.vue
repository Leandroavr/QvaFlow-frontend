<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    size="md"
    :auto-focus-first-input="!closeResult"
    @update:open="handleOpenUpdate"
  >
    <!-- Alerta de Error del Servidor -->
    <div
      v-if="serverError"
      class="mb-4 flex items-start gap-2.5 rounded-lg border border-state-error-border bg-state-error-bg p-3 text-xs text-state-error sm:text-sm"
      role="alert"
      data-testid="close-shift-error-alert"
    >
      <AlertCircle class="h-4 w-4 shrink-0 translate-y-0.5" />
      <span class="flex-1 font-medium">{{ serverError }}</span>
    </div>

    <!-- PANTALLA 1: FORMULARIO DE CONTEO Y ARQUEO -->
    <div v-if="!closeResult && shift" class="space-y-4 py-1">
      <!-- 1. Cuadro de Valores Operativos Registrados por el Servidor (solo si canSeeExpected) -->
      <div
        v-if="canSeeExpected"
        class="bg-surface-sunken/40 space-y-2.5 rounded-xl border border-border-subtle p-3 text-xs"
      >
        <div class="flex items-center justify-between border-b border-border-subtle pb-2">
          <span class="font-semibold text-content-primary">Turno: {{ shift.id }}</span>
          <span class="text-content-secondary">Cajero: {{ shift.cashierName }}</span>
        </div>

        <div class="grid grid-cols-3 gap-2 pt-1 text-center">
          <div class="border-border-subtle/60 rounded-lg border bg-surface-card p-2">
            <span class="text-content-tertiary block text-[10px] uppercase tracking-wider"
              >Fondo Inicial</span
            >
            <span class="mt-0.5 block font-mono text-xs font-semibold text-content-primary">
              {{ shift.initialFunds.CUP }} CUP
            </span>
            <span class="block font-mono text-[11px] text-content-secondary">
              {{ shift.initialFunds.USD }} USD
            </span>
          </div>

          <div class="border-border-subtle/60 rounded-lg border bg-surface-card p-2">
            <span class="text-content-tertiary block text-[10px] uppercase tracking-wider"
              >Ventas Efectivo</span
            >
            <span class="mt-0.5 block font-mono text-xs font-semibold text-state-success">
              +{{ shift.salesTotals.cupCash }} CUP
            </span>
            <span class="block font-mono text-[11px] text-state-success">
              +{{ shift.salesTotals.USD }} USD
            </span>
          </div>

          <div class="border-border-subtle/60 rounded-lg border bg-surface-card p-2">
            <span class="text-content-tertiary block text-[10px] uppercase tracking-wider"
              >Ajustes Canje</span
            >
            <span class="mt-0.5 block font-mono text-xs font-semibold text-content-primary">
              {{ shift.exchangeAdjustments.CUP }} CUP
            </span>
            <span class="block font-mono text-[11px] text-content-secondary">
              +{{ shift.exchangeAdjustments.USD }} USD
            </span>
          </div>
        </div>

        <!-- Fondos Esperados en Gaveta (Calculados) -->
        <div class="border-border-subtle/80 flex items-center justify-between border-t px-1 pt-2">
          <span class="font-bold text-content-primary">Fondos Esperados:</span>
          <div class="text-right">
            <span class="mr-2 font-mono font-bold text-primary" data-testid="expected-funds-cup">
              {{ localExpectedCUP }} CUP
            </span>
            <span class="font-mono font-bold text-primary" data-testid="expected-funds-usd">
              {{ localExpectedUSD }} USD
            </span>
          </div>
        </div>
      </div>

      <!-- Encabezado resumido para cierre ciego -->
      <div
        v-else
        class="bg-surface-sunken/40 rounded-xl border border-border-subtle p-3 text-xs"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-content-primary">Turno: {{ shift.id }}</span>
          <span class="text-content-secondary">Cajero: {{ shift.cashierName }}</span>
        </div>
      </div>

      <!-- 2. Formulario de Conteo Físico -->
      <form id="close-shift-form" class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Conteo CUP -->
          <BaseFormField
            label="Conteo físico CUP"
            required
            :error="formErrors.countedCUP"
            description="Efectivo real contado en pesos cubanos."
          >
            <BaseInput
              ref="countedCupInputRef"
              v-model="countedCUP"
              placeholder="0.00"
              :has-error="Boolean(formErrors.countedCUP)"
              data-testid="close-counted-cup-input"
              @keydown.enter.prevent="handleCountEnter"
            >
              <template #prefix>
                <span class="text-content-tertiary text-xs font-semibold">CUP</span>
              </template>
            </BaseInput>
          </BaseFormField>

          <!-- Conteo USD -->
          <BaseFormField
            label="Conteo físico USD"
            required
            :error="formErrors.countedUSD"
            description="Billetes reales contados en dólares."
          >
            <BaseInput
              v-model="countedUSD"
              placeholder="0.00"
              :has-error="Boolean(formErrors.countedUSD)"
              data-testid="close-counted-usd-input"
              @keydown.enter.prevent="handleCountEnter"
            >
              <template #prefix>
                <span class="text-content-tertiary text-xs font-semibold">USD</span>
              </template>
            </BaseInput>
          </BaseFormField>
        </div>

        <!-- 3. Previsualización de Diferencias (solo si canSeeExpected) -->
        <div
          v-if="canSeeExpected"
          class="rounded-lg border p-3 text-xs"
          :class="
            hasLocalDifference
              ? 'bg-state-warning-bg/30 border-state-warning-border text-state-warning'
              : 'bg-state-success-bg/30 border-state-success-border text-state-success'
          "
        >
          <div class="flex items-center justify-between font-semibold">
            <span>{{
              hasLocalDifference ? 'Diferencia detectada en gaveta:' : 'Arqueo conforme:'
            }}</span>
            <div class="space-x-2 text-right font-mono font-bold">
              <span :data-testid="hasLocalDifference ? 'diff-preview-cup' : 'diff-zero-cup'">
                {{ localDiffCUP }} CUP
              </span>
              <span>&bull;</span>
              <span :data-testid="hasLocalDifference ? 'diff-preview-usd' : 'diff-zero-usd'">
                {{ localDiffUSD }} USD
              </span>
            </div>
          </div>
          <p v-if="hasLocalDifference" class="mt-1 text-[11px] text-content-secondary">
            Existe una discrepancia entre el conteo físico y lo esperado. Debe justificar el motivo
            obligatoriamente (mínimo 10 caracteres).
          </p>
        </div>

        <!-- Alerta de REASON_REQUIRED para cierre ciego (sin importes) -->
        <div
          v-if="!canSeeExpected && reasonRequired"
          class="rounded-lg border border-state-warning-border bg-state-warning-bg/30 p-3 text-xs text-state-warning"
          data-testid="blind-reason-required"
        >
          <span class="font-semibold">
            El conteo no coincide con lo registrado. Indica el motivo.
          </span>
        </div>

        <!-- 4. Motivo / Observaciones del Cierre -->
        <BaseFormField
          :label="notesLabel"
          :required="notesRequired"
          :error="formErrors.notes"
          :description="notesDescription"
        >
          <BaseInput
            v-model="notes"
            :placeholder="notesPlaceholder"
            :has-error="Boolean(formErrors.notes)"
            data-testid="close-notes-input"
            @keydown.enter.prevent.stop
          />
        </BaseFormField>
      </form>
    </div>

    <!-- PANTALLA 2: RESUMEN DEVUELTO POR EL SERVIDOR TRAS CIERRE EXITOSO -->
    <div v-else-if="closeResult" class="space-y-4 py-2" data-testid="close-shift-result-view">
      <!-- Resultado para cierre ciego -->
      <template v-if="!canSeeExpected">
        <div class="text-center py-2" data-testid="blind-modal-success">
          <div
            class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-state-success-border bg-state-success-bg text-state-success"
          >
            <CheckCircle2 class="h-5 w-5" />
          </div>
          <h4 class="text-sm font-bold text-content-primary">
            Turno cerrado. Tu arqueo fue enviado a revision.
          </h4>
          <div class="mx-auto mt-3 max-w-xs space-y-1.5 text-xs">
            <div class="flex justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2">
              <span class="text-content-secondary">Declarado CUP:</span>
              <span class="font-mono font-bold text-content-primary" data-testid="blind-result-counted-cup">
                {{ closeResult.countedFunds.CUP }} CUP
              </span>
            </div>
            <div class="flex justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2">
              <span class="text-content-secondary">Declarado USD:</span>
              <span class="font-mono font-bold text-content-primary" data-testid="blind-result-counted-usd">
                {{ closeResult.countedFunds.USD }} USD
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- Resultado completo (canSeeExpected) -->
      <template v-else>
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-state-success-border bg-state-success-bg text-state-success"
          >
            <CheckCircle2 class="h-5 w-5" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-content-primary">Turno {{ closeResult.id }} Cerrado</h4>
            <p class="text-xs text-content-muted">
              Arqueo físico registrado y auditado por el servidor
            </p>
          </div>
        </div>

        <div class="space-y-2 rounded-xl border border-border-subtle bg-surface-sunken p-3 text-xs">
          <div class="flex justify-between">
            <span class="text-content-secondary">Fondos Esperados (CUP / USD):</span>
            <span
              class="font-mono font-bold text-content-primary"
              data-testid="result-expected-funds"
            >
              {{ closeResult.expectedFunds.CUP }} CUP / {{ closeResult.expectedFunds.USD }} USD
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-content-secondary">Fondos Contados (CUP / USD):</span>
            <span class="font-mono font-bold text-content-primary" data-testid="result-counted-funds">
              {{ closeResult.countedFunds.CUP }} CUP / {{ closeResult.countedFunds.USD }} USD
            </span>
          </div>

          <div class="flex items-baseline justify-between border-t border-border-subtle pt-2">
            <span class="font-bold text-content-primary">Diferencias Finales:</span>
            <div class="text-right">
              <span
                class="font-mono font-extrabold"
                :class="
                  closeResult.differences.CUP !== '0.00' || closeResult.differences.USD !== '0.00'
                    ? 'text-state-warning'
                    : 'text-state-success'
                "
                data-testid="result-differences"
              >
                {{ closeResult.differences.CUP }} CUP &bull; {{ closeResult.differences.USD }} USD
              </span>
            </div>
          </div>

          <div
            v-if="closeResult.discrepancyReason"
            class="mt-2 rounded border border-border-subtle bg-surface-card p-2 text-[11px]"
          >
            <span class="block font-semibold text-content-secondary">Justificación registrada:</span>
            <span class="italic text-content-primary">{{ closeResult.discrepancyReason }}</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Acciones del Modal -->
    <template #actions>
      <template v-if="!closeResult">
        <BaseButton
          variant="secondary"
          density="compact"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Cancelar (Esc)
        </BaseButton>

        <BaseButton
          variant="primary"
          density="compact"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          form="close-shift-form"
          type="submit"
          data-testid="btn-confirm-close-shift"
        >
          Confirmar Cierre de Caja
        </BaseButton>
      </template>

      <template v-else>
        <BaseButton
          variant="primary"
          density="compact"
          block
          data-testid="btn-accept-close-result"
          @click="handleFinish"
        >
          Aceptar y Salir (Enter)
        </BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { CashShift, ShiftCloseResult } from '../types'
import { usePosShift } from '../composables/usePosShift'
import {
  addDecimals,
  subtractDecimals,
  compareDecimals,
  normalizeDecimal,
} from '@/shared/utils/decimal'
import { ApiError } from '@/shared/types/api'

interface Props {
  open: boolean
  shift: CashShift | null
  /** El backend decide quien ve los montos esperados. */
  canSeeExpected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canSeeExpected: true,
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', result: ShiftCloseResult): void
  (e: 'close'): void
}>()

const { closeShift } = usePosShift()

const isSubmitting = ref(false)
const serverError = ref<string | null>(null)
const closeResult = ref<ShiftCloseResult | null>(null)
/** Indica que el servidor respondió REASON_REQUIRED (cierre ciego). */
const reasonRequired = ref(false)

const countedCUP = ref<string>('0.00')
const countedUSD = ref<string>('0.00')
const notes = ref<string>('')
const countedCupInputRef = ref<any>(null)

const modalTitle = computed(() => {
  if (closeResult.value && !props.canSeeExpected) return 'Turno Cerrado'
  if (closeResult.value) return 'Resumen de Cierre de Turno'
  return 'Cierre de Turno y Arqueo de Caja'
})

const isNotesFocused = (): boolean => {
  const el = document.activeElement
  if (!el) return false
  return Boolean(
    el.closest('[data-testid="close-notes-input"]') ||
    el.getAttribute('data-testid') === 'close-notes-input'
  )
}

const isAmountZeroOrEmpty = (): boolean => {
  const cup = countedCUP.value?.trim()
  const usd = countedUSD.value?.trim()
  if (!cup || !usd) return true
  try {
    const isCupZero = compareDecimals(cup, '0.00') <= 0
    const isUsdZero = compareDecimals(usd, '0.00') <= 0
    if (isCupZero || isUsdZero) return true
  } catch {
    return true
  }
  return false
}

const handleCountEnter = () => {
  if (isAmountZeroOrEmpty() || isNotesFocused()) return
  handleSubmit()
}

const formErrors = reactive<Record<string, string>>({
  countedCUP: '',
  countedUSD: '',
  notes: '',
})

// Cálculo de esperados locales para preview
const localExpectedCUP = computed<string>(() => {
  if (!props.shift) return '0.00'
  const base = addDecimals(props.shift.initialFunds.CUP, props.shift.salesTotals.cupCash)
  return addDecimals(base, props.shift.exchangeAdjustments.CUP)
})

const localExpectedUSD = computed<string>(() => {
  if (!props.shift) return '0.00'
  const base = addDecimals(props.shift.initialFunds.USD, props.shift.salesTotals.USD)
  return addDecimals(base, props.shift.exchangeAdjustments.USD)
})

const localDiffCUP = computed<string>(() => {
  const counted = countedCUP.value ? normalizeDecimal(countedCUP.value) : '0.00'
  return subtractDecimals(counted, localExpectedCUP.value)
})

const localDiffUSD = computed<string>(() => {
  const counted = countedUSD.value ? normalizeDecimal(countedUSD.value) : '0.00'
  return subtractDecimals(counted, localExpectedUSD.value)
})

const hasLocalDifference = computed<boolean>(() => {
  return localDiffCUP.value !== '0.00' || localDiffUSD.value !== '0.00'
})

/** En cierre ciego, notas son obligatorias si REASON_REQUIRED fue disparado */
const notesRequired = computed(() => {
  if (props.canSeeExpected) return hasLocalDifference.value
  return reasonRequired.value
})

const notesLabel = computed(() => {
  if (props.canSeeExpected) {
    return hasLocalDifference.value
      ? 'Motivo del descuadre (obligatorio)'
      : 'Notas de cierre (opcional)'
  }
  return reasonRequired.value
    ? 'Motivo del descuadre (obligatorio)'
    : 'Notas de cierre (opcional)'
})

const notesDescription = computed(() => {
  if (props.canSeeExpected) {
    return hasLocalDifference.value
      ? 'Mínimo 10 caracteres explicando el faltante o sobrante.'
      : 'Observaciones operativas del turno.'
  }
  return reasonRequired.value
    ? 'Mínimo 10 caracteres explicando el motivo.'
    : 'Observaciones operativas del turno.'
})

const notesPlaceholder = computed(() => {
  if (props.canSeeExpected) {
    return hasLocalDifference.value
      ? 'Explique el motivo del faltante o sobrante...'
      : 'Observaciones del turno (opcional)'
  }
  return reasonRequired.value
    ? 'Indique el motivo del descuadre...'
    : 'Observaciones del turno (opcional)'
})

const resetForm = () => {
  serverError.value = null
  closeResult.value = null
  reasonRequired.value = false
  formErrors.countedCUP = ''
  formErrors.countedUSD = ''
  formErrors.notes = ''
  // En cierre ciego no pre-rellenamos con esperado
  if (props.canSeeExpected) {
    countedCUP.value = localExpectedCUP.value
    countedUSD.value = localExpectedUSD.value
  } else {
    countedCUP.value = '0.00'
    countedUSD.value = '0.00'
  }
  notes.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      nextTick(() => {
        countedCupInputRef.value?.focus()
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

const handleFinish = () => {
  if (closeResult.value) {
    emit('success', closeResult.value)
  }
  emit('update:open', false)
  emit('close')
}

const handleSubmit = async (e?: Event) => {
  if (e) {
    e.preventDefault()
  }
  if (isNotesFocused()) return
  if (isAmountZeroOrEmpty()) return

  serverError.value = null
  formErrors.countedCUP = ''
  formErrors.countedUSD = ''
  formErrors.notes = ''

  if (!props.shift) return

  // Validación de motivo si hay diferencia (solo cuando puede ver esperado)
  if (props.canSeeExpected && hasLocalDifference.value) {
    const trimmedNotes = notes.value.trim()
    if (!trimmedNotes || trimmedNotes.length < 10) {
      formErrors.notes =
        'Existe una diferencia en el arqueo. Debe ingresar obligatoriamente un motivo con al menos 10 caracteres.'
      return
    }
  }

  // En cierre ciego con REASON_REQUIRED activo, validar notas localmente
  if (!props.canSeeExpected && reasonRequired.value) {
    const trimmedNotes = notes.value.trim()
    if (!trimmedNotes || trimmedNotes.length < 10) {
      formErrors.notes =
        'El conteo no coincide con lo registrado. Indica el motivo.'
      return
    }
  }

  isSubmitting.value = true
  try {
    const res = await closeShift(props.shift.id, {
      countedCUP: normalizeDecimal(countedCUP.value),
      countedUSD: normalizeDecimal(countedUSD.value),
      notes: notes.value.trim() || undefined,
    })
    closeResult.value = res
  } catch (err: any) {
    if (err instanceof ApiError) {
      // En cierre ciego, si el servidor dice REASON_REQUIRED, marcar notas obligatorias
      if (!props.canSeeExpected && err.code === 'REASON_REQUIRED') {
        reasonRequired.value = true
        formErrors.notes = 'El conteo no coincide con lo registrado. Indica el motivo.'
        return
      }
      serverError.value = err.message
      if (err.details?.notes) {
        formErrors.notes = Array.isArray(err.details.notes)
          ? err.details.notes[0]
          : String(err.details.notes)
      }
    } else {
      serverError.value = err?.message || 'Error inesperado al cerrar el turno.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
