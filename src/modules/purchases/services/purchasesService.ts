import apiClient from '@/core/axios'
import inventoryService from '@/modules/inventory/services/inventoryService'
import type {
  Provider,
  PurchaseInvoice,
  CreatePurchaseInvoiceDto,
  PurchaseInvoiceItem,
} from '../types/purchases'

// 3 Proveedores de referencia para autocompletar rápidamente
const PROVEEDORES_MOCK: Provider[] = [
  {
    id: 1,
    code: 'PROV-001',
    name: 'Distribuidora Habana S.R.L.',
    phone: '+53 7 830-1122',
  },
  {
    id: 2,
    code: 'PROV-002',
    name: 'MIPYME Los Primos Alimentos',
    phone: '+53 5 289-4455',
  },
  {
    id: 3,
    code: 'PROV-003',
    name: 'Importadora Caribe Logística',
    phone: '+53 7 204-9988',
  },
]

// Facturas iniciales con estado 'PENDIENTE' y 'CONFIRMADA'
const FACTURAS_MOCK: PurchaseInvoice[] = [
  {
    id: 'FAC-INV-001',
    noDocument: 'FAC-2026-001',
    invoiceNumber: 'FAC-2026-001',
    proveedor: 'Distribuidora Habana S.R.L.',
    providerName: 'Distribuidora Habana S.R.L.',
    fechaMovimiento: '2026-10-18',
    issueDate: '2026-10-18',
    importeTotal: 24500,
    total: 24500,
    moneda: 'CUP',
    currency: 'CUP',
    estado: 'CONFIRMADA',
    status: 'CONFIRMADA',
    notes: 'Recepción de café y refrescos en tienda principal. Entrada confirmada y stock sumado.',
    createdAt: '2026-10-18 11:30',
    items: [
      {
        id: 1,
        productId: 101,
        producto: '78910001',
        productCode: '78910001',
        productName: 'Café Serrano Clásico 250g',
        unit: 'pqte',
        cantidad: 30,
        quantity: 30,
        localizacion: 'LOC-TND-E1',
        unitCost: 450,
        subtotal: 13500,
      },
      {
        id: 2,
        productId: 103,
        producto: '78910003',
        productCode: '78910003',
        productName: 'Refresco Tukola Lata 330ml',
        unit: 'lata',
        cantidad: 61,
        quantity: 61,
        localizacion: 'LOC-NEV-B1',
        unitCost: 180,
        subtotal: 11000,
      },
    ],
  },
  {
    id: 'FAC-INV-002',
    noDocument: 'FAC-2026-002',
    invoiceNumber: 'FAC-2026-002',
    proveedor: 'MIPYME Los Primos Alimentos',
    providerName: 'MIPYME Los Primos Alimentos',
    fechaMovimiento: '2026-10-24',
    issueDate: '2026-10-24',
    importeTotal: 18040,
    total: 18040,
    moneda: 'CUP',
    currency: 'CUP',
    estado: 'PENDIENTE',
    status: 'PENDIENTE',
    notes: 'Entrada de cerveza Cristal para reposición. Mercancía en tránsito (Pendiente de confirmación).',
    createdAt: '2026-10-24 15:45',
    items: [
      {
        id: 3,
        productId: 104,
        producto: '78910004',
        productCode: '78910004',
        productName: 'Cerveza Cristal Lata 355ml',
        unit: 'lata',
        cantidad: 82,
        quantity: 82,
        localizacion: 'LOC-NEV-B1',
        unitCost: 220,
        subtotal: 18040,
      },
    ],
  },
]

const PRODUCTOS_ABASTECIMIENTO_MOCK = [
  { id: 101, code: '78910001', name: 'Café Serrano Clásico 250g', unit: 'pqte', defaultCost: 450 },
  { id: 102, code: '78910002', name: 'Aceite de Girasol Criollo 1L', unit: 'botella', defaultCost: 700 },
  { id: 103, code: '78910003', name: 'Refresco Tukola Lata 330ml', unit: 'lata', defaultCost: 180 },
  { id: 104, code: '78910004', name: 'Cerveza Cristal Lata 355ml', unit: 'lata', defaultCost: 220 },
  { id: 105, code: '78910005', name: 'Cigarros H. Upmann Selecto', unit: 'cajetilla', defaultCost: 210 },
  { id: 106, code: '78910006', name: 'Pollo Entero Congelado 1kg', unit: 'kg', defaultCost: 980 },
]

let localInvoices: PurchaseInvoice[] = [...FACTURAS_MOCK]
let localProviders: Provider[] = [...PROVEEDORES_MOCK]

