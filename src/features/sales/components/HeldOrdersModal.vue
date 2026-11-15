<template>
  <BaseModal
    :open="open"
    title="Órdenes en Espera (F4)"
    size="md"
    @update:open="handleOpenUpdate"
  >
    <div class="space-y-3 py-1">
      <div v-if="orders.length === 0" class="flex flex-col items-center justify-center py-8 text-center" data-testid="held-orders-empty">
        <Clock class="size-8 text-content-muted/60" aria-hidden="true" />
        <p class="mt-2 text-xs font-semibold text-content-secondary">No hay órdenes en espera</p>
        <p class="mt-1 text-[11px] text-content-muted">
          Presione F4 con productos en el carrito para suspender la venta temporalmente.
        </p>
      </div>

      <div v-else class="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1" data-testid="held-orders-list">
        <div
          v-for="order in orders"
          :key="order.id"
          class="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-sunken/40 p-3 transition-colors hover:border-border"
          data-testid="held-order-card"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs text-content-primary">{{ order.label }}</span>
              <span class="rounded bg-surface-card px-1.5 py-0.5 text-[10px] font-mono text-content-tertiary border border-border-subtle">
                {{ formatTime(order.heldAt) }}
              </span>
            </div>
            <div class="mt-1 flex items-baseline gap-2 text-xs text-content-secondary">
              <span class="font-mono font-bold text-primary">{{ order.totalCUP }} CUP</span>
              <span class="text-[11px] text-content-muted">
                &bull; {{ order.totalLinesCount }} líns. ({{ order.totalUnitsCount }} uds.)
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <BaseButton
              variant="secondary"
              density="compact"
              class="text-state-error hover:bg-state-error-bg border-state-error-border/40"
              title="Descartar orden"
              data-testid="btn-discard-held"
              @click="emit('discard', order.id)"
            >
              <Trash2 class="size-3.5" aria-hidden="true" />
              <span class="hidden sm:inline">Descartar</span>
            </BaseButton>

            <BaseButton
              variant="primary"
              density="compact"
              data-testid="btn-restore-held"
              @click="emit('restore', order.id)"
            >
              <RotateCcw class="size-3.5" aria-hidden="true" />
              <span>Restaurar</span>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <template #actions>
      <BaseButton
        variant="secondary"
        density="compact"
        @click="handleClose"
      >
        Cerrar (Esc)
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { Clock, RotateCcw, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { PosHeldOrder } from '../composables/usePosHeldOrders'

interface Props {
  open: boolean
  orders: PosHeldOrder[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'restore', orderId: string): void
  (e: 'discard', orderId: string): void
  (e: 'close'): void
}>()

const formatTime = (isoString: string): string => {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return isoString
  }
}

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
