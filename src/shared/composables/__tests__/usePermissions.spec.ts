import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../../features/auth/stores/authStore'
import { usePermissions } from '../usePermissions'

describe('usePermissions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('retorna false para cualquier permiso si no hay sesión iniciada', () => {
    const { can, canAny, canAll } = usePermissions()
    expect(can('sales.create')).toBe(false)
    expect(canAny(['sales.create', 'inventory.view'])).toBe(false)
    expect(canAll(['sales.create'])).toBe(false)
  })

  it('evalúa permisos dinámicos según el perfil autenticado', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'almacenero', password: 'password123' })

    const { can, canAny, canAll } = usePermissions()

    // Almacenero tiene acceso a inventario y compras, y costo de productos
    expect(can('inventory.view')).toBe(true)
    expect(can('products.view_cost')).toBe(true)

    // No tiene acceso a registrar ventas
    expect(can('sales.create')).toBe(false)

    expect(canAny(['sales.create', 'inventory.view'])).toBe(true)
    expect(canAll(['inventory.view', 'products.view_cost'])).toBe(true)
    expect(canAll(['inventory.view', 'sales.create'])).toBe(false)
  })
})
