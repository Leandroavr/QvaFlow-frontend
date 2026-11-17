<template>
  <div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface-card">
    <!-- Cabecera del Carrito -->
    <div class="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-4">
      <div class="flex items-center gap-2">
        <ShoppingCart class="size-4 text-primary" aria-hidden="true" />
        <h3 class="text-sm font-bold text-content-primary">Orden Actual</h3>
        <span
          v-if="!isEmpty"
          class="bg-primary/10 rounded-full px-2 py-0.5 text-xs font-semibold text-primary"
        >
          {{ totalLinesCount }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <!-- Botón Suspender en cabecera del carrito -->
        <button
          type="button"
          :disabled="isEmpty"
          class="hover:bg-surface-hover inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-content-secondary transition-colors hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
          title="Suspender orden activa (F4)"
          data-testid="btn-suspend-cart"
          @click="emit('hold')"
        >
          <Pause class="size-3.5" aria-hidden="true" />
          <span>Suspender</span>
        </button>

        <!-- Botón Vaciar Carrito -->
        <button
          type="button"
          :disabled="isEmpty"
          class="text-danger hover:bg-danger/10 focus:ring-danger inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
          title="Vaciar carrito"
          @click="showClearConfirm = true"
        >
          <Trash2 class="size-3.5" aria-hidden="true" />
          <span>Vaciar</span>
        </button>
      </div>
    </div>

    <!-- Lista de Líneas del Carrito -->
    <div
      v-if="!isEmpty"
      class="min-h-0 flex-1 divide-y divide-border-subtle overflow-y-auto p-2 sm:p-3"
      data-testid="pos-cart-items"
    >
      <div
        v-for="item in items"
        :key="item.product.code"
        class="flex flex-col gap-2 rounded-lg p-2.5 transition-colors hover:bg-surface-app"
      >
        <!-- Fila 1: Nombre y Botón Eliminar -->
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <h4 class="truncate text-xs font-semibold text-content-primary sm:text-sm">
              {{ item.product.name }}
            </h4>
            <div class="flex items-center gap-2 text-[11px] text-content-secondary">
              <span class="font-mono text-content-muted">{{ item.product.code }}</span>
              <span>•</span>
              <span>@ {{ item.product.priceCUP }} CUP</span>
            </div>
          </div>

          <button
            type="button"
            class="hover:text-danger focus:ring-danger rounded p-1 text-content-muted transition-colors focus:outline-none focus:ring-2"
            title="Eliminar producto"
            @click="emit('remove', item.product.code)"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </div>

        <!-- Fila 2: Controles de Cantidad (+ / -) y Subtotal -->
        <div class="flex items-center justify-between pt-1">
          <!-- Controles de Cantidad -->
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="shadow-2xs hover:bg-surface-hover flex size-7 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-content-primary focus:outline-none focus:ring-2 focus:ring-primary active:scale-95"
              title="Disminuir cantidad"
              @click="emit('decrement', item.product.code)"
            >
              <Minus class="size-3.5" aria-hidden="true" />
            </button>

            <span
              class="min-w-[40px] text-center font-mono text-xs font-bold text-content-primary sm:text-sm"
            >
              {{ item.quantity }}
            </span>

            <button
              type="button"
              :disabled="isMaxStockReached(item)"
              class="shadow-2xs hover:bg-surface-hover flex size-7 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-content-primary focus:outline-none focus:ring-2 focus:ring-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              :title="isMaxStockReached(item) ? 'Stock máximo alcanzado' : 'Aumentar cantidad'"
              @click="emit('increment', item.product.code)"
            >
              <Plus class="size-3.5" aria-hidden="true" />
            </button>

            <span
              v-if="isMaxStockReached(item)"
              class="bg-warning/10 text-warning ml-1 rounded px-1 py-0.5 text-[9px] font-semibold"
            >
              Máx
            </span>
          </div>

          <!-- Subtotal de Línea -->
          <div class="text-right">
            <span class="font-mono text-xs font-bold text-content-primary sm:text-sm">
              {{ item.subtotalCUP }}
            </span>
            <span class="ml-0.5 text-[10px] text-content-muted">CUP</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado Vacío del Carrito -->
    <div
      v-else
      class="flex h-full min-h-[200px] flex-1 flex-col items-center justify-center p-6 text-center text-content-muted"
      data-testid="pos-cart-empty"
    >
      <div
        class="flex size-12 items-center justify-center rounded-full bg-surface-app text-content-muted"
      >
        <ShoppingCart class="size-6 opacity-40" aria-hidden="true" />
      </div>
      <p class="mt-3 text-xs font-medium text-content-secondary">El carrito está vacío</p>
      <p class="mt-1 text-[11px] text-content-muted">
        Escanee códigos de barras o seleccione productos del catálogo para comenzar.
      </p>
    </div>

    <!-- Panel de Totales y Botón de Cobro -->
    <div class="border-t border-border-subtle bg-surface-app p-3 sm:p-4">
      <div class="space-y-1.5 text-xs text-content-secondary">
        <!-- Dos filas separadas: Líneas y Unidades -->
        <div class="flex items-center justify-between">
          <span>Líneas</span>
          <span class="font-medium text-content-primary" data-testid="cart-total-lines">
            {{ totalLinesCount }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span>Unidades</span>
          <span class="font-medium text-content-primary" data-testid="cart-total-units">
            {{ totalUnitsCount }}
          </span>
        </div>

        <div class="border-border-subtle/60 flex items-baseline justify-between border-t pt-1.5">
          <span class="text-sm font-bold text-content-primary">Total a Cobrar</span>
          <div class="text-right">
            <span class="font-mono text-xl font-extrabold text-primary sm:text-2xl">
              {{ totalCUP }}
            </span>
            <span class="ml-1 text-xs font-semibold text-content-muted">CUP</span>
          </div>
        </div>

        <!-- Equivalente en USD con tasa efectiva (ceil), solo si hay tasas disponibles -->
        <div
          v-if="equivalentUSD"
          class="flex items-center justify-end gap-1.5 text-[11px] text-content-muted"
          data-testid="cart-equivalent-usd"
        >
          <span>Equivalente:</span>
          <span class="font-mono font-bold text-content-secondary">{{ equivalentUSD }} USD</span>
          <span class="text-content-tertiary text-[10px]"
            >(1 USD = {{ effectiveRateUSD }} CUP)</span
          >
        </div>
      </div>

      <!-- Botón de Cobro (F8) con ancho completo -->
      <button
        type="button"
        :disabled="isEmpty || !isShiftOpen"
        class="shadow-xs mt-3 flex h-11 w-full items-center justify-between rounded-xl bg-primary px-4 text-sm font-bold text-white transition-all hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        title="Proceder al cobro de la venta (F8)"
        @click="emit('checkout')"
      >
        <span class="flex items-center gap-1.5">
          <Banknote class="size-4" aria-hidden="true" />
          <span>Cobrar Venta</span>
        </span>
        <kbd class="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
          F8
        </kbd>
      </button>

      <!-- Aviso con botón Abrir Turno si la caja está cerrada -->
      <div
        v-if="!isShiftOpen"
        class="mt-2.5 flex flex-col gap-2 rounded-lg border border-state-warning-border bg-state-warning-bg p-2.5 text-xs text-state-warning"
        data-testid="pos-shift-closed-notice"
      >
        <div class="flex items-center gap-1.5 font-semibold">
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>Turno de caja cerrado</span>
        </div>
        <p class="text-[11px] text-content-secondary">
          No es posible realizar cobros sin un turno abierto.
        </p>
        <BaseButton
          variant="secondary"
          density="compact"
          size="sm"
          block
          @click="emit('open-shift')"
        >
          Abrir turno
        </BaseButton>
      </div>
    </div>

    <!-- Diálogo de Confirmación para Vaciar Carrito -->
    <ConfirmDialog
      :open="showClearConfirm"
      title="¿Vaciar carrito de compra?"
      message="Se eliminarán todos los artículos agregados a la orden activa. ¿Desea continuar?"
      confirm-text="Vaciar Carrito"
      cancel-text="Cancelar"
      variant="danger"
      @confirm="handleConfirmClear"
      @cancel="showClearConfirm = false"
      @update:open="showClearConfirm = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShoppingCart, Trash2, X, Plus, Minus, Banknote, AlertCircle, Pause } from 'lucide-vue-next'
import type { CartItem } from '../types'
import type { DecimalString } from '@/shared/types/currency'
import { compareDecimals, divideDecimals, ceilToInteger } from '@/shared/utils/decimal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

const props = withDefaults(
  defineProps<{
    items: CartItem[]
    totalCUP: DecimalString
    totalLinesCount: number
    totalUnitsCount: DecimalString
    isEmpty: boolean
    isShiftOpen?: boolean
    effectiveRateUSD?: string
  }>(),
  {
    isShiftOpen: true,
    effectiveRateUSD: undefined,
  }
)

const emit = defineEmits<{
  (e: 'increment', productCode: string): void
  (e: 'decrement', productCode: string): void
  (e: 'remove', productCode: string): void
  (e: 'clear'): void
  (e: 'checkout'): void
  (e: 'open-shift'): void
  (e: 'hold'): void
}>()

const showClearConfirm = ref<boolean>(false)

const equivalentUSD = computed<string | null>(() => {
  if (!props.effectiveRateUSD || compareDecimals(props.effectiveRateUSD, '0.00') <= 0) {
    return null
  }
  return ceilToInteger(divideDecimals(props.totalCUP, props.effectiveRateUSD))
})

const isMaxStockReached = (item: CartItem): boolean => {
  return compareDecimals(item.quantity, item.product.stock) >= 0
}

const handleConfirmClear = () => {
  showClearConfirm.value = false
  emit('clear')
}
</script>
