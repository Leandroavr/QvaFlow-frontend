import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'

import { useAuthStore } from '@/features/auth/stores/authStore'
import InventoryTransferCreateView from '@/app/views/inventory/InventoryTransferCreateView.vue'
import InventoryTransfersView from '@/app/views/inventory/InventoryTransfersView.vue'
import ForbiddenView from '@/app/views/ForbiddenView.vue'

describe('Formulario de Creación de Traslado (InventoryTransferCreateView)', () => {
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
        {
          path: '/inventory/transfers',
          name: 'inventory-transfers',
          component: InventoryTransfersView,
        },
        {
          path: '/inventory/transfers/new',
          name: 'inventory-transfers-new',
          component: InventoryTransferCreateView,
          meta: {
            permission: 'inventory.transfer',
          },
        },
      ],
    })

    await router.push('/inventory/transfers/new')
    await router.isReady()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('(1) monta para almacenero y no para vendedor (403)', async () => {
    const authStore = useAuthStore()

    // 1. Vendedor sin permiso 'inventory.transfer'
    await authStore.login({ username: 'vendedor', password: 'password123' })
    const wrapperVendedor = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    expect(wrapperVendedor.text()).toContain('Acceso Denegado (403)')
    expect(wrapperVendedor.find('[data-test="submit-transfer-button"]').exists()).toBe(false)
    wrapperVendedor.unmount()

    // 2. Almacenero con permiso 'inventory.transfer'
    await authStore.login({ username: 'almacenero', password: 'password123' })
    const wrapperAlmacenero = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })
    await flushPromises()
    await waitDelay()
    await flushPromises()

    expect(wrapperAlmacenero.text()).toContain('Nuevo Traslado de Inventario')
    expect(wrapperAlmacenero.text()).not.toContain('Acceso Denegado (403)')
    expect(wrapperAlmacenero.find('[data-test="submit-transfer-button"]').exists()).toBe(true)
    wrapperAlmacenero.unmount()
  })

  it('(2) agregar línea con producto, origen, destino y cantidad', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Usar el input de producto para asignar código existente
    const productInput = wrapper.find('[data-test="product-code-input"] input')
    await productInput.setValue('78910001')

    // Asignar cantidad
    const qtyInput = wrapper.find('[data-test="quantity-input"] input')
    await qtyInput.setValue('3.00')

    // Click en botón "Agregar"
    const addBtn = wrapper.find('[data-test="add-line-button"]')
    await addBtn.trigger('click')
    await flushPromises()

    // Comprobar que la línea se agregó a la tabla
    const rows = wrapper.findAll('[data-test="line-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]?.text()).toContain('78910001')
    expect(rows[0]?.text()).toContain('3.00')
    expect(wrapper.find('[data-test="total-lines"]').text()).toContain('1')

    wrapper.unmount()
  })

  it('(3) origen igual a destino bloquea', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Establecer producto y mismo origen y destino en el estado del componente
    const vm = wrapper.vm as any
    vm.draftProductCode = '78910001'
    vm.draftSourceLocation = 'LOC-CEN-P1'
    vm.draftTargetLocation = 'LOC-CEN-P1'
    await flushPromises()

    // Muestra aviso de error de misma localización
    expect(wrapper.find('[data-test="same-location-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="same-location-error"]').text()).toContain(
      'La localización de destino no puede ser igual a la de origen'
    )

    // Al pulsar agregar, la adición es rechazada y no se suma la línea
    const addBtn = wrapper.find('[data-test="add-line-button"]')
    await addBtn.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-test="line-row"]').length).toBe(0)
    wrapper.unmount()
  })

  it('(4) cantidad mayor al stock muestra aviso', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.draftProductCode = '78910001'
    // Café Serrano tiene 24.00 en LOC-TND-E1
    vm.draftSourceLocation = 'LOC-TND-E1'
    vm.draftQuantity = '50.00'
    await flushPromises()

    // Aviso visible
    const warning = wrapper.find('[data-test="stock-warning"]')
    expect(warning.exists()).toBe(true)
    expect(warning.text()).toContain('supera el stock disponible')
    expect(warning.text()).toContain('50.00')
    expect(warning.text()).toContain('24.00')

    wrapper.unmount()
  })

  it('(5) envío válido crea el documento y navega al listado con el nuevo número', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // 1. Ingresar motivo
    const reasonInput = wrapper.find('[data-test="reason-input"] input')
    await reasonInput.setValue('Reabastecimiento urgente de tienda')

    // 2. Agregar línea válida
    const vm = wrapper.vm as any
    vm.draftProductCode = '78910001'
    vm.draftSourceLocation = 'LOC-TND-E1'
    vm.draftTargetLocation = 'LOC-CEN-P1'
    vm.draftQuantity = '2.00'
    vm.addLineFromDraft()
    await flushPromises()

    expect(vm.lines.length).toBe(1)

    // 3. Registrar traslado
    const submitBtn = wrapper.find('[data-test="submit-transfer-button"]')
    await submitBtn.trigger('click')

    await flushPromises()
    await waitDelay(300)
    await flushPromises()

    // Comprobar navegación a /inventory/transfers
    expect(router.currentRoute.value.path).toBe('/inventory/transfers')

    wrapper.unmount()
  })

  it('(6) el 409 del mock se refleja en la línea correcta y no navega', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // 1. Ingresar motivo
    const reasonInput = wrapper.find('[data-test="reason-input"] input')
    await reasonInput.setValue('Traslado con stock excesivo no disponible')

    // 2. Agregar línea con cantidad superior al disponible en el servidor (Aceite Criollo 78910002 en LOC-CEN-P1 tiene 15.00)
    const vm = wrapper.vm as any
    vm.draftProductCode = '78910002'
    vm.draftSourceLocation = 'LOC-CEN-P1'
    vm.draftTargetLocation = 'LOC-TND-M1'
    vm.draftQuantity = '500.00'
    vm.addLineFromDraft()
    await flushPromises()

    expect(vm.lines.length).toBe(1)

    // 3. Registrar traslado
    const submitBtn = wrapper.find('[data-test="submit-transfer-button"]')
    await submitBtn.trigger('click')

    await flushPromises()
    await waitDelay(300)
    await flushPromises()

    // No debe navegar
    expect(router.currentRoute.value.path).toBe('/inventory/transfers/new')

    // La fila debe mostrar el error 409 reflejado
    const errorEl = wrapper.find('[data-test="stock-insufficient-error"]')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toContain('Insuficiente')
    expect(errorEl.text()).toContain('500.00')
    expect(errorEl.text()).toContain('15.00')

    wrapper.unmount()
  })

  it('(7) código escrito más Enter agrega la línea', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Simular escaneo de código de barras con pistola lectora
    const productInput = wrapper.find('[data-test="product-code-input"] input')
    await productInput.setValue('78910001')
    await productInput.trigger('keydown.enter')

    await flushPromises()

    // La línea debe agregarse directamente a la tabla
    const rows = wrapper.findAll('[data-test="line-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]?.text()).toContain('78910001')
    expect(rows[0]?.text()).toContain('Café Serrano Clásico 250g')

    wrapper.unmount()
  })

  it('(8) Cancelar con cambios pide confirmación', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const wrapper = mount(InventoryTransferCreateView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await flushPromises()
    await waitDelay()
    await flushPromises()

    // Caso 1: Sin cambios, pulsar cancelar navega directamente
    const cancelBtn = wrapper.find('[data-test="cancel-button"]')
    await cancelBtn.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/inventory/transfers')

    // Regresar al formulario
    await router.push('/inventory/transfers/new')
    await flushPromises()

    // Caso 2: Con cambios en motivo
    const reasonInput = wrapper.find('[data-test="reason-input"] input')
    await reasonInput.setValue('Cambio pendiente sin guardar')
    await flushPromises()

    await cancelBtn.trigger('click')
    await flushPromises()

    // El diálogo de confirmación se abre en document.body mediante BaseModal
    expect(document.body.textContent).toContain('Descartar cambios')
    expect(document.body.textContent).toContain('¿Está seguro de que desea cancelar?')

    // No navega hasta confirmar
    expect(router.currentRoute.value.path).toBe('/inventory/transfers/new')

    // Confirmar descarte
    const vm = wrapper.vm as any
    vm.handleConfirmDiscard()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/inventory/transfers')

    wrapper.unmount()
  })
})
