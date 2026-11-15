<template>
  <div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-surface-card">
    <!-- Barra Superior del Catálogo: Buscador con foco permanente -->
    <div class="border-b border-border-subtle p-3 sm:p-4">
      <div class="relative flex items-center">
        <Search
          class="pointer-events-none absolute left-3.5 size-4 text-content-secondary"
          aria-hidden="true"
        />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="shadow-2xs focus:ring-primary/20 h-10 w-full rounded-xl border border-border-subtle bg-surface-app pl-10 pr-24 text-sm text-content-primary transition-colors placeholder:text-content-muted focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2"
          placeholder="Escanear código de barras o buscar... (F2)"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          @keydown.enter="handleEnterKey"
        />
        <div class="pointer-events-none absolute right-3 flex items-center gap-1.5">
          <kbd
            class="shadow-2xs rounded border border-border-strong bg-surface-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-content-muted"
          >
            F2
          </kbd>
          <kbd
            class="shadow-2xs rounded border border-border-strong bg-surface-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-content-muted"
          >
            Enter
          </kbd>
        </div>
      </div>

      <!-- Barra de Filtro de Categorías -->
      <div
        v-if="categories.length > 2"
        class="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs"
        role="tablist"
        aria-label="Filtrar por categoría"
      >
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          role="tab"
          :aria-selected="selectedCategory === cat"
          class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          :class="
            selectedCategory === cat
              ? 'shadow-2xs bg-primary text-white'
              : 'hover:bg-surface-hover border border-border-subtle bg-surface-app text-content-secondary hover:text-content-primary'
          "
          @click="selectedCategory = cat"
        >
          {{ cat === 'ALL' ? 'Todos' : cat }}
        </button>
      </div>
    </div>

    <!-- Contenedor scrolleable de la Cuadrícula -->
    <div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
      <!-- Estado de Carga: Skeletons -->
      <div
        v-if="loading"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        data-testid="pos-catalog-loading"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="shadow-2xs flex flex-col justify-between rounded-xl border border-border-subtle bg-surface-app p-3"
        >
          <div class="space-y-2">
            <div class="bg-surface-hover h-3 w-16 animate-pulse rounded" />
            <div class="bg-surface-hover h-4 w-full animate-pulse rounded" />
            <div class="bg-surface-hover h-4 w-3/4 animate-pulse rounded" />
          </div>
          <div class="mt-4 flex items-center justify-between pt-2">
            <div class="bg-surface-hover h-5 w-14 animate-pulse rounded" />
            <div class="bg-surface-hover h-4 w-10 animate-pulse rounded" />
          </div>
        </div>
      </div>

      <!-- Estado Vacío: Sin resultados -->
      <div
        v-else-if="filteredProducts.length === 0"
        class="flex h-full min-h-[240px] flex-col items-center justify-center p-6 text-center"
        data-testid="pos-catalog-empty"
      >
        <div
          class="bg-surface-hover flex size-12 items-center justify-center rounded-full text-content-muted"
        >
          <PackageX class="size-6" aria-hidden="true" />
        </div>
        <h3 class="mt-3 text-sm font-semibold text-content-primary">No se encontraron productos</h3>
        <p class="mt-1 max-w-sm text-xs text-content-secondary">
          {{
            searchQuery
              ? `No hay artículos que coincidan con "${searchQuery}".`
              : 'El catálogo del terminal está vacío o sin existencias.'
          }}
        </p>
      </div>

      <!-- Cuadrícula de Productos -->
      <div
        v-else
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        data-testid="pos-catalog-grid"
      >
        <button
          v-for="product in filteredProducts"
          :key="product.id"
          type="button"
          :disabled="isOutOfStock(product)"
          class="shadow-2xs group flex flex-col justify-between rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          :class="[
            isOutOfStock(product)
              ? 'cursor-not-allowed border-border-subtle bg-surface-app opacity-55'
              : 'hover:bg-surface-hover border-border-subtle bg-surface-card hover:border-primary active:scale-[0.98]',
          ]"
          @click="handleProductClick(product)"
        >
          <!-- Parte Superior: Código y Nombre -->
          <div class="min-w-0">
            <div class="flex items-center justify-between gap-1 text-[11px] text-content-muted">
              <span class="truncate font-mono">{{ product.code }}</span>
              <span class="truncate text-[10px] text-content-secondary">{{
                product.category
              }}</span>
            </div>
            <h4
              class="mt-1 line-clamp-2 text-xs font-semibold text-content-primary transition-colors group-hover:text-primary sm:text-sm"
              :title="product.name"
            >
              {{ product.name }}
            </h4>
          </div>

          <!-- Parte Inferior: Precio y Stock -->
          <div class="mt-3 flex items-baseline justify-between border-t border-border-subtle pt-2">
            <div>
              <span class="text-xs font-bold text-content-primary sm:text-sm">
                {{ product.priceCUP }}
              </span>
              <span class="ml-0.5 text-[10px] font-medium text-content-muted">CUP</span>
            </div>

            <div class="text-right">
              <span
                v-if="isOutOfStock(product)"
                class="bg-danger/10 text-danger rounded px-1.5 py-0.5 text-[10px] font-semibold"
              >
                Agotado
              </span>
              <span
                v-else
                class="text-[11px] font-medium"
                :class="
                  isLowStock(product) ? 'text-warning font-semibold' : 'text-content-secondary'
                "
              >
                {{ product.stock }} {{ product.unit }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Search, PackageX } from 'lucide-vue-next'
import type { PosProduct } from '../types'
import { usePosCatalog } from '../composables/usePosCatalog'
import { compareDecimals } from '@/shared/utils/decimal'

const props = withDefaults(
  defineProps<{
    warehouseId?: string
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'add-to-cart', product: PosProduct): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)

const {
  loading,
  searchQuery,
  selectedCategory,
  categories,
  filteredProducts,
  loadProducts,
  findProductByExactCode,
} = usePosCatalog()

const isOutOfStock = (product: PosProduct): boolean => {
  return compareDecimals(product.stock, '0.00') <= 0
}

const isLowStock = (product: PosProduct): boolean => {
  return compareDecimals(product.stock, '5.00') <= 0 && !isOutOfStock(product)
}

const focusSearch = () => {
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

const handleProductClick = (product: PosProduct) => {
  if (isOutOfStock(product)) return
  emit('add-to-cart', product)
  focusSearch()
}

const handleEnterKey = () => {
  const code = searchQuery.value.trim()
  if (!code) return

  const matched = findProductByExactCode(code)
  if (matched) {
    if (!isOutOfStock(matched)) {
      emit('add-to-cart', matched)
      searchQuery.value = ''
    }
  }
  focusSearch()
}

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'F2') {
    e.preventDefault()
    focusSearch()
  }
}

onMounted(() => {
  loadProducts(props.warehouseId)
  focusSearch()
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})

defineExpose({
  focusSearch,
  searchInputRef,
  loadProducts,
})
</script>
