<template>
  <div v-if="!can('inventory.adjust')" class="py-12 text-center">
    <div
      class="bg-state-error-subtle mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-state-error"
    >
      <AlertCircle class="h-6 w-6" aria-hidden="true" />
    </div>
    <h2 class="mt-4 text-base font-semibold text-content-primary">Acceso Denegado (403)</h2>
    <p class="mt-1 text-xs text-content-muted">
      No posee los permisos requeridos (inventory.adjust) para registrar ajustes de inventario.
    </p>
    <div class="mt-6">
      <BaseButton variant="secondary" density="compact" :icon="ArrowLeft" @click="goBackToList">
        Volver a ajustes
      </BaseButton>
    </div>
  </div>

  <div v-else class="space-y-6">
    <!-- Encabezado de la página -->
    <PageHeader
      title="Nuevo Ajuste de Inventario"
      description="Registrar el conteo físico y la cuadratura de existencias por arqueo o corrección."
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          density="compact"
          :icon="ArrowLeft"
          @click="handleCancelClick"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          density="compact"
          :icon="Check"
          :loading="isSubmitting"
          :disabled="isSubmitting || lines.length === 0 || !reason.trim()"
          data-test="submit-adjustment-button"
          @click="handleSubmit"
        >
          Registrar ajuste
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Estado de carga esquelético -->
    <div v-if="isLoadingOptions" class="space-y-6">
      <div class="border-border-default rounded-xl border bg-surface-card p-5">
        <BaseSkeleton height="1.5rem" width="12rem" class="mb-4" />
        <BaseSkeleton height="2.5rem" width="100%" />
      </div>
      <div class="border-border-default rounded-xl border bg-surface-card p-5">
        <BaseSkeleton height="1.5rem" width="16rem" class="mb-4" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BaseSkeleton height="2.5rem" />
          <BaseSkeleton height="2.5rem" />
          <BaseSkeleton height="2.5rem" />
        </div>
      </div>
    </div>

    <!-- Error al cargar opciones con reintento -->
    <div
      v-else-if="error && !availableStock.length && !locations.length"
      class="bg-state-error-subtle/10 rounded-xl border border-state-error p-5 text-center"
    >
      <AlertCircle class="mx-auto h-8 w-8 text-state-error" aria-hidden="true" />
      <p class="mt-2 text-sm font-medium text-state-error">{{ error }}</p>
      <p class="mt-1 text-xs text-content-muted">
        Ocurrió un error al cargar el catálogo de existencias y almacenes.
      </p>
      <div class="mt-4">
        <BaseButton
          variant="secondary"
          density="compact"
          :icon="RefreshCw"
          @click="fetchAdjustmentOptions"
        >
          Reintentar carga
        </BaseButton>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Error global del servidor si no corresponde a un campo específico -->
      <div
        v-if="error"
        class="border-state-error/40 bg-state-error-subtle/20 flex items-center gap-2 rounded-lg border p-3 text-xs text-state-error"
        role="alert"
      >
        <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{{ error }}</span>
      </div>

      <!-- Cabecera del documento: Motivo -->
      <div class="border-border-default shadow-xs rounded-xl border bg-surface-card p-5">
        <h2 class="text-sm font-semibold text-content-primary">Datos del Documento</h2>
        <p class="mt-0.5 text-xs text-content-muted">
          Indique la justificación del ajuste (ej. 'Conteo físico mensual', 'Rotura de envase').
        </p>

        <div class="mt-4 max-w-2xl">
          <BaseFormField
            id="adjustment-reason"
            label="Motivo del ajuste"
            required
            :error="reasonError || (fieldErrors['reason'] ? fieldErrors['reason'][0] : '')"
            help="Mínimo 3 caracteres obligatorios."
          >
            <BaseInput
              id="adjustment-reason"
              v-model="reason"
              name="reason"
              placeholder="Escriba el motivo del ajuste..."
              data-test="reason-input"
              density="compact"
              @update:model-value="validateReason"
            />
          </BaseFormField>
        </div>
      </div>

      <!-- Editor de Líneas: Fila de captura -->
      <div class="border-border-default shadow-xs rounded-xl border bg-surface-card p-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-content-primary">Líneas de Ajuste</h2>
            <p class="mt-0.5 text-xs text-content-muted">
              Escanee o seleccione el producto, indique la localización e ingrese la cantidad
              contada (0 es válido).
            </p>
          </div>
          <span class="text-xs font-medium text-content-muted" data-test="total-lines">
            Total de líneas:
            <strong class="text-content-primary">{{ lines.length }}</strong>
          </span>
        </div>

        <!-- Fila de captura / Formulario de línea -->
        <div class="bg-surface-sunken/40 mt-4 rounded-lg border border-border-subtle p-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <!-- Producto / Pistola lectora (Componente Compartido) -->
            <div class="sm:col-span-5">
              <DocumentProductSelector
                :model-value="draftProductCode"
                :available-stock="availableStock"
                :error="draftLineError.product"
                @update:model-value="handleProductChange"
                @update:search-input="handleSearchInputChange"
                @exact-match="handleExactProductMatch"
              />
            </div>

            <!-- Localización (muestra almacén y stock del sistema) -->
            <div class="sm:col-span-4">
              <BaseFormField
                id="adjustment-location"
                label="Localización (Almacén - Localización)"
                required
                :error="draftLineError.location"
                :help="
                  draftProductCode
                    ? `Stock actual sistema: ${currentSystemStock}`
                    : 'Seleccione producto primero'
                "
              >
                <BaseSelect
                  id="adjustment-location"
                  v-model="draftLocationCode"
                  :options="locationSelectOptions"
                  placeholder="Seleccione localización..."
                  density="compact"
                  data-test="location-select"
                  @update:model-value="handleLocationChange"
                />
              </BaseFormField>
            </div>

            <!-- Cantidad contada y botón agregar -->
            <div class="flex items-end gap-2 sm:col-span-3">
              <div class="flex-1">
                <BaseFormField
                  id="adjustment-counted"
                  label="Cantidad contada"
                  required
                  :error="draftLineError.counted"
                >
                  <BaseInput
                    id="adjustment-counted"
                    v-model="draftCountedQuantity"
                    type="text"
                    placeholder="0.00"
                    density="compact"
                    data-test="counted-quantity-input"
                    @enter="addLineFromDraft"
                    @keydown.enter.prevent="addLineFromDraft"
                  />
                </BaseFormField>
              </div>

              <div class="pb-1">
                <BaseButton
                  variant="primary"
                  density="compact"
                  :icon="Plus"
                  title="Agregar línea al ajuste"
                  data-test="add-line-button"
                  @click="addLineFromDraft"
                >
                  Agregar
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Cuadro informativo: Sistema, Contado y Diferencia Prevista -->
          <div
            v-if="draftProductCode && draftLocationCode"
            class="border-border-default shadow-2xs mt-3 flex flex-wrap items-center gap-4 rounded-md border bg-surface-card px-3.5 py-2.5 text-xs text-content-primary"
          >
            <div class="flex items-center gap-1.5" data-test="preview-system">
              <span class="text-content-muted">Sistema:</span>
              <strong class="font-mono text-content-primary">{{ currentSystemStock }}</strong>
              <span
                v-if="!hasExistingStockRow"
                class="bg-state-warning-subtle/30 rounded px-1.5 py-0.5 text-[10px] font-medium text-state-warning"
                data-test="no-previous-stock"
              >
                Sin existencias previas
              </span>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="text-content-muted">Contado físico:</span>
              <span class="font-mono font-medium text-content-primary">{{
                draftCountedQuantity || '0.00'
              }}</span>
            </div>

            <div class="flex items-center gap-1.5" data-test="preview-difference">
              <span class="text-content-muted">Diferencia prevista:</span>
              <span
                class="font-mono font-semibold"
                :class="getDifferenceColorClass(previewDifference)"
              >
                {{ previewDifference }}
              </span>
              <span class="text-[10px] text-content-muted">(Informativa)</span>
            </div>
          </div>

          <!-- Error de duplicado en cliente -->
          <div
            v-if="draftLineError.duplicate"
            class="border-state-error/30 bg-state-error-subtle/20 mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-state-error"
            data-test="duplicate-error"
            role="alert"
          >
            <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{{ draftLineError.duplicate }}</span>
          </div>
        </div>

        <!-- Error de items a nivel de formulario del servidor -->
        <p
          v-if="fieldErrors['items']"
          class="mt-3 text-xs text-state-error"
          role="alert"
          data-test="server-items-error"
        >
          {{ fieldErrors['items'][0] }}
        </p>

        <!-- Tabla de líneas agregadas -->
        <div class="border-border-default mt-4 overflow-hidden rounded-lg border">
          <table class="w-full text-left text-xs" data-test="lines-table">
            <thead
              class="border-border-default border-b bg-surface-sunken font-semibold text-content-primary"
            >
              <tr>
                <th class="px-3.5 py-2.5">#</th>
                <th class="px-3.5 py-2.5">Producto</th>
                <th class="px-3.5 py-2.5">Localización</th>
                <th class="px-3.5 py-2.5 text-right">Sistema</th>
                <th class="px-3.5 py-2.5 text-right">Contado</th>
                <th class="px-3.5 py-2.5 text-right">Diferencia prevista</th>
                <th class="px-3.5 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle bg-surface-card">
              <tr v-if="lines.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-content-muted">
                  No hay líneas en el ajuste. Escanee un producto o use el formulario superior para
                  agregarlas.
                </td>
              </tr>
              <tr
                v-for="(line, idx) in lines"
                :key="`${line.productCode}-${line.locationCode}-${idx}`"
                class="hover:bg-surface-sunken/40 transition-colors"
                data-test="line-row"
              >
                <td class="px-3.5 py-2.5 text-content-muted">{{ idx + 1 }}</td>
                <td class="px-3.5 py-2.5">
                  <div class="font-medium text-content-primary">
                    {{ getProductName(line.productCode, availableStock) }}
                  </div>
                  <div class="font-mono text-[11px] text-content-muted">
                    {{ line.productCode }}
                  </div>
                </td>
                <td class="px-3.5 py-2.5">
                  <div class="text-content-primary">
                    {{ getLocationDisplayName(line.locationCode, locations, warehouses) }}
                  </div>
                  <div class="text-[11px] text-content-muted">
                    {{ line.locationCode }}
                  </div>
                </td>
                <td class="px-3.5 py-2.5 text-right font-medium text-content-primary">
                  {{ getLineSystemStock(line) }}
                  <div
                    v-if="isLineWithoutPreviousStock(line)"
                    class="text-[10px] text-state-warning"
                  >
                    Sin existencias previas
                  </div>
                </td>
                <td class="px-3.5 py-2.5 text-right font-semibold text-content-primary">
                  {{ line.countedQuantity }}
                </td>
                <td class="px-3.5 py-2.5 text-right font-mono font-semibold">
                  <span :class="getDifferenceColorClass(getLineDifference(line))">
                    {{ getLineDifference(line) }}
                  </span>
                </td>
                <td class="px-3.5 py-2.5 text-center">
                  <BaseButton
                    variant="ghost"
                    density="compact"
                    :icon="Trash2"
                    aria-label="Quitar línea"
                    title="Quitar línea"
                    data-test="remove-line-button"
                    @click="removeLine(idx)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Barra de acciones inferior -->
      <div class="flex items-center justify-end gap-3 pt-2">
        <BaseButton
          variant="secondary"
          density="compact"
          data-test="cancel-button"
          @click="handleCancelClick"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          density="compact"
          :icon="Check"
          :loading="isSubmitting"
          :disabled="isSubmitting || lines.length === 0 || !reason.trim()"
          data-test="submit-adjustment-button-bottom"
          @click="handleSubmit"
        >
          Registrar ajuste
        </BaseButton>
      </div>
    </div>

    <!-- Diálogo de confirmación para descartar cambios (Componente Compartido) -->
    <DocumentCancelDialog
      :open="showCancelModal"
      @confirm="handleConfirmDiscard"
      @cancel="showCancelModal = false"
      @update:open="showCancelModal = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Check, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import PageHeader from '@/shared/ui/PageHeader.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { SelectOption } from '@/shared/ui/BaseSelect.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseSkeleton from '@/shared/ui/BaseSkeleton.vue'

