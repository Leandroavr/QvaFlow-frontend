<template>
  <!-- Soporte futuro de modo Kiosco (layout: 'fullscreen' en meta de ruta) -->
  <div v-if="isFullscreen" class="h-dvh overflow-auto bg-surface-app text-content-primary">
    <router-view />
  </div>

  <!-- Layout Estándar de Aplicación Desktop (100% Viewport Height) -->
  <div v-else class="flex h-dvh overflow-hidden bg-surface-app text-content-primary">
    <!-- Skip Link para Accesibilidad WCAG -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      Saltar al contenido principal
    </a>

    <!-- Barra lateral izquierda (Sidebar) -->
    <AppSidebar
      :collapsed="isCollapsed"
      :mobile-open="mobileOpen"
      @toggle-collapse="toggleCollapse"
      @close-mobile="mobileOpen = false"
    />

    <!-- Contenedor Derecho: Topbar fija + Main Content scrolleable -->
    <div class="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
      <!-- Barra superior (Topbar) con polling único compartido -->
      <AppTopbar :server-status="serverStatus" @open-mobile="mobileOpen = true" />

      <!-- Contenido Principal con scroll propio independiente -->
      <main
        id="main-content"
        tabindex="-1"
        class="flex-1 overflow-y-auto overflow-x-hidden p-4 focus:outline-none sm:p-6 lg:p-8"
      >
        <div class="mx-auto w-full max-w-7xl">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import { useServerStatus } from '../../shared/composables/useServerStatus'

const route = useRoute()

// Modo kiosco / fullscreen
const isFullscreen = computed(() => route.meta.layout === 'fullscreen')

// Polling único compartido de conexión con backend Symfony
const { serverStatus } = useServerStatus()

// Estado de colapso de barra lateral persistido en localStorage
const STORAGE_KEY = 'qvaflow_sidebar_collapsed'
const isCollapsed = ref<boolean>(false)
const mobileOpen = ref<boolean>(false)

const loadCollapsedState = () => {
  if (typeof window === 'undefined') return

  // Bajo 1280px se colapsa automáticamente por diseño responsive
  if (window.innerWidth < 1280) {
    isCollapsed.value = true
    return
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  } else {
    isCollapsed.value = false
  }
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
  }
}

// Atajo de teclado Ctrl+B / Cmd+B para alternar el colapso del sidebar
const handleKeyboardShortcut = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    toggleCollapse()
  }
}

// Adaptación responsive al redimensionar ventana
const handleResize = () => {
  if (typeof window === 'undefined') return

  if (window.innerWidth >= 1024) {
    mobileOpen.value = false
  }

  // Si la pantalla es menor a 1280px, colapsar automáticamente
  if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  loadCollapsedState()
  window.addEventListener('keydown', handleKeyboardShortcut)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardShortcut)
  window.removeEventListener('resize', handleResize)
})
</script>
