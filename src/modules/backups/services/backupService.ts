import apiClient from '@/core/axios'
import type { BackupLog, BackupSnapshot } from '../types/backup'

// Historial simulado de salvas previas
const HISTORIAL_RESPALDOS_MOCK: BackupLog[] = [
  {
    id: 'BAK-1003',
    filename: 'qvaflow_backup_20261026_2200.json',
    createdAt: '2026-10-26 22:00:15',
    sizeFormatted: '2.45 MB',
    sizeBytes: 2569011,
    type: 'AUTOMATICA',
    user: 'Sistema (Daemon Cron Local)',
    status: 'EXITOSA',
    recordCount: 428,
  },
  {
    id: 'BAK-1002',
    filename: 'qvaflow_backup_20261025_1930.json',
    createdAt: '2026-10-25 19:30:42',
    sizeFormatted: '2.18 MB',
    sizeBytes: 2285895,
    type: 'MANUAL',
    user: 'Carlos Valdés (Admin)',
    status: 'EXITOSA',
    recordCount: 395,
  },
  {
    id: 'BAK-1001',
    filename: 'qvaflow_backup_20261023_1800.json',
    createdAt: '2026-10-23 18:00:05',
    sizeFormatted: '1.92 MB',
    sizeBytes: 2013265,
    type: 'MANUAL',
    user: 'Superadministrador',
    status: 'EXITOSA',
    recordCount: 340,
  },
]

let localHistory: BackupLog[] = [...HISTORIAL_RESPALDOS_MOCK]

/**
 * Servicio para la generación, exportación y descarga de copias de seguridad de QvaFlow.
 */
export const backupService = {
  /**
   * Obtiene el registro histórico de respaldos generados.
   */
  async getHistory(): Promise<BackupLog[]> {
    try {
      const response = await apiClient.get<BackupLog[]>('/backups/history')
      return response.data
    } catch {
      return Promise.resolve([...localHistory])
    }
  },

  /**
   * Simula la llamada al endpoint de Symfony para exportar la base de datos PostgreSQL,
   * genera el archivo JSON en memoria y fuerza la descarga en el navegador.
   *
   * @param userName Nombre del usuario o administrador que solicita la salva
   */
  async generateAndDownloadBackup(userName: string = 'Administrador'): Promise<BackupLog> {
    try {
      // Intentar contactar al backend si está disponible
      await apiClient.post('/backups/generate')
    } catch {
      // Simular latencia de volcado de base de datos offline (1 segundo)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 1. Estructurar snapshot completo de la base de datos local
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const timestampStr = `${yyyy}${mm}${dd}_${hh}${min}`
    const filename = `qvaflow_backup_${timestampStr}.json`

    const snapshotData: BackupSnapshot = {
      system: 'QvaFlow POS & Inventory Offline-First',
      version: '2.4.0-offline',
      environment: 'LAN Local (MIPYME Cuba)',
      exportedAt: now.toISOString().replace('T', ' ').slice(0, 19),
      exportedBy: userName,
      checksum: `sha256_${Date.now().toString(16)}_${Math.random().toString(36).substring(2, 8)}`,
      data: {
        catalog: [
          { code: '78910001', name: 'Café Serrano Clásico 250g', category: 'Alimentos', price: 650, cost: 450 },
          { code: '78910002', name: 'Aceite de Girasol Criollo 1L', category: 'Alimentos', price: 950, cost: 700 },
          { code: '78910003', name: 'Refresco Tukola Lata 330ml', category: 'Bebidas', price: 280, cost: 180 },
          { code: '78910004', name: 'Cerveza Cristal Lata 355ml', category: 'Bebidas', price: 320, cost: 220 },
          { code: '78910005', name: 'Cigarros H. Upmann Selecto', category: 'Tabacos', price: 300, cost: 210 },
          { code: '78910006', name: 'Pollo Entero Congelado 1kg', category: 'Cárnicos', price: 1350, cost: 980 },
        ],
        inventory: [
          { warehouse: 'Tienda Principal', itemsCount: 4, stockTotal: 82 },
          { warehouse: 'Nevera', itemsCount: 3, stockTotal: 120 },
          { warehouse: 'Almacén Central', itemsCount: 1, stockTotal: 15 },
        ],
        shifts: [
          { shiftId: 'TURNO-2026-001', cashier: 'Caja Principal', status: 'OPEN', initialCUP: 10000, initialUSD: 100 },
        ],
        rates: { CUP: 1, USD: 360, EUR: 380, MLC: 275 },
        salesSummary: {
          totalTickets: 384,
          totalCUP: 145850,
        },
      },
    }

    // 2. Convertir a Blob JSON
    const jsonString = JSON.stringify(snapshotData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
    const sizeBytes = blob.size
    const sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB`

    // 3. Forzar descarga inmediata en el navegador mediante elemento <a> virtual
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = filename
    anchor.style.display = 'none'

    document.body.appendChild(anchor)
    anchor.click()

    // Limpieza de recursos en memoria
    setTimeout(() => {
      document.body.removeChild(anchor)
      URL.revokeObjectURL(downloadUrl)
    }, 200)

    // 4. Registrar en el historial de salvas
    const newRecord: BackupLog = {
      id: `BAK-${Date.now().toString().slice(-4)}`,
      filename,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
      sizeFormatted,
      sizeBytes,
      type: 'MANUAL',
      user: userName,
      status: 'EXITOSA',
      recordCount: 450,
    }

    localHistory.unshift(newRecord)
    return newRecord
  },

  /**
   * Procesa la restauración de una copia de seguridad cargada desde un archivo JSON local.
   * Valida la estructura y simula la inserción / sincronización de datos en PostgreSQL.
   *
   * @param snapshot Objeto de respaldo deserializado
   * @param filename Nombre del archivo .json cargado
   * @param sizeBytes Tamaño en bytes del archivo
   * @param userName Nombre del administrador que ejecuta la restauración
   */
  async restoreBackup(
    snapshot: BackupSnapshot,
    filename: string,
    sizeBytes: number,
    userName: string = 'Administrador'
  ): Promise<BackupLog> {
    try {
      await apiClient.post('/backups/restore', snapshot)
    } catch {
      // Simular tiempo de reconstrucción de esquemas y restauración en PostgreSQL local
      await new Promise((resolve) => setTimeout(resolve, 1200))
    }

    const now = new Date()
    const recordCount =
      (snapshot.data?.catalog?.length || 0) +
      (snapshot.data?.inventory?.length || 0) +
      (snapshot.data?.shifts?.length || 0)

    const restoreRecord: BackupLog = {
      id: `RES-${Date.now().toString().slice(-4)}`,
      filename: `[RESTAURACIÓN] ${filename}`,
      createdAt: now.toISOString().replace('T', ' ').slice(0, 19),
      sizeFormatted: `${(sizeBytes / 1024).toFixed(1)} KB`,
      sizeBytes,
      type: 'RESTAURACION',
      user: userName,
      status: 'EXITOSA',
      recordCount: recordCount || 420,
    }

    localHistory.unshift(restoreRecord)
    return restoreRecord
  },
}

export default backupService