import DocumentProductSelector from '@/features/inventory/components/DocumentProductSelector.vue'
import DocumentCancelDialog from '@/features/inventory/components/DocumentCancelDialog.vue'
import {
  getLocationDisplayName,
  getProductName,
  getStockAtLocation,
} from '@/features/inventory/components/documentHelpers'

import { useAdjustments } from '@/features/inventory/composables/useAdjustments'
import { usePermissions } from '@/shared/composables/usePermissions'
import { subtractDecimals, compareDecimals, normalizeDecimal } from '@/shared/utils/decimal'
import type { CreateInventoryAdjustmentItemDto, StockItem } from '@/features/inventory/types'

const router = useRouter()
const route = useRoute()
const { can } = usePermissions()

const {
  isSubmitting,
  fieldErrors,
  availableStock,
  locations,
  warehouses,
  isLoadingOptions,
  error,
  fetchAdjustmentOptions,
  createAdjustment,
} = useAdjustments()

// Estado del formulario
const reason = ref('')
const reasonError = ref('')
const lines = ref<CreateInventoryAdjustmentItemDto[]>([])
const showCancelModal = ref(false)

// Estado de la fila de captura borrador
const productSearchInput = ref('')
const draftProductCode = ref('')
const draftLocationCode = ref('')
const draftCountedQuantity = ref('0.00')
const draftLineError = ref<Record<string, string>>({})

