/**
 * Definiciones de tipos para el módulo de Respaldos y Copias de Seguridad en QvaFlow.
 */

export type BackupType = 'MANUAL' | 'AUTOMATICA' | 'RESTAURACION'
export type BackupStatus = 'EXITOSA' | 'FALLIDA'

export interface BackupLog {
  id: string
  filename: string
  createdAt: string
  sizeFormatted: string
  sizeBytes: number
  type: BackupType
  user: string
  status: BackupStatus
  recordCount: number
}

export interface BackupSnapshot {
  system: string
  version: string
  environment: string
  exportedAt: string
  exportedBy: string
  checksum: string
  data: {
    catalog: unknown[]
    inventory: unknown[]
    shifts: unknown[]
    rates: Record<string, number>
    salesSummary: {
      totalTickets: number
      totalCUP: number
    }
  }
}
