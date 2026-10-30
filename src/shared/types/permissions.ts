/**
 * Formato de permisos RBAC dinámicos en QvaFlow: "modulo.accion"
 * 
 * NOTA DE SEGURIDAD ARQUITECTURAL:
 * Los roles en QvaFlow son dinámicos (el administrador crea roles a medida en la BD).
 * El frontend NUNCA debe comparar nombres de rol ('admin', 'cajero', etc.).
 * La lógica en vistas y componentes se basa EXCLUSIVAMENTE en verificar permisos específicos.
 * 
 * IMPORTANTE: El control en el frontend es puramente VISUAL y de ergonomía de interfaz (UI/UX).
 * La seguridad e integridad real y definitiva de los datos la aplica el backend Symfony en cada petición.
 */

export const KNOWN_PERMISSIONS = [
  // Ventas y Caja
  'sales.create',
  'sales.cancel',
  'sales.view',
  'cash.manage',
  'cash.open_close',

  // Inventario y Almacenes
  'inventory.view',
  'inventory.create',
  'inventory.adjust',
  'inventory.transfer',

  // Catálogo de Productos y Costos
  'products.view',
  'products.create',
  'products.edit',
  'products.view_cost', // Permiso sensible: ver costos de compra y márgenes

  // Compras y Facturas de Proveedores
  'purchases.view',
  'purchases.create',
  'purchases.confirm',

  // Reportes y Analíticas
  'reports.view',
  'reports.export',

  // Seguridad y Administración
  'users.manage',
  'roles.manage',
  'backups.manage',
  'system.config',
] as const

export type AppPermission = typeof KNOWN_PERMISSIONS[number] | string

export interface PermissionDefinition {
  id: string
  code: AppPermission
  module: string
  name: string
  description: string
  isSensitive?: boolean
}
