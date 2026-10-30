<template>
  <div
    class="relative flex flex-col justify-between bg-white rounded-xl border border-slate-200 p-3.5 transition-all duration-150 select-none shadow-sm"
    :class="[
      isOutOfStock
        ? 'opacity-60 cursor-not-allowed bg-slate-50'
        : 'hover:shadow-md hover:border-emerald-400 cursor-pointer active:scale-[0.98]'
    ]"
    @click="handleClick"
  >
    <!-- Cabecera de la tarjeta: Icono/Imagen y Badge de Stock -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-inner"
        :style="{ backgroundColor: (product.accentColor || '#10b981') + '15' }"
      >
        <span>{{ product.image || '📦' }}</span>
      </div>

      <div class="flex flex-col items-end">
        <span
          class="px-2 py-0.5 rounded-full text-xs font-semibold"
          :class="stockBadgeClass"
        >
          {{ isOutOfStock ? 'Agotado' : `${product.stock} ${product.unit}` }}
        </span>
        <span class="text-[10px] text-slate-400 mt-0.5 tracking-wider font-mono">
          {{ product.code }}
        </span>
      </div>
    </div>

    <!-- Contenido: Nombre y Categoría -->
    <div class="my-1.5 flex-1">
      <h4 class="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug m-0">
        {{ product.name }}
      </h4>
      <span class="text-[11px] text-slate-400 font-medium">
        {{ product.category }}
      </span>
    </div>

    <!-- Pie de la tarjeta: Precio USD / CUP y Botón Agregar -->
    <div class="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
      <div>
        <div class="flex items-baseline gap-1">
          <span class="font-black text-sm text-emerald-700 tracking-tight font-mono">
            ${{ (product.priceUSD || (product.price / 360)).toFixed(2) }} USD
          </span>
        </div>
        <span class="text-xs font-bold text-slate-800 block leading-tight">
          {{ formatearMoneda(product.price, 'CUP') }}
        </span>
      </div>

      <button
        type="button"
        :disabled="isOutOfStock"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors shadow-sm"
        :class="[
          isOutOfStock
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
        ]"
        title="Agregar al Carrito"
        @click.stop="handleClick"
      >
        <PlusOutlined class="text-xs" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { PosProduct } from '../types/pos'

interface Props {
  product: PosProduct
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'add', product: PosProduct): void
}>()

const { formatearMoneda } = useFormatoMoneda()

const isOutOfStock = computed(() => props.product.stock <= 0)

const stockBadgeClass = computed(() => {
  if (isOutOfStock.value) return 'bg-red-100 text-red-700'
  if (props.product.stock <= 5) return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
})

const handleClick = () => {
  if (!isOutOfStock.value) {
    emit('add', props.product)
  }
}
</script>
