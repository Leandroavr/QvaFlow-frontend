import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../authStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('inicia en estado no autenticado', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.permissions).toEqual([])
  })

  it('inicia sesión exitosamente con credenciales mock correctas', async () => {
    const store = useAuthStore()

    await store.login({ username: 'superadmin', password: 'password123' })

    expect(store.isAuthenticated).toBe(true)
    expect(store.user).not.toBeNull()
    expect(store.user?.username).toBe('superadmin')
    expect(store.token).toBe('mock-jwt-token-superadmin-qvaflow-xyz-2026')
    expect(localStorage.getItem('qvaflow_token')).toBe('mock-jwt-token-superadmin-qvaflow-xyz-2026')
  })

  it('falla con credenciales incorrectas y genera error en el store', async () => {
    const store = useAuthStore()

    await expect(
      store.login({ username: 'superadmin', password: 'wrongpassword' })
    ).rejects.toThrow()

    expect(store.isAuthenticated).toBe(false)
    expect(store.error).toBe('Usuario o contraseña incorrectos.')
  })

  it('cierra sesión correctamente y limpia localStorage', async () => {
    const store = useAuthStore()
    await store.login({ username: 'superadmin', password: 'password123' })
    expect(store.isAuthenticated).toBe(true)

    await store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(localStorage.getItem('qvaflow_token')).toBeNull()
    expect(localStorage.getItem('qvaflow_user')).toBeNull()
  })

  it('verifica permisos individuales y grupales de manera precisa', async () => {
    const store = useAuthStore()
    await store.login({ username: 'vendedor', password: 'password123' })

    // Vendedor tiene sales.create pero NO products.view_cost
    expect(store.hasPermission('sales.create')).toBe(true)
    expect(store.hasPermission('products.view_cost')).toBe(false)

    expect(store.hasAnyPermission(['sales.create', 'products.view_cost'])).toBe(true)
    expect(store.hasAnyPermission(['products.view_cost', 'inventory.adjust'])).toBe(false)
  })
})
