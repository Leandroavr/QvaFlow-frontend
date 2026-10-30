import apiClient from '@/core/axios'
import type {
  MonthlyKpis,
  TopProduct,
  IdleProduct,
  MonthlyFinanceRecord,
  FinancialMovement,
  MonthOption,
} from '../types/reports'

const KPIS_MOCK: MonthlyKpis = {
  totalRevenue: 145850,
  estimatedProfit: 48200,
  profitMarginPercent: 33.05,
  totalTransactions: 384,
  averageTicket: 379.8,
}

// Histórico de balances mensuales de Ventas vs Compras
const FINANZAS_MENSUALES_MOCK: Record<string, MonthlyFinanceRecord> = {
  '2026-10': {
    monthKey: '2026-10',
    monthLabel: 'Octubre 2026',
    salesCUP: 145850,
    salesUSD: 405.14,
    salesCount: 384,
    purchasesCUP: 84200,
    purchasesUSD: 233.88,
    purchasesCount: 12,
    grossProfitCUP: 61650,
    grossProfitUSD: 171.26,
    marginPercent: 42.27,
  },
  '2026-09': {
    monthKey: '2026-09',
    monthLabel: 'Septiembre 2026',
    salesCUP: 128400,
    salesUSD: 356.66,
    salesCount: 340,
    purchasesCUP: 78000,
    purchasesUSD: 216.66,
    purchasesCount: 10,
    grossProfitCUP: 50400,
    grossProfitUSD: 140.00,
    marginPercent: 39.25,
  },
  '2026-08': {
    monthKey: '2026-08',
    monthLabel: 'Agosto 2026',
    salesCUP: 110200,
    salesUSD: 306.11,
    salesCount: 295,
    purchasesCUP: 69500,
    purchasesUSD: 193.05,
    purchasesCount: 8,
    grossProfitCUP: 40700,
    grossProfitUSD: 113.06,
    marginPercent: 36.93,
  },
}

// Movimientos de auditoría financiera (Ventas y Compras)
const MOVIMIENTOS_MOCK: FinancialMovement[] = [
  {
    id: 'MOV-1001',
    type: 'VENTA',
    date: '27/10/2026 10:15',
    reference: 'TICK-908123',
    description: 'Venta de mostrador (Café Serrano + Tukola)',
    category: 'Alimentos y Bebidas',
    warehouse: 'Tienda Principal',
    amountCUP: 2140,
    amountUSD: 5.94,
    paymentMethod: 'CUP Efectivo',
    status: 'COMPLETADA',
  },
  {
    id: 'MOV-1002',
    type: 'COMPRA',
    date: '25/10/2026 14:30',
    reference: 'FAC-2026-001',
    description: 'Entrada de mercancía: Distribuidora Habana (Café Serrano)',
    category: 'Alimentos',
    warehouse: 'Tienda Principal',
    amountCUP: 24500,
    amountUSD: 68.05,
    paymentMethod: 'Transferencia Bancaria',
    status: 'PAGADA',
  },
  {
    id: 'MOV-1003',
    type: 'VENTA',
    date: '24/10/2026 16:45',
    reference: 'TICK-908120',
    description: 'Venta rápida (Cerveza Cristal x6)',
    category: 'Bebidas',
    warehouse: 'Tienda Principal',
    amountCUP: 1920,
    amountUSD: 5.33,
    paymentMethod: 'Transfermóvil QR',
    status: 'COMPLETADA',
  },
  {
    id: 'MOV-1004',
    type: 'COMPRA',
    date: '22/10/2026 09:20',
    reference: 'FAC-2026-002',
    description: 'Compra a MIPYME Los Primos: Cerveza Cristal y Aceite',
    category: 'Bebidas y Víveres',
    warehouse: 'Almacén Central',
    amountCUP: 38200,
    amountUSD: 106.11,
    paymentMethod: 'Efectivo',
    status: 'PAGADA',
  },
  {
    id: 'MOV-1005',
    type: 'VENTA',
    date: '20/10/2026 11:10',
    reference: 'TICK-908115',
    description: 'Cobro en divisa USD en efectivo (3 latas cerveza)',
    category: 'Bebidas',
    warehouse: 'Tienda Principal',
    amountCUP: 950,
    amountUSD: 3.00,
    paymentMethod: 'USD Efectivo',
    status: 'COMPLETADA',
  },
  {
    id: 'MOV-1006',
    type: 'COMPRA',
    date: '15/10/2026 10:00',
    reference: 'FAC-2026-003',
    description: 'Reabastecimiento de Tabacos y Fósforos',
    category: 'Tabacos',
    warehouse: 'Tienda Principal',
    amountCUP: 21500,
    amountUSD: 59.72,
    paymentMethod: 'Efectivo',
    status: 'PAGADA',
  },
  {
    id: 'MOV-1007',
    type: 'VENTA',
    date: '28/09/2026 18:20',
    reference: 'TICK-907850',
    description: 'Venta fin de mes (Víveres varios)',
    category: 'Alimentos',
    warehouse: 'Tienda Principal',
    amountCUP: 4850,
    amountUSD: 13.47,
    paymentMethod: 'CUP Efectivo',
    status: 'COMPLETADA',
  },
  {
    id: 'MOV-1008',
    type: 'COMPRA',
    date: '20/09/2026 12:00',
    reference: 'FAC-2026-009',
    description: 'Compra mayorista Aceite de Girasol',
    category: 'Alimentos',
    warehouse: 'Almacén Central',
    amountCUP: 45000,
    amountUSD: 125.00,
    paymentMethod: 'Transferencia',
    status: 'PAGADA',
  },
]

