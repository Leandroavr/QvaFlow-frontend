import { getCurrentInstance, onMounted, onUnmounted, computed, type ComputedRef } from 'vue'
import { useUiStore } from '../stores/uiStore'
import { authService } from '../../services'
import type { ServerConnectionStatus } from '../ui/StatusDot.vue'

// ============================================================================
// Estado del polling compartido a nivel de módulo (Singleton en runtime)
// Garantiza un único intervalo activo en toda la SPA sin llamadas duplicadas.
// ============================================================================
let sharedTimer: ReturnType<typeof setInterval> | null = null
let subscriberCount = 0
let isPinging = false
let currentPingPromise: Promise<void> | null = null
let listenersAttached = false

const handleOnline = () => {
  void triggerSharedCheck()
}

const handleOffline = () => {
  try {
    const uiStore = useUiStore()
    uiStore.setServerStatus('disconnected')
  } catch {
    // Silenciar si se ejecuta fuera de contexto Pinia
  }
}

/**
 * Ejecuta una comprobación de salud contra el backend Symfony.
 * Si ya hay un ping en curso, reutiliza la misma promesa (deduplicación).
 */
export async function triggerSharedCheck(): Promise<void> {
  if (isPinging && currentPingPromise) {
    return currentPingPromise
  }

  isPinging = true
  currentPingPromise = (async () => {
    try {
      const uiStore = useUiStore()
      await authService.checkHealth()
      uiStore.setServerStatus('connected')
    } catch {
      try {
        const uiStore = useUiStore()
        uiStore.setServerStatus('disconnected')
      } catch {
        // Silenciar si Pinia no está activo
      }
    } finally {
      isPinging = false
      currentPingPromise = null
    }
  })()

  return currentPingPromise
}

function startSharedPolling(intervalMs: number) {
  subscriberCount++

  if (subscriberCount === 1) {
    // Comprobación inicial inmediata
    void triggerSharedCheck()

    // Temporizador único global
    if (!sharedTimer) {
      sharedTimer = setInterval(() => {
        void triggerSharedCheck()
      }, intervalMs)
    }

    if (typeof window !== 'undefined' && !listenersAttached) {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      listenersAttached = true
    }
  }
}

function stopSharedPolling() {
  subscriberCount = Math.max(0, subscriberCount - 1)

  if (subscriberCount === 0) {
    if (sharedTimer) {
      clearInterval(sharedTimer)
      sharedTimer = null
    }

    if (typeof window !== 'undefined' && listenersAttached) {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      listenersAttached = false
    }
  }
}

/**
 * Resetea el estado del singleton para entornos de prueba aislados.
 */
export function _resetSharedServerStatusState() {
  if (sharedTimer) {
    clearInterval(sharedTimer)
    sharedTimer = null
  }
  if (typeof window !== 'undefined' && listenersAttached) {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    listenersAttached = false
  }
  subscriberCount = 0
  isPinging = false
  currentPingPromise = null
}

/**
 * Composable para monitorizar el estado de conexión del servidor local Symfony en tiempo real.
 * Garantiza UN solo polling compartido y expone estado reactivo mediante ComputedRef.
 */
export function useServerStatus(intervalMs = 15000) {
  const uiStore = useUiStore()

  // Reactividad garantizada: ComputedRef para no perder reactividad al desestructurar
  const serverStatus: ComputedRef<ServerConnectionStatus> = computed(() => uiStore.serverStatus)
  const isServerAvailable: ComputedRef<boolean> = computed(() => uiStore.isServerAvailable)

  // Registro del ciclo de vida si se invoca dentro de un componente Vue
  if (getCurrentInstance()) {
    onMounted(() => {
      startSharedPolling(intervalMs)
    })

    onUnmounted(() => {
      stopSharedPolling()
    })
  }

  return {
    serverStatus,
    isServerAvailable,
    checkConnection: triggerSharedCheck,
  }
}
