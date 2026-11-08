import { use, init, type EChartsType, type ComposeOption } from 'echarts/core'
import { BarChart, LineChart, type BarSeriesOption, type LineSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  type GridComponentOption,
  type TooltipComponentOption,
  type LegendComponentOption,
  type AriaComponentOption,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

// Registro exclusivo de módulos concretos requeridos (Tree-shaking estricto)
use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  SVGRenderer,
])

export type ECOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | AriaComponentOption
>

export { init, type EChartsType }