/**
 * Servicio para la gestión de compras, facturas de proveedores y albaranes.
 */
export const purchasesService = {
  /**
   * Obtiene la lista histórica de facturas de compra.
   */
  async getInvoices(): Promise<PurchaseInvoice[]> {
    try {
      const response = await apiClient.get<PurchaseInvoice[]>('/purchases/invoices')
      return response.data
    } catch {
      return Promise.resolve([...localInvoices])
    }
  },

  /**
   * Obtiene la lista de proveedores de referencia.
   */
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await apiClient.get<Provider[]>('/purchases/providers')
      return response.data
    } catch {
      return Promise.resolve([...localProviders])
    }
  },

  /**
   * Obtiene productos disponibles para compras.
   */
  async getAvailableProducts() {
    return Promise.resolve([...PRODUCTOS_ABASTECIMIENTO_MOCK])
  },

  /**
   * Registra una nueva Factura_Compra.
   * Regla de negocio: se guarda inicialmente en 'PENDIENTE' y NO afecta el stock hasta su confirmación.
   */
  async createInvoice(dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    try {
      const response = await apiClient.post<PurchaseInvoice>('/purchases/invoices', dto)
      return response.data
    } catch {
      let totalCalc = 0
      const processedItems: PurchaseInvoiceItem[] = dto.items.map((item, index) => {
        const qty = item.cantidad ?? item.quantity ?? 1
        const itemSubtotal = qty * item.unitCost
        totalCalc += itemSubtotal
        return {
          id: Date.now() + index,
          productId: item.productId,
          producto: item.producto || item.productCode,
          productCode: item.productCode,
          productName: item.productName,
          unit: item.unit,
          cantidad: qty,
          quantity: qty,
          localizacion: item.localizacion || 'LOC-CEN-P1',
          unitCost: item.unitCost,
          subtotal: itemSubtotal,
        }
      })

      const docNo = dto.noDocument || dto.invoiceNumber || `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
      const proveedorClean = dto.proveedor.trim()

      const newInvoice: PurchaseInvoice = {
        id: `FAC-INV-${Date.now().toString().slice(-4)}`,
        noDocument: docNo,
        invoiceNumber: docNo,
        proveedor: proveedorClean,
        providerName: proveedorClean,
        fechaMovimiento: dto.fechaMovimiento || dto.issueDate || new Date().toISOString().slice(0, 10),
        issueDate: dto.fechaMovimiento || dto.issueDate || new Date().toISOString().slice(0, 10),
        importeTotal: totalCalc,
        total: totalCalc,
        moneda: dto.moneda || 'CUP',
        currency: dto.moneda || 'CUP',
        estado: 'PENDIENTE',
        status: 'PENDIENTE',
        items: processedItems,
        notes: dto.notes,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      }

      localInvoices.unshift(newInvoice)

      // Guardar proveedor en lista si es nuevo
      if (proveedorClean && !localProviders.some((p) => p.name.toLowerCase() === proveedorClean.toLowerCase())) {
        localProviders.push({
          id: Date.now(),
          code: `PROV-${Date.now().toString().slice(-3)}`,
          name: proveedorClean,
        })
      }

      // IMPORTANTE: Al estar en 'PENDIENTE', NO se llama a updateStockFromPurchase todavía
      return Promise.resolve(newInvoice)
    }
  },

  /**
   * Confirma la recepción de la mercancía de una Factura de Compra
   * cambiando el estado a CONFIRMADA y sumando las existencias al Stock en cada localización.
   */
  async confirmInvoice(invoiceId: string): Promise<PurchaseInvoice> {
    try {
      const response = await apiClient.post<PurchaseInvoice>(`/purchases/invoices/${invoiceId}/confirm`)
      return response.data
    } catch {
      const invoice = localInvoices.find((inv) => inv.id === invoiceId || inv.noDocument === invoiceId)
      if (!invoice) {
        throw new Error(`Factura ${invoiceId} no encontrada`)
      }

      if (invoice.estado === 'CONFIRMADA') {
        throw new Error('Esta factura ya fue confirmada previamente.')
      }

      invoice.estado = 'CONFIRMADA'
      invoice.status = 'CONFIRMADA'

      // En este preciso momento se impacta el Stock en cada localización
      inventoryService.confirmPurchaseStock(
        invoice.items.map((it) => ({
          producto: it.producto,
          productName: it.productName,
          quantity: it.cantidad,
          unitCost: it.unitCost,
          localizacion: it.localizacion,
        }))
      )

      return Promise.resolve({ ...invoice })
    }
  },
}

export default purchasesService
