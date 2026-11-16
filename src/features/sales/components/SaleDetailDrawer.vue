<template>
  <BaseDrawer
    :open="open"
    :title="sale ? `Detalle de Venta #${sale.id}` : 'Detalle de Venta'"
    size="md"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <span class="text-xs text-content-muted">Cargando comprobante de venta...</span>
    </div>
    <div v-else-if="error" class="p-4 text-center text-xs text-state-error">
      {{ error }}
    </div>
    <div v-else-if="sale" class="space-y-4 text-xs">
      <div>Folio: {{ sale.id }}</div>
      <div>Cajero: {{ sale.cashierName }}</div>
      <div>Total CUP: {{ sale.totalCUP }}</div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import BaseDrawer from '@/shared/ui/BaseDrawer.vue'
import type { Sale } from '../types'

interface Props {
  open: boolean
  sale: Sale | null
  isLoading?: boolean
  error?: string | null
  isCancelling?: boolean
  cancelError?: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'cancel', reason: string): void
}>()
</script>
