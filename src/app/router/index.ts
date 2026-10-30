import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { syncLegacyAuthSession } from '../legacy/legacyAuthBridge'

const routerMode = import.meta.env.VITE_ROUTER_MODE || 'hash'

const history =
  routerMode === 'history'
    ? createWebHistory(import.meta.env.BASE_URL)
    : createWebHashHistory(import.meta.env.BASE_URL)

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../../features/auth/views/LoginView.vue'),
    meta: {
      public: true,
      title: 'Iniciar Sesión - QvaFlow',
    },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/AppHomeView.vue'),
    meta: {
      title: 'Inicio - QvaFlow POS',
    },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('../views/ForbiddenView.vue'),
    meta: {
      title: '403 Acceso Denegado - QvaFlow',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history,
  routes,
})

// Registro condicional de desarrollo con carga diferida.
// En el build de producción (vite build), Rollup elimina este bloque por completo
// y ninguna vista /legacy entra en el bundle.
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false') {
  const { legacyRoutes } = await import('./legacyRoutes')
  legacyRoutes.forEach((route) => {
    router.addRoute(route)
  })
}

/**
 * Navigation Guard para control de sesión y validación de permisos RBAC dinámicos.
 */
export async function setupNavigationGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()

  // Si hay un token almacenado pero el store aún no se inicializó, intentamos verificarlo
  if (!authStore.isInitialized && authStore.token) {
    await authStore.checkAuth()
  }

  const isPublicRoute = to.meta.public === true
  const isAuthenticated = authStore.isAuthenticated

  // 1. Redirigir a /login si no hay sesión y la ruta es protegida
  if (!isPublicRoute && !isAuthenticated) {
    next({
      name: 'login',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    })
    return
  }

  // 2. Si ya hay sesión y se intenta ir a /login, redirigir a /
  if (to.name === 'login' && isAuthenticated) {
    next({ name: 'home' })
    return
  }

  // 3. Control de permisos RBAC si la ruta define meta.permission
  if (to.meta.permission && isAuthenticated) {
    const requiredPermission = to.meta.permission as string
    if (!authStore.hasPermission(requiredPermission)) {
      next({
        name: 'forbidden',
        query: { permission: requiredPermission },
      })
      return
    }
  }

  // 4. Sincronizar sesión con store legado si se navega a una ruta /legacy
  const targetPath = to.path || to.fullPath || ''
  if (targetPath.startsWith('/legacy') && isAuthenticated) {
    syncLegacyAuthSession()
  }

  // Actualizar título de la ventana
  if (to.meta.title && typeof document !== 'undefined') {
    document.title = String(to.meta.title)
  }

  next()
}

router.beforeEach(setupNavigationGuard)

export default router
