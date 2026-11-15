import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import PosTerminalView from '../views/PosTerminalView.vue'
import PosCatalog from '../components/PosCatalog.vue'
import PosCart from '../components/PosCart.vue'
import { usePosCart } from '../composables/usePosCart'
import { routes, setupNavigationGuard } from '@/app/router'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { PosProduct } from '../types'
import type { RouteLocationNormalized } from 'vue-router'

describe('Punto de Venta (POS) - Estructura, Catálogo y Carrito', () => {
  let router: Router
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()

    // Autenticar por defecto con permiso sales.create
    localStorage.setItem(
      'qvaflow_user',
      JSON.stringify({
        username: 'vendedor',
        fullName: 'Carlos Valdés (Cajero)',
        permissions: ['sales.create', 'sales.view'],
      })
    )

    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })

    await router.push('/sales/pos')
    await router.isReady()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('(1) foco permanente: el buscador se enfoca al montar y tras agregar un producto', async () => {
    const wrapper = mount(PosCatalog, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)

    // El elemento enfocado en el DOM debe ser el input del buscador
    expect(document.activeElement).toBe(input.element)

    // Al seleccionar un producto, se emite add-to-cart y se reenfoca el input
    const productButton = wrapper.find('[data-testid="pos-catalog-grid"] button')
    if (productButton.exists()) {
      await productButton.trigger('click')
      await flushPromises()
      expect(document.activeElement).toBe(input.element)
    }

    wrapper.unmount()
  })

  it('(2) Enter con código exacto agrega al carrito y limpia el input; repetir código incrementa +1 sin duplicar línea', async () => {
    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)

    // 1er Enter con código exacto: '78910001' (Café Serrano, precio 650.00 CUP, stock 24.00)
    await input.setValue('78910001')
    await input.trigger('keydown.enter')
    await flushPromises()

    // El input se limpia automáticamente
    expect((input.element as HTMLInputElement).value).toBe('')

    // Carrito debe tener exactamente 1 línea con cantidad '1.00'
    const cartLines = wrapper.findAll('[data-testid="pos-cart-items"] > div')
    expect(cartLines).toHaveLength(1)
    expect(cartLines[0].text()).toContain('Café Serrano Clásico 250g')
    expect(cartLines[0].text()).toContain('1.00')
    expect(cartLines[0].text()).toContain('650.00')

    // 2do Enter con el MISMO código: no debe duplicar la fila, sino sumar +1
    await input.setValue('78910001')
    await input.trigger('keydown.enter')
    await flushPromises()

    // Sigue habiendo 1 sola fila en el carrito
    const cartLinesAfter = wrapper.findAll('[data-testid="pos-cart-items"] > div')
    expect(cartLinesAfter).toHaveLength(1)
    // Cantidad ahora es 2.00
    expect(cartLinesAfter[0].text()).toContain('2.00')
    // Subtotal ahora es 1300.00 CUP
    expect(cartLinesAfter[0].text()).toContain('1300.00')

    wrapper.unmount()
  })

  it('(3) límite de stock: no permite agregar ni incrementar por encima de las existencias disponibles', async () => {
    const cart = usePosCart()
    const productLimited: PosProduct = {
      id: 105,
      code: '78910005',
      name: 'Cigarros H. Upmann Selecto',
      category: 'Tabacos',
      priceCUP: '300.00',
      priceUSD: '0.83',
      stock: '2.00', // Stock disponible solo 2
      unit: 'cajetilla',
    }

    // 1era adición: 1.00 unidad -> permitido
    expect(cart.addToCart(productLimited, '1.00')).toBe(true)
    expect(cart.items.value[0].quantity).toBe('1.00')

    // 2da adición: +1.00 unidad -> permitido (alcanza el tope de 2.00)
    expect(cart.addToCart(productLimited, '1.00')).toBe(true)
    expect(cart.items.value[0].quantity).toBe('2.00')

    // 3era adición: superar stock de 2.00 -> bloqueado (retorna false y se mantiene en 2.00)
    expect(cart.addToCart(productLimited, '1.00')).toBe(false)
    expect(cart.items.value[0].quantity).toBe('2.00')

    // Incrementar en carrito cuando ya está al máximo -> bloqueado
    expect(cart.increment('78910005')).toBe(false)
    expect(cart.items.value[0].quantity).toBe('2.00')

    // En el componente PosCart el botón '+' queda deshabilitado
    const wrapper = mount(PosCart, {
      props: {
        items: cart.items.value,
        totalCUP: cart.totalCUP.value,
        totalLinesCount: cart.totalLinesCount.value,
        totalUnitsCount: cart.totalUnitsCount.value,
        isEmpty: cart.isEmpty.value,
        isShiftOpen: true,
      },
    })

    const plusButton = wrapper.find('button[title="Stock máximo alcanzado"]')
    expect(plusButton.exists()).toBe(true)
    expect(plusButton.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Máx')
  })

  it('(4) vaciar con confirmación: botón abre ConfirmDialog y solo vacía si el usuario confirma', async () => {
    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()

    // Agregamos un producto para que el carrito no esté vacío
    const input = wrapper.find('input')
    await input.setValue('78910001')
    await input.trigger('keydown.enter')
    await flushPromises()

    expect(wrapper.find('[data-testid="pos-cart-items"]').exists()).toBe(true)

    // Pulsar botón "Vaciar"
    const clearBtn = wrapper.find('button[title="Vaciar carrito"]')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    await flushPromises()

    // Debe abrirse el diálogo de confirmación con role="dialog"
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('¿Vaciar carrito de compra?')

    // Confirmar el vaciado
    const confirmBtn = Array.from(dialog?.querySelectorAll('button') || []).find((b) =>
      b.textContent?.includes('Vaciar')
    ) as HTMLButtonElement
    expect(confirmBtn).toBeDefined()
    confirmBtn.click()
    await flushPromises()

    // El carrito ahora está vacío
    expect(wrapper.find('[data-testid="pos-cart-empty"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('(5) Escape sale: pulsar Escape o el botón Salir del POS redirige a /', async () => {
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(PosTerminalView, {
      global: {
        plugins: [pinia, router],
      },
      attachTo: document.body,
    })

    await flushPromises()

    // 1. Probar clic en botón "Salir del POS"
    const exitBtn = wrapper.find('button[title="Salir del Punto de Venta (Escape)"]')
    expect(exitBtn.exists()).toBe(true)
    await exitBtn.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/')

    pushSpy.mockClear()

    // 2. Probar tecla Escape global
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(pushSpy).toHaveBeenCalledWith('/')

    wrapper.unmount()
  })

  it('(6) sin permiso sales.create redirige con 403 a /forbidden', async () => {
    const authStore = useAuthStore()
    // El usuario almacenero solo tiene permisos de inventario, NO tiene sales.create
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const to = {
      name: 'sales-pos',
      fullPath: '/sales/pos',
      meta: { permission: 'sales.create' },
    } as unknown as RouteLocationNormalized

    const from = {} as RouteLocationNormalized

    const result = await setupNavigationGuard(to, from)

    expect(result).toEqual({
      name: 'forbidden',
      query: { permission: 'sales.create' },
    })
  })
})
