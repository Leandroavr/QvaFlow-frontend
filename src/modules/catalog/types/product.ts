/**
 * Tipos e interfaces avanzadas para el catálogo de productos de QvaFlow.
 * Soporta esquema EAV (atributos dinámicos), múltiples códigos de barra,
 * precios multimoneda simultáneos y galería de imágenes.
 */

export type MonedaTipo = 'CUP' | 'USD' | 'EUR' | 'MLC'
export type UnidadMedida = 'u' | 'kg' | 'lb' | 'pqte' | 'l'

export interface ProductBarcode {
  id: string
  code: string
  isPrimary: boolean
  description?: string
}

export interface ProductAttribute {
  id: string
  name: string
  value: string
}

export interface ProductMultiCurrencyPrices {
  CUP: number
  USD?: number | null
  EUR?: number | null
  MLC?: number | null
}

export interface ProductMultiCurrencyCosts {
  USD?: number | null
  CUP?: number | null
}

export interface ProductImageItem {
  uid: string
  name: string
  status?: string
  url: string
  thumbUrl?: string
}

export interface Product {
  id: number
  code: string // Código principal (SKU o código primario)
  barcodes: ProductBarcode[]
  name: string
  category: string
  costPriceUSD?: number | null // Costo en USD (Moneda principal)
  costPriceCUP?: number | null // Costo en CUP
  costPrice: number // Costo base (retrocompatibilidad)
  salePriceUSD?: number | null // Precio de venta en USD
  salePriceCUP?: number | null // Precio de venta en CUP
  salePrice: number // Precio de venta principal (CUP)
  primaryCurrency?: 'USD' | 'CUP'
  prices: ProductMultiCurrencyPrices
  costs?: ProductMultiCurrencyCosts
  stock: number
  minStock: number
  currency: MonedaTipo
  unit: UnidadMedida
  active: boolean
  description?: string
  attributes: ProductAttribute[]
  images: ProductImageItem[]
  createdAt?: string
  updatedAt?: string
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProductDto = Partial<CreateProductDto>