// Top 5 productos más vendidos del catálogo
const TOP_PRODUCTOS_MOCK: TopProduct[] = [
  {
    id: 101,
    code: '78910001',
    name: 'Café Serrano Clásico 250g',
    category: 'Alimentos',
    unitsSold: 185,
    totalRevenue: 120250,
    percentage: 100,
  },
  {
    id: 104,
    code: '78910004',
    name: 'Cerveza Cristal Lata 355ml',
    category: 'Bebidas',
    unitsSold: 142,
    totalRevenue: 45440,
    percentage: 77,
  },
  {
    id: 103,
    code: '78910003',
    name: 'Refresco Tukola Lata 330ml',
    category: 'Bebidas',
    unitsSold: 96,
    totalRevenue: 26880,
    percentage: 52,
  },
  {
    id: 102,
    code: '78910002',
    name: 'Aceite de Girasol Criollo 1L',
    category: 'Alimentos',
    unitsSold: 64,
    totalRevenue: 60800,
    percentage: 35,
  },
  {
    id: 105,
    code: '78910005',
    name: 'Cigarros H. Upmann Selecto',
    category: 'Tabacos',
    unitsSold: 55,
    totalRevenue: 16500,
    percentage: 30,
  },
]

// Productos ociosos / sin rotación en los últimos 30 días
const PRODUCTOS_OCIOSOS_MOCK: IdleProduct[] = [
  {
    id: 201,
    code: '78920011',
    name: 'Salsa de Tomate Taíno 500g',
    category: 'Alimentos',
    warehouse: 'Almacén Central',
    stock: 28,
    unit: 'frasco',
    tiedUpCapital: 4200,
    daysWithoutSale: 42,
  },
  {
    id: 202,
    code: '78920012',
    name: 'Jabón de Tocador Nácar 125g',
    category: 'Aseo y Limpieza',
    warehouse: 'Tienda Principal',
    stock: 15,
    unit: 'u',
    tiedUpCapital: 1800,
    daysWithoutSale: 31,
  },
  {
    id: 203,
    code: '78920013',
    name: 'Fósforos El Gallo Paquete x10',
    category: 'Varios',
    warehouse: 'Tienda Principal',
    stock: 40,
    unit: 'pqte',
    tiedUpCapital: 1200,
    daysWithoutSale: 55,
  },
]

/**
 * Servicio de Analíticas y Reportes de Ventas y Compras.
 */
