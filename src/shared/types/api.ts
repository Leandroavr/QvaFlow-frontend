/**
 * Contrato de tipos y estructura de respuesta de la API REST de QvaFlow.
 */

export interface ApiErrorPayload {
  code: string
  message: string
  details?: Record<string, string | string[]>
}

export class ApiError extends Error {
  public readonly code: string
  public readonly statusCode?: number
  public readonly details?: Record<string, string | string[]>

  constructor(payload: ApiErrorPayload, statusCode?: number) {
    super(payload.message)
    this.name = 'ApiError'
    this.code = payload.code
    this.statusCode = statusCode
    this.details = payload.details
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}

export interface PaginationParams {
  page?: number
  perPage?: number
  sort?: string
  search?: string
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded'
  version: string
  timestamp: string
  database?: string
}