// Detección de cambios sin guardar
const isDirty = computed(() => {
  return Boolean(reason.value.trim()) || lines.value.length > 0 || Boolean(draftProductCode.value)
})

// Validación zod de la cabecera
const reasonSchema = z
  .string()
  .trim()
  .min(3, 'El motivo del ajuste debe tener al menos 3 caracteres.')

function validateReason() {
  const result = reasonSchema.safeParse(reason.value)
  if (!result.success) {
    reasonError.value = result.error.issues[0]?.message || 'Motivo inválido'
    return false
  }
  reasonError.value = ''
  return true
}

// Opciones de localización mostrando almacén y stock del sistema
const locationSelectOptions = computed<SelectOption[]>(() => {
  return locations.value.map((loc) => {
    const wh = warehouses.value.find((w) => w.code === loc.warehouseCode)
    const whName = wh ? wh.name : loc.warehouseCode
    const locName = loc.name || loc.code

    if (draftProductCode.value) {
      const match = availableStock.value.find(
        (s) => s.productCode === draftProductCode.value && s.locationCode === loc.code
      )
      const qty = match ? match.quantity : '0.00'
      return {
        value: loc.code,
        label: `${locName} (${whName}) — Sistema: ${qty}`,
      }
    }

    return {
      value: loc.code,
      label: `${locName} (${whName})`,
    }
  })
})

