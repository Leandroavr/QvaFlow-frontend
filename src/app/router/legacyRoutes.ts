import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas temporales para visualización y referencia visual de pantallas legadas.
 * Solo activas en entorno de desarrollo con mocks (DEV=true y VITE_USE_MOCKS=true).
 */
export const legacyRoutes: RouteRecordRaw[] = [
  {
    path: '/legacy',
    component: () => import('../views/LegacyShell.vue'),
    meta: {
      title: 'Vistas Legadas (Referencia) - QvaFlow',
    },
    children: [
      {
        path: '',
        redirect: '/legacy/pos',
      },
      {
        path: 'pos',
        name: 'legacy-pos',
        component: () => import('../../modules/pos/views/PosTerminalView.vue'),
        meta: {
          title: 'TPV Punto de Venta (Legacy) - QvaFlow',
        },
      },
      {
        path: 'ventas',
        name: 'legacy-ventas',
        component: () => import('../../modules/pos/views/SalesAndShiftsView.vue'),
        meta: {
          title: 'Ventas y Turnos (Legacy) - QvaFlow',
        },
      },
      {
        path: 'inventario',
        name: 'legacy-inventario',
        component: () => import('../../modules/inventory/views/InventoryStockView.vue'),
        meta: {
          title: 'Inventario y Almacenes (Legacy) - QvaFlow',
        },
      },
      {
        path: 'catalogo',
        name: 'legacy-catalogo',
        component: () => import('../../modules/catalog/views/CatalogProductsView.vue'),
        meta: {
          title: 'Catálogo de Productos (Legacy) - QvaFlow',
        },
      },
      {
        path: 'compras',
        name: 'legacy-compras',
        component: () => import('../../modules/purchases/views/PurchasesView.vue'),
        meta: {
          title: 'Facturas de Compra (Legacy) - QvaFlow',
        },
      },
      {
        path: 'reportes',
        name: 'legacy-reportes',
        component: () => import('../../modules/reports/views/ReportsDashboardView.vue'),
        meta: {
          title: 'Reportes y Analíticas (Legacy) - QvaFlow',
        },
      },
      {
        path: 'usuarios',
        name: 'legacy-usuarios',
        component: () => import('../../modules/auth/views/UserRoleManagerView.vue'),
        meta: {
          title: 'Gestión de Usuarios y Roles (Legacy) - QvaFlow',
        },
      },
      {
        path: 'respaldos',
        name: 'legacy-respaldos',
        component: () => import('../../modules/backups/views/BackupManagerView.vue'),
        meta: {
          title: 'Copias de Seguridad (Legacy) - QvaFlow',
        },
      },
    ],
  },
]
