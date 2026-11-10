<template>
  <div v-if="!can('inventory.transfer')" class="py-12 text-center">
    <div
      class="bg-state-error-subtle mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-state-error"
    >
      <AlertCircle class="h-6 w-6" aria-hidden="true" />
    </div>
    <h2 class="mt-4 text-base font-semibold text-content-primary">Acceso Denegado (403)</h2>
    <p class="mt-1 text-xs text-content-muted">
      No posee los permisos requeridos (inventory.transfer) para registrar traslados de inventario.
    </p>
    <div class="mt-6">
      <BaseButton variant="secondary" density="compact" :icon="ArrowLeft" @click="goBackToList">
        Volver a traslados
      </BaseButton>
    </div>
  </div>

  <div v-else class="space-y-6">
    <!-- Encabezado de la página -->
    <PageHeader
      title="Nuevo Traslado de Inventario"
      description="Registrar el movimiento de mercancía entre almacenes y localizaciones físicas."
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
          data-test="submit-transfer-button"
          @click="handleSubmit"
        >
          Registrar traslado
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Estado de carga esquelético -->
    <div v-if="isLoadingOptions" class="space-y-6">
      <div class="rounded-xl border border-border bg-surface-card p-5">
        <BaseSkeleton height="1.5rem" width="12rem" class="mb-4" />
        <BaseSkeleton height="2.5rem" width="100%" />
      </div>
      <div class="rounded-xl border border-border bg-surface-card p-5">
        <BaseSkeleton height="1.5rem" width="16rem" class="mb-4" />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <BaseSkeleton height="2.5rem" />
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
          @click="fetchTransferOptions"
        >
          Reintentar carga
        </BaseButton>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Error global del servidor si no corresponde a un campo específico -->
      <div
        v-if="error && !stockInsufficientError"
        class="border-state-error/40 bg-state-error-subtle/20 flex items-center gap-2 rounded-lg border p-3 text-xs text-state-error"
        role="alert"
      >
        <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{{ error }}</span>
      </div>

      <!-- Cabecera del documento: Motivo -->
      <div class="rounded-xl border border-border bg-surface-card p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-content-primary">Datos del Documento</h2>
        <p class="mt-0.5 text-xs text-content-muted">
          Indique la justificación u orden operativa de este traslado.
        </p>

        <div class="mt-4 max-w-2xl">
          <BaseFormField
            id="transfer-reason"
            label="Motivo del traslado"
            required
            :error="reasonError || (fieldErrors['reason'] ? fieldErrors['reason'][0] : '')"
            help="Mínimo 3 caracteres (ej. 'Reabastecimiento de mostrador', 'Pedido mayorista')"
          >
            <BaseInput
              id="transfer-reason"
              v-model="reason"
              name="reason"
              placeholder="Escriba el motivo..."
              data-test="reason-input"
              density="compact"
              @update:model-value="validateReason"
            />
          </BaseFormField>
        </div>
      </div>

      <!-- Editor de Líneas: Fila de captura -->
      <div class="rounded-xl border border-border bg-surface-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-content-primary">Líneas de Mercancía</h2>
            <p class="mt-0.5 text-xs text-content-muted">
              Escanee el código de barras o seleccione el producto, origen, destino y cantidad.
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
            <div class="sm:col-span-4">
              <DocumentProductSelector
                :model-value="draftProductCode"
                :available-stock="availableStock"
                :error="draftLineError.product"
                @update:model-value="handleProductChange"
                @update:search-input="handleSearchInputChange"
                @exact-match="handleExactProductMatch"
              />
            </div>

            <!-- Localización de Origen -->
            <div class="sm:col-span-3">
              <BaseFormField
                id="source-location"
                label="Origen (Almacén - Localización)"
                required
                :error="draftLineError.source"
                :help="
                  draftProductCode
                    ? `Stock disp: ${availableStockAtSource}`
                    : 'Seleccione producto primero'
                "
              >
                <BaseSelect
                  id="source-location"
                  v-model="draftSourceLocation"
                  :options="sourceLocationSelectOptions"
                  placeholder="Seleccione origen..."
                  density="compact"
                  data-test="source-location-select"
                  @update:model-value="handleSourceLocationChange"
                />
              </BaseFormField>
            </div>

            <!-- Localización de Destino -->
            <div class="sm:col-span-3">
              <BaseFormField
                id="target-location"
                label="Destino (Almacén - Localización)"
                required
                :error="draftLineError.target"
                help="Excluye el origen seleccionado"
              >
                <BaseSelect
                  id="target-location"
                  v-model="draftTargetLocation"
                  :options="targetLocationSelectOptions"
                  placeholder="Seleccione destino..."
                  density="compact"
                  data-test="target-location-select"
                  @update:model-value="handleTargetLocationChange"
                />
              </BaseFormField>
            </div>

            <!-- Cantidad y Botón de adición -->
            <div class="flex items-end gap-2 sm:col-span-2">
              <div class="flex-1">
                <BaseFormField
                  id="transfer-quantity"
                  label="Cantidad"
                  required
                  :error="draftLineError.quantity"
                >
                  <BaseInput
                    id="transfer-quantity"
                    v-model="draftQuantity"
                    type="text"
                    placeholder="1.00"
                    density="compact"
                    data-test="quantity-input"
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
                  title="Agregar línea al traslado"
                  data-test="add-line-button"
                  @click="addLineFromDraft"
                >
                  Agregar
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Aviso de stock insuficiente en cliente (no bloqueante, informativo) -->
          <div
            v-if="isQuantityHigherThanStock"
            class="border-state-warning/30 bg-state-warning-subtle/20 mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-state-warning"
            data-test="stock-warning"
            role="alert"
          >
            <AlertTriangle class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Aviso: La cantidad a trasladar ({{ draftQuantity }}) supera el stock disponible ({{
                availableStockAtSource
              }}) en la localización de origen. El servidor validará la disponibilidad final.
            </span>
          </div>

          <!-- Error si origen es igual a destino -->
          <div
            v-if="
              draftSourceLocation &&
              draftTargetLocation &&
              draftSourceLocation === draftTargetLocation
            "
            class="border-state-error/30 bg-state-error-subtle/20 mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-state-error"
            data-test="same-location-error"
            role="alert"
          >
            <AlertCircle class="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>La localización de destino no puede ser igual a la de origen.</span>
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
        <div class="mt-4 overflow-hidden rounded-lg border border-border">
          <table class="w-full text-left text-xs" data-test="lines-table">
            <thead
              class="border-b border-border bg-surface-sunken font-semibold text-content-primary"
            >
              <tr>
                <th class="px-3.5 py-2.5">#</th>
                <th class="px-3.5 py-2.5">Producto</th>
                <th class="px-3.5 py-2.5">Origen</th>
                <th class="px-3.5 py-2.5">Destino</th>
                <th class="px-3.5 py-2.5 text-right">Cantidad</th>
                <th class="px-3.5 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle bg-surface-card">
              <tr v-if="lines.length === 0">
                <td colspan="6" class="px-4 py-8 text-center text-content-muted">
                  No hay líneas en el traslado. Escanee un producto o use el formulario superior
                  para agregarlas.
                </td>
              </tr>
              <tr
                v-for="(line, idx) in lines"
                :key="`${line.productCode}-${line.sourceLocationCode}-${idx}`"
                :class="[
                  'transition-colors',
                  isLineInsufficient(line)
                    ? 'bg-state-error-subtle/10 border-l-4 border-l-state-error'
                    : 'hover:bg-surface-sunken/40',
                ]"
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
                    {{ getLocationDisplayName(line.sourceLocationCode, locations, warehouses) }}
                  </div>
                  <div class="text-[11px] text-content-muted">
                    {{ line.sourceLocationCode }}
                  </div>
                </td>
                <td class="px-3.5 py-2.5">
                  <div class="text-content-primary">
                    {{ getLocationDisplayName(line.targetLocationCode, locations, warehouses) }}
                  </div>
                  <div class="text-[11px] text-content-muted">
                    {{ line.targetLocationCode }}
                  </div>
                </td>
                <td class="px-3.5 py-2.5 text-right font-medium text-content-primary">
                  {{ line.quantity }}
                  <div
                    v-if="isLineInsufficient(line)"
                    class="mt-1 flex items-center justify-end gap-1 text-[11px] font-semibold text-state-error"
                    data-test="stock-insufficient-error"
                  >
                    <AlertCircle class="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>
                      Insuficiente (Pedido: {{ stockInsufficientError?.requestedQuantity }}, Disp:
                      {{ stockInsufficientError?.availableQuantity }})
                    </span>
                  </div>
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
          data-test="submit-transfer-button-bottom"
          @click="handleSubmit"
        >
          Registrar traslado
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
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from 'lucide-vue-next'
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

