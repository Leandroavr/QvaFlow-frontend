/**
 * Definiciones de tipos para el módulo de Seguridad, RBAC y Autenticación en QvaFlow.
 */

// Permisos granulares de control de acceso basado en roles (RBAC)
export type Permission =
  | 'VIEW_COSTS' // Consultar y editar precios de costo
  | 'VIEW_ALL_SALES' // Ver todas las ventas de la empresa
  | 'MANAGE_CATALOG' // Crear y modificar catálogo de productos
  | 'MANAGE_INVENTORY' // Módulo de inventario y almacén
  | 'MANAGE_PURCHASES' // Módulo de compras y proveedores
  | 'MANAGE_USERS' // Gestión de roles y personal
  | 'POS_ACCESS' // Operar el terminal de ventas (POS)
  | 'VIEW_REPORTS' // Acceso a reportes y analíticas financieras

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE'

export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  email?: string
  phone?: string
  status: 'ACTIVO' | 'INACTIVO'
  permissions: Permission[]
  lastLogin?: string
}

export interface UpdateUserRoleDto {
  userId: number
  role: UserRole
  permissions: Permission[]
  status?: 'ACTIVO' | 'INACTIVO'
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn?: number
}

export interface AuthResponse {
  tokens: AuthTokens
  user: User
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn?: number
}
