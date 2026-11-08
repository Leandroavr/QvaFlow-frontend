import { ref, watch, onMounted, getCurrentInstance } from 'vue'
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
  /**
   * Paleta para series categóricas deducida de tokens existentes (marca y semánticos).
   * Nota: No existe una paleta categórica específica (--chart-categorical-1..N) en tokens.css.
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
      palette: ['#1e3a6b', '#0369a1', '#15803d', '#b45309', '#b91c1c', '#d62839'],
    }
  }

  const style = window.getComputedStyle(document.documentElement)

  const primary = resolveVar(style, '--qvaflow-primary', '#1e3a6b')
  const info = resolveVar(style, '--color-info', '#0369a1')
  const success = resolveVar(style, '--color-success', '#15803d')
  const warning = resolveVar(style, '--color-warning', '#b45309')
  const error = resolveVar(style, '--color-error', '#b91c1c')
  const accent = resolveVar(style, '--qvaflow-accent', '#d62839')

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
    // Paleta de series categóricas basada en tokens existentes
    palette: [primary, info, success, warning, error, accent],
  }
}

export function useChartTheme() {
  const { isDark, theme } = useTheme()
  const chartTheme = ref<ChartThemeTokens>(readTokensFromDOM())

  const updateTokens = () => {
    chartTheme.value = readTokensFromDOM()
  }

  watch(
    theme,
    () => {
      updateTokens()
    },
    { flush: 'sync' }
  )

  if (getCurrentInstance()) {
    onMounted(() => {
      updateTokens()
    })
  }

  return {
    chartTheme,
    isDark,
    updateTokens,
  }
}