import { useTransfers } from '@/features/inventory/composables/useTransfers'
import { usePermissions } from '@/shared/composables/usePermissions'
import { compareDecimals, normalizeDecimal } from '@/shared/utils/decimal'
import type { CreateStockTransferItemDto, StockItem } from '@/features/inventory/types'

const router = useRouter()
const route = useRoute()
const { can } = usePermissions()

const {
  isSubmitting,
  fieldErrors,
  stockInsufficientError,
  availableStock,
  locations,
  warehouses,
  isLoadingOptions,
  error,
  fetchTransferOptions,
  createTransfer,
} = useTransfers()

// Estado del formulario
const reason = ref('')
const reasonError = ref('')
const lines = ref<CreateStockTransferItemDto[]>([])
const showCancelModal = ref(false)

// Estado de la fila de captura borrador
const productSearchInput = ref('')
const draftProductCode = ref('')
const draftSourceLocation = ref('')
const draftTargetLocation = ref('')
const draftQuantity = ref('1.00')
const draftLineError = ref<Record<string, string>>({})

// Detección de cambios sin guardar
const isDirty = computed(() => {
  return Boolean(reason.value.trim()) || lines.value.length > 0 || Boolean(draftProductCode.value)
})

// Validación zod de la cabecera
const reasonSchema = z
  .string()
  .trim()
  .min(3, 'El motivo del traslado debe tener al menos 3 caracteres.')

