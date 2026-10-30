import type { LoginCredentials, AuthResponse, User } from '../../shared/types/auth'
import type { HealthCheckResponse } from '../../shared/types/api'

/**
 * Contrato de servicio de autenticación y sesión.
 * 
 * Este desacoplamiento permite alternar con total transparencia entre
 * MockAuthService (desarrollo independiente) y HttpAuthService (integración Symfony)
 * simplemente modificando la variable de entorno VITE_USE_MOCKS.
 */
export interface AuthService {
  /**
   * Inicia sesión con usuario y contraseña.
   * Retorna el token JWT y el perfil de usuario con sus permisos RBAC.
   */
  login(credentials: LoginCredentials): Promise<AuthResponse>

  /**
   * Cierra la sesión activa invalidando el token en el servidor si aplica.
   */
  logout(): Promise<void>

  /**
   * Obtiene los datos del usuario autenticado actual y sus permisos vigentes.
   * Se ejecuta al recargar o iniciar la SPA para validar el token almacenado.
   */
  getMe(): Promise<User>

  /**
   * Comprueba la disponibilidad del servidor local Symfony (GET /health o similar).
   */
  checkHealth(): Promise<HealthCheckResponse>
}
