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
        <div class="flex items-center justify-between">
          <span>Líneas / Artículos</span>
          <span class="font-medium text-content-primary"
            >{{ totalLinesCount }} / {{ totalUnitsCount }}</span
          >
        </div>
        <div class="border-border-subtle/60 flex items-baseline justify-between border-t pt-1">
          <span class="text-sm font-bold text-content-primary">Total a Cobrar</span>
          <div class="text-right">
            <span class="font-mono text-xl font-extrabold text-primary sm:text-2xl">
              {{ totalCUP }}
            </span>
            <span class="ml-1 text-xs font-semibold text-content-muted">CUP</span>
          </div>
        </div>
      </div>

      <!-- Botón de Cobro (F8) -->
      <button
        type="button"
        :disabled="isEmpty || !isShiftOpen"
        class="shadow-xs disabled:bg-surface-hover mt-3 flex h-11 w-full items-center justify-between rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:text-content-muted"
        title="Proceder al cobro de la venta (F8)"
        @click="emit('checkout')"
      >
        <span class="flex items-center gap-1.5">
          <Banknote class="size-4" aria-hidden="true" />
          <span>Cobrar Venta</span>
        </span>
        <kbd
          class="rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/90"
        >
          F8
        </kbd>
      </button>

      <p v-if="!isShiftOpen" class="text-danger mt-1.5 text-center text-[11px] font-medium">
        Turno de caja cerrado. No es posible cobrar.
      </p>
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
import { ref } from 'vue'
import { ShoppingCart, Trash2, X, Plus, Minus, Banknote } from 'lucide-vue-next'
import type { CartItem } from '../types'
import type { DecimalString } from '@/shared/types/currency'
import { compareDecimals } from '@/shared/utils/decimal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

const props = withDefaults(
  defineProps<{
    items: CartItem[]
    totalCUP: DecimalString
    totalLinesCount: number
    totalUnitsCount: DecimalString
    isEmpty: boolean
    isShiftOpen?: boolean
  }>(),
  {
    isShiftOpen: true,
  }
)

const emit = defineEmits<{
  (e: 'increment', productCode: string): void
  (e: 'decrement', productCode: string): void
  (e: 'remove', productCode: string): void
  (e: 'clear'): void
  (e: 'checkout'): void
}>()

const showClearConfirm = ref<boolean>(false)

const isMaxStockReached = (item: CartItem): boolean => {
  return compareDecimals(item.quantity, item.product.stock) >= 0
}

const handleConfirmClear = () => {
  showClearConfirm.value = false
  emit('clear')
}
</script>
