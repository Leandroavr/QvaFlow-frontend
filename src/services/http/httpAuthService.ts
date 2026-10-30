import type { AuthService } from '../interfaces/authService'
import type { LoginCredentials, AuthResponse, User } from '../../shared/types/auth'
import type { HealthCheckResponse } from '../../shared/types/api'
import { httpClient } from '../api/httpClient'

/**
 * Implementación HTTP real para conectar con el backend Symfony.
 *
 * GUÍA DE INTEGRACIÓN PARA EL DESARROLLADOR DE BACKEND:
 * Cada método documenta la ruta y cuerpo esperado. Ver /docs/API_CONTRACT.md para los detalles completos.
 */
export class HttpAuthService implements AuthService {
  /**
   * TODO: [Backend Symfony] Endpoint POST /auth/login
   * Body: { username: string, password: string }
   * Response: { accessToken: string, refreshToken?: string, user: User }
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/login', credentials)
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint POST /auth/logout
   * Header: Authorization: Bearer <token>
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout')
    } catch {
      // Si el servidor falla al desloguear, permitimos limpiar la sesión local
    }
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /auth/me
   * Header: Authorization: Bearer <token>
   * Response: User { id, username, fullName, role, permissions: string[] }
   */
  async getMe(): Promise<User> {
    const response = await httpClient.get<User>('/auth/me')
    return response.data
  }

  /**
   * TODO: [Backend Symfony] Endpoint GET /health
   * Response: { status: 'ok' | 'degraded', version: string, timestamp: string }
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const response = await httpClient.get<HealthCheckResponse>('/health')
    return response.data
  }
}
