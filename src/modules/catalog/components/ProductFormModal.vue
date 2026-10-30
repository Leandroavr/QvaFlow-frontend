<template>
  <a-modal
    :open="visible"
    :title="isEditMode ? 'Editar Producto en Catálogo' : 'Ingresar Nuevo Producto al Sistema'"
    :confirm-loading="loading"
    ok-text="Guardar Producto"
    cancel-text="Cancelar"
    width="860px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical" class="pt-1">
      <a-tabs v-model:activeKey="activeTabKey" class="product-form-tabs">
        <!-- PESTAÑA 1: DATOS GENERALES Y FOTO -->
        <a-tab-pane key="basic" tab="📋 Datos y Foto">
          <div class="space-y-4 pt-1">
            <!-- Sección de Foto / Miniatura -->
            <div
              class="flex flex-col items-center gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row"
            >
              <!-- Vista previa de imagen -->
              <div
                class="shadow-xs relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white"
              >
                <img
                  v-if="formData.images && formData.images.length > 0"
                  :src="formData.images[0].url"
                  alt="Foto Producto"
                  class="h-full w-full object-cover"
                />
                <span v-else class="select-none text-4xl">{{ selectedEmoji || '📦' }}</span>
              </div>

              <!-- Controles de subida y emojis rápidos -->
              <div class="w-full flex-1 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase text-slate-700"
                    >Fotografía o Icono del Producto</span
                  >
                  <span class="text-[11px] text-slate-400">JPG, PNG o WEBP</span>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <a-upload
                    :before-upload="handleBeforeUpload"
                    :show-upload-list="false"
                    accept="image/*"
                  >
                    <a-button size="small" class="flex items-center gap-1 text-xs">
                      <UploadOutlined />
                      <span>Subir Foto desde Dispositivo</span>
                    </a-button>
                  </a-upload>

                  <a-button
                    v-if="formData.images && formData.images.length > 0"
                    size="small"
                    danger
                    class="text-xs"
                    @click="clearUploadedPhoto"
                  >
                    Quitar Foto
                  </a-button>
                </div>

                <!-- Selección de icono rápido si no tiene foto a mano -->
                <div class="pt-1">
                  <span class="mb-1 block text-[11px] text-slate-500"
                    >O elija un icono rápido de referencia:</span
                  >
                  <div class="flex flex-wrap gap-1.5">
                    <button
                      v-for="emo in [
                        '☕',
                        '🌻',
                        '🥤',
                        '🍺',
                        '🚬',
                        '🍗',
                        '🥖',
                        '🥩',
                        '🧼',
                        '💊',
                        '👕',
                        '📦',
                      ]"
                      :key="emo"
                      type="button"
                      class="flex h-7 w-7 cursor-pointer items-center justify-center rounded border bg-white text-sm transition-colors hover:bg-slate-100"
                      :class="
                        selectedEmoji === emo && (!formData.images || formData.images.length === 0)
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                          : 'border-slate-200'
                      "
                      @click="selectEmoji(emo)"
                    >
                      {{ emo }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Nombre y Categoría -->
            <a-row :gutter="16">
              <a-col :xs="24" :sm="14">
                <a-form-item label="Nombre del Producto" name="name">
                  <a-input
                    v-model:value="formData.name"
                    placeholder="Ej. Café Serrano Clásico 250g"
                    allow-clear
                  />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="10">
                <a-form-item label="Categoría" name="category">
                  <a-select
                    v-model:value="formData.category"
                    placeholder="Seleccione categoría"
                    :dropdown-match-select-width="false"
                    :popup-match-select-width="false"
                    show-search
                    allow-clear
                  >
                    <a-select-option value="Alimentos">Alimentos</a-select-option>
                    <a-select-option value="Bebidas">Bebidas</a-select-option>
                    <a-select-option value="Aseo y Limpieza">Aseo y Limpieza</a-select-option>
                    <a-select-option value="Tabacos">Tabacos</a-select-option>
                    <a-select-option value="Cárnicos">Cárnicos</a-select-option>
                    <a-select-option value="Textil y Calzado">Textil y Calzado</a-select-option>
                    <a-select-option value="Otros">Otros</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <!-- Unidad, Stock y Alerta -->
            <a-row :gutter="16">
              <a-col :xs="24" :sm="8">
                <a-form-item label="Unidad de Medida" name="unit">
                  <a-select
                    v-model:value="formData.unit"
                    :dropdown-match-select-width="false"
                    :popup-match-select-width="false"
                  >
                    <a-select-option value="u">Unidad (u)</a-select-option>
                    <a-select-option value="kg">Kilogramo (kg)</a-select-option>
                    <a-select-option value="lb">Libra (lb)</a-select-option>
                    <a-select-option value="pqte">Paquete (pqte)</a-select-option>
                    <a-select-option value="l">Litro (l)</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="8">
                <a-form-item label="Stock Inicial" name="stock">
                  <a-input-number v-model:value="formData.stock" :min="0" class="w-full" />
                </a-form-item>
              </a-col>

              <a-col :xs="24" :sm="8">
                <a-form-item label="Stock Mínimo (Alerta)" name="minStock">
                  <a-input-number v-model:value="formData.minStock" :min="0" class="w-full" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item label="Descripción o Detalles (Opcional)" name="description">
              <a-textarea
                v-model:value="formData.description"
                placeholder="Breve reseña del producto, procedencia o notas..."
                :rows="2"
              />
            </a-form-item>

            <div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <a-switch v-model:checked="formData.active" />
              <div>
                <span class="block text-xs font-bold text-slate-800">
                  {{
                    formData.active
                      ? 'Producto Activo en el Terminal POS'
                      : 'Producto Inactivo / Oculto'
                  }}
                </span>
                <span class="text-[11px] text-slate-400">
                  {{
                    formData.active
                      ? 'Aparece disponible para facturar en caja.'
                      : 'No será mostrado en el catálogo de cobro.'
                  }}
                </span>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- PESTAÑA 2: PRECIOS Y COSTOS (USD Y CUP CON RESPETO AL ADMIN) -->
        <a-tab-pane key="pricing" tab="💵 Precios y Costos (USD / CUP)">
          <div class="space-y-4 pt-1">
            <!-- Nota Aclaratoria de Moneda Principal y Regla de Negocio -->
            <div
              class="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
            >
              <span class="text-lg text-emerald-700">💡</span>
              <div class="text-xs text-emerald-950">
                <span class="font-bold">Moneda Principal del Negocio: USD</span>
                <p class="m-0 mt-0.5 text-emerald-800">
                  El sistema registra y valora su inventario principalmente en USD. Si el producto
                  se adquiere o vende en CUP, ingrese el valor en CUP directamente.
                  <strong
                    >El sistema respetará estrictamente lo que usted ingrese en ambos campos</strong
                  >
                  sin modificarlos automáticamente.
                </p>
              </div>
            </div>

            <!-- SECCIÓN 1: COSTO DE ADQUISICIÓN (ENTRADA) -->
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black uppercase tracking-wide text-slate-800">
                    1. Costo de Adquisición (Entrada de Mercancía)
                  </span>
                  <a-tag v-if="!authStore.canViewCosts" color="warning" class="text-[10px]"
                    >Restringido por Rol</a-tag
                  >
                </div>
                <span class="text-[11px] text-slate-400"
                  >Tasa del día: 1 USD = {{ dailyRateUSD }} CUP</span
                >
              </div>

              <div v-if="authStore.canViewCosts" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Costo en USD -->
                <div class="shadow-xs rounded-lg border border-slate-200 bg-white p-3">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800">🇺🇸 Costo en USD</span>
                    <a-tag color="success" class="m-0 text-[10px]">Principal</a-tag>
                  </div>
                  <a-input-number
                    v-model:value="formData.costPriceUSD"
                    :min="0"
                    :precision="2"
                    placeholder="0.00"
                    class="w-full text-base font-bold"
                    prefix="$"
                  />
                  <div class="mt-1 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400">Valor de compra en USD</span>
                    <button
                      type="button"
                      class="cursor-pointer text-[10px] text-emerald-600 hover:underline"
                      @click="suggestCostCUPFromUSD"
                    >
                      Sugerir a CUP →
                    </button>
                  </div>
                </div>

                <!-- Costo en CUP -->
                <div class="shadow-xs rounded-lg border border-slate-200 bg-white p-3">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800">🇨🇺 Costo en CUP</span>
                    <a-tag color="blue" class="m-0 text-[10px]">Nacional</a-tag>
                  </div>
                  <a-input-number
                    v-model:value="formData.costPriceCUP"
                    :min="0"
                    :precision="0"
                    placeholder="0"
                    class="w-full text-base font-bold"
                    prefix="$"
                  />
                  <div class="mt-1 flex items-center justify-between">
                    <span class="text-[10px] text-slate-400">Valor de compra en CUP</span>
                    <button
                      type="button"
                      class="cursor-pointer text-[10px] text-emerald-600 hover:underline"
                      @click="suggestCostUSDFromCUP"
                    >
                      ← Sugerir a USD
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="text-xs italic text-slate-400">
                🔒 Su usuario no tiene permisos asignados para visualizar ni editar los precios de
                costo.
              </div>
            </div>

            <!-- SECCIÓN 2: PRECIOS DE VENTA AL PÚBLICO (PVP) -->
            <div class="shadow-xs rounded-xl border border-slate-200 bg-white p-4">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wide text-slate-800">
                  2. Precios de Venta al Público (PVP en Caja)
                </span>
                <span class="text-[11px] text-slate-500">Defina el precio exacto por moneda</span>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <!-- Precio Venta USD -->
                <div class="rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-3.5">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-900">🇺🇸 Precio de Venta (USD)</span>
                    <a-tag color="success" class="m-0 text-[10px] font-bold">Base Sistema</a-tag>
                  </div>
                  <a-form-item name="salePriceUSD" class="mb-1">
                    <a-input-number
                      v-model:value="formData.salePriceUSD"
                      :min="0"
                      :precision="2"
                      placeholder="0.00"
                      class="w-full text-lg font-black text-emerald-700"
                      prefix="$"
                    />
                  </a-form-item>
                  <div class="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Precio si el cliente paga en USD</span>
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-emerald-700 hover:underline"
                      @click="suggestSalePriceCUPFromUSD"
                    >
                      Sugerir a CUP →
                    </button>
                  </div>
                </div>

                <!-- Precio Venta CUP -->
                <div class="rounded-xl border-2 border-blue-400 bg-blue-50/40 p-3.5">
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-xs font-bold text-blue-900">🇨🇺 Precio de Venta (CUP)</span>
                    <a-tag color="blue" class="m-0 text-[10px] font-bold">Cobro Nacional</a-tag>
                  </div>
                  <a-form-item name="salePriceCUP" class="mb-1">
                    <a-input-number
                      v-model:value="formData.salePriceCUP"
                      :min="0"
                      :precision="0"
                      placeholder="0"
                      class="w-full text-lg font-black text-blue-800"
                      prefix="$"
                    />
                  </a-form-item>
                  <div class="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Precio si el cliente paga en CUP</span>
                    <button
                      type="button"
                      class="cursor-pointer font-medium text-blue-700 hover:underline"
                      @click="suggestSalePriceUSDFromCUP"
                    >
                      ← Sugerir a USD
                    </button>
                  </div>
                </div>
              </div>

              <!-- Indicador de Margen de Ganancia Calculado -->
              <div
                v-if="authStore.canViewCosts && marginPercentage !== null"
                class="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs"
              >
                <span class="text-slate-600">Margen estimado de ganancia comercial:</span>
                <span
                  class="text-sm font-black"
                  :class="
                    marginPercentage >= 30
                      ? 'text-emerald-600'
                      : marginPercentage > 0
                        ? 'text-amber-600'
                        : 'text-red-600'
                  "
                >
                  {{ marginPercentage >= 0 ? '+' : '' }}{{ marginPercentage.toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- PESTAÑA 3: CÓDIGOS DE BARRA Y LECTOR USB -->
        <a-tab-pane key="barcodes" tab="🏷️ Códigos de Barra">
          <div class="space-y-4 pt-1">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="m-0 text-sm font-bold text-slate-800">Códigos de Barra y SKU</h4>
                <p class="m-0 text-xs text-slate-400">
                  Compatible con pistola lectora USB. Puede ingresar el código del envase individual
                  o de la caja.
                </p>
              </div>

              <a-button
                type="dashed"
                class="flex items-center gap-1 border-emerald-500 text-emerald-600"
                @click="addBarcodeRow"
              >
                <PlusOutlined />
                <span>Agregar Código</span>
              </a-button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(bc, index) in formData.barcodes"
                :key="bc.id"
                class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div class="w-48">
                  <span class="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500"
                    >Código / Barra</span
                  >
                  <a-input
                    v-model:value="bc.code"
                    placeholder="Ej. 78910001"
                    class="font-mono text-sm"
                  />
                </div>

                <div class="flex-1">
                  <span class="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500"
                    >Descripción</span
                  >
                  <a-input
                    v-model:value="bc.description"
                    placeholder="Ej. Envase individual, Empaque x24..."
                  />
                </div>

                <div class="flex items-center gap-2 pt-4">
                  <a-radio :checked="bc.isPrimary" @click="setPrimaryBarcode(index)">
                    <span
                      class="text-xs"
                      :class="bc.isPrimary ? 'font-bold text-emerald-600' : 'text-slate-500'"
                    >
                      Principal
                    </span>
                  </a-radio>

                  <button
                    type="button"
                    :disabled="formData.barcodes.length <= 1"
                    class="cursor-pointer p-1 text-slate-400 hover:text-red-500 disabled:opacity-30"
                    @click="removeBarcodeRow(index)"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- PESTAÑA 4: ATRIBUTOS DINÁMICOS EAV -->
        <a-tab-pane key="attributes" tab="🧩 Atributos Dinámicos">
          <div class="space-y-4 pt-1">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="m-0 text-sm font-bold text-slate-800">
                  Especificaciones Técnicas (EAV)
                </h4>
                <p class="m-0 text-xs text-slate-400">
                  Agregue atributos específicos como Talla, Color, Sabor, etc.
                </p>
              </div>

              <a-button
                type="dashed"
                class="flex items-center gap-1 border-emerald-500 text-emerald-600"
                @click="addAttributeRow"
              >
                <PlusOutlined />
                <span>Agregar Atributo</span>
              </a-button>
            </div>

            <div v-if="formData.attributes && formData.attributes.length > 0" class="space-y-2">
              <div
                v-for="(attr, index) in formData.attributes"
                :key="attr.id"
                class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div class="w-1/2">
                  <span class="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500"
                    >Nombre</span
                  >
                  <a-input v-model:value="attr.name" placeholder="Ej. Sabor, Origen, Talla..." />
                </div>
                <div class="w-1/2">
                  <span class="mb-0.5 block text-[11px] font-semibold uppercase text-slate-500"
                    >Valor</span
                  >
                  <a-input v-model:value="attr.value" placeholder="Ej. Vainilla, Cuba, M..." />
                </div>
                <div class="pt-4">
                  <button
                    type="button"
                    class="cursor-pointer p-1 text-slate-400 hover:text-red-500"
                    @click="removeAttributeRow(index)"
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>

            <div
              v-else
              class="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-slate-400"
            >
              <p class="m-0 text-xs">
                No se han definido atributos personalizados para este producto.
              </p>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import useAuthStore from '@/modules/auth/store/authStore'
import usePosStore from '@/modules/pos/store/posStore'
import type { Product, CreateProductDto, MonedaTipo, UnidadMedida } from '../types/product'

interface Props {
  visible: boolean
  productToEdit?: Product | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  productToEdit: null,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', payload: CreateProductDto): void
}>()

const authStore = useAuthStore()
const posStore = usePosStore()
const formRef = ref<FormInstance>()
const isEditMode = computed(() => !!props.productToEdit)
const activeTabKey = ref<string>('basic')

const dailyRateUSD = computed(() => posStore.exchangeRates.USD || 360)
const selectedEmoji = ref<string>('📦')

const formData = reactive<CreateProductDto>({
  code: '',
  barcodes: [{ id: 'bc-1', code: '', isPrimary: true, description: 'Código Principal' }],
  name: '',
  category: 'Alimentos',
  costPriceUSD: null,
  costPriceCUP: null,
  costPrice: 0,
  salePriceUSD: null,
  salePriceCUP: null,
  salePrice: 0,
  prices: { CUP: 0, USD: null, EUR: null, MLC: null },
  stock: 0,
  minStock: 5,
  currency: 'USD' as MonedaTipo,
  unit: 'u' as UnidadMedida,
  active: true,
  description: '',
  attributes: [],
  images: [],
})

const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: 'El nombre del producto es obligatorio', trigger: 'blur' }],
  category: [{ required: true, message: 'Seleccione una categoría', trigger: 'change' }],
}

