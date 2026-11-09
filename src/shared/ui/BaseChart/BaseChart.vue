<template>
  <div class="w-full">
    <!-- Estado de carga esquelético -->
    <BaseSkeleton v-if="loading" :height="height" rounded="rounded-xl" class="w-full" />

    <!-- Estado vacío accesible -->
    <EmptyState
      v-else-if="empty"
      title="Sin datos para graficar"
      description="No hay información disponible para el período o filtros seleccionados."
      class="rounded-xl"
      :style="{ minHeight: height }"
    />

    <!-- Gráfico SVG renderizado con ECharts -->
    <div v-else class="relative w-full" :style="{ height }">
      <div ref="chartEl" role="img" :aria-label="resolvedAriaLabel" class="h-full w-full" />

      <!-- Alternativa textual accesible para lectores de pantalla -->
      <div v-if="$slots.table" class="sr-only">
        <slot name="table" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'
import { useChartTheme, type ChartThemeTokens } from '@/shared/composables/useChartTheme'
import type { EChartsType } from './echartsCore'

interface Props {
  /** Configuración y series de ECharts */
  option: Record<string, any>
  /** Altura del contenedor gráfico (por defecto 280px) */
  height?: string
  /** Descripción accesible obligatoria para lectores de pantalla */
  ariaLabel?: string
  'aria-label'?: string
  /** Estado de carga visual */
  loading?: boolean
  /** Estado de datos vacíos */
  empty?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '280px',
  loading: false,
  empty: false,
})

const resolvedAriaLabel = computed(
  () => props.ariaLabel || props['aria-label'] || 'Gráfico interactivo'
)

const chartEl = ref<HTMLElement | null>(null)
let chartInstance: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

const { chartTheme } = useChartTheme()

function applyAxisTheme(axis: any, theme: ChartThemeTokens): any {
  if (!axis) return axis
  if (Array.isArray(axis)) {
    return axis.map((a) => applyAxisTheme(a, theme))
  }
  return {
    ...axis,
    axisLine: {
      lineStyle: { color: theme.borderDefault },
      ...(axis.axisLine || {}),
    },
    axisTick: {
      lineStyle: { color: theme.borderDefault },
      ...(axis.axisTick || {}),
    },
    axisLabel: {
      color: theme.textMuted,
      ...(axis.axisLabel || {}),
    },
    splitLine: {
      lineStyle: { color: theme.borderSubtle },
      ...(axis.splitLine || {}),
    },
  }
}

function applyTooltipTheme(tooltip: any, theme: ChartThemeTokens): any {
  if (tooltip === false) return false
  return {
    backgroundColor: theme.surfaceCard,
    borderColor: theme.borderDefault,
    textStyle: {
      color: theme.textPrimary,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
    },
    ...(tooltip || {}),
  }
}

function applyLegendTheme(legend: any, theme: ChartThemeTokens): any {
  if (legend === false || legend === null || legend === undefined) return legend
  const defaultLegendConfig = {
    top: 8,
    left: 'center',
    textStyle: {
      color: theme.textSecondary,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12,
    },
  }
  if (Array.isArray(legend)) {
    return legend.map((item) => ({
      ...defaultLegendConfig,
      ...(item || {}),
      textStyle: {
        ...defaultLegendConfig.textStyle,
        ...(item?.textStyle || {}),
      },
    }))
  }
  return {
    ...defaultLegendConfig,
    ...(legend || {}),
    textStyle: {
      ...defaultLegendConfig.textStyle,
      ...(legend?.textStyle || {}),
    },
  }
}

function applyGridTheme(grid: any, theme: ChartThemeTokens, hasLegend: boolean): any {
  const defaultGridConfig = {
    top: hasLegend ? 48 : 24,
    right: 20,
    bottom: 24,
    left: 20,
    containLabel: true,
    borderColor: theme.borderSubtle,
  }
  if (Array.isArray(grid)) {
    return grid.map((item) => ({
      ...defaultGridConfig,
      ...(item || {}),
    }))
  }
  return {
    ...defaultGridConfig,
    ...(grid || {}),
  }
}

function buildThemedOption(
  option: Record<string, any>,
  theme: ChartThemeTokens
): Record<string, any> {
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const hasLegend = Boolean(
    option.legend &&
    option.legend !== false &&
    (!Array.isArray(option.legend) || option.legend.length > 0)
  )

  return {
    ...option,
    color: option.color || theme.palette,
    textStyle: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: theme.textSecondary,
      ...(option.textStyle || {}),
    },
    animation: !prefersReduced,
    animationDuration: prefersReduced ? 0 : 300,
    animationDurationUpdate: prefersReduced ? 0 : 300,
    aria: {
      enabled: true,
      decal: { show: false },
    },
    grid: applyGridTheme(option.grid, theme, hasLegend),
    tooltip: applyTooltipTheme(option.tooltip, theme),
    legend: applyLegendTheme(option.legend, theme),
    xAxis: applyAxisTheme(option.xAxis, theme),
    yAxis: applyAxisTheme(option.yAxis, theme),
  }
}

const renderChart = () => {
  if (!chartInstance) return
  const themed = buildThemedOption(props.option, chartTheme.value)
  chartInstance.setOption(themed, true)
}

const setupResizeObserver = () => {
  if (resizeObserver || !chartEl.value || typeof ResizeObserver === 'undefined') return
  resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize()
  })
  resizeObserver.observe(chartEl.value)
}

const initChart = async () => {
  if (props.loading || props.empty) return
  await nextTick()
  if (!chartEl.value) return

  if (!chartInstance) {
    // Carga diferida en un chunk separado (import dinámico)
    const { init } = await import('./echartsCore')
    if (!chartEl.value) return
    chartInstance = init(chartEl.value, undefined, {
      renderer: 'svg',
    })
    setupResizeObserver()
  }

  renderChart()
}

const disposeChart = () => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

watch(
  [() => props.option, () => chartTheme.value],
  () => {
    if (chartInstance && !props.loading && !props.empty) {
      renderChart()
    }
  },
  { deep: true }
)

watch([() => props.loading, () => props.empty], ([newLoading, newEmpty]) => {
  if (newLoading || newEmpty) {
    disposeChart()
  } else {
    initChart()
  }
})

onMounted(() => {
  initChart()
})

onBeforeUnmount(() => {
  disposeChart()
})
</script>
