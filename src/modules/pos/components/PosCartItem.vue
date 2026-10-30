<template>
  <div class="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-2">
    <!-- FILA SUPERIOR: Icono, Nombre Completo del Producto y Botón Eliminar -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-start gap-2 min-w-0 flex-1">
        <span class="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-sm shrink-0 shadow-inner">
          {{ item.product.image || '📦' }}
        </span>
        <h5
          class="text-xs font-bold text-slate-800 m-0 leading-snug line-clamp-2"
          :title="item.product.name"
        >
          {{ item.product.name }}
        </h5>
      </div>

      <button
        type="button"
        class="text-slate-300 hover:text-red-500 p-1 rounded transition-colors text-xs cursor-pointer shrink-0"
        title="Quitar del carrito"
        @click="emit('remove', item.product.id)"
      >
        <DeleteOutlined />
      </button>
    </div>

    <!-- FILA INFERIOR: Controles de Cantidad y Subtotal -->
    <div class="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
      <!-- Controles de Cantidad -->
      <div class="flex items-center gap-1 shrink-0 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
        <button
          type="button"
          class="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-slate-200 text-slate-700 active:scale-95 transition-all text-xs cursor-pointer shadow-2xs"
          @click="decreaseQuantity"
        >
          <MinusOutlined />
        </button>

        <span class="w-7 text-center font-bold text-xs text-slate-900 select-none font-mono">
          {{ item.quantity }}
        </span>

        <button
          type="button"
          :disabled="item.quantity >= item.product.stock"
          class="w-6 h-6 rounded flex items-center justify-center bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all text-xs cursor-pointer shadow-2xs"
          @click="increaseQuantity"
        >
          <PlusOutlined />
        </button>
      </div>

      <!-- Precio Unitario y Subtotal -->
      <div class="text-right">
        <span class="text-[10px] text-slate-400 block leading-tight font-mono">
          {{ item.quantity }} x {{ formatearMoneda(item.unitPrice, 'CUP') }}
        </span>
        <span class="text-xs font-black text-slate-900 font-mono">
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
