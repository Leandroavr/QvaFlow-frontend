<template>
  <div
    class="shadow-xs space-y-2 rounded-xl border border-slate-200 bg-white p-2.5 transition-all hover:border-slate-300"
  >
    <!-- FILA SUPERIOR: Icono, Nombre Completo del Producto y Botón Eliminar -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 flex-1 items-start gap-2">
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm shadow-inner"
        >
          {{ item.product.image || '📦' }}
        </span>
        <h5
          class="m-0 line-clamp-2 text-xs font-bold leading-snug text-slate-800"
          :title="item.product.name"
        >
          {{ item.product.name }}
        </h5>
      </div>

      <button
        type="button"
        class="shrink-0 cursor-pointer rounded p-1 text-xs text-slate-300 transition-colors hover:text-red-500"
        title="Quitar del carrito"
        @click="emit('remove', item.product.id)"
      >
        <DeleteOutlined />
      </button>
    </div>

    <!-- FILA INFERIOR: Controles de Cantidad y Subtotal -->
    <div class="flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
      <!-- Controles de Cantidad -->
      <div
        class="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
      >
        <button
          type="button"
          class="shadow-2xs flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white text-xs text-slate-700 transition-all hover:bg-slate-200 active:scale-95"
          @click="decreaseQuantity"
        >
          <MinusOutlined />
        </button>

        <span class="w-7 select-none text-center font-mono text-xs font-bold text-slate-900">
          {{ item.quantity }}
        </span>

        <button
          type="button"
          :disabled="item.quantity >= item.product.stock"
          class="shadow-2xs flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white text-xs text-slate-700 transition-all hover:bg-slate-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          @click="increaseQuantity"
        >
          <PlusOutlined />
        </button>
      </div>

      <!-- Precio Unitario y Subtotal -->
      <div class="text-right">
        <span class="block font-mono text-[10px] leading-tight text-slate-400">
          {{ item.quantity }} x {{ formatearMoneda(item.unitPrice, 'CUP') }}
        </span>
        <span class="font-mono text-xs font-black text-slate-900">
          {{ formatearMoneda(item.subtotal, 'CUP') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MinusOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { CartItem } from '../types/pos'

interface Props {
  item: CartItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update-quantity', productId: number, newQty: number): void
  (e: 'remove', productId: number): void
}>()

const { formatearMoneda } = useFormatoMoneda()

const increaseQuantity = () => {
  emit('update-quantity', props.item.product.id, props.item.quantity + 1)
}

const decreaseQuantity = () => {
  emit('update-quantity', props.item.product.id, props.item.quantity - 1)
}
</script>
