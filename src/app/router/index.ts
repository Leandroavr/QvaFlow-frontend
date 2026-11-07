import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
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
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('../views/ForbiddenView.vue'),
    meta: {
      title: '403 Acceso Denegado - QvaFlow',
    },
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/AppHomeView.vue'),
        meta: {
          title: 'Inicio - QvaFlow POS',
          breadcrumb: 'Inicio',
        },
      },
      // Ventas
      {
        path: 'sales/pos',
        name: 'sales-pos',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'sales.create',
          title: 'Punto de Venta - QvaFlow',
          breadcrumb: 'Punto de venta',
          parentBreadcrumb: 'Ventas',
        },
      },
      {
        path: 'sales/history',
        name: 'sales-history',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'sales.view',
          title: 'Historial de Ventas - QvaFlow',
          breadcrumb: 'Historial de ventas',
          parentBreadcrumb: 'Ventas',
        },
      },
      // Caja
      {
        path: 'cash/shift',
        name: 'cash-shift',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'cash.manage',
          title: 'Turno y Arqueo - QvaFlow',
          breadcrumb: 'Turno y arqueo',
          parentBreadcrumb: 'Caja',
        },
      },
      {
        path: 'cash/exchange',
        name: 'cash-exchange',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'cash.exchange',
          title: 'Tasa de Cambio y Canje - QvaFlow',
          breadcrumb: 'Tasa de cambio y canje',
          parentBreadcrumb: 'Caja',
        },
      },
      {
        path: 'cash/history',
        name: 'cash-history',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'cash.view_history',
          title: 'Cuadres de Caja - QvaFlow',
          breadcrumb: 'Cuadres de caja',
          parentBreadcrumb: 'Caja',
        },
      },
      // Inventario
      {
        path: 'inventory/stock',
        name: 'inventory-stock',
        component: () => import('../views/inventory/InventoryStockView.vue'),
        meta: {
          permission: 'inventory.view',
          title: 'Stock de Inventario - QvaFlow',
          breadcrumb: 'Stock',
          parentBreadcrumb: 'Inventario',
        },
      },
      {
        path: 'inventory/warehouses',
        name: 'inventory-warehouses',
        component: () => import('../views/inventory/WarehousesView.vue'),
        meta: {
          permission: 'inventory.view',
          title: 'Almacenes y Localizaciones - QvaFlow',
          breadcrumb: 'Almacenes y localizaciones',
          parentBreadcrumb: 'Inventario',
        },
      },
      {
        path: 'inventory/transfers',
        name: 'inventory-transfers',
        component: () => import('../views/inventory/InventoryTransfersView.vue'),
        meta: {
          permission: 'inventory.transfer',
          title: 'Movimientos y Traslados - QvaFlow',
          breadcrumb: 'Movimientos y traslados',
          parentBreadcrumb: 'Inventario',
        },
      },
      {
        path: 'inventory/transfers/new',
        name: 'inventory-transfers-new',
        component: () => import('../views/inventory/InventoryTransferCreateView.vue'),
        meta: {
          permission: 'inventory.transfer',
          title: 'Nuevo Traslado - QvaFlow',
          breadcrumb: 'Nuevo traslado',
          parentBreadcrumb: 'Movimientos y traslados',
        },
      },
      {
        path: 'inventory/adjustments',
        name: 'inventory-adjustments',
        component: () => import('../views/inventory/InventoryAdjustmentsView.vue'),
        meta: {
          permission: 'inventory.adjust',
          title: 'Ajustes de Inventario - QvaFlow',
          breadcrumb: 'Ajustes de inventario',
          parentBreadcrumb: 'Inventario',
        },
      },
      {
        path: 'inventory/adjustments/new',
        name: 'inventory-adjustments-new',
        component: () => import('../views/inventory/InventoryAdjustmentCreateView.vue'),
        meta: {
          permission: 'inventory.adjust',
          title: 'Nuevo Ajuste - QvaFlow',
          breadcrumb: 'Nuevo ajuste',
          parentBreadcrumb: 'Ajustes de inventario',
        },
      },
      // Productos
      {
        path: 'products/catalog',
        name: 'products-catalog',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'products.view',
          title: 'Catálogo de Productos - QvaFlow',
          breadcrumb: 'Catálogo de productos',
          parentBreadcrumb: 'Productos',
        },
      },
      // Compras
      {
        path: 'purchases/invoices',
        name: 'purchases-invoices',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'purchases.view',
          title: 'Facturas de Compra - QvaFlow',
          breadcrumb: 'Facturas de compra',
          parentBreadcrumb: 'Compras',
        },
      },
      // Reportes
      {
        path: 'reports',
        name: 'reports-dashboard',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'reports.view',
          title: 'Reportes - QvaFlow',
          breadcrumb: 'Reportes',
          parentBreadcrumb: 'Reportes',
        },
      },
      // Administración
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'users.manage',
          title: 'Gestión de Usuarios - QvaFlow',
          breadcrumb: 'Usuarios',
          parentBreadcrumb: 'Administración',
        },
      },
      {
        path: 'admin/roles',
        name: 'admin-roles',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'roles.manage',
          title: 'Roles y Permisos - QvaFlow',
          breadcrumb: 'Roles y permisos',
          parentBreadcrumb: 'Administración',
        },
      },
      {
        path: 'admin/backups',
        name: 'admin-backups',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'backups.manage',
          title: 'Respaldos de Datos - QvaFlow',
          breadcrumb: 'Respaldos',
          parentBreadcrumb: 'Administración',
        },
      },
      {
        path: 'admin/settings',
        name: 'admin-settings',
        component: () => import('../views/ModulePlaceholderView.vue'),
        meta: {
          permission: 'system.config',
          title: 'Configuración General - QvaFlow',
          breadcrumb: 'Configuración',
          parentBreadcrumb: 'Administración',
        },
      },
    ],
  },
  // Ruta 404 No Encontrado
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      public: true,
      title: '404 No Encontrado - QvaFlow',
      breadcrumb: 'No encontrado',
    },
  },
]