export const reportsService = {
  /**
   * Obtiene la lista de meses disponibles para filtrado.
   */
  async getAvailableMonths(): Promise<MonthOption[]> {
    return Promise.resolve([
      { key: '2026-10', label: 'Octubre 2026 (Mes Actual)' },
      { key: '2026-09', label: 'Septiembre 2026' },
      { key: '2026-08', label: 'Agosto 2026' },
      { key: 'ALL', label: 'Todos los Meses (Acumulado Anual)' },
    ])
  },

  /**
   * Obtiene el consolidado de Ventas vs Compras para el mes especificado.
   */
  async getMonthlyFinanceSummary(monthKey: string = '2026-10'): Promise<MonthlyFinanceRecord> {
    if (monthKey === 'ALL') {
      // Consolidar todos los meses
      const all = Object.values(FINANZAS_MENSUALES_MOCK)
      const salesCUP = all.reduce((acc, m) => acc + m.salesCUP, 0)
      const salesUSD = all.reduce((acc, m) => acc + m.salesUSD, 0)
      const purchasesCUP = all.reduce((acc, m) => acc + m.purchasesCUP, 0)
      const purchasesUSD = all.reduce((acc, m) => acc + m.purchasesUSD, 0)
      const grossProfitCUP = salesCUP - purchasesCUP
      const grossProfitUSD = salesUSD - purchasesUSD
      const marginPercent = salesCUP > 0 ? Number(((grossProfitCUP / salesCUP) * 100).toFixed(2)) : 0

      return Promise.resolve({
        monthKey: 'ALL',
        monthLabel: 'Consolidado Histórico',
        salesCUP,
        salesUSD: Number(salesUSD.toFixed(2)),
        salesCount: all.reduce((acc, m) => acc + m.salesCount, 0),
        purchasesCUP,
        purchasesUSD: Number(purchasesUSD.toFixed(2)),
        purchasesCount: all.reduce((acc, m) => acc + m.purchasesCount, 0),
        grossProfitCUP,
        grossProfitUSD: Number(grossProfitUSD.toFixed(2)),
        marginPercent,
      })
    }

    const found = FINANZAS_MENSUALES_MOCK[monthKey] || FINANZAS_MENSUALES_MOCK['2026-10']
    return Promise.resolve({ ...found })
  },

  /**
   * Obtiene el listado de movimientos de Ventas y Compras.
   */
  async getFinancialMovements(monthKey: string = '2026-10'): Promise<FinancialMovement[]> {
    if (monthKey === 'ALL') {
      return Promise.resolve([...MOVIMIENTOS_MOCK])
    }

    // Filtrar por prefijo de mes en la fecha (ej. 2026-10)
    const [year, month] = monthKey.split('-')
    const pattern = `/${month}/${year}`
    const filtered = MOVIMIENTOS_MOCK.filter((m) => m.date.includes(pattern))
    return Promise.resolve(filtered.length > 0 ? filtered : [...MOVIMIENTOS_MOCK])
  },

  /**
   * Obtiene los KPIs consolidados del mes.
   */
  async getMonthlyKpis(): Promise<MonthlyKpis> {
    try {
      const response = await apiClient.get<MonthlyKpis>('/reports/kpis')
      return response.data
    } catch {
      return Promise.resolve({ ...KPIS_MOCK })
    }
  },

  /**
   * Obtiene los productos más vendidos con su porcentaje.
   */
  async getTopSellingProducts(): Promise<TopProduct[]> {
    try {
      const response = await apiClient.get<TopProduct[]>('/reports/top-products')
      return response.data
    } catch {
      return Promise.resolve([...TOP_PRODUCTOS_MOCK])
    }
  },

  /**
   * Obtiene la lista de inventario ocioso / sin rotación.
   */
  async getIdleProducts(): Promise<IdleProduct[]> {
    try {
      const response = await apiClient.get<IdleProduct[]>('/reports/idle-products')
      return response.data
    } catch {
      return Promise.resolve([...PRODUCTOS_OCIOSOS_MOCK])
    }
  },
}

export default reportsService
