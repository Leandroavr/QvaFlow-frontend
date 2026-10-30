/**
 * Definiciones de tipos para el módulo de Reportes y Analíticas de QvaFlow.
 */

export interface TopProduct {
  id: number
  code: string
  name: string
  category: string
  unitsSold: number
  totalRevenue: number
  percentage: number // Para la barra de progreso de a-progress
}

export interface IdleProduct {
  id: number
  code: string
  name: string
  category: string
  warehouse: string
  stock: number
  unit: string
  tiedUpCapital: number // Capital inmovilizado (stock * costo)
  daysWithoutSale: number
}

export interface MonthlyKpis {
  totalRevenue: number
  estimatedProfit: number
  profitMarginPercent: number
  totalTransactions: number
  averageTicket: number
}

export interface MonthOption {
  key: string // '2026-10', '2026-09', '2026-08', 'ALL'
  label: string
}

export interface MonthlyFinanceRecord {
  monthKey: string
  monthLabel: string
  salesCUP: number
  salesUSD: number
  salesCount: number
  purchasesCUP: number
  purchasesUSD: number
  purchasesCount: number
  grossProfitCUP: number
  grossProfitUSD: number
  marginPercent: number
}

export interface FinancialMovement {
  id: string
  type: 'VENTA' | 'COMPRA'
  date: string
  reference: string
  description: string
  category: string
  warehouse: string
  amountCUP: number
  amountUSD: number
  paymentMethod: string
  status: string
}

