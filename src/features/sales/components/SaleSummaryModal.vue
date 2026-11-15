<template>
  <BaseModal
    :open="open"
    title="Comprobante de Venta"
    size="sm"
    :auto-focus-first-input="true"
    @update:open="handleOpenUpdate"
  >
    <div v-if="sale" class="space-y-4 py-1" data-testid="sale-summary-card">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-state-success-border bg-state-success-bg text-state-success"
        >
          <CheckCircle2 class="h-5 w-5" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-content-primary">Venta {{ sale.id }}</h4>
          <p class="text-xs text-content-muted">Comprobante registrado con éxito</p>
        </div>
      </div>

      <div class="space-y-2 rounded-lg border border-border-subtle bg-surface-sunken p-3 text-xs">
        <div class="flex justify-between">
          <span class="text-content-secondary">Total Pagado:</span>
          <span class="font-mono font-bold text-content-primary">
            {{ sale.totalInCurrency }} {{ sale.paidCurrency }}
          </span>
        </div>

        <div v-if="sale.paidCurrency === 'USD'" class="flex justify-between">
          <span class="text-content-secondary">Tasa Aplicada:</span>
          <span class="font-mono text-content-primary"
            >1 USD = {{ sale.exchangeRateApplied }} CUP</span
          >
        </div>

        <div class="flex justify-between">
          <span class="text-content-secondary">Efectivo Recibido:</span>
          <span class="font-mono text-content-primary">
            {{ sale.cashReceived }} {{ sale.paidCurrency }}
          </span>
        </div>

        <div class="border-border-subtle/80 flex items-baseline justify-between border-t pt-2">
          <span class="font-bold text-content-primary">Vuelto Entregado:</span>
          <div class="text-right">
            <span
              class="font-mono text-lg font-extrabold text-state-success"
              data-testid="summary-change-given-cup"
            >
              {{ sale.changeGivenCUP }}
            </span>
            <span class="text-content-tertiary ml-1 text-xs font-semibold">CUP</span>
          </div>
        </div>
      </div>
    </div>

    <template #actions>
      <BaseButton
        ref="closeBtnRef"
        variant="primary"
        density="compact"
        block
        data-testid="btn-close-summary"
        @click="handleClose"
      >
        Aceptar y Nueva Venta (Enter)
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Sale } from '../types'

interface Props {
  open: boolean
  sale: Sale | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
}>()

const closeBtnRef = ref<any>(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      const el = closeBtnRef.value?.$el || closeBtnRef.value
      el?.focus?.()
    }
  }
)

const handleClose = () => {
  emit('update:open', false)
  emit('close')
}

const handleOpenUpdate = (val: boolean) => {
  emit('update:open', val)
  if (!val) {
    emit('close')
  }
}
</script>
