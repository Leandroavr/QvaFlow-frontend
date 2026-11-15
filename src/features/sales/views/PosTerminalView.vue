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
        <div class="flex flex-1 items-center justify-center p-6 text-content-secondary">
          <span class="text-sm">Carrito de compra</span>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import PosHeader from '../components/PosHeader.vue'
import PosCatalog from '../components/PosCatalog.vue'
import type { PosProduct } from '../types'

const router = useRouter()
const catalogRef = ref<InstanceType<typeof PosCatalog> | null>(null)

const handleExit = () => {
  router.push('/')
}

const handleAddToCart = (_product: PosProduct) => {
  // Conectado al carrito
  catalogRef.value?.focusSearch()
}

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // Atajo Escape: salir del POS si no hay modales interceptando
  if (e.key === 'Escape') {
    // Si hay algún modal/drawer abierto (role dialog en DOM), dejamos que el modal lo procese
    const openDialog = document.querySelector('[role="dialog"]')
    if (!openDialog) {
      e.preventDefault()
      handleExit()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})
</script>
