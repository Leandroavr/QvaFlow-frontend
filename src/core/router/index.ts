import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/shared/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { title: 'Iniciar Sesión - QvaFlow', public: true },
  },
  {
    path: '/ventas',
    redirect: '/pos',
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/pos',
    children: [
      {
        path: 'pos',
        name: 'pos',
        component: () => import('@/modules/pos/views/PosTerminalView.vue'),
        meta: { title: 'Punto de Venta (POS)', permission: 'POS_ACCESS' },
      },
      {
        path: 'catalog',
        name: 'catalog',
        component: () => import('@/modules/catalog/views/CatalogProductsView.vue'),
        meta: { title: 'Catálogo de Productos', permission: 'MANAGE_CATALOG' },
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/modules/inventory/views/InventoryStockView.vue'),
        meta: { title: 'Inventario y Stock', permission: 'MANAGE_INVENTORY' },
      },
      {
        path: 'purchases',
        name: 'purchases',
        component: () => import('@/modules/purchases/views/PurchasesView.vue'),
        meta: { title: 'Compras y Entradas', permission: 'MANAGE_PURCHASES' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/modules/reports/views/ReportsDashboardView.vue'),
        meta: { title: 'Reportes y Analíticas', permission: 'VIEW_REPORTS' },
      },
      {
        path: 'backups',
        name: 'backups',
        component: () => import('@/modules/backups/views/BackupManagerView.vue'),
        meta: { title: 'Copias de Seguridad y Salvas', requiresAdmin: true },
      },
      {
        path: 'sales-and-shifts',
        name: 'sales-and-shifts',
        component: () => import('@/modules/pos/views/SalesAndShiftsView.vue'),
        meta: { title: 'Historial de Ventas y Cuadres', permission: 'VIEW_ALL_SALES' },
      },
      {
        path: 'roles',
        name: 'roles',
        component: () => import('@/modules/auth/views/UserRoleManagerView.vue'),
        meta: { title: 'Gestión de Personal y Roles', requiresRoleManagement: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/pos',
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Guardia de navegación para control de sesión y roles (RBAC)
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('qvaflow_token')
  const isPublic = to.meta.public === true

  if (!isPublic && !token) {
    next({ name: 'login' })
    return
  }

  if (to.name === 'login' && token) {
    next({ name: 'pos' })
    return
  }

  try {
    const rawUser = localStorage.getItem('qvaflow_user')
    const user = rawUser ? JSON.parse(rawUser) : null
    const isSuperadmin = user?.role === 'SUPERADMIN'
    const isAdmin = user?.role === 'ADMIN'
    const permissions: string[] = user?.permissions || []

    // 1. Protección de rutas exclusivas de Administrador / Respaldos
    if (to.meta.requiresAdmin && !isSuperadmin && !isAdmin) {
      next({ name: 'pos' })
      return
    }

    // 2. Protección para gestión de personal y roles
    if (
      to.meta.requiresRoleManagement &&
      !isSuperadmin &&
      !isAdmin &&
      !permissions.includes('MANAGE_USERS')
    ) {
      next({ name: 'pos' })
      return
    }

    // 3. Protección por permisos granulares de módulo
    if (to.meta.permission && !isSuperadmin && !isAdmin) {
      const requiredPerm = to.meta.permission as string

      // Cajero tiene acceso garantizado al terminal de cobro POS
      if (to.name === 'pos' && user?.role === 'CASHIER') {
        next()
        return
      }

      // Almacenero tiene acceso a catálogo e inventario
      if ((to.name === 'catalog' || to.name === 'inventory') && user?.role === 'WAREHOUSE') {
        next()
        return
      }

      if (!permissions.includes(requiredPerm)) {
        next({ name: 'pos' })
        return
      }
    }
  } catch {
    // Si ocurre un error de deserialización, continuar normalmente
  }

  next()
})

export default router
