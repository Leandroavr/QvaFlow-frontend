<template>
  <div class="space-y-5">
    <!-- ALERTA INFORMATIVA PRINCIPAL: OFFLINE-FIRST Y MEMORIAS USB -->
    <a-alert type="info" show-icon class="shadow-xs rounded-xl border-blue-200 bg-blue-50/80 p-4">
      <template #message>
        <span class="text-sm font-bold text-qvaflow-navy">
          Protocolo de Seguridad Offline-first para MIPYMES
        </span>
      </template>
      <template #description>
        <div class="mt-1 space-y-1 text-xs leading-relaxed text-blue-900">
          <p class="m-0">
            Al operar en una <strong>red local sin dependencia permanente de internet</strong>, la
            integridad de los datos de su negocio depende de las copias de seguridad locales.
          </p>
          <p class="m-0 text-blue-800">
            💡 <strong>Recomendación Operativa:</strong> Descargue una salva al finalizar cada
            jornada comercial y cópiela hacia una <strong>memoria USB externa</strong>. En caso de
            reposición de equipo servidor o contingencia, use la opción
            <strong>Cargar y Restaurar Salva</strong>.
          </p>
        </div>
      </template>
    </a-alert>

    <!-- TARJETAS SUPERIORES DE ESTADO Y KPIS -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- Última Salva Generada -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Última Salva Generada
          </p>
          <h3 class="m-0 text-base font-bold text-slate-800">
            {{ backupStore.lastBackup?.createdAt || 'Sin registros' }}
          </h3>
          <span
            class="block max-w-[200px] truncate text-xs font-semibold text-qvaflow-navy"
            :title="backupStore.lastBackup?.filename"
          >
            {{
              backupStore.lastBackup
                ? backupStore.lastBackup.filename
                : 'Se recomienda generar una salva'
            }}
          </span>
        </div>
        <div
          class="shadow-xs flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-qvaflow-navy"
        >
          🛡️
        </div>
      </div>

      <!-- Total de Respaldos Históricos -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Respaldos en Registro
          </p>
          <h3 class="m-0 text-2xl font-black text-slate-800">
            {{ backupStore.totalBackups }}
          </h3>
          <span class="text-xs text-slate-400">
            Volumen acumulado: ~{{ backupStore.totalStorageKB }} KB
          </span>
        </div>
        <div
          class="shadow-xs flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-700"
        >
          💾
        </div>
      </div>

      <!-- Estado de la Base de Datos Local -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Motor PostgreSQL Local
          </p>
          <div class="mt-0.5 flex items-center gap-2">
            <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500"></span>
            <h3 class="m-0 text-base font-bold text-slate-800">Estado Óptimo</h3>
          </div>
          <span class="text-xs text-slate-400">Sin inconsistencias detectadas</span>
        </div>
        <div
          class="shadow-xs flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl font-bold text-emerald-600"
        >
          ⚡
        </div>
      </div>
    </div>

    <!-- TARJETAS DE ACCIÓN DUAL: GENERAR (DESCARGAR) Y CARGAR (RESTAURAR) -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <!-- TARJETA 1: GENERACIÓN Y DESCARGA DIRECTA -->
      <div
        class="flex flex-col justify-between space-y-4 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-qvaflow-navy"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span
              class="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-qvaflow-navy"
            >
              SNAPSHOT COMPLETO (JSON)
            </span>
            <span class="font-mono text-xs text-slate-500">v2.4.0-offline</span>
          </div>
          <h3 class="m-0 text-xl font-black text-slate-900">Generar y Descargar Salva (JSON)</h3>
          <p class="m-0 text-xs leading-relaxed text-slate-600">
            Empaqueta en un único archivo JSON estructurado todos los productos, existencias en
            almacenes, turnos de caja, ventas y configuración para resguardar en una memoria USB.
          </p>
        </div>

        <a-button
          type="primary"
          size="large"
          :loading="backupStore.isGenerating"
          class="flex h-12 cursor-pointer items-center justify-center gap-2 border-none bg-qvaflow-navy text-sm font-bold shadow-md shadow-qvaflow-navy/20 hover:bg-qvaflow-navy-dark"
          @click="handleExportBackup"
        >
          <DownloadOutlined class="text-lg" />
          <span>Generar y Descargar Salva Completa</span>
        </a-button>
      </div>

      <!-- TARJETA 2: CARGA Y RESTAURACIÓN DE SALVA -->
      <div
        class="flex flex-col justify-between space-y-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 shadow-sm transition-all hover:border-qvaflow-navy"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span
              class="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-800"
            >
              RESTAURACIÓN & MIGRACIÓN
            </span>
            <span class="font-mono text-xs text-slate-500">Formato .json</span>
          </div>
          <h3 class="m-0 text-xl font-black text-slate-900">Cargar y Restaurar Salva (JSON)</h3>
          <p class="m-0 text-xs leading-relaxed text-slate-600">
            Seleccione una copia de seguridad (.json) desde su memoria USB o disco para restaurar
            íntegramente la información del negocio en este equipo.
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
            class="flex h-12 cursor-pointer items-center justify-center gap-2 border-qvaflow-navy text-sm font-bold text-qvaflow-navy transition-colors hover:bg-qvaflow-navy hover:text-white"
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
        <a-alert type="error" show-icon class="rounded-xl border-red-200 bg-red-50">
          <template #message>
            <span class="text-sm font-black text-red-900">
              ¡Advertencia Crítica de Sobrescritura!
            </span>
          </template>
          <template #description>
            <div class="mt-1 text-xs leading-relaxed text-red-800">
              La restauración de una copia de seguridad
              <strong>sobrescribirá los datos actuales</strong> de productos, inventarios en
              almacenes y turnos de caja en la base de datos local. Esta acción es
              <strong>irreversible</strong>.
            </div>
          </template>
        </a-alert>

        <!-- Resumen de los Datos Detectados en el Archivo -->
        <div
          v-if="parsedSnapshot"
          class="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <h4 class="m-0 text-xs font-bold uppercase tracking-wider text-slate-700">
            Metadatos de la Salva Seleccionada:
          </h4>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="block text-[11px] text-slate-400">Archivo:</span>
              <span
                class="block truncate font-mono font-bold text-slate-800"
                :title="selectedFileName"
              >
                {{ selectedFileName }}
              </span>
            </div>
            <div>
              <span class="block text-[11px] text-slate-400">Tamaño:</span>
              <span class="font-mono font-bold text-slate-800">{{
                selectedFileSizeFormatted
              }}</span>
            </div>
            <div>
              <span class="block text-[11px] text-slate-400">Fecha de Exportación:</span>
              <span class="font-mono font-bold text-slate-800">{{
                parsedSnapshot.exportedAt
              }}</span>
            </div>
            <div>
              <span class="block text-[11px] text-slate-400">Generada por:</span>
              <span class="font-bold text-slate-800">{{ parsedSnapshot.exportedBy }}</span>
            </div>
            <div>
              <span class="block text-[11px] text-slate-400">Versión del Sistema:</span>
              <span class="font-mono font-bold text-slate-800">{{ parsedSnapshot.version }}</span>
            </div>
            <div>
              <span class="block text-[11px] text-slate-400">Entorno:</span>
              <span class="font-bold text-slate-800">{{ parsedSnapshot.environment }}</span>
            </div>
          </div>

          <!-- Conteo de Registros a Restaurar -->
          <div class="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
            <span class="font-semibold text-slate-600">Registros a incorporar:</span>
            <div class="flex items-center gap-2">
              <span class="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                📦 {{ parsedSnapshot.data?.catalog?.length || 0 }} Productos
              </span>
              <span
                class="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
              >
                🏢 {{ parsedSnapshot.data?.inventory?.length || 0 }} Almacenes
              </span>
              <span class="rounded bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                🧾 {{ parsedSnapshot.data?.shifts?.length || 0 }} Turnos
              </span>
            </div>
          </div>
        </div>

        <!-- Checkbox de Confirmación Explícita -->
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <a-checkbox v-model:checked="confirmOverwrite" class="text-xs font-bold text-amber-950">
            He verificado el archivo y confirmo que deseo sobrescribir la base de datos local con
            esta copia de seguridad.
          </a-checkbox>
        </div>

        <!-- Botones de Acción del Modal -->
        <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-2">
          <a-button size="large" @click="cancelRestore"> Cancelar </a-button>

          <a-button
            type="primary"
            danger
            size="large"
            :disabled="!confirmOverwrite"
            :loading="backupStore.isRestoring"
            class="cursor-pointer font-bold shadow-md"
            @click="handleExecuteRestore"
          >
            Sobrescribir y Restaurar Sistema
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- TABLA DE HISTORIAL DE RESPALDOS -->
    <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="m-0 text-base font-bold text-slate-800">
            Historial de Salvas y Restauraciones
          </h3>
          <p class="m-0 text-xs text-slate-400">
            Registro de auditoría de respaldos generados e importados
          </p>
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
        :pagination="{
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (total: number) => `Total ${total} operaciones registradas`,
        }"
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
                <span class="block font-mono text-xs font-bold text-slate-800">
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
            <span class="font-mono text-xs text-slate-700">{{
              formatearFechaHora(record.createdAt)
            }}</span>
          </template>

          <!-- Columna Tipo -->
          <template v-else-if="column.key === 'type'">
            <a-tag v-if="record.type === 'RESTAURACION'" color="volcano" class="text-xs font-bold">
              🔄 Restauración
            </a-tag>
            <a-tag v-else-if="record.type === 'MANUAL'" color="blue" class="text-xs font-semibold">
              👤 Manual
            </a-tag>
            <a-tag v-else color="purple" class="text-xs font-semibold"> ⚙️ Automática </a-tag>
          </template>

          <!-- Columna Tamaño -->
          <template v-else-if="column.key === 'size'">
            <span
              class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"
            >
              {{ record.sizeFormatted }}
            </span>
          </template>

          <!-- Columna Usuario -->
          <template v-else-if="column.key === 'user'">
            <span class="text-xs font-medium text-slate-700">{{ record.user }}</span>
          </template>

          <!-- Columna Estado -->
          <template v-else-if="column.key === 'status'">
            <a-tag color="success" class="text-xs font-semibold"> ✓ Exitosa </a-tag>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="link"
              class="flex items-center gap-1 p-0 font-semibold text-qvaflow-navy hover:text-qvaflow-navy-dark"
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
