import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTheme, initThemeBeforeMount } from '../useTheme'

describe('useTheme & initThemeBeforeMount', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.restoreAllMocks()
  })

  it('asigna "light" como tema por defecto en la primera visita sin preferencia guardada', () => {
    const resolved = initThemeBeforeMount()
    expect(resolved).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    const { theme, isDark } = useTheme()
    expect(theme.value).toBe('light')
    expect(isDark.value).toBe(false)
  })

  it('migra de forma segura desde "system" a "dark" si prefers-color-scheme es dark y lo persiste', () => {
    localStorage.setItem('qvaflow_theme', 'system')

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const resolved = initThemeBeforeMount()

    expect(resolved).toBe('dark')
    expect(localStorage.getItem('qvaflow_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    const { theme, isDark } = useTheme()
    expect(theme.value).toBe('dark')
    expect(isDark.value).toBe(true)
  })

  it('migra de forma segura desde "system" a "light" si prefers-color-scheme no es dark y lo persiste', () => {
    localStorage.setItem('qvaflow_theme', 'system')

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const resolved = initThemeBeforeMount()

    expect(resolved).toBe('light')
    expect(localStorage.getItem('qvaflow_theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('permite alternar entre "light" y "dark" con toggleTheme', () => {
    initThemeBeforeMount()
    const { theme, isDark, toggleTheme } = useTheme()

    expect(theme.value).toBe('light')

    toggleTheme()
    expect(theme.value).toBe('dark')
    expect(isDark.value).toBe(true)
    expect(localStorage.getItem('qvaflow_theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    toggleTheme()
    expect(theme.value).toBe('light')
    expect(isDark.value).toBe(false)
    expect(localStorage.getItem('qvaflow_theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
