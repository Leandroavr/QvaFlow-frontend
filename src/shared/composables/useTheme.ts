import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'

export type ThemePreference = 'light' | 'dark'

const STORAGE_KEY = 'qvaflow_theme'
const currentTheme = ref<ThemePreference>('light')

/**
 * Inicialización inmediata para evitar parpadeo visual (FOUC)
 * y resolución/migración segura de preferencias previas.
 */
export function initThemeBeforeMount(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const saved = localStorage.getItem(STORAGE_KEY)

  if (saved === 'light' || saved === 'dark') {
    currentTheme.value = saved
  } else if (saved === 'system') {
    // Migración segura: si contenía 'system', se resuelve UNA sola vez según prefers-color-scheme
    const systemDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved: ThemePreference = systemDark ? 'dark' : 'light'
    currentTheme.value = resolved
    localStorage.setItem(STORAGE_KEY, resolved)
  } else if (saved !== null) {
    // Valor inválido: migrar resolviendo una vez según prefers-color-scheme
    const systemDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved: ThemePreference = systemDark ? 'dark' : 'light'
    currentTheme.value = resolved
    localStorage.setItem(STORAGE_KEY, resolved)
  } else {
    // Primera visita sin preferencia guardada: por defecto 'light'
    currentTheme.value = 'light'
  }

  applyDarkClass(currentTheme.value === 'dark')
  return currentTheme.value
}

function applyDarkClass(isDark: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark')

  const setTheme = (theme: ThemePreference) => {
    currentTheme.value = theme
    localStorage.setItem(STORAGE_KEY, theme)
    applyDarkClass(theme === 'dark')
  }

  const toggleTheme = () => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  watch(currentTheme, (newTheme) => {
    applyDarkClass(newTheme === 'dark')
  })

  if (getCurrentInstance()) {
    onMounted(() => {
      applyDarkClass(currentTheme.value === 'dark')
    })
  }

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
