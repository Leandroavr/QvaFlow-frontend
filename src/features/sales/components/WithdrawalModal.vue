<template>
  <BaseModal
    :open="open"
    title="Registrar Salida de Caja / Inventario (F7)"
    size="md"
    :auto-focus-first-input="true"
    @update:open="handleOpenUpdate"
  >
    <!-- Alerta de Error del Servidor -->
    <div
      v-if="serverError"
      class="mb-4 flex items-start gap-2.5 rounded-lg border border-state-error-border bg-state-error-bg p-3 text-xs text-state-error sm:text-sm"
      role="alert"
      data-testid="withdrawal-error-alert"
    >
      <AlertCircle class="h-4 w-4 shrink-0 translate-y-0.5" />
      <span class="flex-1 font-medium">{{ serverError }}</span>
    </div>

    <form id="pos-withdrawal-form" class="space-y-4 py-1" @submit.prevent="handleSubmit">
      <!-- Selector de Tipo: Efectivo o Producto -->
      <BaseFormField
        label="Tipo de Salida"
        required
        description="Selecciona qué se retira del mostrador."
      >
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
            :class="
              kind === 'CASH'
                ? 'bg-primary/10 shadow-xs border-primary text-primary'
                : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
            "
            data-testid="withdrawal-type-cash"
            @click="kind = 'CASH'"
          >
            Efectivo
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
            :class="
              kind === 'PRODUCT'
                ? 'bg-primary/10 shadow-xs border-primary text-primary'
                : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
            "
            data-testid="withdrawal-type-product"
            @click="kind = 'PRODUCT'"
          >
            Producto
          </button>
        </div>
      </BaseFormField>

      <!-- CAMPOS PARA SALIDA DE EFECTIVO -->
      <template v-if="kind === 'CASH'">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Moneda -->
          <BaseFormField label="Moneda" required description="Divisa retirada de la gaveta.">
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
                :class="
                  currency === 'CUP'
                    ? 'bg-primary/10 shadow-xs border-primary text-primary'
                    : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
                "
                data-testid="withdrawal-currency-cup"
                @click="currency = 'CUP'"
              >
                CUP
              </button>
              <button
                type="button"
                class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
                :class="
                  currency === 'USD'
                    ? 'bg-primary/10 shadow-xs border-primary text-primary'
                    : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
                "
                data-testid="withdrawal-currency-usd"
                @click="currency = 'USD'"
              >
                USD
              </button>
            </div>
          </BaseFormField>

          <!-- Monto -->
          <BaseFormField
            :label="`Importe en ${currency}`"
            required
            :error="formErrors.amount"
            description="Cantidad de efectivo extraída."
          >
            <BaseInput
              ref="amountInputRef"
              v-model="amount"
              placeholder="0.00"
              :has-error="Boolean(formErrors.amount)"
              data-testid="withdrawal-amount-input"
            >
              <template #prefix>
                <span class="text-content-tertiary text-xs font-semibold">{{ currency }}</span>
              </template>
            </BaseInput>
          </BaseFormField>
        </div>
      </template>

      <!-- CAMPOS PARA SALIDA DE PRODUCTO -->
      <template v-else>
        <!-- Selección de Producto -->
        <BaseFormField
          label="Producto"
          required
          :error="formErrors.product"
          description="Artículo que se retira del almacén."
        >
          <select
            v-model="selectedProductId"
            class="h-9 w-full rounded-lg border border-border-subtle bg-surface-card px-3 text-xs font-medium text-content-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="withdrawal-product-select"
          >
            <option value="" disabled>Selecciona un producto...</option>
            <option v-for="prod in availableProducts" :key="prod.id" :value="prod.id">
              {{ prod.code }} - {{ prod.name }} (Stock: {{ prod.stock }} {{ prod.unit }})
            </option>
          </select>
        </BaseFormField>

        <!-- Cantidad a Retirar -->
        <BaseFormField
          label="Cantidad"
          required
          :error="formErrors.quantity"
          :description="
            selectedProduct
              ? `Stock disponible: ${selectedProduct.stock} ${selectedProduct.unit}`
              : 'Unidades a retirar.'
          "
        >
          <BaseInput
            v-model="quantity"
            placeholder="1.00"
            :has-error="Boolean(formErrors.quantity)"
            data-testid="withdrawal-quantity-input"
          >
            <template #suffix>
              <span class="text-content-tertiary text-xs font-semibold">{{
                selectedProduct?.unit || 'uds'
              }}</span>
            </template>
          </BaseInput>
        </BaseFormField>
      </template>

      <!-- Beneficiario -->
      <BaseFormField
        label="Beneficiario"
        required
        description="Persona que recibe el dinero o producto."
      >
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
            :class="
              beneficiary === 'OWNER'
                ? 'bg-primary/10 shadow-xs border-primary text-primary'
                : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
            "
            data-testid="withdrawal-beneficiary-owner"
            @click="beneficiary = 'OWNER'"
          >
            Dueño
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border py-2 text-xs font-bold transition-all"
            :class="
              beneficiary === 'OTHER'
                ? 'bg-primary/10 shadow-xs border-primary text-primary'
                : 'border-border-subtle bg-surface-card text-content-secondary hover:text-content-primary'
            "
            data-testid="withdrawal-beneficiary-other"
            @click="beneficiary = 'OTHER'"
          >
            Otro
          </button>
        </div>
      </BaseFormField>

      <!-- Nombre del Beneficiario (si es OTRO) -->
      <BaseFormField
        v-if="beneficiary === 'OTHER'"
        label="Nombre del beneficiario"
        required
        :error="formErrors.beneficiaryName"
        description="Identidad de la persona autorizada a recibirlo."
      >
        <BaseInput
          v-model="beneficiaryName"
          placeholder="Nombre y cargo / motivo de entrega"
          :has-error="Boolean(formErrors.beneficiaryName)"
          data-testid="withdrawal-beneficiary-name-input"
        />
      </BaseFormField>

      <!-- Motivo Obligatorio (mínimo 10 caracteres) -->
      <BaseFormField
        label="Motivo de la salida"
        required
        :error="formErrors.reason"
        :description="`Obligatorio para auditoría. Mínimo 10 caracteres (${reason.trim().length}/10).`"
      >
        <BaseInput
          v-model="reason"
          placeholder="Describe detalladamente la razón de la salida"
          :has-error="Boolean(formErrors.reason)"
          data-testid="withdrawal-reason-input"
        />
      </BaseFormField>
    </form>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <BaseButton
          variant="secondary"
          type="button"
          data-testid="withdrawal-cancel-btn"
          @click="handleCancel"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="pos-withdrawal-form"
          :loading="isSubmitting"
          data-testid="withdrawal-submit-btn"
        >
          Registrar Salida
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import BaseModal from '@/shared/ui/BaseModal.vue'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type {
  PosProduct,
  CashWithdrawal,
  CreateWithdrawalDto,
  WithdrawalKind,
  WithdrawalBeneficiary,
} from '../types'
import { usePosWithdrawal } from '../composables/usePosWithdrawal'
import { salesService } from '@/services'
import { isPositiveDecimal, compareDecimals, normalizeDecimal } from '@/shared/utils/decimal'

