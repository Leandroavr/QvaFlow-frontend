import type { Component } from 'vue'
import {
  Home,
  ShoppingCart,
  Store,
  History,
  Landmark,
  Coins,
  ArrowLeftRight,
  FileSpreadsheet,
  Boxes,
  Package,
  Warehouse,
  SlidersHorizontal,
  Tag,
  Truck,
  FileText,
  BarChart3,
  Shield,
  Users,
  Database,
  Settings,
} from 'lucide-vue-next'
import type { AppPermission } from '../../shared/types/permissions'
import { usePermissions } from '../../shared/composables/usePermissions'
import { computed, type ComputedRef } from 'vue'

export interface MenuItem {
  id: string
  label: string
  icon?: Component
  to?: string
  permission?: AppPermission | string
  anyOf?: (AppPermission | string)[]
  children?: MenuItem[]
}

/**
 * Definición centralizada y tipada del menú principal de navegación de QvaFlow.
 * Cada elemento define sus rutas y permisos RBAC requeridos.
 */
export const APP_MENU: MenuItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    icon: Home,
    to: '/',
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: ShoppingCart,
    children: [
      {
        id: 'sales-pos',
        label: 'Punto de venta',
        icon: Store,
        to: '/sales/pos',
        permission: 'sales.create',
      },
      {
        id: 'sales-history',
        label: 'Historial de ventas',
        icon: History,
        to: '/sales/history',
        permission: 'sales.view',
      },
    ],
  },
  {
    id: 'cash',
    label: 'Caja',
    icon: Landmark,
    children: [
      {
        id: 'cash-shift',
        label: 'Turno y arqueo',
        icon: Coins,
        to: '/cash/shift',
        permission: 'cash.manage',
      },
      {
        id: 'cash-exchange',
        label: 'Cambio y canje de divisas',
        icon: ArrowLeftRight,
        to: '/cash/exchange',
        permission: 'cash.exchange',
      },
      {
        id: 'cash-history',
        label: 'Cuadres de caja',
        icon: FileSpreadsheet,
        to: '/cash/history',
        permission: 'cash.view_history',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: Boxes,
    children: [
      {
        id: 'inventory-stock',
        label: 'Stock',
        icon: Package,
        to: '/inventory/stock',
        permission: 'inventory.view',
      },
      {
        id: 'inventory-warehouses',
        label: 'Almacenes',
        icon: Warehouse,
        to: '/inventory/warehouses',
        permission: 'inventory.view',
      },
      {
        id: 'inventory-transfers',
        label: 'Movimientos y traslados',
        icon: ArrowLeftRight,
        to: '/inventory/transfers',
        permission: 'inventory.transfer',
      },
      {
        id: 'inventory-adjustments',
        label: 'Ajustes de inventario',
        icon: SlidersHorizontal,
        to: '/inventory/adjustments',
        permission: 'inventory.adjust',
      },
    ],
  },
  {
    id: 'products',
    label: 'Productos',
    icon: Tag,
    children: [
      {
        id: 'products-catalog',
        label: 'Catálogo de productos',
        icon: Package,
        to: '/products/catalog',
        permission: 'products.view',
      },
    ],
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: Truck,
    children: [
      {
        id: 'purchases-invoices',
        label: 'Facturas de compra',
        icon: FileText,
        to: '/purchases/invoices',
        permission: 'purchases.view',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: BarChart3,
    children: [
      {
        id: 'reports-dashboard',
        label: 'Reportes',
        icon: BarChart3,
        to: '/reports',
        permission: 'reports.view',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Shield,
    children: [
      {
        id: 'admin-users',
        label: 'Usuarios',
        icon: Users,
        to: '/admin/users',
        permission: 'users.manage',
      },
      {
        id: 'admin-roles',
        label: 'Roles y permisos',
        icon: Shield,
        to: '/admin/roles',
        permission: 'roles.manage',
      },
      {
        id: 'admin-backups',
        label: 'Respaldos',
        icon: Database,
        to: '/admin/backups',
        permission: 'backups.manage',
      },
      {
        id: 'admin-settings',
        label: 'Configuración',
        icon: Settings,
        to: '/admin/settings',
        permission: 'system.config',
      },
    ],
  },
]

/**
 * Filtra el árbol de menú según los permisos del usuario activo.
 * Oculta elementos individuales sin permiso y grupos completos si todos sus hijos quedan ocultos.
 *
 * NOTA: El menú solo oculta visualmente opciones en la UI.
 * La seguridad e integridad real de la aplicación es responsabilidad exclusiva del backend Symfony.
 *
 * @param menu Array de elementos de navegación
 * @param can Función evaluadora de permisos individuales (permission: string) => boolean
 */
export function filterMenuByPermissions(
  menu: MenuItem[],
  can: (permission: string) => boolean
): MenuItem[] {
  return menu
    .map((item) => {
      // 1. Evaluar permiso individual si existe
      if (item.permission && !can(item.permission)) {
        return null
      }

      // 2. Evaluar disyunción anyOf si existe
      if (item.anyOf && item.anyOf.length > 0 && !item.anyOf.some((p) => can(p))) {
        return null
      }

      // 3. Evaluar submenús (grupos)
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByPermissions(item.children, can)
        // Si el grupo se queda sin elementos hijos visibles, se oculta por completo
        if (filteredChildren.length === 0) {
          return null
        }
        return {
          ...item,
          children: filteredChildren,
        }
      }

      return { ...item }
    })
    .filter((item): item is MenuItem => item !== null)
}

/**
 * Composable de ayuda para obtener el menú de navegación reactivo
 * ya filtrado según la sesión y permisos del usuario actual en Pinia.
 */
export function useNavigationMenu(): ComputedRef<MenuItem[]> {
  const { can } = usePermissions()
  return computed(() => filterMenuByPermissions(APP_MENU, can))
}
