import type { PaginatedResponse, PaginationParams } from '../../shared/types/api'

/**
 * Interfaz genérica para futuros servicios de datos (Productos, Ventas, Almacén, etc.)
 * Sirve de patrón uniforme para que el backend Symfony implemente endpoints CRUD estándar.
 */
export interface BaseCrudService<T, TCreateDto = Partial<T>, TUpdateDto = Partial<T>> {
  getAll(params?: PaginationParams): Promise<PaginatedResponse<T> | T[]>
  getById(id: string | number): Promise<T>
  create(payload: TCreateDto): Promise<T>
  update(id: string | number, payload: TUpdateDto): Promise<T>
  delete(id: string | number): Promise<void>
}
