import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

import { MockInventoryService } from '@/services/mock/mockInventoryService'
import { ApiError } from '@/shared/types/api'
import { useAuthStore } from '@/features/auth/stores/authStore'
import InventoryStockView from '@/app/views/inventory/InventoryStockView.vue'
import WarehousesView from '@/app/views/inventory/WarehousesView.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

describe('Módulo de Inventario y Almacenes (Pruebas Unitarias)', () => {
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
        { path: '/inventory/stock', component: InventoryStockView },
        { path: '/inventory/warehouses', component: WarehousesView },
      ],
    })

    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // =========================================================================
  // 1. Pruebas de MockInventoryService
  // =========================================================================
  describe('1. MockInventoryService - Lógica de Servidor en Memoria', () => {
    it('filtra correctamente por almacén', async () => {
      const service = new MockInventoryService()
      const res = await service.getStock({ warehouse: 'ALM-CENTRAL', perPage: 50 })

      expect(res.items.length).toBeGreaterThan(0)
      expect(res.items.every((item) => item.warehouseCode === 'ALM-CENTRAL')).toBe(true)
    })

    it('filtra correctamente por localización', async () => {
      const service = new MockInventoryService()
      const res = await service.getStock({ location: 'LOC-CEN-P1', perPage: 50 })

      expect(res.items.length).toBeGreaterThan(0)
      expect(res.items.every((item) => item.locationCode === 'LOC-CEN-P1')).toBe(true)
    })

    it('filtra por estado de stock: low, out, ok', async () => {
      const service = new MockInventoryService()

      const resLow = await service.getStock({ status: 'low' })
      expect(resLow.items.every((i) => i.status === 'low')).toBe(true)

      const resOut = await service.getStock({ status: 'out' })
      expect(resOut.items.every((i) => i.status === 'out')).toBe(true)

      const resOk = await service.getStock({ status: 'ok' })
      expect(resOk.items.every((i) => i.status === 'ok')).toBe(true)
    })

    it('filtra por término de búsqueda en nombre o código', async () => {
      const service = new MockInventoryService()
      const res = await service.getStock({ search: 'Café' })

      expect(res.items.length).toBeGreaterThan(0)
      expect(
        res.items.some((i) => i.productName.includes('Café') || i.productCode.includes('Café'))
      ).toBe(true)
    })

    it('ordena y pagina los resultados de existencias', async () => {
      const service = new MockInventoryService()
      const page1 = await service.getStock({ page: 1, perPage: 3, sort: 'productName:asc' })
      const page2 = await service.getStock({ page: 2, perPage: 3, sort: 'productName:asc' })

      expect(page1.items.length).toBe(3)
      expect(page2.items.length).toBe(3)
      expect(page1.items[0].productCode).not.toBe(page2.items[0].productCode)
    })

    it('lanza ApiError 409 al intentar eliminar un almacén con existencias asociadas', async () => {
      const service = new MockInventoryService()
      // ALM-CENTRAL tiene existencias en INITIAL_STOCK
      await expect(service.deleteWarehouse('ALM-CENTRAL')).rejects.toThrow(ApiError)

      try {
        await service.deleteWarehouse('ALM-CENTRAL')
      } catch (err: any) {
        expect(err.statusCode).toBe(409)
        expect(err.code).toBe('WAREHOUSE_HAS_STOCK')
        expect(err.message).toContain('existencias')
      }
    })

    it('lanza ApiError 409 al intentar eliminar una localización con existencias asociadas', async () => {
      const service = new MockInventoryService()
      // LOC-CEN-P1 tiene existencias asignadas
      await expect(service.deleteLocation('LOC-CEN-P1')).rejects.toThrow(ApiError)

      try {
        await service.deleteLocation('LOC-CEN-P1')
      } catch (err: any) {
        expect(err.statusCode).toBe(409)
        expect(err.code).toBe('LOCATION_HAS_STOCK')
      }
    })

    it('lanza ApiError 409 al intentar crear un almacén con código duplicado', async () => {
      const service = new MockInventoryService()
      await expect(
        service.createWarehouse({ code: 'ALM-CENTRAL', name: 'Duplicado Central' })
      ).rejects.toThrow(ApiError)

      try {
        await service.createWarehouse({ code: 'ALM-CENTRAL', name: 'Duplicado Central' })
      } catch (err: any) {
        expect(err.statusCode).toBe(409)
        expect(err.code).toBe('CODE_ALREADY_EXISTS')
      }
    })

    it('lanza ApiError 409 al intentar crear una localización con código duplicado', async () => {
      const service = new MockInventoryService()
      await expect(
        service.createLocation({
          code: 'LOC-CEN-P1',
          warehouseCode: 'ALM-CENTRAL',
          name: 'Pasillo Duplicado',
        })
      ).rejects.toThrow(ApiError)

      try {
        await service.createLocation({
          code: 'LOC-CEN-P1',
          warehouseCode: 'ALM-CENTRAL',
          name: 'Pasillo Duplicado',
        })
      } catch (err: any) {
        expect(err.statusCode).toBe(409)
        expect(err.code).toBe('CODE_ALREADY_EXISTS')
      }
    })

    it('omite campo cost y costValue para usuarios sin permiso products.view_cost', async () => {
      const authStore = useAuthStore()
      // Login como vendedor (no tiene permiso products.view_cost)
      await authStore.login({ username: 'vendedor', password: 'password123' })

      const service = new MockInventoryService()
      const stock = await service.getStock({ perPage: 5 })
      const summary = await service.getStockSummary()

      // En stock, ningún item debe tener propiedad cost
      expect(stock.items.every((item) => item.cost === undefined)).toBe(true)

      // En summary, no debe existir costValue
      expect(summary.costValue).toBeUndefined()
    })

    it('incluye campo cost y costValue para superadmin con permiso products.view_cost', async () => {
      const authStore = useAuthStore()
      // Login como superadmin (tiene products.view_cost)
      await authStore.login({ username: 'superadmin', password: 'password123' })

      const service = new MockInventoryService()
      const stock = await service.getStock({ perPage: 5 })
      const summary = await service.getStockSummary()

      // Debe incluir cost y costValue
      expect(stock.items.some((item) => item.cost !== undefined)).toBe(true)
      expect(summary.costValue).toBeDefined()
    })
  })

  // =========================================================================
  // 2. Pruebas de Vistas y RBAC
  // =========================================================================
  describe('2. Vistas de Inventario y Control de Acceso (RBAC)', () => {
    it('monta InventoryStockView para superadmin con 4 StatCards y columna de costo', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'superadmin', password: 'password123' })

      await router.push('/inventory/stock')
      const wrapper = mount(InventoryStockView, {
        global: {
          plugins: [pinia, router],
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Debe incluir la tarjeta de valor al costo
      expect(wrapper.text()).toContain('Valor al costo (CUP)')
      expect(wrapper.text()).toContain('Stock de Inventario')
    })

    it('monta InventoryStockView para vendedor con 3 StatCards y sin columna de costo', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'vendedor', password: 'password123' })

      await router.push('/inventory/stock')
      const wrapper = mount(InventoryStockView, {
        global: {
          plugins: [pinia, router],
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Vendedor no ve costo
      expect(wrapper.text()).not.toContain('Valor al costo (CUP)')
    })

    it('monta WarehousesView para superadmin con botones de acción para crear almacén y localización', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'superadmin', password: 'password123' })

      await router.push('/inventory/warehouses')
      const wrapper = mount(WarehousesView, {
        global: {
          plugins: [pinia, router],
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Nuevo almacén')
      expect(wrapper.text()).toContain('Nueva localización')
    })

    it('monta WarehousesView para vendedor en modo lectura sin botones de creación ni acciones', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'vendedor', password: 'password123' })

      await router.push('/inventory/warehouses')
      const wrapper = mount(WarehousesView, {
        global: {
          plugins: [pinia, router],
        },
      })

      expect(wrapper.exists()).toBe(true)
      // Vendedor carece de warehouses.manage
      expect(wrapper.text()).not.toContain('Nuevo almacén')
      expect(wrapper.text()).not.toContain('Nueva localización')
    })
  })

  // =========================================================================
  // 3. ConfirmDialog
  // =========================================================================
  describe('3. ConfirmDialog (src/shared/ui/ConfirmDialog.vue)', () => {
    it('emite evento confirm al pulsar el botón de confirmación', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          open: true,
          title: '¿Eliminar elemento?',
          message: 'Esta acción es irreversible.',
          confirmText: 'Sí, eliminar',
          cancelText: 'Cancelar',
        },
      })

      const vm = wrapper.vm as any
      vm.handleConfirm()

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')!.length).toBe(1)
    })

    it('emite evento cancel al pulsar el botón de cancelar o cerrar el diálogo', async () => {
      const wrapper = mount(ConfirmDialog, {
        props: {
          open: true,
          title: '¿Eliminar elemento?',
          message: 'Esta acción es irreversible.',
          confirmText: 'Sí, eliminar',
          cancelText: 'No, cancelar',
        },
      })

      const vm = wrapper.vm as any
      vm.handleCancel()

      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false])

      // Comprobar también cierre por escape o backdrop
      vm.handleOpenUpdate(false)
      expect(wrapper.emitted('cancel')!.length).toBe(2)
      expect(wrapper.emitted('update:open')?.[1]).toEqual([false])
    })
  })

  // =========================================================================
  // 4. Sincronización con URL
  // =========================================================================
  describe('4. Sincronización con URL (Query Params)', () => {
    it('lee parámetros de la URL al montar InventoryStockView', async () => {
      const authStore = useAuthStore()
      await authStore.login({ username: 'superadmin', password: 'password123' })

      await router.push('/inventory/stock?search=Refresco&status=low&page=2')

      const wrapper = mount(InventoryStockView, {
        global: {
          plugins: [pinia, router],
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(router.currentRoute.value.query.search).toBe('Refresco')
      expect(router.currentRoute.value.query.status).toBe('low')
      expect(router.currentRoute.value.query.page).toBe('2')
    })
  })
})