function validateReason() {
  const result = reasonSchema.safeParse(reason.value)
  if (!result.success) {
    reasonError.value = result.error.issues[0]?.message || 'Motivo inválido'
    return false
  }
  reasonError.value = ''
  return true
}

// Opciones de localizaciones de origen con formato de stock disponible
const sourceLocationSelectOptions = computed<SelectOption[]>(() => {
  return locations.value.map((loc) => {
    const wh = warehouses.value.find((w) => w.code === loc.warehouseCode)
    const qty = getStockAtLocation(draftProductCode.value, loc.code, availableStock.value)
    const whName = wh ? wh.name : loc.warehouseCode
    const locName = loc.name || loc.code

    return {
      value: loc.code,
      label: draftProductCode.value
        ? `${locName} (${whName}) — Disp: ${qty}`
        : `${locName} (${whName})`,
    }
  })
})

// Opciones de localizaciones de destino (excluyendo el origen seleccionado)
const targetLocationSelectOptions = computed<SelectOption[]>(() => {
  return locations.value
    .filter((loc) => loc.code !== draftSourceLocation.value)
    .map((loc) => {
      const wh = warehouses.value.find((w) => w.code === loc.warehouseCode)
      const whName = wh ? wh.name : loc.warehouseCode
      const locName = loc.name || loc.code
      return {
        value: loc.code,
        label: `${locName} (${whName})`,
      }
    })
})

// Stock disponible en la localización de origen seleccionada para el producto borrador
const availableStockAtSource = computed<string>(() => {
  return getStockAtLocation(draftProductCode.value, draftSourceLocation.value, availableStock.value)
})

// Comprueba si la cantidad ingresada supera el stock disponible en origen (aviso al usuario)
const isQuantityHigherThanStock = computed<boolean>(() => {
  if (!draftProductCode.value || !draftSourceLocation.value) return false
  try {
    const qtyNum = parseFloat(draftQuantity.value)
    if (isNaN(qtyNum) || qtyNum <= 0) return false
    return compareDecimals(normalizeDecimal(draftQuantity.value), availableStockAtSource.value) > 0
  } catch {
    return false
  }
})

// Marca si una línea corresponde al error 409 STOCK_INSUFFICIENT devuelto por el servidor
function isLineInsufficient(line: CreateStockTransferItemDto): boolean {
  if (!stockInsufficientError.value) return false
  return (
    stockInsufficientError.value.productCode === line.productCode &&
    stockInsufficientError.value.sourceLocationCode === line.sourceLocationCode
  )
}

function handleSearchInputChange(val: string) {
  productSearchInput.value = val
}

function handleProductChange(code: string) {
  if (code) {
    setProduct(code)
  } else {
    draftProductCode.value = ''
  }
}

function handleExactProductMatch(item: StockItem) {
  setProduct(item.productCode)
  addLineFromDraft()
}

