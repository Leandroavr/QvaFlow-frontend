import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

import { useAuthStore } from '@/features/auth/stores/authStore'
import InventoryTransfersView from '@/app/views/inventory/InventoryTransfersView.vue'
import InventoryAdjustmentsView from '@/app/views/inventory/InventoryAdjustmentsView.vue'

describe('Vistas de Documentos de Inventario (Traslados y Ajustes)', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: Router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/inventory/transfers', component: InventoryTransfersView },
        { path: '/inventory/adjustments', component: InventoryAdjustmentsView },
      ],
    })

    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  const waitDelay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms))

  // =========================================================================
  // 1. Vista de Movimientos y Traslados
  // =========================================================================
  describe('InventoryTransfersView', () => {
    it('(1) monta para almacenero y muestra las filas semilla de traslados', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/transfers')
      const wrapper = mount(InventoryTransfersView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Movimientos y Traslados')
      // Muestra documentos semilla precargados
      expect(wrapper.text()).toContain('TRF-2026-0001')
      expect(wrapper.text()).toContain('TRF-2026-0002')
      expect(wrapper.text()).toContain('TRF-2026-0003')
      expect(wrapper.text()).toContain('Confirmado')
    })

    it('(2) abre el drawer al hacer clic en una fila y muestra los items del traslado', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/transfers')
      const wrapper = mount(InventoryTransfersView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      // Buscar la fila de TRF-2026-0001
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)
      const trfRow = rows.find((r) => r.text().includes('TRF-2026-0001')) ?? rows[0]
      await trfRow.trigger('click')
      await waitDelay()
      await flushPromises()

      // El drawer está en document.body mediante DialogPortal
      expect(document.body.textContent).toContain('Detalle de Traslado')
      expect(document.body.textContent).toContain('Líneas de Mercancía Trasladada')
      expect(document.body.textContent).toContain('Café Serrano Clásico 250g')
      expect(document.body.textContent).toContain('LOC-CEN-P1')
      expect(document.body.textContent).toContain('LOC-TND-E1')
    })

    it('(3) el botón "Nuevo traslado" no aparece para un usuario con solo inventory.view', async () => {
      const authStore = useAuthStore()
      authStore.token = 'mock-auditor-token'
      authStore.user = {
        id: 'usr_auditor_01',
        username: 'auditor',
        fullName: 'Auditor de Inventario',
        role: 'Auditor',
        permissions: ['inventory.view'],
        lastLoginAt: '2026-11-01T10:00:00Z',
      }
      localStorage.setItem('qvaflow_token', 'mock-auditor-token')
      localStorage.setItem('qvaflow_user', JSON.stringify(authStore.user))

      await router.push('/inventory/transfers')
      const wrapper = mount(InventoryTransfersView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('TRF-2026-0001')
      expect(wrapper.text()).not.toContain('Nuevo traslado')
    })

    it('(4) la búsqueda y la página se sincronizan con la URL', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/transfers?search=TRF-2026-0001&page=1')
      const wrapper = mount(InventoryTransfersView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(router.currentRoute.value.query.search).toBe('TRF-2026-0001')
      expect(router.currentRoute.value.query.page).toBe('1')
      expect(wrapper.text()).toContain('TRF-2026-0001')
      expect(wrapper.text()).not.toContain('TRF-2026-0002')
    })

    it('(5) el estado vacío aparece cuando el filtro no devuelve resultados', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/transfers?search=INEXISTENTE_XYZ_999')
      const wrapper = mount(InventoryTransfersView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(wrapper.text()).toContain('No se encontraron traslados')
    })
  })

  // =========================================================================
  // 2. Vista de Ajustes de Inventario
  // =========================================================================
  describe('InventoryAdjustmentsView', () => {
    it('(1) monta para almacenero y muestra las filas semilla de ajustes', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/adjustments')
      const wrapper = mount(InventoryAdjustmentsView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Ajustes de Inventario')
      expect(wrapper.text()).toContain('AJU-2026-0001')
      expect(wrapper.text()).toContain('AJU-2026-0002')
      expect(wrapper.text()).toContain('Confirmado')
    })

    it('(2) abre el drawer al hacer clic en una fila y muestra los items del ajuste', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/adjustments')
      const wrapper = mount(InventoryAdjustmentsView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)
      // Clic en la primera fila
      await rows[0].trigger('click')
      await waitDelay()
      await flushPromises()

      expect(document.body.textContent).toContain('Detalle de Ajuste')
      expect(document.body.textContent).toContain('Líneas de Ajuste Físico')
      expect(document.body.textContent).toContain('Sistema')
      expect(document.body.textContent).toContain('Contado')
      expect(document.body.textContent).toContain('Diferencia')
    })

    it('(3) el botón "Nuevo ajuste" no aparece para un usuario con solo inventory.view', async () => {
      const authStore = useAuthStore()
      authStore.token = 'mock-auditor-token'
      authStore.user = {
        id: 'usr_auditor_01',
        username: 'auditor',
        fullName: 'Auditor de Inventario',
        role: 'Auditor',
        permissions: ['inventory.view'],
        lastLoginAt: '2026-11-01T10:00:00Z',
      }
      localStorage.setItem('qvaflow_token', 'mock-auditor-token')
      localStorage.setItem('qvaflow_user', JSON.stringify(authStore.user))

      await router.push('/inventory/adjustments')
      const wrapper = mount(InventoryAdjustmentsView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('AJU-2026-0001')
      expect(wrapper.text()).not.toContain('Nuevo ajuste')
    })

    it('(4) la búsqueda y la página se sincronizan con la URL', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/adjustments?search=envase&page=1')
      const wrapper = mount(InventoryAdjustmentsView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(router.currentRoute.value.query.search).toBe('envase')
      expect(router.currentRoute.value.query.page).toBe('1')
      expect(wrapper.text()).toContain('AJU-2026-0001')
      expect(wrapper.text()).not.toContain('AJU-2026-0002')
    })

    it('(5) el estado vacío aparece cuando el filtro no devuelve resultados', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      await router.push('/inventory/adjustments?search=NO_EXISTE_ESTE_AJUSTE')
      const wrapper = mount(InventoryAdjustmentsView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      expect(wrapper.text()).toContain('No se encontraron ajustes')
    })

    it('(6) el ajuste con conteo 0 muestra la diferencia con signo negativo (-4.00)', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'almacenero', password: 'password123' })

      // AJU-2026-0002 tiene conteo 0.00 sobre pollo entero congelado (sistema 4.00, diff -4.00)
      await router.push('/inventory/adjustments?search=AJU-2026-0002')
      const wrapper = mount(InventoryAdjustmentsView, {
        global: {
          plugins: [pinia, router],
        },
      })

      await flushPromises()
      await waitDelay()
      await flushPromises()

      const row = wrapper.find('tbody tr')
      expect(row.exists()).toBe(true)
      await row.trigger('click')
      await waitDelay()
      await flushPromises()

      // Verificar que en el drawer aparezca el conteo en 0.00 y la diferencia con signo -4.00
      expect(document.body.textContent).toContain('Pollo Entero Congelado 1kg')
      expect(document.body.textContent).toContain('0.00')
      expect(document.body.textContent).toContain('-4.00')
    })
  })
})
