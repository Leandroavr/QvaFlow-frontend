import { ref, computed, watch, onMounted } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'qvaflow_theme'
const currentTheme = ref<ThemePreference>('system')
const systemPrefersDark = ref(false)

/**
 * Inicialización inmediata para evitar parpadeo visual (FOUC).
 */
export function initThemeBeforeMount() {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    currentTheme.value = saved
  } else {
    currentTheme.value = 'system'
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemPrefersDark.value = mediaQuery.matches

    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
      if (currentTheme.value === 'system') {
        applyDarkClass(e.matches)
      }
    })
  }

  const isDark =
    currentTheme.value === 'dark' || (currentTheme.value === 'system' && systemPrefersDark.value)
  applyDarkClass(isDark)
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
  const isDark = computed(() => {
    if (currentTheme.value === 'system') {
      return systemPrefersDark.value
    }
    return currentTheme.value === 'dark'
  })

  const setTheme = (theme: ThemePreference) => {
    currentTheme.value = theme
    localStorage.setItem(STORAGE_KEY, theme)
    applyDarkClass(isDark.value)
  }

  const toggleTheme = () => {
    if (currentTheme.value === 'light') {
      setTheme('dark')
    } else if (currentTheme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  watch(currentTheme, () => {
    applyDarkClass(isDark.value)
  })

  onMounted(() => {
    applyDarkClass(isDark.value)
  })

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