// Cálculo en vivo del Margen de Ganancia
const marginPercentage = computed(() => {
  const saleUSD =
    formData.salePriceUSD ||
    (formData.salePriceCUP ? formData.salePriceCUP / dailyRateUSD.value : 0)
  const costUSD =
    formData.costPriceUSD ||
    (formData.costPriceCUP ? formData.costPriceCUP / dailyRateUSD.value : 0)

  if (!saleUSD || !costUSD || saleUSD <= 0) return null
  return ((saleUSD - costUSD) / saleUSD) * 100
})

watch(
  () => props.productToEdit,
  (product) => {
    if (product) {
      formData.code = product.code
      formData.barcodes = product.barcodes?.length
        ? product.barcodes.map((b) => ({ ...b }))
        : [
            {
              id: `bc-${Date.now()}`,
              code: product.code,
              isPrimary: true,
              description: 'Código Principal',
            },
          ]
      formData.name = product.name
      formData.category = product.category
      formData.costPriceUSD =
        product.costPriceUSD ??
        (product.costPrice ? Number((product.costPrice / dailyRateUSD.value).toFixed(2)) : null)
      formData.costPriceCUP = product.costPriceCUP ?? product.costPrice ?? null
      formData.costPrice = product.costPrice ?? 0
      formData.salePriceUSD =
        product.salePriceUSD ??
        product.prices?.USD ??
        (product.salePrice ? Number((product.salePrice / dailyRateUSD.value).toFixed(2)) : null)
      formData.salePriceCUP = product.salePriceCUP ?? product.salePrice ?? null
      formData.salePrice = product.salePrice ?? 0
      formData.prices = {
        CUP: product.salePriceCUP || product.salePrice || 0,
        USD: product.salePriceUSD || product.prices?.USD || null,
        EUR: product.prices?.EUR || null,
        MLC: product.prices?.MLC || null,
      }
      formData.stock = product.stock
      formData.minStock = product.minStock
      formData.currency = product.currency || 'USD'
      formData.unit = product.unit || 'u'
      formData.active = product.active
      formData.description = product.description || ''
      formData.attributes = product.attributes?.map((a) => ({ ...a })) || []
      formData.images = product.images?.map((img) => ({ ...img })) || []
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  formData.code = ''
  formData.barcodes = [
    { id: `bc-${Date.now()}`, code: '', isPrimary: true, description: 'Código Principal' },
  ]
  formData.name = ''
  formData.category = 'Alimentos'
  formData.costPriceUSD = null
  formData.costPriceCUP = null
  formData.costPrice = 0
  formData.salePriceUSD = null
  formData.salePriceCUP = null
  formData.salePrice = 0
  formData.prices = { CUP: 0, USD: null, EUR: null, MLC: null }
  formData.stock = 0
  formData.minStock = 5
  formData.currency = 'USD'
  formData.unit = 'u'
  formData.active = true
  formData.description = ''
  formData.attributes = []
  formData.images = []
  selectedEmoji.value = '📦'
  activeTabKey.value = 'basic'
}

// Botones de ayuda voluntaria (NO sobreescriben automáticamente sin clic)
const suggestCostCUPFromUSD = () => {
  if (formData.costPriceUSD) {
    formData.costPriceCUP = Math.round(formData.costPriceUSD * dailyRateUSD.value)
  }
}

const suggestCostUSDFromCUP = () => {
  if (formData.costPriceCUP) {
    formData.costPriceUSD = Number((formData.costPriceCUP / dailyRateUSD.value).toFixed(2))
  }
}

const suggestSalePriceCUPFromUSD = () => {
  if (formData.salePriceUSD) {
    formData.salePriceCUP = Math.round(formData.salePriceUSD * dailyRateUSD.value)
  }
}

const suggestSalePriceUSDFromCUP = () => {
  if (formData.salePriceCUP) {
    formData.salePriceUSD = Number((formData.salePriceCUP / dailyRateUSD.value).toFixed(2))
  }
}

const selectEmoji = (emoji: string) => {
  selectedEmoji.value = emoji
}

const handleBeforeUpload = (file: File) => {
  const localUrl = URL.createObjectURL(file)
  formData.images = [
    {
      uid: `img-${Date.now()}`,
      name: file.name,
      url: localUrl,
    },
  ]
  return false
}

const clearUploadedPhoto = () => {
  formData.images = []
}

const addBarcodeRow = () => {
  formData.barcodes.push({
    id: `bc-${Date.now()}`,
    code: '',
    isPrimary: false,
    description: '',
  })
}

const removeBarcodeRow = (index: number) => {
  formData.barcodes.splice(index, 1)
}

const setPrimaryBarcode = (index: number) => {
  formData.barcodes.forEach((b, i) => {
    b.isPrimary = i === index
  })
}

const addAttributeRow = () => {
  formData.attributes.push({
    id: `attr-${Date.now()}`,
    name: '',
    value: '',
  })
}

const removeAttributeRow = (index: number) => {
  formData.attributes.splice(index, 1)
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    // Sincronizar código principal
    const primaryBc = formData.barcodes.find((b) => b.isPrimary && b.code)
    formData.code = primaryBc
      ? primaryBc.code
      : formData.barcodes[0]?.code || `PRD-${Date.now().toString().slice(-4)}`

    // Normalizar precios base
    const baseCUP =
      formData.salePriceCUP ||
      (formData.salePriceUSD ? Math.round(formData.salePriceUSD * dailyRateUSD.value) : 0)
    formData.salePrice = baseCUP
    formData.prices.CUP = baseCUP
    formData.prices.USD =
      formData.salePriceUSD ||
      (formData.salePriceCUP
        ? Number((formData.salePriceCUP / dailyRateUSD.value).toFixed(2))
        : null)
    formData.costPrice =
      formData.costPriceCUP ||
      (formData.costPriceUSD ? Math.round(formData.costPriceUSD * dailyRateUSD.value) : 0)

    emit('submit', { ...formData })
  } catch {
    message.error('Por favor complete los campos requeridos en el formulario.')
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
