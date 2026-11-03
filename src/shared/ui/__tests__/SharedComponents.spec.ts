import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import BaseBadge from '../BaseBadge.vue'
import StatCard from '../StatCard.vue'
import BaseSkeleton from '../BaseSkeleton.vue'
import EmptyState from '../EmptyState.vue'
import BaseSelect from '../BaseSelect.vue'
import BaseModal from '../BaseModal.vue'
import BaseDrawer from '../BaseDrawer.vue'
import BaseTabs from '../BaseTabs.vue'
import BaseDropdownMenu from '../BaseDropdownMenu.vue'
import BaseTooltip from '../BaseTooltip.vue'
import BaseFormField from '../BaseFormField.vue'
import BaseButton from '../BaseButton.vue'
import { TrendingUp, Package, Plus } from 'lucide-vue-next'

describe('Componentes Primitivos UI (src/shared/ui)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error')
    consoleWarnSpy = vi.spyOn(console, 'warn')
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  describe('1. BaseBadge', () => {
    it('monta sin errores ni advertencias en todas sus variantes', () => {
      const variants = ['neutral', 'success', 'warning', 'danger', 'info'] as const

      variants.forEach((v) => {
        const wrapper = mount(BaseBadge, {
          props: { variant: v, dot: true },
          slots: { default: 'Test' },
        })
        expect(wrapper.exists()).toBe(true)
        expect(wrapper.text()).toContain('Test')
        wrapper.unmount()
      })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('2. StatCard', () => {
    it('monta sin errores en estado normal y con tendencia', () => {
      const wrapper = mount(StatCard, {
        props: {
          label: 'Ventas del día',
          value: '$1,200.00',
          description: '30 tickets',
          trend: { value: '+10%', direction: 'up', label: 'vs ayer' },
          icon: TrendingUp,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Ventas del día')
      expect(wrapper.text()).toContain('$1,200.00')
      expect(wrapper.text()).toContain('+10%')
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('renderiza skeleton cuando loading=true', () => {
      const wrapper = mount(StatCard, {
        props: {
          label: 'Cargando',
          value: '---',
          loading: true,
        },
      })

      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('---')
      wrapper.unmount()
    })
  })

  describe('3. BaseSkeleton y EmptyState', () => {
    it('BaseSkeleton monta con token de superficie y animación pulse', () => {
      const wrapper = mount(BaseSkeleton, {
        props: { width: '100px', height: '20px' },
      })
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.classes()).toContain('animate-pulse')
      expect(wrapper.classes()).toContain('bg-surface-skeleton')
      wrapper.unmount()
    })

    it('EmptyState monta con icono, título, descripción y slots', () => {
      const wrapper = mount(EmptyState, {
        props: {
          title: 'Sin datos',
          description: 'No hay elementos para mostrar.',
          icon: Package,
        },
        slots: {
          actions: '<button id="btn-action">Crear</button>',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Sin datos')
      expect(wrapper.text()).toContain('No hay elementos para mostrar.')
      expect(wrapper.find('#btn-action').exists()).toBe(true)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('4. BaseSelect', () => {
    const options = [
      { label: 'Almacén 1', value: 'wh-1' },
      { label: 'Almacén 2', value: 'wh-2' },
      { label: 'Almacén 3 (deshabilitado)', value: 'wh-3', disabled: true },
    ]

    it('monta sin errores y muestra etiqueta y placeholder', () => {
      const wrapper = mount(BaseSelect, {
        props: {
          label: 'Almacenes',
          placeholder: 'Seleccione un almacén',
          options,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Almacenes')
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })

    it('emite update:modelValue al seleccionar una opción', async () => {
      const wrapper = mount(BaseSelect, {
        props: {
          options,
          includeAllOption: true,
          allOptionLabel: 'Todos los almacenes',
        },
      })

      // Simular selección de opción normal
      const vm = wrapper.vm as any
      vm.handleUpdate('wh-2')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['wh-2'])

      // Simular selección de opción "Todos"
      vm.handleUpdate('__all_option__')
      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([''])

      wrapper.unmount()
    })
  })

  describe('5. BaseModal y BaseDrawer', () => {
    it('BaseModal monta y emite close al cerrarse con Escape', async () => {
      const wrapper = mount(BaseModal, {
        props: {
          open: true,
          title: 'Modal de prueba',
          description: 'Descripción del modal',
        },
        slots: {
          default: '<p>Contenido modal</p>',
          actions: '<button id="confirm">Aceptar</button>',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()

      // Invocar handleOpenUpdate con false (lo que dispara Reka UI al presionar Escape o cerrar)
      const vm = wrapper.vm as any
      vm.handleOpenUpdate(false)

      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
      expect(wrapper.emitted('close')).toBeTruthy()

      wrapper.unmount()
    })

    it('BaseDrawer monta y gestiona su ciclo de apertura', async () => {
      const wrapper = mount(BaseDrawer, {
        props: {
          open: true,
          title: 'Panel lateral',
          description: 'Detalles',
          size: 'lg',
        },
        slots: {
          default: '<div>Contenido del drawer</div>',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()

      const vm = wrapper.vm as any
      vm.handleOpenUpdate(false)
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
      expect(wrapper.emitted('close')).toBeTruthy()

      wrapper.unmount()
    })
  })

  describe('6. BaseTabs', () => {
    it('monta con pestañas subrayadas y contadores', () => {
      const items = [
        { id: 'tab1', label: 'Activos', count: 5 },
        { id: 'tab2', label: 'Archivados', count: 0 },
      ]

      const wrapper = mount(BaseTabs, {
        props: {
          modelValue: 'tab1',
          items,
        },
        slots: {
          tab1: '<div>Contenido Tab 1</div>',
          tab2: '<div>Contenido Tab 2</div>',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Activos')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('Archivados')
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('7. BaseDropdownMenu', () => {
    it('monta y dispara acciones configuradas al seleccionar un ítem', async () => {
      const clickSpy = vi.fn()
      const items = [
        { id: 'action-1', label: 'Editar', onClick: clickSpy },
        { id: 'action-2', label: 'Eliminar', danger: true },
      ]

      const wrapper = mount(BaseDropdownMenu, {
        props: { items },
        slots: {
          trigger: '<button id="btn-trigger">Opciones</button>',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()

      // Invocar handleSelect sobre action-1
      const vm = wrapper.vm as any
      vm.handleSelect(items[0])

      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(wrapper.emitted('select')?.[0]).toEqual(['action-1'])

      wrapper.unmount()
    })
  })

  describe('8. BaseTooltip', () => {
    it('monta con trigger envuelto sin advertencias de consola', () => {
      const wrapper = mount(BaseTooltip, {
        props: { content: 'Texto de ayuda emergente', side: 'top' },
        slots: {
          default: '<button id="btn-tooltip">Posa el ratón</button>',
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('#btn-tooltip').exists()).toBe(true)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('9. BaseFormField', () => {
    it('asocia correctamente etiquetas, texto de ayuda y mensaje de error con aria-describedby', () => {
      const wrapper = mount(BaseFormField, {
        props: {
          id: 'test-field',
          label: 'Nombre completo',
          help: 'Ingrese su nombre tal como aparece en el documento.',
          required: true,
        },
        slots: {
          default: (slotProps: any) =>
            h('input', {
              id: slotProps.id,
              'aria-describedby': slotProps.describedBy,
            }),
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('label').attributes('for')).toBe('test-field')
      expect(wrapper.text()).toContain('Nombre completo')
      expect(wrapper.find('#test-field-help').exists()).toBe(true)
      expect(wrapper.find('input').attributes('aria-describedby')).toContain('test-field-help')

      // Probar estado de error
      wrapper.setProps({ error: 'El campo es obligatorio' })
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      wrapper.unmount()
    })
  })

  describe('10. BaseButton', () => {
    it('renderiza icono y texto en una sola línea con clases inline-flex, items-center, justify-center, gap-2 y whitespace-nowrap', () => {
      const wrapper = mount(BaseButton, {
        props: {
          icon: Plus,
        },
        slots: {
          default: 'Nuevo almacén',
        },
      })

      expect(wrapper.exists()).toBe(true)
      const buttonClasses = wrapper.classes()
      expect(buttonClasses).toContain('inline-flex')
      expect(buttonClasses).toContain('items-center')
      expect(buttonClasses).toContain('justify-center')
      expect(buttonClasses).toContain('gap-2')
      expect(buttonClasses).toContain('whitespace-nowrap')

      // Verificar que el contenedor de texto también previene saltos de línea
      const textSpan = wrapper.find('span.whitespace-nowrap')
      expect(textSpan.exists()).toBe(true)
      expect(textSpan.text()).toBe('Nuevo almacén')
      wrapper.unmount()
    })
  })
})
