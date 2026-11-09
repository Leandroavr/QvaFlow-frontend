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
    document.documentElement.style.setProperty('--chart-1', '#2563eb')

    const { chartTheme } = useChartTheme()

    expect(chartTheme.value).toBeDefined()
    expect(chartTheme.value.textPrimary).toBe('#112233')
    expect(chartTheme.value.primary).toBe('#445566')
    expect(chartTheme.value.chart1).toBe('#2563eb')
    expect(Array.isArray(chartTheme.value.palette)).toBe(true)
    expect(chartTheme.value.palette).toHaveLength(8)
    expect(chartTheme.value.palette[0]).toBe('#2563eb')

    // Cambiar propiedad CSS y alternar el tema
    document.documentElement.style.setProperty('--color-text-primary', '#f8fafc')
    document.documentElement.style.setProperty('--chart-1', '#60a5fa')
    toggleTheme()

    expect(chartTheme.value.textPrimary).toBe('#f8fafc')
    expect(chartTheme.value.chart1).toBe('#60a5fa')
    expect(chartTheme.value.palette[0]).toBe('#60a5fa')
  })
})
