<template>
  <header
    class="flex h-12 w-full shrink-0 select-none items-center justify-between border-b border-border-subtle bg-surface-card px-3 text-content-primary sm:px-4"
    role="banner"
  >
    <!-- Zona Izquierda: Salir del POS con atajo Escape -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="shadow-xs hover:bg-surface-hover inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-app px-2.5 py-1 text-xs font-semibold text-content-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 sm:text-sm"
        title="Salir del Punto de Venta (Escape)"
        @click="handleExit"
      >
        <ArrowLeft class="size-4 shrink-0 text-content-secondary" aria-hidden="true" />
        <span>Salir del POS</span>
        <kbd
          class="hidden rounded border border-border-strong bg-surface-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-content-muted sm:inline-block"
        >
          Esc
        </kbd>
      </button>

      <!-- Divisor vertical -->
      <div class="hidden h-5 w-px bg-border-subtle sm:block" />

      <!-- Título o indicador del terminal -->
      <div class="hidden items-center gap-2 sm:flex">
        <Store class="size-4 text-primary" aria-hidden="true" />
        <span class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
          Terminal POS
        </span>
      </div>
    </div>

    <!-- Zona Central: Estado del Turno y Datos del Cajero -->
    <div class="flex items-center gap-2 sm:gap-4">
      <!-- Badge de Turno -->
      <div class="flex items-center gap-1.5">
        <span
          class="relative flex size-2.5 shrink-0"
          :title="isShiftOpen ? 'Turno de caja activo' : 'Turno de caja cerrado'"
        >
          <span
            v-if="isShiftOpen"
            class="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          />
          <span
            class="relative inline-flex size-2.5 rounded-full"
            :class="isShiftOpen ? 'bg-success' : 'bg-danger'"
          />
        </span>
        <span class="text-xs font-medium" :class="isShiftOpen ? 'text-success' : 'text-danger'">
          {{ isShiftOpen ? 'Turno Abierto' : 'Turno Cerrado' }}
        </span>
        <span v-if="currentShift?.id" class="hidden text-xs text-content-muted lg:inline">
          ({{ currentShift.id }})
        </span>
        <button
          v-if="!isShiftOpen"
          type="button"
          class="ml-1 text-xs font-semibold text-primary hover:underline focus:outline-none"
          @click="emit('open-shift')"
        >
          Abrir turno
        </button>
      </div>

      <!-- Nombre del Cajero -->
      <div class="flex items-center gap-1.5 border-l border-border-subtle pl-2 sm:pl-4">
        <User class="size-4 shrink-0 text-content-secondary" aria-hidden="true" />
        <span
          class="max-w-[120px] truncate text-xs font-medium text-content-primary sm:max-w-[200px] sm:text-sm"
        >
          {{ cashierName }}
        </span>
      </div>
    </div>

    <!-- Zona Derecha: Acciones rápidas y Pantalla Completa (Fullscreen API) -->
    <div class="flex items-center gap-2">
      <!-- Botón Canje de Divisas (F6) -->
      <button
        v-if="isShiftOpen"
        type="button"
        class="shadow-xs hover:bg-surface-hover inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-app px-2.5 py-1 text-xs font-semibold text-content-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        title="Canje de divisas extranjeras en mostrador (F6)"
        data-testid="header-exchange-btn"
        @click="emit('open-exchange')"
      >
        <ArrowLeftRight class="size-3.5 text-primary" aria-hidden="true" />
        <span class="hidden sm:inline">Canje</span>
        <kbd
          class="hidden rounded border border-border-strong bg-surface-card px-1 py-0.5 font-mono text-[9px] font-medium text-content-muted md:inline-block"
        >
          F6
        </kbd>
      </button>

      <button
        type="button"
        class="shadow-xs hover:bg-surface-hover inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface-app p-1.5 text-content-secondary transition-colors hover:text-content-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        :title="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
        :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
        @click="toggleFullscreen"
      >
        <Minimize v-if="isFullscreen" class="size-4" aria-hidden="true" />
        <Maximize v-else class="size-4" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Maximize, Minimize, User, Store, ArrowLeftRight } from 'lucide-vue-next'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { usePosShift } from '../composables/usePosShift'

const router = useRouter()
const authStore = useAuthStore()
const { currentShift, isShiftOpen, loadShiftData } = usePosShift()

const props = withDefaults(
  defineProps<{
    customCashierName?: string
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'open-shift'): void
  (e: 'open-exchange'): void
}>()

const isFullscreen = ref<boolean>(false)

const cashierName = computed(() => {
  if (props.customCashierName) return props.customCashierName
  const u = authStore.user
  return u?.fullName || u?.username || 'Cajero'
})

const updateFullscreenState = () => {
  isFullscreen.value = Boolean(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
  )
}

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      } else if (
        (document.documentElement as unknown as { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen
      ) {
        await (
          document.documentElement as unknown as { webkitRequestFullscreen: () => Promise<void> }
        ).webkitRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (
        (document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen
      ) {
        await (
          document as unknown as { webkitExitFullscreen: () => Promise<void> }
        ).webkitExitFullscreen()
      }
    }
    updateFullscreenState()
  } catch {
    // Si la Fullscreen API es bloqueada por permisos o navegador, se ignora silenciosamente
  }
}

const handleExit = () => {
  emit('exit')
  router.push('/')
}

onMounted(() => {
  loadShiftData()
  updateFullscreenState()
  document.addEventListener('fullscreenchange', updateFullscreenState)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState)
})
</script>