// Stock actual del sistema para el producto y localización elegidos
const currentSystemStock = computed<string>(() => {
  return getStockAtLocation(draftProductCode.value, draftLocationCode.value, availableStock.value)
})

// Indica si el producto tiene registro previo en esa localización
const hasExistingStockRow = computed<boolean>(() => {
  if (!draftProductCode.value || !draftLocationCode.value) return true
  return availableStock.value.some(
    (s) => s.productCode === draftProductCode.value && s.locationCode === draftLocationCode.value
  )
})

// Cálculo de la diferencia prevista con signo explícito (+, -, 0.00 sin signo)
const previewDifference = computed<string>(() => {
  if (!draftProductCode.value || !draftLocationCode.value) return '0.00'
  return calculateDifference(draftCountedQuantity.value, currentSystemStock.value)
})

function calculateDifference(countedStr: string, systemStr: string): string {
  try {
    const c = parseFloat(countedStr)
    const s = parseFloat(systemStr)
    if (isNaN(c) || isNaN(s)) return '0.00'
    const diff = subtractDecimals(normalizeDecimal(countedStr), normalizeDecimal(systemStr))
    const cmp = compareDecimals(diff, '0.00')
    if (cmp > 0) return `+${diff}`
    if (cmp < 0) return diff
    return '0.00'
  } catch {
    return '0.00'
  }
}

function getDifferenceColorClass(diffStr: string): string {
  if (diffStr.startsWith('+')) return 'text-state-success'
  if (diffStr.startsWith('-')) return 'text-state-error'
  return 'text-content-muted'
}

function getLineSystemStock(line: CreateInventoryAdjustmentItemDto): string {
  return getStockAtLocation(line.productCode, line.locationCode, availableStock.value)
}

function isLineWithoutPreviousStock(line: CreateInventoryAdjustmentItemDto): boolean {
  return !availableStock.value.some(
    (s) => s.productCode === line.productCode && s.locationCode === line.locationCode
  )
}

function getLineDifference(line: CreateInventoryAdjustmentItemDto): string {
  const sys = getLineSystemStock(line)
  return calculateDifference(line.countedQuantity, sys)
}

function handleSearchInputChange(val: string) {
  productSearchInput.value = val
}

function handleExactProductMatch(item: StockItem) {
  setProduct(item.productCode)
  addLineFromDraft()
}

function handleProductChange(code: string) {
  if (code) {
    setProduct(code)
  } else {
    draftProductCode.value = ''
  }
}

function setProduct(code: string) {
  draftProductCode.value = code
  productSearchInput.value = code
  draftLineError.value.product = ''

  // Autoseleccionar primera localización con stock o primera disponible si no está elegida
  if (!draftLocationCode.value) {
    const stockItemsForProduct = availableStock.value
      .filter((s) => s.productCode === code && compareDecimals(s.quantity, '0.00') > 0)
      .sort((a, b) => compareDecimals(b.quantity, a.quantity))

    if (stockItemsForProduct.length > 0 && stockItemsForProduct[0]) {
      draftLocationCode.value = stockItemsForProduct[0].locationCode
    } else if (locations.value.length > 0 && locations.value[0]) {
      draftLocationCode.value = locations.value[0].code
    }
  }

  // Si hay localización seleccionada, sugerir el stock actual como contado inicial
  if (draftLocationCode.value) {
    const current = getStockAtLocation(code, draftLocationCode.value, availableStock.value)
    draftCountedQuantity.value = current
  }
}

