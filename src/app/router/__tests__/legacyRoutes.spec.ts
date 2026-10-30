import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { router } from '../index'
import { legacyRoutes } from '../legacyRoutes'
import { useAuthStore } from '../../../features/auth/stores/authStore'
import { MOCK_USERS } from '../../../mocks/users'

describe('Rutas Legadas de Referencia (/legacy/*)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('cada una de las 8 vistas legadas resuelve dinámicamente su componente sin error de importación', async () => {
    const parentRoute = legacyRoutes.find((r) => r.path === '/legacy')
    expect(parentRoute).toBeDefined()

    // Comprobar que el shell principal carga correctamente
    const shellModule = await (parentRoute!.component as () => Promise<any>)()
    expect(shellModule.default || shellModule).toBeDefined()

    const expectedPaths = [
      'pos',
      'ventas',
      'inventario',
      'catalogo',
      'compras',
      'reportes',
      'usuarios',
      'respaldos',
    ]

    const childRoutes = parentRoute?.children || []

    for (const path of expectedPaths) {
      const child = childRoutes.find((c) => c.path === path)
      expect(child, `La subruta legacy /legacy/${path} debe existir`).toBeDefined()

      // Verificar que el import dinámico carga sin errores
      const componentModule = await (child!.component as () => Promise<any>)()
      const component = componentModule.default || componentModule
      expect(
        component,
        `El componente de /legacy/${path} debe ser un componente Vue válido`
      ).toBeDefined()
    }
  }, 30000)

  it('bloquea el acceso anónimo a /legacy/* y redirige a /login con redirect query', async () => {
    const authStore = useAuthStore()
    authStore.logout()

    await router.push('/legacy/pos')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/legacy/pos')
  })

  it('permite el acceso a /legacy/* cuando el usuario está autenticado en el store nuevo', async () => {
    const authStore = useAuthStore()
    const superadmin = MOCK_USERS.superadmin
    authStore.user = superadmin.user
    authStore.token = superadmin.token
    authStore.isInitialized = true

    await router.push('/legacy/pos')
    expect(router.currentRoute.value.path).toBe('/legacy/pos')
  }, 15000)
})
