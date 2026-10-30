import type { AuthService } from '../interfaces/authService'
import type { LoginCredentials, AuthResponse, User } from '../../shared/types/auth'
import type { HealthCheckResponse } from '../../shared/types/api'
import { ApiError } from '../../shared/types/api'
import { MOCK_USERS } from '../../mocks/users'
import { useUiStore } from '../../shared/stores/uiStore'

/**
 * Implementación mock del servicio de autenticación.
 * Permite el funcionamiento 100% autónomo del frontend sin necesidad de backend Symfony.
 */
export class MockAuthService implements AuthService {
  private delay(ms = 250): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.delay(300)

    const userEntry = MOCK_USERS[credentials.username.toLowerCase().trim()]

    if (!userEntry || userEntry.passwordHash !== credentials.password) {
      throw new ApiError(
        {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Usuario o contraseña incorrectos.',
        },
        401
      )
    }

    // Actualizar estado del servidor en uiStore
    try {
      const uiStore = useUiStore()
      uiStore.setServerStatus('connected')
    } catch {
      // Ignorar si se corre fuera de Pinia
    }

    return {
      accessToken: userEntry.token,
      refreshToken: `${userEntry.token}-refresh`,
      user: { ...userEntry.user },
      expiresIn: 86400, // 24 horas
    }
  }

  async logout(): Promise<void> {
    await this.delay(100)
    // En mock no requiere llamada remota
  }

  async getMe(): Promise<User> {
    await this.delay(150)
    const token = localStorage.getItem('qvaflow_token')

    if (!token) {
      throw new ApiError({ code: 'AUTH_UNAUTHORIZED', message: 'No hay sesión activa.' }, 401)
    }

    // Encontrar el usuario mock correspondiente al token
    const match = Object.values(MOCK_USERS).find((u) => u.token === token)
    if (match) {
      return { ...match.user }
    }

    // Si había un usuario en caché local
    const rawUser = localStorage.getItem('qvaflow_user')
    if (rawUser) {
      return JSON.parse(rawUser) as User
    }

    // Por defecto fallback al superadmin si el token es mock
    return { ...MOCK_USERS.superadmin.user }
  }

  async checkHealth(): Promise<HealthCheckResponse> {
    await this.delay(100)
    return {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected (mock)',
    }
  }
}
