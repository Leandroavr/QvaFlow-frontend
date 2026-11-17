<template>
  <BaseModal
    :open="open"
    title="Apertura de Turno de Caja"
    size="md"
    :auto-focus-first-input="true"
    @update:open="handleOpenUpdate"
  >
    <form id="open-shift-form" class="flex flex-col gap-4 py-1" @submit.prevent="handleSubmit">
      <!-- Mensaje de error del servidor si existe (ej. SHIFT_ALREADY_OPEN) -->
      <div
        v-if="serverError"
        class="flex items-start gap-2.5 rounded-lg border border-state-error-border bg-state-error-bg p-3 text-xs text-state-error sm:text-sm"
        role="alert"
        data-testid="open-shift-error-alert"
      >
        <AlertCircle class="h-4 w-4 shrink-0 translate-y-0.5" />
        <span class="flex-1 font-medium">{{ serverError }}</span>
      </div>

      <!-- Nombre del Cajero -->
      <BaseFormField
        label="Cajero asignado"
        required
        :error="formErrors.cashierName"
        description="Identidad del responsable operativo de la gaveta."
      >
        <BaseInput
          v-model="form.cashierName"
          placeholder="Nombre y apellidos del cajero"
          :has-error="Boolean(formErrors.cashierName)"
        />
      </BaseFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Fondo Inicial en CUP -->
        <BaseFormField
          label="Fondo inicial CUP"
          required
          :error="formErrors.initialCUP"
          description="Efectivo de inicio en CUP."
        >
          <BaseInput
            v-model="form.initialCUP"
            placeholder="0.00"
            :has-error="Boolean(formErrors.initialCUP)"
          >
            <template #suffix>
              <span class="text-content-tertiary text-xs font-semibold">CUP</span>
            </template>
          </BaseInput>
        </BaseFormField>

        <!-- Fondo Inicial en USD -->
        <BaseFormField
          label="Fondo inicial USD"
          required
          :error="formErrors.initialUSD"
          description="Efectivo de inicio en USD."
        >
          <BaseInput
            v-model="form.initialUSD"
            placeholder="0.00"
            :has-error="Boolean(formErrors.initialUSD)"
          >
            <template #suffix>
              <span class="text-content-tertiary text-xs font-semibold">USD</span>
            </template>
          </BaseInput>
        </BaseFormField>
      </div>

      <!-- Tasa del Día USD -->
      <BaseFormField
        label="Tasa del día USD (1 USD =)"
        required
        :error="formErrors.dailyRateUSD"
        description="Tasa de cambio de referencia para cobro y canje en mostrador."
      >
        <BaseInput
          v-model="form.dailyRateUSD"
          placeholder="360.00"
          :has-error="Boolean(formErrors.dailyRateUSD)"
        >
          <template #suffix>
            <span class="text-content-tertiary text-xs font-semibold">CUP</span>
          </template>
        </BaseInput>
      </BaseFormField>
    </form>

    <template #actions>
      <BaseButton
        variant="secondary"
        density="compact"
        :disabled="isSubmitting"
        @click="handleCancel"
      >
        Cancelar
      </BaseButton>

      <BaseButton
        variant="primary"
        density="compact"
        :loading="isSubmitting"
        form="open-shift-form"
        type="submit"
      >
        Abrir Turno
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { z } from 'zod'
import { AlertCircle } from 'lucide-vue-next'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePosShift } from '../composables/usePosShift'
import { isPositiveDecimal, compareDecimals, normalizeDecimal } from '@/shared/utils/decimal'
import { ApiError } from '@/shared/types/api'

interface Props {
  open: boolean
  defaultRateUSD?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultRateUSD: '360.00',
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success'): void
}>()

const authStore = useAuthStore()
const { openShift } = usePosShift()

const isSubmitting = ref(false)
const serverError = ref<string | null>(null)

const form = reactive({
  cashierName: '',
  initialCUP: '0.00',
  initialUSD: '0.00',
  dailyRateUSD: '360.00',
})

const formErrors = reactive<Record<string, string>>({
  cashierName: '',
  initialCUP: '',
  initialUSD: '',
  dailyRateUSD: '',
})

const clearErrors = () => {
  serverError.value = null
  formErrors.cashierName = ''
  formErrors.initialCUP = ''
  formErrors.initialUSD = ''
  formErrors.dailyRateUSD = ''
}

const resetForm = () => {
  clearErrors()
  form.cashierName = authStore.user?.fullName || authStore.user?.username || 'Cajero Principal'
  form.initialCUP = '0.00'
  form.initialUSD = '0.00'
  form.dailyRateUSD = props.defaultRateUSD || '360.00'
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
  { immediate: true }
)

const openShiftSchema = z.object({
  cashierName: z.string().trim().min(1, 'El nombre del cajero es obligatorio'),
  initialCUP: z
    .string()
    .trim()
    .refine((val) => {
      return /^(\d+)(\.\d{1,2})?$/.test(val) && compareDecimals(val, '0.00') >= 0
    }, 'Debe ser un importe válido en CUP (ej. 5000.00)'),
  initialUSD: z
    .string()
    .trim()
    .refine((val) => {
      return /^(\d+)(\.\d{1,2})?$/.test(val) && compareDecimals(val, '0.00') >= 0
    }, 'Debe ser un importe válido en USD (ej. 50.00)'),
  dailyRateUSD: z
    .string()
    .trim()
    .refine((val) => {
      return /^(\d+)(\.\d{1,2})?$/.test(val) && isPositiveDecimal(val)
    }, 'La tasa USD debe ser un número mayor a 0.00'),
})

const handleSubmit = async () => {
  clearErrors()
  const result = openShiftSchema.safeParse(form)

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string
      if (field) {
        formErrors[field] = issue.message
      }
    })
    return
  }

  isSubmitting.value = true
  try {
    await openShift({
      cashierName: form.cashierName.trim(),
      initialCUP: normalizeDecimal(form.initialCUP),
      initialUSD: normalizeDecimal(form.initialUSD),
      dailyRateUSD: normalizeDecimal(form.dailyRateUSD),
    })
    emit('success')
    emit('update:open', false)
  } catch (err: any) {
    if (err instanceof ApiError) {
      serverError.value = err.message
    } else {
      serverError.value = err?.message || 'Error inesperado al abrir turno'
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('update:open', false)
}

const handleOpenUpdate = (val: boolean) => {
  emit('update:open', val)
}
</script>
