<template>
  <BaseFormField id="product-input" :label="label" :required="required" :error="error" :help="help">
    <div class="flex flex-col gap-1.5">
      <BaseInput
        id="product-input"
        :model-value="searchInput"
        placeholder="Código o nombre..."
        density="compact"
        data-test="product-code-input"
        @update:model-value="onInputUpdate"
        @enter="handleEnter"
      >
        <template #prefix>
          <Barcode class="h-3.5 w-3.5" aria-hidden="true" />
        </template>
      </BaseInput>

      <!-- Selector desplegable complementario de producto -->
      <BaseSelect
        id="product-select"
        :model-value="modelValue"
        :options="productSelectOptions"
        placeholder="O elija de la lista..."
        density="compact"
        searchable
        data-test="product-select"
        @update:model-value="handleSelect"
      />
    </div>
  </BaseFormField>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Barcode } from 'lucide-vue-next'
import BaseFormField from '@/shared/ui/BaseFormField.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { SelectOption } from '@/shared/ui/BaseSelect.vue'
import type { StockItem } from '../types'

interface Props {
  modelValue?: string
  availableStock: StockItem[]
  label?: string
  required?: boolean
  error?: string
  help?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'Producto (lector o búsqueda)',
  required: true,
  error: '',
  help: 'Enter agrega la línea con código exacto',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:searchInput', value: string): void
  (e: 'exactMatch', item: StockItem, query: string): void
  (e: 'notFound', query: string): void
}>()

const searchInput = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== searchInput.value) {
      searchInput.value = val || ''
    }
  }
)

const productSelectOptions = computed<SelectOption[]>(() => {
  const seen = new Set<string>()
  const opts: SelectOption[] = []
  for (const item of props.availableStock) {
    if (!seen.has(item.productCode)) {
      seen.add(item.productCode)
      opts.push({
        value: item.productCode,
        label: `${item.productName} (${item.productCode})`,
      })
    }
  }
  return opts
})

function onInputUpdate(val: string | number) {
  const str = String(val || '')
  searchInput.value = str
  emit('update:searchInput', str)
  const match = props.availableStock.find(
    (s) =>
      s.productCode.toLowerCase() === str.trim().toLowerCase() ||
      s.productName.toLowerCase() === str.trim().toLowerCase()
  )
  if (match) {
    emit('update:modelValue', match.productCode)
  }
}

function handleSelect(code: string | number | null) {
  const strCode = String(code || '')
  searchInput.value = strCode
  emit('update:modelValue', strCode)
  emit('update:searchInput', strCode)
}

function handleEnter() {
  const query = searchInput.value.trim()
  if (!query) return

  const exactMatch =
    props.availableStock.find((s) => s.productCode.toLowerCase() === query.toLowerCase()) ||
    props.availableStock.find((s) => s.productName.toLowerCase() === query.toLowerCase())

  if (exactMatch) {
    searchInput.value = exactMatch.productCode
    emit('update:modelValue', exactMatch.productCode)
    emit('exactMatch', exactMatch, query)
  } else {
    const partialMatch = props.availableStock.find(
      (s) =>
        s.productCode.toLowerCase().includes(query.toLowerCase()) ||
        s.productName.toLowerCase().includes(query.toLowerCase())
    )
    if (partialMatch) {
      searchInput.value = partialMatch.productCode
      emit('update:modelValue', partialMatch.productCode)
    } else {
      emit('notFound', query)
    }
  }
}

defineExpose({
  searchInput,
})
</script>
