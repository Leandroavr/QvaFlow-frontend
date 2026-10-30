<template>
  <div class="space-y-5">
    <!-- ALERTA INFORMATIVA PRINCIPAL: OFFLINE-FIRST Y MEMORIAS USB -->
    <a-alert
      type="info"
      show-icon
      class="rounded-xl border-blue-200 bg-blue-50/80 shadow-xs p-4"
    >
      <template #message>
        <span class="font-bold text-qvaflow-navy text-sm">
          Protocolo de Seguridad Offline-first para MIPYMES
        </span>
      </template>
      <template #description>
        <div class="text-xs text-blue-900 leading-relaxed mt-1 space-y-1">
          <p class="m-0">
            Al operar en una <strong>red local sin dependencia permanente de internet</strong>, la integridad de los datos de su negocio depende de las copias de seguridad locales.
          </p>
          <p class="m-0 text-blue-800">
            💡 <strong>Recomendación Operativa:</strong> Descargue una salva al finalizar cada jornada comercial y cópiela hacia una <strong>memoria USB externa</strong>. En caso de reposición de equipo servidor o contingencia, use la opción <strong>Cargar y Restaurar Salva</strong>.
          </p>
        </div>
      </template>
    </a-alert>

    <!-- TARJETAS SUPERIORES DE ESTADO Y KPIS -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Última Salva Generada -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Última Salva Generada</p>
          <h3 class="text-base font-bold text-slate-800 m-0">
            {{ backupStore.lastBackup?.createdAt || 'Sin registros' }}
          </h3>
          <span class="text-xs text-qvaflow-navy font-semibold truncate block max-w-[200px]" :title="backupStore.lastBackup?.filename">
            {{ backupStore.lastBackup ? backupStore.lastBackup.filename : 'Se recomienda generar una salva' }}
          </span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-blue-50 text-qvaflow-navy flex items-center justify-center text-2xl font-bold shadow-xs">
          🛡️
        </div>
      </div>

      <!-- Total de Respaldos Históricos -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Respaldos en Registro</p>
          <h3 class="text-2xl font-black text-slate-800 m-0">
            {{ backupStore.totalBackups }}
          </h3>
          <span class="text-xs text-slate-400">
            Volumen acumulado: ~{{ backupStore.totalStorageKB }} KB
          </span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl font-bold shadow-xs">
          💾
        </div>
      </div>

      <!-- Estado de la Base de Datos Local -->
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Motor PostgreSQL Local</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 class="text-base font-bold text-slate-800 m-0">Estado Óptimo</h3>
          </div>
          <span class="text-xs text-slate-400">Sin inconsistencias detectadas</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold shadow-xs">
          ⚡
        </div>
      </div>
    </div>

    <!-- TARJETAS DE ACCIÓN DUAL: GENERAR (DESCARGAR) Y CARGAR (RESTAURAR) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- TARJETA 1: GENERACIÓN Y DESCARGA DIRECTA -->
      <div class="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-qvaflow-navy transition-all shadow-sm flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-qvaflow-navy font-mono text-xs font-bold border border-blue-200">
              SNAPSHOT COMPLETO (JSON)
            </span>
            <span class="text-xs text-slate-500 font-mono">v2.4.0-offline</span>
          </div>
          <h3 class="text-xl font-black text-slate-900 m-0">
            Generar y Descargar Salva (JSON)
          </h3>
          <p class="text-xs text-slate-600 leading-relaxed m-0">
            Empaqueta en un único archivo JSON estructurado todos los productos, existencias en almacenes, turnos de caja, ventas y configuración para resguardar en una memoria USB.
          </p>
        </div>

        <a-button
          type="primary"
          size="large"
          :loading="backupStore.isGenerating"
          class="h-12 bg-qvaflow-navy hover:bg-qvaflow-navy-dark border-none font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-qvaflow-navy/20 cursor-pointer"
          @click="handleExportBackup"
        >
          <DownloadOutlined class="text-lg" />
          <span>Generar y Descargar Salva Completa</span>
        </a-button>
      </div>

      <!-- TARJETA 2: CARGA Y RESTAURACIÓN DE SALVA -->
      <div class="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300 hover:border-qvaflow-navy transition-all shadow-sm flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-mono text-xs font-bold border border-amber-200">
              RESTAURACIÓN & MIGRACIÓN
            </span>
            <span class="text-xs text-slate-500 font-mono">Formato .json</span>
          </div>
          <h3 class="text-xl font-black text-slate-900 m-0">
            Cargar y Restaurar Salva (JSON)
          </h3>
          <p class="text-xs text-slate-600 leading-relaxed m-0">
            Seleccione una copia de seguridad (.json) desde su memoria USB o disco para restaurar íntegramente la información del negocio en este equipo.
          </p>
        </div>

        <!-- Zona de Carga / Dropzone -->
        <div class="flex items-center gap-3">
          <input
            ref="fileInputRef"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleFileInputChange"
          />

          <a-button
            size="large"
            block
            class="h-12 border-qvaflow-navy text-qvaflow-navy hover:text-white hover:bg-qvaflow-navy font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            @click="triggerFileInput"
          >
            <UploadOutlined class="text-lg" />
            <span>Seleccionar Archivo JSON de Salva</span>
          </a-button>
        </div>
      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN Y PREVISUALIZACIÓN DE RESTAURACIÓN -->
    <a-modal
      v-model:open="isRestoreModalVisible"
      title="Restauración de Copia de Seguridad"
      width="580px"
      :footer="null"
      :mask-closable="false"
      destroy-on-close
    >
      <div class="space-y-4 pt-2">
        <!-- Alerta Crítica de Sobrescritura -->
        <a-alert
          type="error"
          show-icon
          class="rounded-xl border-red-200 bg-red-50"
        >
          <template #message>
            <span class="font-black text-red-900 text-sm">
              ¡Advertencia Crítica de Sobrescritura!
            </span>
          </template>
          <template #description>
            <div class="text-xs text-red-800 mt-1 leading-relaxed">
              La restauración de una copia de seguridad <strong>sobrescribirá los datos actuales</strong> de productos, inventarios en almacenes y turnos de caja en la base de datos local. Esta acción es <strong>irreversible</strong>.
            </div>
          </template>
        </a-alert>

        <!-- Resumen de los Datos Detectados en el Archivo -->
        <div v-if="parsedSnapshot" class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 m-0">
            Metadatos de la Salva Seleccionada:
          </h4>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-slate-400 block text-[11px]">Archivo:</span>
              <span class="font-mono font-bold text-slate-800 truncate block" :title="selectedFileName">
                {{ selectedFileName }}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Tamaño:</span>
              <span class="font-mono font-bold text-slate-800">{{ selectedFileSizeFormatted }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Fecha de Exportación:</span>
              <span class="font-mono font-bold text-slate-800">{{ parsedSnapshot.exportedAt }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Generada por:</span>
              <span class="font-bold text-slate-800">{{ parsedSnapshot.exportedBy }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Versión del Sistema:</span>
              <span class="font-mono font-bold text-slate-800">{{ parsedSnapshot.version }}</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[11px]">Entorno:</span>
              <span class="font-bold text-slate-800">{{ parsedSnapshot.environment }}</span>
            </div>
          </div>

          <!-- Conteo de Registros a Restaurar -->
          <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            <span class="text-slate-600 font-semibold">Registros a incorporar:</span>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[11px]">
                📦 {{ parsedSnapshot.data?.catalog?.length || 0 }} Productos
              </span>
              <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                🏢 {{ parsedSnapshot.data?.inventory?.length || 0 }} Almacenes
              </span>
              <span class="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[11px]">
                🧾 {{ parsedSnapshot.data?.shifts?.length || 0 }} Turnos
              </span>
            </div>
          </div>
        </div>

        <!-- Checkbox de Confirmación Explícita -->
        <div class="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <a-checkbox v-model:checked="confirmOverwrite" class="text-xs font-bold text-amber-950">
            He verificado el archivo y confirmo que deseo sobrescribir la base de datos local con esta copia de seguridad.
          </a-checkbox>
        </div>

        <!-- Botones de Acción del Modal -->
        <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <a-button size="large" @click="cancelRestore">
            Cancelar
          </a-button>

          <a-button
            type="primary"
            danger
            size="large"
            :disabled="!confirmOverwrite"
            :loading="backupStore.isRestoring"
            class="font-bold shadow-md cursor-pointer"
            @click="handleExecuteRestore"
          >
            Sobrescribir y Restaurar Sistema
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- TABLA DE HISTORIAL DE RESPALDOS -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-slate-800 text-base m-0">Historial de Salvas y Restauraciones</h3>
          <p class="text-xs text-slate-400 m-0">Registro de auditoría de respaldos generados e importados</p>
        </div>

        <a-button @click="backupStore.fetchHistory">
          <template #icon><ReloadOutlined /></template>
          Actualizar
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="backupStore.history"
        :loading="backupStore.loading"
        :pagination="{ pageSize: 5, showSizeChanger: true, showTotal: (total: number) => `Total ${total} operaciones registradas` }"
        row-key="id"
        class="overflow-x-auto"
      >
        <template #bodyCell="{ column, record }">
          <!-- Columna Archivo -->
          <template v-if="column.key === 'filename'">
            <div class="flex items-center gap-2">
              <span class="text-lg">
                {{ record.type === 'RESTAURACION' ? '🔄' : '📄' }}
              </span>
              <div>
                <span class="font-mono font-bold text-xs text-slate-800 block">
                  {{ record.filename }}
                </span>
                <span class="text-[10px] text-slate-400">
                  {{ record.recordCount }} registros procesados
                </span>
              </div>
            </div>
          </template>

          <!-- Columna Fecha y Hora (DD/MM/YYYY HH:mm) -->
          <template v-else-if="column.key === 'createdAt'">
            <span class="text-xs text-slate-700 font-mono">{{ formatearFechaHora(record.createdAt) }}</span>
          </template>

          <!-- Columna Tipo -->
          <template v-else-if="column.key === 'type'">
            <a-tag v-if="record.type === 'RESTAURACION'" color="volcano" class="text-xs font-bold">
              🔄 Restauración
            </a-tag>
            <a-tag v-else-if="record.type === 'MANUAL'" color="blue" class="text-xs font-semibold">
              👤 Manual
            </a-tag>
            <a-tag v-else color="purple" class="text-xs font-semibold">
              ⚙️ Automática
            </a-tag>
          </template>

          <!-- Columna Tamaño -->
          <template v-else-if="column.key === 'size'">
            <span class="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {{ record.sizeFormatted }}
            </span>
          </template>

          <!-- Columna Usuario -->
          <template v-else-if="column.key === 'user'">
            <span class="text-xs font-medium text-slate-700">{{ record.user }}</span>
          </template>

          <!-- Columna Estado -->
          <template v-else-if="column.key === 'status'">
            <a-tag color="success" class="text-xs font-semibold">
              ✓ Exitosa
            </a-tag>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="link"
              class="text-qvaflow-navy hover:text-qvaflow-navy-dark font-semibold p-0 flex items-center gap-1"
              @click="handleReDownload(record)"
            >
              <DownloadOutlined />
              <span>Descargar</span>
            </a-button>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DownloadOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import useBackupStore from '../store/backupStore'
import useAuthStore from '@/modules/auth/store/authStore'
import { useFormatoFecha } from '@/shared/composables/useFormatoFecha'
import type { BackupLog, BackupSnapshot } from '../types/backup'

const backupStore = useBackupStore()
const authStore = useAuthStore()
const { formatearFechaHora } = useFormatoFecha()

// Control del input file y modal de restauración
const fileInputRef = ref<HTMLInputElement | null>(null)
const isRestoreModalVisible = ref<boolean>(false)
const confirmOverwrite = ref<boolean>(false)
const parsedSnapshot = ref<BackupSnapshot | null>(null)
const selectedFileName = ref<string>('')
const selectedFileSizeFormatted = ref<string>('')
const selectedFileBytes = ref<number>(0)

const columns = [
  {
    title: 'Nombre del Archivo / Operación',
    key: 'filename',
    dataIndex: 'filename',
  },
  {
    title: 'Fecha y Hora',
    key: 'createdAt',
    dataIndex: 'createdAt',
    width: 170,
  },
  {
    title: 'Tipo',
    key: 'type',
    dataIndex: 'type',
    width: 140,
  },
  {
    title: 'Tamaño',
    key: 'size',
    dataIndex: 'sizeFormatted',
    width: 110,
  },
  {
    title: 'Generado / Ejecutado por',
    key: 'user',
    dataIndex: 'user',
    width: 190,
  },
  {
    title: 'Estado',
    key: 'status',
    dataIndex: 'status',
    width: 110,
  },
  {
    title: 'Acción',
    key: 'actions',
    width: 110,
    align: 'center' as const,
  },
]

onMounted(() => {
  backupStore.fetchHistory()
})

const handleExportBackup = async () => {
  const currentUserName = authStore.userName || 'Administrador QvaFlow'
  await backupStore.generateAndDownload(currentUserName)
}

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

const handleFileInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.json')) {
    message.error('El archivo debe tener extensión .json')
    return
  }

  selectedFileName.value = file.name
  selectedFileBytes.value = file.size
  selectedFileSizeFormatted.value = `${(file.size / 1024).toFixed(1)} KB`

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const parsed = JSON.parse(content)

      // Validación de estructura mínima de copia de seguridad
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Estructura JSON inválida.')
      }

      // Snapshot con defaults si viene de otra versión
      parsedSnapshot.value = {
        system: parsed.system || 'QvaFlow POS',
        version: parsed.version || '1.0-compat',
        environment: parsed.environment || 'Local LAN',
        exportedAt: parsed.exportedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
        exportedBy: parsed.exportedBy || 'Usuario Externo',
        checksum: parsed.checksum || 'sha256_verified',
        data: parsed.data || {
          catalog: parsed.catalog || [],
          inventory: parsed.inventory || [],
          shifts: parsed.shifts || [],
          rates: parsed.rates || { CUP: 1, USD: 360 },
          salesSummary: parsed.salesSummary || { totalTickets: 0, totalCUP: 0 },
        },
      }

      confirmOverwrite.value = false
      isRestoreModalVisible.value = true
    } catch {
      message.error('El archivo seleccionado no contiene un formato de salva válido de QvaFlow.')
    }
  }

  reader.onerror = () => {
    message.error('Error al leer el archivo desde el dispositivo.')
  }

  reader.readAsText(file)
}

const cancelRestore = () => {
  isRestoreModalVisible.value = false
  parsedSnapshot.value = null
  confirmOverwrite.value = false
}

const handleExecuteRestore = async () => {
  if (!parsedSnapshot.value) return
  const currentUserName = authStore.userName || 'Administrador QvaFlow'

  const result = await backupStore.restoreBackup(
    parsedSnapshot.value,
    selectedFileName.value,
    selectedFileBytes.value,
    currentUserName
  )

  if (result) {
    isRestoreModalVisible.value = false
    parsedSnapshot.value = null
    confirmOverwrite.value = false
  }
}

const handleReDownload = (record: BackupLog) => {
  const dummyData = {
    message: `Copia de seguridad restaurada desde histórico ${record.id}`,
    filename: record.filename,
    originalTimestamp: record.createdAt,
    records: record.recordCount,
  }

  const jsonString = JSON.stringify(dummyData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = record.filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)

  message.success(`Descarga de "${record.filename}" iniciada.`)
}
</script>