function handleLocationChange(code: string | number | null) {
  draftLocationCode.value = String(code || '')
  draftLineError.value.location = ''
  if (draftProductCode.value && draftLocationCode.value) {
    const current = getStockAtLocation(
      draftProductCode.value,
      draftLocationCode.value,
      availableStock.value
    )
    draftCountedQuantity.value = current
  }
}

// Agregar línea validada
function addLineFromDraft() {
  draftLineError.value = {}

  if (!draftProductCode.value && productSearchInput.value.trim()) {
    const query = productSearchInput.value.trim()
    const match = availableStock.value.find(
      (s) =>
        s.productCode.toLowerCase() === query.toLowerCase() ||
        s.productName.toLowerCase() === query.toLowerCase()
    )
    if (match) {
      setProduct(match.productCode)
    }
  }

  let hasError = false

  if (!draftProductCode.value) {
    draftLineError.value.product = 'Debe seleccionar un producto.'
    hasError = true
  }

  if (!draftLocationCode.value) {
    draftLineError.value.location = 'Debe indicar la localización.'
    hasError = true
  }

  const countedNum = parseFloat(draftCountedQuantity.value)
  if (isNaN(countedNum) || countedNum < 0) {
    draftLineError.value.counted = 'La cantidad contada no puede ser negativa (0 es válido).'
    hasError = true
  }

  // Validar duplicado producto + localización en el documento
  const isDuplicate = lines.value.some(
    (l) => l.productCode === draftProductCode.value && l.locationCode === draftLocationCode.value
  )
  if (isDuplicate) {
    draftLineError.value.duplicate =
      'No se puede duplicar la combinación de producto y localización en el ajuste.'
    hasError = true
  }

  if (hasError) return

  lines.value.push({
    productCode: draftProductCode.value,
    locationCode: draftLocationCode.value,
    countedQuantity: normalizeDecimal(draftCountedQuantity.value),
  })

  // Reset del borrador
  draftProductCode.value = ''
  productSearchInput.value = ''
  draftCountedQuantity.value = '0.00'
  draftLineError.value = {}
}

function removeLine(index: number) {
  lines.value.splice(index, 1)
}

// Envío del formulario
async function handleSubmit() {
  if (isSubmitting.value) return

  if (!validateReason()) {
    toast.error('Por favor revise el motivo del ajuste.')
    return
  }

  if (lines.value.length === 0) {
    toast.error('Debe agregar al menos una línea de mercancía al ajuste.')
    return
  }

  try {
    const created = await createAdjustment({
      reason: reason.value.trim(),
      items: lines.value,
    })

    toast.success(`Ajuste ${created.noDocument} registrado exitosamente`)
    router.push('/inventory/adjustments')
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 403) {
      toast.error('No posee permisos para registrar ajustes de inventario (403).')
    } else if (status === 404) {
      toast.error('No se encontraron los productos o localizaciones en el catálogo (404).')
    } else if (status === 400) {
      toast.error('Revise los datos del formulario antes de enviar.')
    }
  }
}

// Cancelación y navegación
function handleCancelClick() {
  if (isDirty.value) {
    showCancelModal.value = true
  } else {
    goBackToList()
  }
}

function handleConfirmDiscard() {
  showCancelModal.value = false
  goBackToList()
}

function goBackToList() {
  router.push('/inventory/adjustments')
}

// Inicialización y precarga desde query params (Bloque 3)
onMounted(async () => {
  if (!can('inventory.adjust')) {
    toast.error('No posee permisos para registrar ajustes (403).')
    return
  }
  await fetchAdjustmentOptions()

  // Precargar si vienen por query params válidos
  const qProduct = route.query.productCode ? String(route.query.productCode).trim() : ''
  const qLocation = route.query.locationCode ? String(route.query.locationCode).trim() : ''

  if (qProduct && availableStock.value.some((s) => s.productCode === qProduct)) {
    setProduct(qProduct)
    if (qLocation && locations.value.some((l) => l.code === qLocation)) {
      draftLocationCode.value = qLocation
      const current = getStockAtLocation(qProduct, qLocation, availableStock.value)
      draftCountedQuantity.value = current
    }
  }
})

defineExpose({
  draftProductCode,
  draftLocationCode,
  draftCountedQuantity,
  lines,
  addLineFromDraft,
  handleConfirmDiscard,
})
</script>
