import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseChart from '../BaseChart.vue'
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue'
import EmptyState from '@/shared/ui/EmptyState.vue'

const mockSetOption = vi.fn()
const mockResize = vi.fn()
const mockDispose = vi.fn()

vi.mock('../echartsCore', () => ({
  init: vi.fn(() => ({
    setOption: mockSetOption,
    resize: mockResize,
    dispose: mockDispose,
  })),
}))

// Mock de ResizeObserver en entorno happy-dom
globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
} as any

describe('BaseChart.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('(1) monta sin errores con option mínima', async () => {
    const wrapper = mount(BaseChart, {
      props: {
        option: {
          series: [{ type: 'bar', data: [10, 20] }],
        },
        ariaLabel: 'Gráfico de barras de prueba',
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 30))

    expect(wrapper.exists()).toBe(true)
    expect(mockSetOption).toHaveBeenCalled()
  })

  it('(2) muestra EmptyState con empty=true y BaseSkeleton con loading=true', () => {
    const loadingWrapper = mount(BaseChart, {
      props: {
        option: {},
        ariaLabel: 'Gráfico en carga',
        loading: true,
      },
    })
    expect(loadingWrapper.findComponent(BaseSkeleton).exists()).toBe(true)
    expect(loadingWrapper.find('[role="img"]').exists()).toBe(false)

    const emptyWrapper = mount(BaseChart, {
      props: {
        option: {},
        ariaLabel: 'Gráfico sin datos',
        empty: true,
      },
    })
    expect(emptyWrapper.findComponent(EmptyState).exists()).toBe(true)
    expect(emptyWrapper.find('[role="img"]').exists()).toBe(false)
  })

  it('(3) llama a dispose al desmontar', async () => {
    const wrapper = mount(BaseChart, {
      props: {
        option: { series: [] },
        ariaLabel: 'Gráfico desmontable',
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 30))

    wrapper.unmount()
    expect(mockDispose).toHaveBeenCalled()
  })

  it('(4) el aria-label llega al elemento con role="img"', () => {
    const label = 'Evolución mensual de ingresos y gastos'
    const wrapper = mount(BaseChart, {
      props: {
        option: {},
        ariaLabel: label,
      },
    })

    const imgEl = wrapper.find('[role="img"]')
    expect(imgEl.exists()).toBe(true)
    expect(imgEl.attributes('aria-label')).toBe(label)
  })

  it('renderiza la alternativa textual accesible en slot table con clase sr-only', () => {
    const wrapper = mount(BaseChart, {
      props: {
        option: {},
        ariaLabel: 'Gráfico con tabla accesible',
      },
      slots: {
        table: '<table data-test="accessible-table"><tbody><tr><td>Datos</td></tr></tbody></table>',
      },
    })

    const srOnlyContainer = wrapper.find('.sr-only')
    expect(srOnlyContainer.exists()).toBe(true)
    expect(srOnlyContainer.find('[data-test="accessible-table"]').exists()).toBe(true)
  })
})
