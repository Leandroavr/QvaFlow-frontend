import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useChartTheme } from '../useChartTheme'
import { useTheme, initThemeBeforeMount } from '../useTheme'

describe('useChartTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.cssText = ''
    vi.restoreAllMocks()
  })

  it('(5) devuelve los tokens leídos del documento y cambia al alternar el tema', () => {
    initThemeBeforeMount()
    const { toggleTheme } = useTheme()

    // Establecer propiedades CSS simuladas en documentElement
    document.documentElement.style.setProperty('--color-text-primary', '#112233')
    document.documentElement.style.setProperty('--qvaflow-primary', '#445566')

    const { chartTheme } = useChartTheme()

    expect(chartTheme.value).toBeDefined()
    expect(chartTheme.value.textPrimary).toBe('#112233')
    expect(chartTheme.value.primary).toBe('#445566')
    expect(Array.isArray(chartTheme.value.palette)).toBe(true)
    expect(chartTheme.value.palette.length).toBeGreaterThan(0)

    // Cambiar propiedad CSS y alternar el tema
    document.documentElement.style.setProperty('--color-text-primary', '#f8fafc')
    toggleTheme()

    expect(chartTheme.value.textPrimary).toBe('#f8fafc')
  })
})
