<template>
  <a-drawer
    :open="visible"
    title="Registrar Factura de Compra"
    placement="right"
    width="840"
    :body-style="{ paddingBottom: '80px' }"
    @close="handleClose"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      layout="vertical"
      class="space-y-4"
    >
      <!-- Datos Generales -->
      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <a-row :gutter="16">
          <!-- Proveedor -->
          <a-col :xs="24" :sm="12">
            <a-form-item label="Proveedor" name="proveedor">
              <a-auto-complete
                v-model:value="formState.proveedor"
                :options="providerOptions"
                placeholder="Nombre del proveedor..."
                allow-clear
              />
            </a-form-item>
          </a-col>

          <!-- Número de Documento / Factura -->
          <a-col :xs="24" :sm="12">
            <a-form-item label="No. Factura" name="noDocument">
              <a-input
                v-model:value="formState.noDocument"
                placeholder="Ej. FAC-2026-003"
                class="font-mono font-semibold"
                allow-clear
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <!-- Fecha del Movimiento -->
          <a-col :xs="24" :sm="12">
            <a-form-item label="Fecha" name="fechaMovimiento">
              <a-date-picker
                v-model:value="formState.fechaMovimiento"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                class="w-full"
                placeholder="DD/MM/YYYY"
              />
            </a-form-item>
          </a-col>

          <!-- Moneda de la Factura -->
          <a-col :xs="24" :sm="12">
            <a-form-item label="Moneda" name="moneda">
              <a-select v-model:value="formState.moneda" :dropdown-match-select-width="false" :popup-match-select-width="false">
                <a-select-option value="CUP">CUP (Pesos)</a-select-option>
                <a-select-option value="USD">USD (Dólares)</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <!-- Artículos y Localización -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Artículos</span>
          <span class="text-xs text-slate-400 font-medium">
            {{ invoiceItems.length }} artículo(s)
          </span>
        </div>

        <!-- Buscador para agregar productos -->
        <div class="flex gap-2">
          <a-select
            v-model:value="selectedProductIdToAdd"
            placeholder="Buscar producto a agregar..."
            show-search
            class="flex-1"
            :filter-option="filterProductOption"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
            allow-clear
          >
            <a-select-option
              v-for="prod in availableProducts"
              :key="prod.id"
              :value="prod.id"
              :data-name="prod.name"
              :data-code="prod.code"
            >
              <div class="flex items-center justify-between">
                <span>{{ prod.name }}</span>
                <span class="text-xs text-slate-400 font-mono">
                  SKU: {{ prod.code }} | Costo Ref: ${{ prod.defaultCost }}
                </span>
              </div>
            </a-select-option>
          </a-select>

          <a-button
            type="primary"
            class="bg-emerald-600 hover:bg-emerald-500 border-none flex items-center gap-1"
            :disabled="!selectedProductIdToAdd"
            @click="addProductRow"
          >
            <PlusOutlined />
            <span>Agregar</span>
          </a-button>
        </div>

        <!-- Tabla editable de artículos entrantes -->
        <div v-if="invoiceItems.length > 0" class="border border-slate-200 rounded-lg overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[680px]">
            <thead class="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th class="p-2.5">Producto</th>
                <th class="p-2.5 w-44">Localización Destino</th>
                <th class="p-2.5 w-24 text-center">Cantidad</th>
                <th class="p-2.5 w-28 text-center">Costo Unit. ({{ formState.moneda }})</th>
                <th class="p-2.5 w-28 text-right">Subtotal</th>
                <th class="p-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(item, idx) in invoiceItems" :key="item.productId" class="hover:bg-slate-50">
                <td class="p-2.5 font-medium text-slate-800">
                  <div>{{ item.productName }}</div>
                  <span class="text-[10px] font-mono text-slate-400">{{ item.productCode }}</span>
                </td>

                <!-- Selector de Localización en Almacén -->
                <td class="p-2.5">
                  <a-select
                    v-model:value="item.localizacion"
                    size="small"
                    class="w-full text-xs"
                    :dropdown-match-select-width="false"
                    :popup-match-select-width="false"
                    placeholder="Seleccionar..."
                  >
                    <a-select-option
                      v-for="loc in inventoryStore.allLocations"
                      :key="loc.codigo"
                      :value="loc.codigo"
                    >
                      📍 {{ loc.nombre }}
                    </a-select-option>
                  </a-select>
                </td>

                <td class="p-2.5 text-center">
                  <a-input-number
                    v-model:value="item.quantity"
                    :min="1"
                    size="small"
                    class="w-20"
                    @change="calculateTotals"
                  />
                </td>

                <td class="p-2.5 text-center">
                  <a-input-number
                    v-model:value="item.unitCost"
                    :min="0"
                    size="small"
                    class="w-24 font-bold"
                    @change="calculateTotals"
                  />
                </td>

                <td class="p-2.5 text-right font-bold text-slate-900">
                  {{ formatearMoneda(item.quantity * item.unitCost, formState.moneda) }}
                </td>

                <td class="p-2.5 text-center">
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                    @click="removeProductRow(idx)"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
          No has agregado artículos a esta factura todavía.
        </div>

        <!-- Observaciones -->
        <a-form-item label="Observaciones / Notas" name="notes" class="mt-2">
          <a-textarea
            v-model:value="formState.notes"
            placeholder="Ej. Mercancía pactada con pago a 15 días, albarán entregado por el chofer..."
            :rows="2"
            allow-clear
          />
        </a-form-item>
      </div>

      <!-- SECCIÓN INFERIOR: Total a Pagar -->
      <div class="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 uppercase tracking-wider block">Importe Total Factura</span>
          <span class="text-2xl font-bold">{{ formatearMoneda(invoiceTotal, formState.moneda) }}</span>
        </div>
        <div class="text-right text-xs text-slate-400">
          <div>Moneda: <strong class="text-white">{{ formState.moneda }}</strong></div>
          <div>Total de Unidades: <strong class="text-white">{{ totalUnits }}</strong></div>
        </div>
      </div>
    </a-form>

    <!-- Footer del Drawer -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <a-button @click="handleClose">Cancelar</a-button>
        <a-button
          type="primary"
          class="bg-emerald-600 hover:bg-emerald-500 border-none"
          :loading="loading"
          @click="handleSubmit"
        >
          Guardar Factura
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import useInventoryStore from '@/modules/inventory/store/inventoryStore'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { Provider, CreatePurchaseInvoiceDto } from '../types/purchases'

