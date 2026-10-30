/**
 * Definiciones de tipos para el módulo de Inventario y Stock en QvaFlow.
 * Alineado con el modelo relacional ERP de Almacenes, Localizaciones y Movimientos.
 */

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE'

/**
 * Localización física dentro de un almacén (estante, pasillo, nevera, etc.)
 */
export interface Localizacion {
  codigo: string
  almacen: string // Código del almacén padre
  nombre?: string
}

/**
 * Almacén general que agrupa 1 o más localizaciones
 */
export interface Almacen {
  codigo: string
  nombre: string
  localizaciones: Localizacion[]
}

export interface InventoryItem {
  id: number
  code: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  currency: string
  warehouse: string // Nombre o código del Almacén
  location?: string // Código de la Localización
  locationName?: string // Nombre descriptivo de la localización
  stock: number
  minStock: number
  unit: string
  lastUpdated?: string
}

/**
 * Ítem de traslado entre dos localizaciones (Items_Mov_almacenes)
 */
export interface ItemMovAlmacenes {
  producto: string // Código de producto
  productName?: string
  cantidad: number
  localizacion1: string // Localización de origen
  localizacion2: string // Localización de destino
}

/**
 * Documento de traslado de mercancías (Movimiento_almacenes)
 */
export interface MovimientoAlmacenes {
  noDocument: string
  fechaMovimiento: string
  estado?: string // Control interno BD ('1'=completado)
  activo?: string // Control interno BD ('1'=activo)
  items: ItemMovAlmacenes[]
  razon?: string
}

export interface InventoryMovement {
  id: string
  productId: number
  productName: string
  type: TipoMovimiento
  quantity: number
  warehouse: string
  location?: string
  targetWarehouse?: string
  targetLocation?: string
  reason: string
  createdAt: string
}

export interface CreateMovementDto {
  productId: number
  type: TipoMovimiento
  quantity: number
  warehouse: string
  location?: string
  targetWarehouse?: string
  targetLocation?: string
  reason: string
}
