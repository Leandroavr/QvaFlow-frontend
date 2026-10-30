import type { AppPermission } from './permissions'
import type { Id } from './api'

/**
 * Entidad de Usuario autenticado.
 * El campo `role` es meramente informativo / visual para la tarjeta de usuario;
 * toda autorización funcional se realiza evaluando el array `permissions`.
 */
export interface User {
  id: Id
  username: string
  fullName: string
  role: string // Solo título descriptivo (ej: "Superadministrador", "Cajero", "Almacenero")
  permissions: AppPermission[]
  avatarUrl?: string
  lastLoginAt?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  user: User
  expiresIn?: number
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
