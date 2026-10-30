import { onMounted, onUnmounted, ref } from 'vue'
import { useUiStore } from '../stores/uiStore'
import { authService } from '../../services'

/**
 * Composable para monitorizar el estado de conexión del servidor local Symfony en tiempo real.
 * Realiza un ping ligero periódico y reintenta ante fallos.
 */
export function useServerStatus(intervalMs = 15000) {
  const uiStore = useUiStore()
  const isPinging = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  const checkConnection = async () => {
    if (isPinging.value) return
    isPinging.value = true

    try {
      await authService.checkHealth()
      uiStore.setServerStatus('connected')
    } catch {
      uiStore.setServerStatus('disconnected')
    } finally {
      isPinging.value = false
    }
  }

  onMounted(() => {
    // Comprobación inicial inmediata
    checkConnection()

    // Intervalo de reintento periódico
    timer = setInterval(checkConnection, intervalMs)

    // Escuchar eventos estándar de red local del navegador
    if (typeof window !== 'undefined') {
      window.addEventListener('online', checkConnection)
      window.addEventListener('offline', () => uiStore.setServerStatus('disconnected'))
    }
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    serverStatus: uiStore.serverStatus,
    isServerAvailable: uiStore.isServerAvailable,
    checkConnection,
  }
}
