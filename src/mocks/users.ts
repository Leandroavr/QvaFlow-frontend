import type { User } from '../shared/types/auth'
import { KNOWN_PERMISSIONS } from '../shared/types/permissions'

export interface MockUserCredential {
  user: User
  passwordHash: string // En mock simulamos coincidencia con contraseña en texto plano
  token: string
}

/**
 * 3 Usuarios de prueba con diferentes perfiles de permisos RBAC para demostración y desarrollo.
 * Definidos estrictamente como datos descriptivos, sin lógica de negocio incrustada.
 */
export const MOCK_USERS: Record<string, MockUserCredential> = {
  superadmin: {
    passwordHash: 'password123',
    token: 'mock-jwt-token-superadmin-qvaflow-xyz-2026',
    user: {
      id: 'usr_superadmin_01',
      username: 'superadmin',
      fullName: 'Administrador General',
      role: 'Superadministrador',
      permissions: [...KNOWN_PERMISSIONS], // Acceso total a todos los módulos y costos
      lastLoginAt: '2026-10-30T10:00:00Z',
    },
  },
  vendedor: {
    passwordHash: 'password123',
    token: 'mock-jwt-token-vendedor-qvaflow-abc-2026',
    user: {
      id: 'usr_vendedor_02',
      username: 'vendedor',
      fullName: 'Carlos Valdés (Vendedor)',
      role: 'Vendedor',
      permissions: [
        'sales.create',
        'sales.cancel',
        'sales.view',
        'products.view', // Puede buscar y agregar productos a la venta
        // OJO: NO tiene 'products.view_cost' (no puede ver márgenes ni costo de adquisición)
        // OJO: NO tiene 'inventory.adjust' ni administración
        // OJO: NO tiene permisos de Caja (caja es solo administración)
      ],
      lastLoginAt: '2026-10-30T09:15:00Z',
    },
  },
  almacenero: {
    passwordHash: 'password123',
    token: 'mock-jwt-token-almacenero-qvaflow-def-2026',
    user: {
      id: 'usr_almacenero_03',
      username: 'almacenero',
      fullName: 'Marcos Díaz (Almacén)',
      role: 'Almacenero',
      permissions: [
        'inventory.view',
        'inventory.create',
        'inventory.adjust',
        'inventory.transfer',
        'warehouses.manage', // Gestión de almacenes y localizaciones físicas
        'products.view',
        'products.create',
        'products.edit',
        'products.view_cost', // Ve costos de compra para registrar albaranes
        'purchases.view',
        'purchases.create',
        'purchases.confirm',
        // OJO: NO tiene 'sales.create' ni operaciones de caja registradora
      ],
      lastLoginAt: '2026-10-29T16:30:00Z',
    },
  },
}
