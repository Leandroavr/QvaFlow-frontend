import type { AuthService } from './interfaces/authService'
import { MockAuthService } from './mock/mockAuthService'
import { HttpAuthService } from './http/httpAuthService'

import type { InventoryService } from './interfaces/inventoryService'
import { MockInventoryService } from './mock/mockInventoryService'
import { HttpInventoryService } from './http/httpInventoryService'

import type { ReportsService } from './interfaces/reportsService'
import { MockReportsService } from './mock/mockReportsService'
import { HttpReportsService } from './http/httpReportsService'

const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

/**
 * Instancia singleton de AuthService.
 * Se alterna automáticamente según la variable de entorno VITE_USE_MOCKS:
 * - VITE_USE_MOCKS=true  -> MockAuthService (datos mock en memoria, desarrollo independiente)
 * - VITE_USE_MOCKS=false -> HttpAuthService (llamadas HTTP a Symfony /api)
 */
export const authService: AuthService = useMocks ? new MockAuthService() : new HttpAuthService()

/**
 * Instancia singleton de InventoryService.
 * Se alterna automáticamente según la variable de entorno VITE_USE_MOCKS:
 * - VITE_USE_MOCKS=true  -> MockInventoryService (datos mock en memoria)
 * - VITE_USE_MOCKS=false -> HttpInventoryService (llamadas HTTP a Symfony /api)
 */
export const inventoryService: InventoryService = useMocks
  ? new MockInventoryService()
  : new HttpInventoryService()

/**
 * Instancia singleton de ReportsService.
 * Se alterna automáticamente según la variable de entorno VITE_USE_MOCKS:
 * - VITE_USE_MOCKS=true  -> MockReportsService (datos mock en memoria)
 * - VITE_USE_MOCKS=false -> HttpReportsService (llamadas HTTP a Symfony /api/reports)
 */
export const reportsService: ReportsService = useMocks
  ? new MockReportsService()
  : new HttpReportsService()

export * from './interfaces/authService'
export * from './interfaces/inventoryService'
export * from './interfaces/reportsService'
export * from './interfaces/baseService'
