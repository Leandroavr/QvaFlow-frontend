import { ref, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useTheme } from '@/shared/composables/useTheme'

export interface ChartThemeTokens {
  textPrimary: string
  textSecondary: string
  textMuted: string
  borderDefault: string
  borderSubtle: string
  surfaceCard: string
  surfacePage: string
  primary: string
  success: string
  warning: string
  error: string
  info: string
  accent: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
  chart6: string
  chart7: string
  chart8: string
  /**
   * Paleta para series categóricas deducida de los tokens CSS --chart-1 a --chart-8.
   */
  palette: string[]
}

function resolveVar(style: CSSStyleDeclaration, prop: string, fallback: string): string {
  const val = style.getPropertyValue(prop).trim()
  return val || fallback
}

export function readTokensFromDOM(): ChartThemeTokens {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      borderDefault: '#cbd5e1',
      borderSubtle: 'rgba(15, 23, 42, 0.08)',
      surfaceCard: '#ffffff',
      surfacePage: '#f8fafc',
      primary: '#1e3a6b',
      success: '#15803d',
      warning: '#b45309',
      error: '#b91c1c',
      info: '#0369a1',
      accent: '#d62839',
      chart1: '#2563eb',
      chart2: '#0d9488',
      chart3: '#7c3aed',
      chart4: '#ea580c',
      chart5: '#db2777',
      chart6: '#0891b2',
      chart7: '#c026d3',
      chart8: '#ca8a04',
      palette: [
        '#2563eb',
        '#0d9488',
        '#7c3aed',
        '#ea580c',
        '#db2777',
        '#0891b2',
        '#c026d3',
        '#ca8a04',
      ],
    }
  }

  const style = window.getComputedStyle(document.documentElement)

  const primary = resolveVar(style, '--qvaflow-primary', '#1e3a6b')
  const info = resolveVar(style, '--color-info', '#0369a1')
  const success = resolveVar(style, '--color-success', '#15803d')
  const warning = resolveVar(style, '--color-warning', '#b45309')
  const error = resolveVar(style, '--color-error', '#b91c1c')
  const accent = resolveVar(style, '--qvaflow-accent', '#d62839')

  const chart1 = resolveVar(style, '--chart-1', '#2563eb')
  const chart2 = resolveVar(style, '--chart-2', '#0d9488')
  const chart3 = resolveVar(style, '--chart-3', '#7c3aed')
  const chart4 = resolveVar(style, '--chart-4', '#ea580c')
  const chart5 = resolveVar(style, '--chart-5', '#db2777')
  const chart6 = resolveVar(style, '--chart-6', '#0891b2')
  const chart7 = resolveVar(style, '--chart-7', '#c026d3')
  const chart8 = resolveVar(style, '--chart-8', '#ca8a04')

  return {
    textPrimary: resolveVar(style, '--color-text-primary', '#0f172a'),
    textSecondary: resolveVar(style, '--color-text-secondary', '#334155'),
    textMuted: resolveVar(style, '--color-text-muted', '#64748b'),
    borderDefault: resolveVar(style, '--color-border-default', '#cbd5e1'),
    borderSubtle: resolveVar(style, '--color-border-subtle', 'rgba(15, 23, 42, 0.08)'),
    surfaceCard: resolveVar(style, '--surface-card', '#ffffff'),
    surfacePage: resolveVar(style, '--surface-page', '#f8fafc'),
    primary,
    success,
    warning,
    error,
    info,
    accent,
    chart1,
    chart2,
    chart3,
    chart4,
    chart5,
    chart6,
    chart7,
    chart8,
    // Paleta de series categóricas basada en los tokens --chart-1 a --chart-8
    palette: [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8],
  }
}

export function useChartTheme() {
  const { isDark, theme } = useTheme()
  const chartTheme = ref<ChartThemeTokens>(readTokensFromDOM())

  const updateTokens = () => {
    chartTheme.value = readTokensFromDOM()
  }

  const syncThemeAndTokens = () => {
    if (typeof document !== 'undefined') {
      const targetDark = theme.value === 'dark'
      const hasDarkClass = document.documentElement.classList.contains('dark')
      if (targetDark !== hasDarkClass) {
        if (targetDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    updateTokens()
  }

  watch(
    theme,
    () => {
      syncThemeAndTokens()
    },
    { flush: 'sync' }
  )

  // Observer para cambios directos de clase en <html> (p. ej. scripts o transiciones externas)
  if (
    typeof window !== 'undefined' &&
    typeof MutationObserver !== 'undefined' &&
    typeof document !== 'undefined' &&
    document.documentElement
  ) {
    const observer = new MutationObserver(() => {
      updateTokens()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    if (getCurrentInstance()) {
      onBeforeUnmount(() => {
        observer.disconnect()
      })
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      syncThemeAndTokens()
    })
  }

  return {
    chartTheme,
    isDark,
    updateTokens,
  }
}
