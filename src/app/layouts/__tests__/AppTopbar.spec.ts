import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import AppTopbar from '../AppTopbar.vue'
import { routes } from '../../router'
import { useAuthStore } from '../../../features/auth/stores/authStore'
import { ChevronRight } from 'lucide-vue-next'

describe('AppTopbar Breadcrumbs', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })
  })

  it('en la ruta de Inicio muestra solo "Inicio" sin duplicar ("Inicio > Inicio")', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mount(AppTopbar, {
      props: {
        serverStatus: 'connected',
      },
      global: {
        plugins: [pinia, router],
      },
    })

    const nav = wrapper.find('nav[aria-label="Migas de pan"]')
    expect(nav.exists()).toBe(true)

    // Solo debe haber un texto de "Inicio" y ningún separador ChevronRight adicional
    const navText = nav.text().replace(/\s+/g, ' ').trim()
    expect(navText).toBe('Inicio')
    expect(navText).not.toContain('Inicio Inicio')
    expect(wrapper.findAllComponents(ChevronRight)).toHaveLength(0)

    wrapper.unmount()
  })

  it('en una ruta de primer nivel como Reportes muestra "Inicio > Reportes" sin duplicar "Reportes"', async () => {
    await router.push('/reports')
    await router.isReady()

    const wrapper = mount(AppTopbar, {
      props: {
        serverStatus: 'connected',
      },
      global: {
        plugins: [pinia, router],
      },
    })

    const nav = wrapper.find('nav[aria-label="Migas de pan"]')
    expect(nav.exists()).toBe(true)

    // Debe contener Inicio y Reportes exactamente una vez cada uno
    const labels = nav
      .findAll('span')
      .map((el) => el.text().trim())
      .filter(Boolean)
    expect(labels).toContain('Inicio')
    expect(labels.filter((l) => l === 'Reportes')).toHaveLength(1)

    // La miga actual debe ser Reportes
    const currentPage = nav.find('[aria-current="page"]')
    expect(currentPage.exists()).toBe(true)
    expect(currentPage.text().trim()).toBe('Reportes')

    wrapper.unmount()
  })

  it('en una ruta agrupada como Stock muestra la jerarquía completa "Inicio > Inventario > Stock"', async () => {
    await router.push('/inventory/stock')
    await router.isReady()

    const wrapper = mount(AppTopbar, {
      props: {
        serverStatus: 'connected',
      },
      global: {
        plugins: [pinia, router],
      },
    })

    const nav = wrapper.find('nav[aria-label="Migas de pan"]')
    expect(nav.exists()).toBe(true)

    const labels = nav
      .findAll('span')
      .map((el) => el.text().trim())
      .filter(Boolean)
    expect(labels).toContain('Inicio')
    expect(labels).toContain('Inventario')
    expect(labels).toContain('Stock')

    const currentPage = nav.find('[aria-current="page"]')
    expect(currentPage.exists()).toBe(true)
    expect(currentPage.text().trim()).toBe('Stock')

    // Dos chevrons separando Inicio -> Inventario -> Stock
    expect(wrapper.findAllComponents(ChevronRight)).toHaveLength(2)

    wrapper.unmount()
  })
})
