<template>
  <div
    class="relative flex select-none flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-150"
    :class="[
      isOutOfStock
        ? 'cursor-not-allowed bg-slate-50 opacity-60'
        : 'cursor-pointer hover:border-emerald-400 hover:shadow-md active:scale-[0.98]',
    ]"
    @click="handleClick"
  >
    <!-- Cabecera de la tarjeta: Icono/Imagen y Badge de Stock -->
    <div class="mb-2 flex items-start justify-between gap-2">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-lg text-2xl shadow-inner"
        :style="{ backgroundColor: (product.accentColor || '#10b981') + '15' }"
      >
        <span>{{ product.image || '📦' }}</span>
      </div>

      <div class="flex flex-col items-end">
        <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="stockBadgeClass">
          {{ isOutOfStock ? 'Agotado' : `${product.stock} ${product.unit}` }}
        </span>
        <span class="mt-0.5 font-mono text-[10px] tracking-wider text-slate-400">
          {{ product.code }}
        </span>
      </div>
    </div>

    <!-- Contenido: Nombre y Categoría -->
    <div class="my-1.5 flex-1">
      <h4 class="m-0 line-clamp-2 text-sm font-semibold leading-snug text-slate-800">
        {{ product.name }}
      </h4>
      <span class="text-[11px] font-medium text-slate-400">
        {{ product.category }}
      </span>
    </div>

    <!-- Pie de la tarjeta: Precio USD / CUP y Botón Agregar -->
    <div class="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
      <div>
        <div class="flex items-baseline gap-1">
          <span class="font-mono text-sm font-black tracking-tight text-emerald-700">
            ${{ (product.priceUSD || product.price / 360).toFixed(2) }} USD
          </span>
        </div>
        <span class="block text-xs font-bold leading-tight text-slate-800">
          {{ formatearMoneda(product.price, 'CUP') }}
        </span>
      </div>

      <button
        type="button"
        :disabled="isOutOfStock"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm transition-colors"
        :class="[
          isOutOfStock
            ? 'cursor-not-allowed bg-slate-300'
            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
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
