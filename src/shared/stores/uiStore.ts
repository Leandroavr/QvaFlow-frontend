import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ServerConnectionStatus } from '../ui/StatusDot.vue'
import type { ThemePreference } from '../composables/useTheme'

export const useUiStore = defineStore('ui', () => {
  const serverStatus = ref<ServerConnectionStatus>('checking')
  const theme = ref<ThemePreference>('light')
  const lastHealthCheck = ref<string | null>(null)
  const isServerAvailable = ref(true)

  const setServerStatus = (status: ServerConnectionStatus) => {
    serverStatus.value = status
    isServerAvailable.value = status === 'connected'
    lastHealthCheck.value = new Date().toISOString()
  }

  const setTheme = (newTheme: ThemePreference) => {
    theme.value = newTheme
  }

  return {
    serverStatus,
    theme,
    lastHealthCheck,
    isServerAvailable,
    setServerStatus,
    setTheme,
  }
})
