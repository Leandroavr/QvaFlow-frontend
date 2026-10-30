import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupNavigationGuard } from '../index'
import { useAuthStore } from '../../../features/auth/stores/authStore'
import type { RouteLocationNormalized } from 'vue-router'

describe('Router Navigation Guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('redirige a /login cuando un usuario sin sesión intenta acceder a una ruta protegida', async () => {
    const to = {
      name: 'home',
      fullPath: '/dashboard',
      meta: {},
    } as unknown as RouteLocationNormalized

    const from = {} as RouteLocationNormalized
    const next = vi.fn()

    await setupNavigationGuard(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'login',
      query: { redirect: '/dashboard' },
    })
  })

  it('permite el acceso sin redirección a rutas públicas como /login para usuarios anónimos', async () => {
    const to = {
      name: 'login',
      fullPath: '/login',
      meta: { public: true },
    } as unknown as RouteLocationNormalized

    const from = {} as RouteLocationNormalized
    const next = vi.fn()

    await setupNavigationGuard(to, from, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('redirige a / (home) si un usuario ya autenticado intenta acceder a /login', async () => {
    const authStore = useAuthStore()
    await authStore.login({ username: 'superadmin', password: 'password123' })

    const to = {
      name: 'login',
      fullPath: '/login',
      meta: { public: true },
    } as unknown as RouteLocationNormalized

    const from = {} as RouteLocationNormalized
    const next = vi.fn()

    await setupNavigationGuard(to, from, next)

    expect(next).toHaveBeenCalledWith({ name: 'home' })
  })

  it('redirige a /forbidden cuando el usuario carece del permiso requerido por la ruta', async () => {
    const authStore = useAuthStore()
    // El usuario 'vendedor' no tiene permiso 'system.config'
    await authStore.login({ username: 'vendedor', password: 'password123' })

    const to = {
      name: 'settings',
      fullPath: '/settings',
      meta: { permission: 'system.config' },
    } as unknown as RouteLocationNormalized

    const from = {} as RouteLocationNormalized
    const next = vi.fn()

    await setupNavigationGuard(to, from, next)

    expect(next).toHaveBeenCalledWith({
      name: 'forbidden',
      query: { permission: 'system.config' },
    })
  })
})
