import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import backupService from '../services/backupService'
import type { BackupLog, BackupSnapshot } from '../types/backup'

/**
 * Store Pinia para la gestión del historial de salvas, exportaciones y restauración de respaldo.
 */
export const useBackupStore = defineStore('backup', () => {
  // Estado Reactivo
  const history = ref<BackupLog[]>([])
  const loading = ref<boolean>(false)
  const isGenerating = ref<boolean>(false)
  const isRestoring = ref<boolean>(false)

  // Getters Computados
  const totalBackups = computed(() => history.value.length)
  const lastBackup = computed(() => (history.value.length > 0 ? history.value[0] : null))

  const totalStorageKB = computed(() => {
    return Math.round(history.value.reduce((acc, item) => acc + item.sizeBytes, 0) / 1024)
  })

  // Acciones

  /**
   * Carga el historial de copias de seguridad previas.
   */
  const fetchHistory = async () => {
    loading.value = true
    try {
      history.value = await backupService.getHistory()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar historial de salvas'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  /**
   * Genera el volcado JSON de la base de datos y activa la descarga directa en el navegador.
   */
  const generateAndDownload = async (
    userName: string = 'Administrador'
  ): Promise<BackupLog | null> => {
    isGenerating.value = true
    try {
      const newBackup = await backupService.generateAndDownloadBackup(userName)
      history.value.unshift(newBackup)
      message.success('Salva generada y descargada correctamente.')
      return newBackup
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al generar la copia de seguridad'
      message.error(errorMsg)
      return null
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Restaura la base de datos a partir de un snapshot de copia de seguridad deserializado.
   */
  const restoreBackup = async (
    snapshot: BackupSnapshot,
    filename: string,
    sizeBytes: number,
    userName: string = 'Administrador'
  ): Promise<BackupLog | null> => {
    isRestoring.value = true
    try {
      const restored = await backupService.restoreBackup(snapshot, filename, sizeBytes, userName)
      history.value.unshift(restored)
      message.success('Base de datos restaurada correctamente desde el archivo de salva.')
      return restored
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error al restaurar la copia de seguridad'
      message.error(errorMsg)
      return null
    } finally {
      isRestoring.value = false
    }
  }

  return {
    // Estado
    history,
    loading,
    isGenerating,
    isRestoring,
    // Getters
    totalBackups,
    lastBackup,
    totalStorageKB,
    // Acciones
    fetchHistory,
    generateAndDownload,
    restoreBackup,
  }
})

export default useBackupStore