export const router = createRouter({
  history,
  routes,
})

// Registro condicional de desarrollo con carga diferida.
// En el build de producción (vite build), Rollup elimina este bloque por completo
// y ninguna vista /legacy ni /dev/components entra en el bundle.
if (import.meta.env.DEV) {
  router.addRoute({
    path: '/dev/components',
    name: 'dev-components',
    component: () => import('../views/DevComponentsView.vue'),
    meta: {
      title: 'Catálogo de Componentes UI - QvaFlow Dev',
      breadcrumb: 'Componentes UI',
    },
  })

  if (import.meta.env.VITE_USE_MOCKS !== 'false') {
    const { legacyRoutes } = await import('./legacyRoutes')
    legacyRoutes.forEach((route) => {
      router.addRoute(route)
    })
  }
}

/**
 * Navigation Guard para control de sesión y validación de permisos RBAC dinámicos.
 * Utiliza retorno de valores (Vue Router 4 return-value mode) para eliminar VUE_ROUTER_R0025.
 */
export async function setupNavigationGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized
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
    return {
      name: 'login',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    }
  }

  // 2. Si ya hay sesión y se intenta ir a /login, redirigir a /
  if (to.name === 'login' && isAuthenticated) {
    return { name: 'home' }
  }

  // 3. Control de permisos RBAC si la ruta define meta.permission
  if (to.meta.permission && isAuthenticated) {
    const requiredPermission = to.meta.permission as string
    if (!authStore.hasPermission(requiredPermission)) {
      return {
        name: 'forbidden',
        query: { permission: requiredPermission },
      }
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

  return true
}

router.beforeEach(setupNavigationGuard)

export default router
