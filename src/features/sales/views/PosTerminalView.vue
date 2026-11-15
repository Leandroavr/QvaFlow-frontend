<template>
  <div class="flex h-dvh w-full flex-col overflow-hidden bg-surface-app text-content-primary">
    <!-- Cabecera Kiosco del POS -->
    <PosHeader @exit="handleExit" @open-shift="openModal" />

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
          @open-shift="openModal"
        />
      </aside>
    </main>

    <!-- Modal de Apertura de Turno de Caja -->
    <OpenShiftModal
      :open="isOpenShiftModalOpen"
      :default-rate-u-s-d="rates?.USD || '360.00'"
      @update:open="handleShiftModalUpdate"
      @success="handleShiftSuccess"
    />

    <!-- Drawer de Cobro de Venta -->
    <PosCheckoutDrawer
      :open="isCheckoutDrawerOpen"
      :items="cart.items.value"
      :total-c-u-p="cart.totalCUP.value"
      :shift-id="currentShift?.id || ''"
      :daily-rate-u-s-d="dailyRateUSD"
      :exchange-margin="exchangeMargin"
      :effective-rate-u-s-d="effectiveRateUSD"
      @update:open="isCheckoutDrawerOpen = $event"
      @close="handleCheckoutClose"
      @success="handleCheckoutSuccess"
    />

    <!-- Modal Resumen de Venta con Vuelto Entregado -->
    <SaleSummaryModal
      :open="isSummaryModalOpen"
      :sale="completedSale"
      @update:open="isSummaryModalOpen = $event"
      @close="handleSummaryClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import PosHeader from '../components/PosHeader.vue'
import PosCatalog from '../components/PosCatalog.vue'
import PosCart from '../components/PosCart.vue'
import OpenShiftModal from '../components/OpenShiftModal.vue'
import PosCheckoutDrawer from '../components/PosCheckoutDrawer.vue'
import SaleSummaryModal from '../components/SaleSummaryModal.vue'
import type { PosProduct, Sale } from '../types'
import { usePosCart } from '../composables/usePosCart'
import { usePosShift } from '../composables/usePosShift'

const router = useRouter()
const catalogRef = ref<InstanceType<typeof PosCatalog> | null>(null)
const cart = usePosCart()
const {
  currentShift,
  rates,
  isShiftOpen,
  dailyRateUSD,
  exchangeMargin,
  effectiveRateUSD,
  isOpenShiftModalOpen,
  loadShiftData,
  openModal,
  closeModal,
} = usePosShift()

const isCheckoutDrawerOpen = ref<boolean>(false)
const completedSale = ref<Sale | null>(null)
const isSummaryModalOpen = ref<boolean>(false)

const handleShiftSuccess = () => {
  catalogRef.value?.focusSearch()
}

const handleShiftModalUpdate = (val: boolean) => {
  if (!val) {
    closeModal()
    catalogRef.value?.focusSearch()
  } else {
    openModal()
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
  isCheckoutDrawerOpen.value = true
}

const handleCheckoutSuccess = (sale: Sale) => {
  completedSale.value = sale
  cart.clearCart()
  toast.success(`Venta completada exitosamente. Vuelto: ${sale.changeGivenCUP} CUP`)
  isSummaryModalOpen.value = true
}

const handleCheckoutClose = () => {
  isCheckoutDrawerOpen.value = false
  catalogRef.value?.focusSearch()
}

const handleSummaryClose = () => {
  isSummaryModalOpen.value = false
  catalogRef.value?.focusSearch()
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

  // Atajos F6 y F8: deshabilitados si el turno está cerrado
  if (e.key === 'F6' || e.key === 'F8') {
    e.preventDefault()
    if (!isShiftOpen.value) {
      return
    }
    if (e.key === 'F8') {
      handleCheckout()
    }
  }
}

onMounted(() => {
  loadShiftData()
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>
