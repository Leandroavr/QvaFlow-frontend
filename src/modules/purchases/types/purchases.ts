/**
 * Definiciones de tipos para el módulo de Compras y Proveedores en QvaFlow.
 * Alineado con Factura_Compra e Items_Factura_Compra del modelo relacional.
 */

export type PurchaseInvoiceStatus = 'PENDIENTE' | 'CONFIRMADA' | 'ANULADA'

export interface Provider {
  id: number
  code: string
  name: string
  phone?: string
  contact?: string
  address?: string
}

export interface PurchaseInvoiceItem {
  id: number
  productId: number
  producto: string // Código de producto para la BD
  productCode: string
  productName: string
  unit: string
  cantidad: number
  quantity: number // Alias para compatibilidad de interfaz
  localizacion: string // Código de localización donde se almacenará
  unitCost: number
  subtotal: number
}

export interface PurchaseInvoice {
  id: string
  noDocument: string
  invoiceNumber: string // Alias para compatibilidad
  proveedor: string // Texto libre ingresado por el usuario
  providerName: string // Alias para compatibilidad
  providerId?: number
  fechaMovimiento: string
  issueDate: string // Alias para compatibilidad
  importeTotal: number
  total: number // Alias para compatibilidad
  moneda: 'CUP' | 'USD'
  currency: string
  estado: PurchaseInvoiceStatus
  status: PurchaseInvoiceStatus
  items: PurchaseInvoiceItem[]
  notes?: string
  createdAt?: string
}

export interface CreateInvoiceItemDto {
  productId: number
  producto?: string
  productCode: string
  productName: string
  unit: string
  quantity: number
  cantidad?: number
  localizacion: string
  unitCost: number
}

export interface CreatePurchaseInvoiceDto {
  noDocument: string
  invoiceNumber?: string
  proveedor: string
  fechaMovimiento: string
  issueDate?: string
  moneda: 'CUP' | 'USD'
  items: CreateInvoiceItemDto[]
  notes?: string
}