interface Props {
  visible: boolean
  providers: Provider[]
  availableProducts: { id: number; code: string; name: string; unit: string; defaultCost: number }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', payload: CreatePurchaseInvoiceDto): void
}>()

const inventoryStore = useInventoryStore()
const { formatearMoneda } = useFormatoMoneda()
const formRef = ref<FormInstance>()

const selectedProductIdToAdd = ref<number | undefined>(undefined)

const formState = reactive({
  noDocument: '',
  proveedor: '',
  fechaMovimiento: new Date().toISOString().slice(0, 10),
  moneda: 'CUP' as 'CUP' | 'USD',
  notes: '',
})

interface EditableRow {
  productId: number
  productCode: string
  productName: string
  unit: string
  quantity: number
  unitCost: number
  localizacion: string
}

const invoiceItems = ref<EditableRow[]>([])

const providerOptions = computed(() => {
  return props.providers.map((p) => ({ value: p.name }))
})

const invoiceTotal = computed(() => {
  return invoiceItems.value.reduce((acc, it) => acc + it.quantity * it.unitCost, 0)
})

const totalUnits = computed(() => {
  return invoiceItems.value.reduce((acc, it) => acc + it.quantity, 0)
})

const filterProductOption = (input: string, option: any) => {
  const name = option['data-name'] || ''
  const code = option['data-code'] || ''
  return (
    name.toLowerCase().includes(input.toLowerCase()) ||
    code.toLowerCase().includes(input.toLowerCase())
  )
}

const addProductRow = () => {
  if (!selectedProductIdToAdd.value) return

  const prod = props.availableProducts.find((p) => p.id === selectedProductIdToAdd.value)
  if (!prod) return

  const existing = invoiceItems.value.find((it) => it.productId === prod.id)
  if (existing) {
    existing.quantity += 1
  } else {
    // Asignar primera localización disponible por defecto
    const defaultLoc = inventoryStore.allLocations[0]?.codigo || 'LOC-CEN-P1'
    invoiceItems.value.push({
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      unit: prod.unit,
      quantity: 1,
      unitCost: prod.defaultCost,
      localizacion: defaultLoc,
    })
  }

  selectedProductIdToAdd.value = undefined
}

const removeProductRow = (index: number) => {
  invoiceItems.value.splice(index, 1)
}

const calculateTotals = () => {
  // Dispara reactividad
}

const formRules: Record<string, Rule[]> = {
  proveedor: [{ required: true, message: 'Indique el proveedor' }],
  noDocument: [{ required: true, message: 'Indique el número de factura' }],
  fechaMovimiento: [{ required: true, message: 'Seleccione la fecha' }],
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    if (invoiceItems.value.length === 0) {
      message.error('Debe incluir al menos un producto en la factura.')
      return
    }

    // Validar que cada ítem tenga asignada una localización
    const sinLocalizacion = invoiceItems.value.some((it) => !it.localizacion)
    if (sinLocalizacion) {
      message.error('Cada producto debe tener asignada una localización física de almacén.')
      return
    }

    const payload: CreatePurchaseInvoiceDto = {
      noDocument: formState.noDocument.trim(),
      proveedor: formState.proveedor.trim(),
      fechaMovimiento: formState.fechaMovimiento,
      moneda: formState.moneda,
      notes: formState.notes,
      items: invoiceItems.value.map((it) => ({
        productId: it.productId,
        producto: it.productCode,
        productCode: it.productCode,
        productName: it.productName,
        unit: it.unit,
        quantity: it.quantity,
        cantidad: it.quantity,
        localizacion: it.localizacion,
        unitCost: it.unitCost,
      })),
    }

    emit('submit', payload)

    // Resetear formulario
    formState.noDocument = ''
    formState.proveedor = ''
    formState.notes = ''
    invoiceItems.value = []
  } catch {
    // Formulario inválido
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>
