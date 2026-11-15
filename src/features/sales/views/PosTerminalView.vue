<template>
  <div class="flex h-dvh w-full flex-col overflow-hidden bg-surface-app text-content-primary">
    <!-- Cabecera Kiosco del POS -->
    <PosHeader @exit="handleExit" />

    <!-- Cuerpo Principal del POS: 2 columnas sin scroll de página -->
    <main class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 lg:flex-row">
      <!-- Columna Izquierda: Buscador y Catálogo (68%) -->
      <section
        class="shadow-xs flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-card"
        aria-label="Catálogo de productos"
      >
        <PosCatalog ref="catalogRef" @add-to-cart="handleAddToCart" />
      </section>

      <!-- Columna Derecha: Carrito de Venta y Totales (32%) -->
      <aside
        class="shadow-xs flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-card lg:w-[380px] xl:w-[420px]"
        aria-label="Carrito de compra"
      >
        <PosCart
          :items="cart.items.value"
          :total-c-u-p="cart.totalCUP.value"
          :total-lines-count="cart.totalLinesCount.value"
          :total-units-count="cart.totalUnitsCount.value"
          :is-empty="cart.isEmpty.value"
          :is-shift-open="isShiftOpen"
          @increment="handleIncrement"
          @decrement="handleDecrement"
          @remove="handleRemove"
          @clear="handleClear"
          @checkout="handleCheckout"
        />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PosHeader from '../components/PosHeader.vue'
import PosCatalog from '../components/PosCatalog.vue'
import PosCart from '../components/PosCart.vue'
import type { PosProduct } from '../types'
import { usePosCart } from '../composables/usePosCart'
import { cashService } from '@/services'

const router = useRouter()
const catalogRef = ref<InstanceType<typeof PosCatalog> | null>(null)
const cart = usePosCart()
const isShiftOpen = ref<boolean>(true)

const checkShiftStatus = async () => {
  try {
    const shift = await cashService.getCurrentShift()
    isShiftOpen.value = Boolean(shift && shift.status === 'OPEN')
  } catch {
    isShiftOpen.value = false
  }
}

const handleExit = () => {
  router.push('/')
}

const handleAddToCart = (product: PosProduct) => {
  cart.addToCart(product)
  catalogRef.value?.focusSearch()
}

const handleIncrement = (code: string) => {
  cart.increment(code)
  catalogRef.value?.focusSearch()
}

const handleDecrement = (code: string) => {
  cart.decrement(code)
  catalogRef.value?.focusSearch()
}

const handleRemove = (code: string) => {
  cart.removeItem(code)
  catalogRef.value?.focusSearch()
}

const handleClear = () => {
  cart.clearCart()
  catalogRef.value?.focusSearch()
}

const handleCheckout = () => {
  if (cart.isEmpty.value || !isShiftOpen.value) return
  // Listo para integración del modal/drawer de cobro en la siguiente fase
}

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // Atajo Escape: salir del POS si no hay modales abiertos
  if (e.key === 'Escape') {
    const openDialog = document.querySelector('[role="dialog"]')
    if (!openDialog) {
      e.preventDefault()
      handleExit()
    }
  }

  // Atajo F8: cobrar
  if (e.key === 'F8') {
    e.preventDefault()
    handleCheckout()
  }
}

onMounted(() => {
  checkShiftStatus()
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>
