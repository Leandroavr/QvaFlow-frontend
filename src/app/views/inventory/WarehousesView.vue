<template>
  <div class="space-y-6">
    <!-- Encabezado de la página -->
    <PageHeader
      title="Almacenes y Localizaciones"
      description="Configuración de espacios físicos de almacenamiento, pasillos y estanterías."
    />

    <!-- Layout a Dos Paneles (Desktop: ~40% / ~60%) -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- PANEL IZQUIERDO: Almacenes (5 cols en lg) -->
      <div class="flex flex-col gap-3 lg:col-span-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-content-primary">Almacenes</h2>
            <BaseBadge variant="neutral" size="sm">
              {{ warehouses.length }}
            </BaseBadge>
          </div>

          <BaseButton
            v-if="can('warehouses.manage')"
            variant="primary"
            density="compact"
            :icon="Plus"
            @click="openCreateWarehouse"
          >
            Nuevo almacén
          </BaseButton>
        </div>

        <!-- Tabla de Almacenes -->
        <DataTable
          mode="client"
          :data="warehouses"
          :columns="warehouseColumns"
          :loading="isLoadingWarehouses"
          :error="error"
          row-key="code"
          :actions="can('warehouses.manage') ? getWarehouseRowActions : undefined"
          empty-title="No hay almacenes configurados"
          empty-description="Añada el primer almacén para organizar el inventario."
          scroll-height="calc(100vh - 340px)"
          :show-pagination="false"
          @row-click="handleWarehouseRowClick"
          @row-action="handleWarehouseRowAction"
          @retry="fetchWarehouses"
        >
          <!-- Celda de Código -->
          <template #cell-code="{ value, row }">
            <div class="flex items-center gap-1.5">
              <span
                v-if="selectedWarehouseCode === row.code"
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span class="font-mono text-[11px] font-semibold text-content-primary">
                {{ value }}
              </span>
            </div>
          </template>

          <!-- Celda de Nombre -->
          <template #cell-name="{ value }">
            <span class="font-medium text-content-primary">{{ value }}</span>
          </template>

          <!-- Celda de Zonas -->
          <template #cell-locationsCount="{ value }">
            <span class="tabular-nums text-content-secondary">{{ value ?? 0 }}</span>
          </template>

          <!-- Celda de Stock -->
          <template #cell-stockUnits="{ value }">
            <span class="font-semibold tabular-nums text-content-primary">{{ value ?? 0 }}</span>
          </template>
        </DataTable>
      </div>

      <!-- PANEL DERECHO: Localizaciones del almacén seleccionado (7 cols en lg) -->
      <div class="flex flex-col gap-3 lg:col-span-7">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-bold text-content-primary">
              Localizaciones
              <span v-if="selectedWarehouse" class="font-normal text-content-muted">
                en {{ selectedWarehouse.name }}
              </span>
            </h2>
            <BaseBadge v-if="selectedWarehouse" variant="neutral" size="sm">
              {{ locations.length }}
            </BaseBadge>
          </div>

          <BaseButton
            v-if="can('warehouses.manage')"
            variant="primary"
            density="compact"
            :icon="Plus"
            :disabled="!selectedWarehouseCode"
            @click="openCreateLocation"
          >
            Nueva localización
          </BaseButton>
        </div>

        <!-- Estado si no hay almacén seleccionado -->
        <div
          v-if="!selectedWarehouseCode && !isLoadingWarehouses"
          class="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border-subtle bg-surface-card p-8 text-center"
        >
          <Building2 class="mb-3 h-10 w-10 text-content-muted" aria-hidden="true" />
          <h3 class="text-sm font-semibold text-content-primary">Ningún almacén seleccionado</h3>
          <p class="mt-1 text-xs text-content-muted">
            Haga clic en un almacén de la lista izquierda para gestionar sus zonas y localizaciones.
          </p>
        </div>

        <!-- Tabla de Localizaciones -->
        <DataTable
          v-else
          mode="client"
          :data="locations"
          :columns="locationColumns"
          :loading="isLoadingLocations"
          row-key="code"
          :actions="can('warehouses.manage') ? getLocationRowActions : undefined"
          empty-title="No hay localizaciones configuradas"
          empty-description="Este almacén aún no tiene pasillos o estantes asignados."
          scroll-height="calc(100vh - 340px)"
          :show-pagination="false"
          @row-action="handleLocationRowAction"
          @retry="handleRetryLocations"
        >
          <!-- Celda de Código -->
          <template #cell-code="{ value }">
            <span class="font-mono text-[11px] font-semibold text-content-primary">
              {{ value }}
            </span>
          </template>

          <!-- Celda de Nombre -->
          <template #cell-name="{ value }">
            <span class="font-medium text-content-primary">{{ value || '—' }}</span>
          </template>

          <!-- Celda de Stock -->
          <template #cell-stockUnits="{ value }">
            <span class="font-semibold tabular-nums text-content-primary">{{ value ?? 0 }}</span>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- MODAL / DRAWER: Nuevo / Editar Almacén -->
    <BaseModal
      :open="isWarehouseModalOpen"
      :title="isEditingWarehouse ? 'Editar Almacén' : 'Nuevo Almacén'"
      :description="
        isEditingWarehouse
          ? 'Modifique el nombre descriptivo del almacén físico.'
          : 'Registre un nuevo espacio o almacén físico de mercancía.'
      "
      size="md"
      @update:open="isWarehouseModalOpen = $event"
    >
      <form id="warehouse-form" class="space-y-4" @submit.prevent="submitWarehouseForm">
        <!-- Código (solo lectura en edición) -->
        <BaseFormField
          label="Código del almacén"
          :required="!isEditingWarehouse"
          :error="warehouseErrors.code"
          help="Identificador alfanumérico en mayúsculas (ej: ALM-CENTRAL)"
        >
          <template #default="{ id }">
            <BaseInput
              :id="id"
              v-model="warehouseForm.code"
              density="compact"
              placeholder="ALM-CENTRAL"
              :disabled="isEditingWarehouse"
              :error="warehouseErrors.code"
              @update:model-value="handleWarehouseCodeInput"
            />
          </template>
        </BaseFormField>

        <!-- Nombre -->
        <BaseFormField
          label="Nombre del almacén"
          required
          :error="warehouseErrors.name"
          help="Nombre descriptivo reconocible (ej: Almacén Central)"
        >
          <template #default="{ id }">
            <BaseInput
              :id="id"
              v-model="warehouseForm.name"
              density="compact"
              placeholder="Nombre del almacén"
              :error="warehouseErrors.name"
            />
          </template>
        </BaseFormField>
      </form>

      <template #actions>
        <BaseButton
          variant="secondary"
          density="compact"
          :disabled="isSubmittingWarehouse"
          @click="isWarehouseModalOpen = false"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          density="compact"
          :loading="isSubmittingWarehouse"
          type="submit"
          form="warehouse-form"
        >
          {{ isEditingWarehouse ? 'Guardar cambios' : 'Crear almacén' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- MODAL: Nueva / Editar Localización -->
    <BaseModal
      :open="isLocationModalOpen"
      :title="isEditingLocation ? 'Editar Localización' : 'Nueva Localización'"
      :description="
        isEditingLocation
          ? 'Modifique el nombre o descripción del estante o pasillo.'
          : `Añada una zona o estantería dentro de ${selectedWarehouse?.name || ''}.`
      "
      size="md"
      @update:open="isLocationModalOpen = $event"
    >
      <form id="location-form" class="space-y-4" @submit.prevent="submitLocationForm">
        <!-- Almacén Padre (Solo lectura) -->
        <BaseFormField label="Almacén contenedor">
          <template #default="{ id }">
            <BaseInput
              :id="id"
              :model-value="`${selectedWarehouse?.name} (${selectedWarehouseCode})`"
              density="compact"
              disabled
            />
          </template>
        </BaseFormField>

        <!-- Código de Localización -->
        <BaseFormField
          label="Código de la localización"
          :required="!isEditingLocation"
          :error="locationErrors.code"
          help="Identificador alfanumérico en mayúsculas (ej: LOC-PASILLO-1)"
        >
          <template #default="{ id }">
            <BaseInput
              :id="id"
              v-model="locationForm.code"
              density="compact"
              placeholder="LOC-CEN-P1"
              :disabled="isEditingLocation"
              :error="locationErrors.code"
              @update:model-value="handleLocationCodeInput"
            />
          </template>
        </BaseFormField>

        <!-- Nombre de Localización -->
        <BaseFormField
          label="Nombre o descripción de la zona"
          required
          :error="locationErrors.name"
          help="Ubicación física clara (ej: Pasillo 1 - Secos)"
        >
          <template #default="{ id }">
            <BaseInput
              :id="id"
              v-model="locationForm.name"
              density="compact"
              placeholder="Pasillo 1 - Secos"
              :error="locationErrors.name"
            />
          </template>
        </BaseFormField>
      </form>

      <template #actions>
        <BaseButton
          variant="secondary"
          density="compact"
          :disabled="isSubmittingLocation"
          @click="isLocationModalOpen = false"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          density="compact"
          :loading="isSubmittingLocation"
          type="submit"
          form="location-form"
        >
          {{ isEditingLocation ? 'Guardar cambios' : 'Crear localización' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- DIÁLOGO DE CONFIRMACIÓN: Eliminar Almacén -->
    <ConfirmDialog
      :open="isDeleteWarehouseOpen"
      title="¿Eliminar almacén?"
      :message="`¿Está seguro de que desea eliminar el almacén '${warehouseToDelete?.name}'? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar almacén"
      variant="danger"
      :loading="isDeletingWarehouse"
      @update:open="isDeleteWarehouseOpen = $event"
      @confirm="confirmDeleteWarehouse"
      @cancel="isDeleteWarehouseOpen = false"
    />

    <!-- DIÁLOGO DE CONFIRMACIÓN: Eliminar Localización -->
    <ConfirmDialog
      :open="isDeleteLocationOpen"
      title="¿Eliminar localización?"
      :message="`¿Está seguro de que desea eliminar la localización '${locationToDelete?.name || locationToDelete?.code}'?`"
      confirm-text="Eliminar localización"
      variant="danger"
      :loading="isDeletingLocation"
      @update:open="isDeleteLocationOpen = $event"
      @confirm="confirmDeleteLocation"
      @cancel="isDeleteLocationOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-vue-next'
import { z } from 'zod'

import PageHeader from '@/shared/ui/PageHeader.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import { DataTable } from '@/shared/ui/DataTable'
import type { DataTableColumn } from '@/shared/ui/DataTable'
import type { DropdownMenuItemConfig } from '@/shared/ui/BaseDropdownMenu.vue'

import { useWarehouses } from '@/features/inventory/composables/useWarehouses'
import { usePermissions } from '@/shared/composables/usePermissions'
import { ApiError } from '@/shared/types/api'
import type { Warehouse, Location } from '@/features/inventory/types'

const { can } = usePermissions()

const {
  warehouses,
  selectedWarehouseCode,
  selectedWarehouse,
  locations,
  isLoadingWarehouses,
  isLoadingLocations,
  error,
  fetchWarehouses,
  fetchLocations,
  selectWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createLocation,
  updateLocation,
  deleteLocation,
} = useWarehouses()

// Columnas de la tabla de almacenes
const warehouseColumns: DataTableColumn<Warehouse>[] = [
  {
    key: 'code',
    title: 'Código',
    width: '120px',
  },
  {
    key: 'name',
    title: 'Nombre',
  },
  {
    key: 'locationsCount',
    title: 'Zonas',
    align: 'right',
    width: '80px',
  },
  {
    key: 'stockUnits',
    title: 'Stock',
    align: 'right',
    width: '80px',
  },
]

// Columnas de la tabla de localizaciones
const locationColumns: DataTableColumn<Location>[] = [
  {
    key: 'code',
    title: 'Código',
    width: '140px',
  },
  {
    key: 'name',
    title: 'Nombre de Zona / Estante',
  },
  {
    key: 'stockUnits',
    title: 'Stock',
    align: 'right',
    width: '90px',
  },
]

// ==========================================
// FORMULARIO DE ALMACÉN (Zod + Validación)
// ==========================================
const warehouseSchema = z.object({
  code: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(32, 'Máximo 32 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números y guiones sin espacios'),
  name: z.string().min(1, 'El nombre es obligatorio').max(60, 'Máximo 60 caracteres'),
})

const isWarehouseModalOpen = ref(false)
const isEditingWarehouse = ref(false)
const isSubmittingWarehouse = ref(false)
const warehouseForm = reactive({
  code: '',
  name: '',
})
const warehouseErrors = reactive({
  code: '',
  name: '',
})

function handleWarehouseCodeInput(val: string | number) {
  // Forzar mayúsculas y eliminar espacios
  warehouseForm.code = String(val).toUpperCase().replace(/\s+/g, '')
  warehouseErrors.code = ''
}

function openCreateWarehouse() {
  isEditingWarehouse.value = false
  warehouseForm.code = ''
  warehouseForm.name = ''
  warehouseErrors.code = ''
  warehouseErrors.name = ''
  isWarehouseModalOpen.value = true
}

function openEditWarehouse(w: Warehouse) {
  isEditingWarehouse.value = true
  warehouseForm.code = w.code
  warehouseForm.name = w.name
  warehouseErrors.code = ''
  warehouseErrors.name = ''
  isWarehouseModalOpen.value = true
}

async function submitWarehouseForm() {
  warehouseErrors.code = ''
  warehouseErrors.name = ''

  const result = warehouseSchema.safeParse(warehouseForm)
  if (!result.success) {
    for (const issue of result.error.issues) {
      if (issue.path[0] === 'code') warehouseErrors.code = issue.message
      if (issue.path[0] === 'name') warehouseErrors.name = issue.message
    }
    return
  }

  isSubmittingWarehouse.value = true
  try {
    if (isEditingWarehouse.value) {
      await updateWarehouse(warehouseForm.code, { name: warehouseForm.name })
      toast.success('Almacén actualizado correctamente.')
    } else {
      await createWarehouse({ code: warehouseForm.code, name: warehouseForm.name })
      toast.success('Almacén creado exitosamente.')
    }
    isWarehouseModalOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      if (err.code === 'CODE_ALREADY_EXISTS') {
        warehouseErrors.code = err.message
      } else if (err.statusCode === 422 && err.details) {
        if (err.details.code)
          warehouseErrors.code = Array.isArray(err.details.code)
            ? err.details.code[0]
            : String(err.details.code)
        if (err.details.name)
          warehouseErrors.name = Array.isArray(err.details.name)
            ? err.details.name[0]
            : String(err.details.name)
      } else {
        toast.error(err.message)
      }
    } else {
      toast.error('Ocurrió un error inesperado al procesar el almacén.')
    }
  } finally {
    isSubmittingWarehouse.value = false
  }
}

// ==========================================
// FORMULARIO DE LOCALIZACIÓN (Zod + Validación)
// ==========================================
const locationSchema = z.object({
  code: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(32, 'Máximo 32 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números y guiones sin espacios'),
  name: z.string().min(1, 'El nombre es obligatorio').max(60, 'Máximo 60 caracteres'),
})

const isLocationModalOpen = ref(false)
const isEditingLocation = ref(false)
const isSubmittingLocation = ref(false)
const locationForm = reactive({
  code: '',
  name: '',
})
const locationErrors = reactive({
  code: '',
  name: '',
})

function handleLocationCodeInput(val: string | number) {
  locationForm.code = String(val).toUpperCase().replace(/\s+/g, '')
  locationErrors.code = ''
}

function openCreateLocation() {
  if (!selectedWarehouseCode.value) {
    toast.error('Debe seleccionar un almacén antes de crear una localización.')
    return
  }
  isEditingLocation.value = false
  locationForm.code = ''
  locationForm.name = ''
  locationErrors.code = ''
  locationErrors.name = ''
  isLocationModalOpen.value = true
}

function openEditLocation(loc: Location) {
  isEditingLocation.value = true
  locationForm.code = loc.code
  locationForm.name = loc.name || ''
  locationErrors.code = ''
  locationErrors.name = ''
  isLocationModalOpen.value = true
}

async function submitLocationForm() {
  locationErrors.code = ''
  locationErrors.name = ''

  const result = locationSchema.safeParse(locationForm)
  if (!result.success) {
    for (const issue of result.error.issues) {
      if (issue.path[0] === 'code') locationErrors.code = issue.message
      if (issue.path[0] === 'name') locationErrors.name = issue.message
    }
    return
  }

  if (!selectedWarehouseCode.value) return

  isSubmittingLocation.value = true
  try {
    if (isEditingLocation.value) {
      await updateLocation(locationForm.code, { name: locationForm.name })
      toast.success('Localización actualizada correctamente.')
    } else {
      await createLocation({
        code: locationForm.code,
        warehouseCode: selectedWarehouseCode.value,
        name: locationForm.name,
      })
      toast.success('Localización creada exitosamente.')
    }
    isLocationModalOpen.value = false
  } catch (err: any) {
    if (err instanceof ApiError) {
      if (err.code === 'CODE_ALREADY_EXISTS') {
        locationErrors.code = err.message
      } else if (err.statusCode === 422 && err.details) {
        if (err.details.code)
          locationErrors.code = Array.isArray(err.details.code)
            ? err.details.code[0]
            : String(err.details.code)
        if (err.details.name)
          locationErrors.name = Array.isArray(err.details.name)
            ? err.details.name[0]
            : String(err.details.name)
      } else {
        toast.error(err.message)
      }
    } else {
      toast.error('Ocurrió un error inesperado al procesar la localización.')
    }
  } finally {
    isSubmittingLocation.value = false
  }
}

// ==========================================
// ELIMINACIÓN Y CONFIRMACIÓN
// ==========================================
const isDeleteWarehouseOpen = ref(false)
const warehouseToDelete = ref<Warehouse | null>(null)
const isDeletingWarehouse = ref(false)

const isDeleteLocationOpen = ref(false)
const locationToDelete = ref<Location | null>(null)
const isDeletingLocation = ref(false)

function getWarehouseRowActions(_row: Warehouse): DropdownMenuItemConfig[] {
  return [
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit2,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      danger: true,
      separator: true,
    },
  ]
}

function handleWarehouseRowAction({ actionId, row }: { actionId: string; row: Warehouse }) {
  if (actionId === 'edit') {
    openEditWarehouse(row)
  } else if (actionId === 'delete') {
    warehouseToDelete.value = row
    isDeleteWarehouseOpen.value = true
  }
}

async function confirmDeleteWarehouse() {
  if (!warehouseToDelete.value) return
  isDeletingWarehouse.value = true
  try {
    await deleteWarehouse(warehouseToDelete.value.code)
    toast.success(`Almacén '${warehouseToDelete.value.name}' eliminado correctamente.`)
    isDeleteWarehouseOpen.value = false
    warehouseToDelete.value = null
  } catch (err: any) {
    if (err instanceof ApiError) {
      toast.error(err.message)
    } else {
      toast.error('No se pudo eliminar el almacén.')
    }
  } finally {
    isDeletingWarehouse.value = false
  }
}

function getLocationRowActions(_row: Location): DropdownMenuItemConfig[] {
  return [
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit2,
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: Trash2,
      danger: true,
      separator: true,
    },
  ]
}

function handleLocationRowAction({ actionId, row }: { actionId: string; row: Location }) {
  if (actionId === 'edit') {
    openEditLocation(row)
  } else if (actionId === 'delete') {
    locationToDelete.value = row
    isDeleteLocationOpen.value = true
  }
}

async function confirmDeleteLocation() {
  if (!locationToDelete.value) return
  isDeletingLocation.value = true
  try {
    await deleteLocation(locationToDelete.value.code)
    toast.success(
      `Localización '${locationToDelete.value.name || locationToDelete.value.code}' eliminada.`
    )
    isDeleteLocationOpen.value = false
    locationToDelete.value = null
  } catch (err: any) {
    if (err instanceof ApiError) {
      toast.error(err.message)
    } else {
      toast.error('No se pudo eliminar la localización.')
    }
  } finally {
    isDeletingLocation.value = false
  }
}

// Handlers de selección y clics
function handleWarehouseRowClick(row: Warehouse) {
  selectWarehouse(row.code)
}

function handleRetryLocations() {
  if (selectedWarehouseCode.value) {
    fetchLocations(selectedWarehouseCode.value)
  }
}

onMounted(async () => {
  await fetchWarehouses()
})
</script>