function setProduct(code: string) {
  draftProductCode.value = code
  productSearchInput.value = code
  draftLineError.value.product = ''

  // Autoseleccionar la localización con mayor stock o primera disponible si no está elegida
  if (!draftSourceLocation.value) {
    const stockItemsForProduct = availableStock.value
      .filter((s) => s.productCode === code && compareDecimals(s.quantity, '0.00') > 0)
      .sort((a, b) => compareDecimals(b.quantity, a.quantity))

    if (stockItemsForProduct.length > 0 && stockItemsForProduct[0]) {
      draftSourceLocation.value = stockItemsForProduct[0].locationCode
    } else if (locations.value.length > 0 && locations.value[0]) {
      draftSourceLocation.value = locations.value[0].code
    }
  }

  // Autoseleccionar destino diferente si no está elegido o si colisiona con el origen
  ensureDifferentTargetLocation()
}

function ensureDifferentTargetLocation() {
  if (!draftTargetLocation.value || draftTargetLocation.value === draftSourceLocation.value) {
    const altLoc = locations.value.find((l) => l.code !== draftSourceLocation.value)
    if (altLoc) {
      draftTargetLocation.value = altLoc.code
    }
  }
}

function handleSourceLocationChange(code: string | number | null) {
  draftSourceLocation.value = String(code || '')
  draftLineError.value.source = ''
  ensureDifferentTargetLocation()
}

function handleTargetLocationChange(code: string | number | null) {
  draftTargetLocation.value = String(code || '')
  draftLineError.value.target = ''
}

// Agregar línea validada a la lista
function addLineFromDraft() {
  draftLineError.value = {}

  // Si draftProductCode está vacío pero el input tiene valor, intentar resolverlo primero
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

  if (!draftSourceLocation.value) {
    draftLineError.value.source = 'Debe indicar la localización de origen.'
    hasError = true
  }

  if (!draftTargetLocation.value) {
    draftLineError.value.target = 'Debe indicar la localización de destino.'
    hasError = true
  } else if (draftSourceLocation.value === draftTargetLocation.value) {
    draftLineError.value.target = 'El destino debe ser diferente al origen.'
    hasError = true
  }

  const qty = parseFloat(draftQuantity.value)
  if (isNaN(qty) || qty <= 0) {
    draftLineError.value.quantity = 'La cantidad debe ser un número positivo mayor a 0.'
    hasError = true
  }

  if (hasError) return

  lines.value.push({
    productCode: draftProductCode.value,
    sourceLocationCode: draftSourceLocation.value,
    targetLocationCode: draftTargetLocation.value,
    quantity: normalizeDecimal(draftQuantity.value),
  })

  // Reset del borrador
  draftProductCode.value = ''
  productSearchInput.value = ''
  draftQuantity.value = '1.00'
  draftLineError.value = {}
}

function removeLine(index: number) {
  lines.value.splice(index, 1)
}

// Envío del formulario
async function handleSubmit() {
  if (isSubmitting.value) return

  if (!validateReason()) {
    toast.error('Por favor revise el motivo del traslado.')
    return
  }

  if (lines.value.length === 0) {
    toast.error('Debe agregar al menos una línea de mercancía al traslado.')
    return
  }

  try {
    const created = await createTransfer({
      reason: reason.value.trim(),
      items: lines.value,
    })

    toast.success(`Traslado ${created.noDocument} registrado exitosamente`)
    router.push('/inventory/transfers')
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode
    if (status === 403) {
      toast.error('No posee permisos para registrar traslados de inventario (403).')
    } else if (status === 404) {
      toast.error('No se encontraron los productos o localizaciones en el catálogo (404).')
    } else if (status === 409) {
      toast.error('Stock insuficiente en origen para una o más líneas.')
    }
  }
}

// Navegación y cancelación
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
  router.push('/inventory/transfers')
}

onMounted(async () => {
  if (!can('inventory.transfer')) {
    toast.error('No posee permisos para registrar traslados (403).')
    return
  }
  await fetchTransferOptions()

  // Precargar desde query params si son válidos
  const qProduct = route.query.productCode ? String(route.query.productCode).trim() : ''
  const qSourceLoc = route.query.sourceLocationCode
    ? String(route.query.sourceLocationCode).trim()
    : ''

  if (qProduct && availableStock.value.some((s) => s.productCode === qProduct)) {
    setProduct(qProduct)
    if (qSourceLoc && locations.value.some((l) => l.code === qSourceLoc)) {
      draftSourceLocation.value = qSourceLoc
      ensureDifferentTargetLocation()
    }
  }
})

defineExpose({
  draftProductCode,
  draftSourceLocation,
  draftTargetLocation,
  draftQuantity,
  lines,
  addLineFromDraft,
  handleConfirmDiscard,
})
</script>
