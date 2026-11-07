import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import AppLayout from '../AppLayout.vue'
import AppSidebar from '../AppSidebar.vue'
import { routes } from '../../router'
import { useAuthStore } from '../../../features/auth/stores/authStore'

describe('AppLayout Smoke Tests', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    // Espiar console.error y console.warn para detectar fallos silenciosos o warnings de Vue
    consoleErrorSpy = vi.spyOn(console, 'error')
    consoleWarnSpy = vi.spyOn(console, 'warn')

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    vi.clearAllTimers()
  })

  it('monta AppLayout para superadmin sin lanzar errores ni advertencias y muestra todas las secciones', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    // Superadmin debe ver todas las opciones en el sidebar
    const sidebarText = wrapper.find('aside').text()
    expect(sidebarText).toContain('Inicio')
    expect(sidebarText).toContain('Ventas')
    expect(sidebarText).toContain('Caja')
    expect(sidebarText).toContain('Inventario')
    expect(sidebarText).toContain('Productos')
    expect(sidebarText).toContain('Compras')
    expect(sidebarText).toContain('Reportes')
    expect(sidebarText).toContain('Administración')

    wrapper.unmount()
  }, 15000)

  it('monta AppLayout para vendedor mostrando solo Inicio, Ventas y Productos', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'vendedor', password: 'password123' })

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    const sidebarText = wrapper.find('aside').text()
    expect(sidebarText).toContain('Inicio')
    expect(sidebarText).toContain('Ventas')
    expect(sidebarText).toContain('Productos')

    // No debe mostrar módulos sin autorización en el menú
    expect(sidebarText).not.toContain('Inventario')
    expect(sidebarText).not.toContain('Compras')
    expect(sidebarText).not.toContain('Reportes')
    expect(sidebarText).not.toContain('Administración')

    wrapper.unmount()
  }, 15000)

  it('monta AppLayout para almacenero mostrando solo Inicio, Inventario, Productos y Compras', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    const sidebarText = wrapper.find('aside').text()
    expect(sidebarText).toContain('Inicio')
    expect(sidebarText).toContain('Inventario')
    expect(sidebarText).toContain('Productos')
    expect(sidebarText).toContain('Compras')

    // No debe mostrar ventas ni administración en el menú
    expect(sidebarText).not.toContain('Ventas')
    expect(sidebarText).not.toContain('Administración')

    wrapper.unmount()
  }, 15000)

  it('abre automáticamente el grupo padre al navegar directamente a una ruta hija', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    // Navegar directamente a una ruta hija de inventario
    await router.push('/inventory/stock')
    await router.isReady()

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    // El grupo padre Inventario debe estar expandido y mostrar "Stock"
    const text = wrapper.text()
    expect(text).toContain('Inventario')
    expect(text).toContain('Stock')
    expect(text).toContain('Almacenes')

    wrapper.unmount()
  }, 15000)

  it('renderiza el popover del sidebar colapsado mediante Teleport fuera del elemento aside', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const wrapper = mount(AppSidebar, {
      props: {
        collapsed: true,
        mobileOpen: false,
      },
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    const groupTrigger = wrapper.find('[data-sidebar-group="sales"]')
    expect(groupTrigger.exists()).toBe(true)

    // Al interactuar con el grupo en modo colapsado, se abre el popover flotante
    await groupTrigger.trigger('mouseenter')

    // El popover debe encontrarse en document.body mediante Teleport
    const teleportedPopover = document.body.querySelector('[data-sidebar-popover]')
    expect(teleportedPopover).not.toBeNull()
    expect(teleportedPopover?.textContent).toContain('Punto de venta')

    // Y NO debe encontrarse dentro de la jerarquía interna del aside
    const insideAside = wrapper.find('aside').find('[data-sidebar-popover]')
    expect(insideAside.exists()).toBe(false)

    // Cierre con tecla Escape
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[data-sidebar-popover]')).toBeNull()

    wrapper.unmount()
  }, 15000)
})