interface Props {
  open: boolean
  shiftId: string
  products?: PosProduct[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
  (e: 'success', withdrawal: CashWithdrawal): void
}>()

const { isSubmitting, serverError, submitWithdrawal } = usePosWithdrawal()

const kind = ref<WithdrawalKind>('CASH')
const currency = ref<'CUP' | 'USD'>('CUP')
const amount = ref('')
const selectedProductId = ref('')
const quantity = ref('1.00')
const beneficiary = ref<WithdrawalBeneficiary>('OWNER')
const beneficiaryName = ref('')
const reason = ref('')

const loadedProducts = ref<PosProduct[]>([])
const availableProducts = computed<PosProduct[]>(() => {
  return props.products && props.products.length > 0 ? props.products : loadedProducts.value
})

const selectedProduct = computed<PosProduct | undefined>(() => {
  return availableProducts.value.find((p) => p.id === selectedProductId.value)
})

const formErrors = reactive({
  amount: '',
  product: '',
  quantity: '',
  beneficiaryName: '',
  reason: '',
})

const loadProductsIfNeeded = async () => {
  if (!props.products || props.products.length === 0) {
    try {
      loadedProducts.value = await salesService.getPosProducts()
    } catch {
      // Ignorar fallo silencioso
    }
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      loadProductsIfNeeded()
    }
  }
)

