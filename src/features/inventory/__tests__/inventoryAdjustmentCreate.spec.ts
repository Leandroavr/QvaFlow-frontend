import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

import { useAuthStore } from '@/features/auth/stores/authStore'
import { inventoryService } from '@/services'
import InventoryStockView from '@/app/views/inventory/InventoryStockView.vue'
import InventoryTransfersView from '@/app/views/inventory/InventoryTransfersView.vue'
import InventoryTransferCreateView from '@/app/views/inventory/InventoryTransferCreateView.vue'
import InventoryAdjustmentsView from '@/app/views/inventory/InventoryAdjustmentsView.vue'
import InventoryAdjustmentCreateView from '@/app/views/inventory/InventoryAdjustmentCreateView.vue'
import ForbiddenView from '@/app/views/ForbiddenView.vue'

describe('Formulario de Ajustes y Acciones de Stock (InventoryAdjustmentCreateView)', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: Router

  const waitDelay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms))

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/forbidden', name: 'forbidden', component: ForbiddenView },
        { path: '/inventory/stock', name: 'inventory-stock', component: InventoryStockView },
        {
          path: '/inventory/transfers',
          name: 'inventory-transfers',
          component: InventoryTransfersView,
        },
        {
          path: '/inventory/transfers/new',
          name: 'inventory-transfers-new',
          component: InventoryTransferCreateView,
          meta: { permission: 'inventory.transfer' },
        },
        {
          path: '/inventory/adjustments',
          name: 'inventory-adjustments',
          component: InventoryAdjustmentsView,
        },
        {
          path: '/inventory/adjustments/new',
          name: 'inventory-adjustments-new',
          component: InventoryAdjustmentCreateView,
          meta: { permission: 'inventory.adjust' },
        },
      ],
    })

    await router.push('/inventory/adjustments/new')
    await router.isReady()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('(1) ajuste monta para almacenero y no para vendedor (403)', async () => {
    const authStore = useAuthStore()

    // 1. Vendedor sin permiso 'inventory.adjust'
    await authStore.login({ username: 'vendedor', password: 'password123' })
    const wrapperVendedor = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    expect(wrapperVendedor.text()).toContain('Acceso Denegado (403)')
    expect(wrapperVendedor.find('[data-test="submit-adjustment-button"]').exists()).toBe(false)
    wrapperVendedor.unmount()

    // 2. Almacenero con permiso 'inventory.adjust'
    await authStore.login({ username: 'almacenero', password: 'password123' })
    const wrapperAlmacenero = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(wrapperAlmacenero.text()).toContain('Nuevo Ajuste de Inventario')
    expect(wrapperAlmacenero.text()).not.toContain('Acceso Denegado (403)')
    expect(wrapperAlmacenero.find('[data-test="submit-adjustment-button"]').exists()).toBe(true)
    wrapperAlmacenero.unmount()
  })

  it('(2) agregar línea muestra sistema y diferencia con signo', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.draftProductCode = '78910001'
    vm.draftLocationCode = 'LOC-TND-E1'
    vm.draftCountedQuantity = '30.00' // Sistema tiene 24.00, diferencia +6.00
    await flushPromises()

    // Comprobar cuadro de previsualización
    expect(wrapper.find('[data-test="preview-system"]').text()).toContain('24.00')
    expect(wrapper.find('[data-test="preview-difference"]').text()).toContain('+6.00')

    // Agregar línea a la tabla
    const addBtn = wrapper.find('[data-test="add-line-button"]')
    await addBtn.trigger('click')
    await flushPromises()

    const rows = wrapper.findAll('[data-test="line-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]?.text()).toContain('78910001')
    expect(rows[0]?.text()).toContain('24.00')
    expect(rows[0]?.text()).toContain('30.00')
    expect(rows[0]?.text()).toContain('+6.00')

    wrapper.unmount()
  })

  it('(3) conteo 0 se acepta y muestra diferencia negativa', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.draftProductCode = '78910001'
    vm.draftLocationCode = 'LOC-TND-E1'
    vm.draftCountedQuantity = '0.00' // Sistema tiene 24.00, diferencia -24.00
    await flushPromises()

    expect(wrapper.find('[data-test="preview-difference"]').text()).toContain('-24.00')

    vm.addLineFromDraft()
    await flushPromises()

    const rows = wrapper.findAll('[data-test="line-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]?.text()).toContain('0.00')
    expect(rows[0]?.text()).toContain('-24.00')

    wrapper.unmount()
  })

  it('(4) duplicado producto+localización bloquea', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vm = wrapper.vm as any
    // Primera línea válida
    vm.draftProductCode = '78910001'
    vm.draftLocationCode = 'LOC-TND-E1'
    vm.draftCountedQuantity = '25.00'
    vm.addLineFromDraft()
    await flushPromises()

    expect(vm.lines.length).toBe(1)

    // Intento de segunda línea idéntica
    vm.draftProductCode = '78910001'
    vm.draftLocationCode = 'LOC-TND-E1'
    vm.draftCountedQuantity = '26.00'
    await flushPromises()

    const addBtn = wrapper.find('[data-test="add-line-button"]')
    await addBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="duplicate-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="duplicate-error"]').text()).toContain(
      'No se puede duplicar la combinación de producto y localización'
    )
    expect(vm.lines.length).toBe(1)

    wrapper.unmount()
  })

  it('(5) envío válido crea el ajuste, el stock cambia y navega al listado con el nuevo número', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // 1. Ingresar motivo
    const reasonInput = wrapper.find('[data-test="reason-input"] input')
    await reasonInput.setValue('Arqueo general de existencias')

    // 2. Agregar línea con Aceite Criollo (78910002 en LOC-CEN-P1 tenía 15.00, lo ajustamos a 18.00)
    const vm = wrapper.vm as any
    vm.draftProductCode = '78910002'
    vm.draftLocationCode = 'LOC-CEN-P1'
    vm.draftCountedQuantity = '18.00'
    vm.addLineFromDraft()
    await flushPromises()

    expect(vm.lines.length).toBe(1)

    // 3. Registrar ajuste
    const submitBtn = wrapper.find('[data-test="submit-adjustment-button"]')
    await submitBtn.trigger('click')

    await flushPromises()
    await waitDelay(300)
    await flushPromises()

    // Comprobar navegación a /inventory/adjustments
    expect(router.currentRoute.value.path).toBe('/inventory/adjustments')

    // Comprobar que el stock cambió a 18.00
    const stockRes = await inventoryService.getStock({ search: '78910002', location: 'LOC-CEN-P1' })
    const updatedItem = stockRes.items.find(
      (s) => s.productCode === '78910002' && s.locationCode === 'LOC-CEN-P1'
    )
    expect(updatedItem?.quantity).toBe('18.00')

    wrapper.unmount()
  })

  it('(6) sin existencias previas muestra "Sin existencias previas"', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vm = wrapper.vm as any
    // Café Serrano (78910001) no existe en LOC-CEN-EA
    vm.draftProductCode = '78910001'
    vm.draftLocationCode = 'LOC-CEN-EA'
    vm.draftCountedQuantity = '5.00'
    await flushPromises()

    // Cuadro de previsualización indica sin existencias previas
    const noPrevEl = wrapper.find('[data-test="no-previous-stock"]')
    expect(noPrevEl.exists()).toBe(true)
    expect(noPrevEl.text()).toContain('Sin existencias previas')
    expect(wrapper.find('[data-test="preview-system"]').text()).toContain('0.00')

    vm.addLineFromDraft()
    await flushPromises()

    const rows = wrapper.findAll('[data-test="line-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]?.text()).toContain('Sin existencias previas')

    wrapper.unmount()
  })

  it('(7) Cancelar con cambios pide confirmación', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Sin cambios, cancelar navega directamente
    const cancelBtn = wrapper.find('[data-test="cancel-button"]')
    await cancelBtn.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/inventory/adjustments')

    // Regresar al formulario
    await router.push('/inventory/adjustments/new')
    await flushPromises()

    // Con cambios en motivo
    const reasonInput = wrapper.find('[data-test="reason-input"] input')
    await reasonInput.setValue('Ajuste cancelado con cambios')
    await flushPromises()

    await cancelBtn.trigger('click')
    await flushPromises()

    // ConfirmDialog se abre en el documento
    expect(document.body.textContent).toContain('Descartar cambios')
    expect(router.currentRoute.value.path).toBe('/inventory/adjustments/new')

    const vm = wrapper.vm as any
    vm.handleConfirmDiscard()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/inventory/adjustments')

    wrapper.unmount()
  })

  it('(8) acción "Trasladar" de Stock navega con los query params y el formulario los precarga', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    await router.push('/inventory/stock')
    const stockWrapper = mount(InventoryStockView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Ejecutar acción por fila 'transfer'
    const vmStock = stockWrapper.vm as any
    vmStock.handleRowAction({
      actionId: 'transfer',
      row: {
        productCode: '78910001',
        locationCode: 'LOC-TND-E1',
      },
    })

    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/inventory/transfers/new')
    expect(router.currentRoute.value.query.productCode).toBe('78910001')
    expect(router.currentRoute.value.query.sourceLocationCode).toBe('LOC-TND-E1')

    // Montar InventoryTransferCreateView con la ruta actual
    const transferWrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vmTransfer = transferWrapper.vm as any
    expect(vmTransfer.draftProductCode).toBe('78910001')
    expect(vmTransfer.draftSourceLocation).toBe('LOC-TND-E1')
    expect(vmTransfer.lines.length).toBe(0) // Pendiente de captura, sin enviar nada

    stockWrapper.unmount()
    transferWrapper.unmount()
  })

  it('(9) acción "Ajustar" de Stock navega con los query params y el formulario los precarga', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    await router.push('/inventory/stock')
    const stockWrapper = mount(InventoryStockView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Ejecutar acción por fila 'adjust'
    const vmStock = stockWrapper.vm as any
    vmStock.handleRowAction({
      actionId: 'adjust',
      row: {
        productCode: '78910001',
        locationCode: 'LOC-TND-E1',
      },
    })

    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/inventory/adjustments/new')
    expect(router.currentRoute.value.query.productCode).toBe('78910001')
    expect(router.currentRoute.value.query.locationCode).toBe('LOC-TND-E1')

    // Montar InventoryAdjustmentCreateView con la ruta actual
    const adjustWrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vmAdjust = adjustWrapper.vm as any
    expect(vmAdjust.draftProductCode).toBe('78910001')
    expect(vmAdjust.draftLocationCode).toBe('LOC-TND-E1')
    expect(vmAdjust.lines.length).toBe(0) // Pendiente de captura

    stockWrapper.unmount()
    adjustWrapper.unmount()
  })

  it('(10) un usuario con solo uno de los dos permisos ve solo esa acción', async () => {
    const authStore = useAuthStore()

    // 1. Usuario con inventory.view e inventory.transfer (sin inventory.adjust)
    authStore.token = 'mock-transfer-token'
    authStore.user = {
      id: 991,
      fullName: 'Transfer User',
      username: 'transfer_only',
      role: 'operador',
      permissions: ['inventory.view', 'inventory.transfer'],
    }

    await router.push('/inventory/stock')
    const wrapperTransferOnly = mount(InventoryStockView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    const vmTransferOnly = wrapperTransferOnly.vm as any
    const actionsTransferOnly = vmTransferOnly.getRowActions({
      productCode: 'P1',
      locationCode: 'L1',
    })
    const idsTransferOnly = actionsTransferOnly.map((a: any) => a.id)

    expect(idsTransferOnly).toContain('transfer')
    expect(idsTransferOnly).not.toContain('adjust')
    wrapperTransferOnly.unmount()

    // 2. Usuario con inventory.view e inventory.adjust (sin inventory.transfer)
    authStore.token = 'mock-adjust-token'
    authStore.user = {
      id: 992,
      fullName: 'Adjust User',
      username: 'adjust_only',
      role: 'auditor',
      permissions: ['inventory.view', 'inventory.adjust'],
    }

    const wrapperAdjustOnly = mount(InventoryStockView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    const vmAdjustOnly = wrapperAdjustOnly.vm as any
    const actionsAdjustOnly = vmAdjustOnly.getRowActions({ productCode: 'P1', locationCode: 'L1' })
    const idsAdjustOnly = actionsAdjustOnly.map((a: any) => a.id)

    expect(idsAdjustOnly).toContain('adjust')
    expect(idsAdjustOnly).not.toContain('transfer')
    wrapperAdjustOnly.unmount()
  })

  it('(11) query params inválidos no rompen el formulario', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    // 1. Params inválidos en /inventory/transfers/new
    await router.push(
      '/inventory/transfers/new?productCode=INEXISTENTE_999&sourceLocationCode=LOC_INVALIDA'
    )
    const transferWrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vmTransfer = transferWrapper.vm as any
    expect(vmTransfer.draftProductCode).toBe('')
    expect(vmTransfer.lines.length).toBe(0)
    transferWrapper.unmount()

    // 2. Params inválidos en /inventory/adjustments/new
    await router.push(
      '/inventory/adjustments/new?productCode=INEXISTENTE_999&locationCode=LOC_INVALIDA'
    )
    const adjustWrapper = mount(InventoryAdjustmentCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vmAdjust = adjustWrapper.vm as any
    expect(vmAdjust.draftProductCode).toBe('')
    expect(vmAdjust.lines.length).toBe(0)
    adjustWrapper.unmount()
  })
})
