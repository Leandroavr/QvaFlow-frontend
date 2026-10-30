import type { AuthService } from './interfaces/authService'
import { MockAuthService } from './mock/mockAuthService'
import { HttpAuthService } from './http/httpAuthService'

const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

/**
 * Instancia singleton de AuthService.
 * Se alterna automáticamente según la variable de entorno VITE_USE_MOCKS:
 * - VITE_USE_MOCKS=true  -> MockAuthService (datos mock en memoria, desarrollo independiente)
 * - VITE_USE_MOCKS=false -> HttpAuthService (llamadas HTTP a Symfony /api)
 */
export const authService: AuthService = useMocks ? new MockAuthService() : new HttpAuthService()

export * from './interfaces/authService'
export * from './interfaces/baseService'