onMounted(() => {
  if (props.open) {
    loadProductsIfNeeded()
  }
})

function resetForm() {
  kind.value = 'CASH'
  currency.value = 'CUP'
  amount.value = ''
  selectedProductId.value = ''
  quantity.value = '1.00'
  beneficiary.value = 'OWNER'
  beneficiaryName.value = ''
  reason.value = ''
  serverError.value = null
  formErrors.amount = ''
  formErrors.product = ''
  formErrors.quantity = ''
  formErrors.beneficiaryName = ''
  formErrors.reason = ''
}

function handleOpenUpdate(val: boolean) {
  emit('update:open', val)
  if (!val) {
    emit('close')
  }
}

function handleCancel() {
  emit('update:open', false)
  emit('close')
}

function validate(): boolean {
  let isValid = true
  formErrors.amount = ''
  formErrors.product = ''
  formErrors.quantity = ''
  formErrors.beneficiaryName = ''
  formErrors.reason = ''

  if (kind.value === 'CASH') {
    if (!amount.value || !isPositiveDecimal(amount.value)) {
      formErrors.amount = 'Indica un importe numérico mayor a 0.'
      isValid = false
    }
  } else {
    if (!selectedProductId.value || !selectedProduct.value) {
      formErrors.product = 'Selecciona un producto para retirar.'
      isValid = false
    } else {
      if (!quantity.value || !isPositiveDecimal(quantity.value)) {
        formErrors.quantity = 'Indica una cantidad numérica mayor a 0.'
        isValid = false
      } else if (compareDecimals(quantity.value, selectedProduct.value.stock) > 0) {
        formErrors.quantity = `Stock insuficiente (disponible: ${selectedProduct.value.stock} ${selectedProduct.value.unit}).`
        isValid = false
      }
    }
  }

  if (beneficiary.value === 'OTHER' && !beneficiaryName.value.trim()) {
    formErrors.beneficiaryName = 'El nombre del beneficiario es obligatorio.'
    isValid = false
  }

  if (reason.value.trim().length < 10) {
    formErrors.reason = 'El motivo debe tener al menos 10 caracteres explicativos.'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validate()) return

  const clientRequestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const dto: CreateWithdrawalDto = {
    clientRequestId,
    shiftId: props.shiftId,
    kind: kind.value,
    beneficiary: beneficiary.value,
    beneficiaryName: beneficiary.value === 'OTHER' ? beneficiaryName.value.trim() : undefined,
    reason: reason.value.trim(),
  }

  if (kind.value === 'CASH') {
    dto.currency = currency.value
    dto.amount = normalizeDecimal(amount.value)
  } else if (selectedProduct.value) {
    dto.productId = selectedProduct.value.id
    dto.productName = selectedProduct.value.name
    dto.sku = selectedProduct.value.code
    dto.quantity = normalizeDecimal(quantity.value)
  }

  try {
    const res = await submitWithdrawal(dto)
    emit('update:open', false)
    emit('close')
    emit('success', res)
  } catch {
    // serverError manejado en el composable
  }
}
</script>
