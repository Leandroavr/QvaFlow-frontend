<template>
  <a-modal
    :open="visible"
    title="Registrar Movimiento de Inventario"
    :confirm-loading="loading"
    ok-text="Procesar Movimiento"
    cancel-text="Cancelar"
    width="640px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="pt-3"
    >
      <!-- Tipo de Movimiento -->
      <a-form-item label="Tipo de Movimiento" name="type">
        <a-select
          v-model:value="formData.type"
          placeholder="Seleccione el tipo"
          :dropdown-match-select-width="false"
          :popup-match-select-width="false"
        >
          <a-select-option value="ENTRADA">Entrada de Mercancía</a-select-option>
          <a-select-option value="SALIDA">Salida / Merma</a-select-option>
          <a-select-option value="TRASLADO">Traslado entre Localizaciones</a-select-option>
          <a-select-option value="AJUSTE">Ajuste de Conteo Físico</a-select-option>
        </a-select>
      </a-form-item>

      <!-- Producto -->
      <a-form-item label="Producto" name="productId">
        <a-select
          v-model:value="formData.productId"
          placeholder="Seleccione el producto"
          :dropdown-match-select-width="false"
          :popup-match-select-width="false"
          show-search
          :filter-option="filterProductOption"
          @change="onProductSelect"
        >
          <a-select-option
            v-for="item in availableProducts"
            :key="item.id"
            :value="item.id"
            :data-name="item.name"
            :data-code="item.code"
          >
            <div class="flex items-center justify-between">
              <span>{{ item.name }}</span>
              <span class="text-xs text-slate-400 font-mono">
                Stock: {{ item.stock }} {{ item.unit }}
              </span>
            </div>
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Campos si NO es Traslado -->
      <div v-if="formData.type !== 'TRASLADO'">
        <a-form-item label="Localización" name="location">
          <a-select
            v-model:value="formData.location"
            placeholder="Seleccione localización"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
            show-search
          >
            <a-select-option
              v-for="loc in inventoryStore.allLocations"
              :key="loc.codigo"
              :value="loc.codigo"
            >
              {{ loc.nombre }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>

      <!-- Campos específicos de TRASLADO -->
      <a-row v-else :gutter="16">
        <a-col :xs="24" :sm="12">
          <a-form-item
            label="Localización Origen"
            name="location"
            :rules="[{ required: true, message: 'Seleccione origen' }]"
          >
            <a-select
              v-model:value="formData.location"
              placeholder="Origen"
              :dropdown-match-select-width="false"
              :popup-match-select-width="false"
              show-search
            >
              <a-select-option
                v-for="loc in inventoryStore.allLocations"
                :key="loc.codigo"
                :value="loc.codigo"
              >
                {{ loc.nombre }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="12">
          <a-form-item
            label="Localización Destino"
            name="targetLocation"
            :rules="[{ required: true, message: 'Seleccione destino' }]"
          >
            <a-select
              v-model:value="formData.targetLocation"
              placeholder="Destino"
              :dropdown-match-select-width="false"
              :popup-match-select-width="false"
              show-search
            >
              <a-select-option
                v-for="loc in availableTargetLocations"
                :key="loc.codigo"
                :value="loc.codigo"
              >
                {{ loc.nombre }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Cantidad del Movimiento -->
      <a-form-item
        :label="formData.type === 'AJUSTE' ? 'Nuevo Stock Total Resultante' : 'Cantidad a Mover'"
        name="quantity"
      >
        <a-input-number
          v-model:value="formData.quantity"
          :min="1"
          class="w-full"
          size="large"
          placeholder="Ej. 10"
        />
        <div v-if="selectedProductInfo" class="text-xs text-slate-400 mt-1">
          Stock actual: <strong class="text-slate-700">{{ selectedProductInfo.stock }} {{ selectedProductInfo.unit }}</strong>
          en {{ selectedProductInfo.warehouse }} ({{ selectedProductInfo.locationName || selectedProductInfo.location || 'General' }}).
        </div>
      </a-form-item>

      <!-- Motivo / Observaciones -->
      <a-form-item label="Motivo / Justificación" name="reason">
        <a-textarea
          v-model:value="formData.reason"
          placeholder="Ej. Traslado para reabastecer mostrador de ventas, merma por rotura, reposición..."
          :rows="2"
          allow-clear
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import useInventoryStore from '../store/inventoryStore'
import type { InventoryItem, TipoMovimiento, CreateMovementDto } from '../types/inventory'

interface Props {
  visible: boolean
  availableProducts: InventoryItem[]
  initialProductId?: number | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialProductId: null,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', payload: CreateMovementDto): void
}>()

const inventoryStore = useInventoryStore()
const formRef = ref<FormInstance>()

const formData = reactive<CreateMovementDto>({
  productId: undefined as unknown as number,
  type: 'ENTRADA' as TipoMovimiento,
  quantity: 1,
  warehouse: 'Tienda Principal',
  location: undefined,
  targetWarehouse: undefined,
  targetLocation: undefined,
  reason: '',
})

const selectedProductInfo = computed(() => {
  return props.availableProducts.find((p) => p.id === formData.productId)
})

const availableTargetLocations = computed(() => {
  return inventoryStore.allLocations.filter((loc) => loc.codigo !== formData.location)
})

watch(
  () => props.initialProductId,
  (newId) => {
    if (newId) {
      formData.productId = newId
      onProductSelect(newId)
    }
  },
  { immediate: true }
)

const onProductSelect = (prodId: number) => {
  const prod = props.availableProducts.find((p) => p.id === prodId)
  if (prod) {
    formData.warehouse = prod.warehouse
    formData.location = prod.location || inventoryStore.allLocations[0]?.codigo
  }
}

const filterProductOption = (input: string, option: any) => {
  const name = option['data-name'] || ''
  const code = option['data-code'] || ''
  return (
    name.toLowerCase().includes(input.toLowerCase()) ||
    code.toLowerCase().includes(input.toLowerCase())
  )
}

const rules: Record<string, Rule[]> = {
  type: [{ required: true, message: 'Seleccione el tipo de movimiento' }],
  productId: [{ required: true, message: 'Seleccione un producto' }],
  quantity: [
    { required: true, message: 'Indique la cantidad' },
    { type: 'number', min: 1, message: 'Debe ser al menos 1' },
  ],
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    if (formData.type === 'TRASLADO') {
      if (!formData.location || !formData.targetLocation) {
        message.warning('Debe seleccionar la localización de origen y la de destino.')
        return
      }
      if (formData.location === formData.targetLocation) {
        message.error('La localización de origen y destino no pueden ser la misma.')
        return
      }
    }

    emit('submit', { ...formData })
  } catch {
    // Formulario incompleto
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
