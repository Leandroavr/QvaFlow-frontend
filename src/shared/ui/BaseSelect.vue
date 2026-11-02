<template>
  <div class="flex flex-col gap-1.5 text-left">
    <!-- Etiqueta opcional -->
    <label v-if="label" :for="selectId" class="text-xs font-medium text-content-primary">
      {{ label }}
    </label>

    <SelectRoot
      :model-value="internalValue"
      :disabled="disabled"
      :name="name"
      @update:model-value="handleUpdate"
    >
      <!-- Disparador de selección (36px compacto) -->
      <SelectTrigger
        :id="selectId"
        :class="[
          'flex h-9 w-full items-center justify-between rounded-lg border bg-surface-card px-3 text-xs text-content-primary transition-colors',
          'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2',
          error
            ? 'border-state-error focus-visible:ring-state-error'
            : 'border-border-default hover:border-border-strong focus-visible:ring-primary',
          disabled && 'cursor-not-allowed bg-surface-sunken opacity-50',
        ]"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${selectId}-error` : undefined"
      >
        <SelectValue :placeholder="placeholder">
          {{ displayLabel }}
        </SelectValue>
        <ChevronDown class="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
      </SelectTrigger>

      <!-- Menú Desplegable con Reka UI Portal -->
      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="4"
          class="border-border-default animate-in fade-in-80 zoom-in-95 z-50 max-h-60 min-w-[var(--radix-select-trigger-width,12rem)] overflow-hidden rounded-xl border bg-surface-card p-1 text-content-primary shadow-lg ring-1 ring-black/5 duration-100"
        >
          <!-- Buscador interno opcional -->
          <div v-if="searchable" class="border-b border-border-subtle p-1.5">
            <div class="relative flex items-center">
              <Search class="absolute left-2 h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar opción..."
                class="h-7 w-full rounded-md border border-border-subtle bg-surface-sunken pl-7 pr-2 text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-primary"
                @keydown.stop
              />
            </div>
          </div>

          <SelectViewport class="p-0.5">
            <!-- Opción "Todos" opcional -->
            <SelectItem
              v-if="includeAllOption && !searchQuery"
              value="__all_option__"
              class="relative flex h-8 cursor-pointer select-none items-center justify-between rounded-lg px-2 text-xs outline-none data-[highlighted]:bg-surface-sunken data-[highlighted]:text-content-primary"
            >
              <SelectItemText>{{ allOptionLabel }}</SelectItemText>
              <SelectItemIndicator>
                <Check class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>

            <SelectSeparator
              v-if="includeAllOption && filteredOptions.length > 0 && !searchQuery"
              class="my-1 h-px bg-border-subtle"
            />

            <!-- Lista de opciones filtradas -->
            <SelectItem
              v-for="opt in filteredOptions"
              :key="String(opt.value)"
              :value="String(opt.value)"
              :disabled="opt.disabled"
              class="relative flex h-8 cursor-pointer select-none items-center justify-between rounded-lg px-2 text-xs outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-sunken data-[highlighted]:text-content-primary data-[disabled]:opacity-40"
            >
              <SelectItemText>{{ opt.label }}</SelectItemText>
              <SelectItemIndicator>
                <Check class="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>

            <div
              v-if="filteredOptions.length === 0 && (!includeAllOption || searchQuery)"
              class="px-2 py-3 text-center text-xs text-content-muted"
            >
              No se encontraron opciones
            </div>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <!-- Mensaje de error accesible -->
    <p v-if="error" :id="`${selectId}-error`" class="text-xs text-state-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectSeparator,
} from 'reka-ui'
import { ChevronDown, Check, Search } from 'lucide-vue-next'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  options: SelectOption[]
  label?: string
  placeholder?: string
  includeAllOption?: boolean
  allOptionLabel?: string
  allOptionValue?: string | number | null
  searchable?: boolean
  error?: string
  disabled?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: 'Seleccionar...',
  includeAllOption: false,
  allOptionLabel: 'Todos',
  allOptionValue: '',
  searchable: false,
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const uniqueId = `select-${Math.random().toString(36).substring(2, 9)}`
const selectId = computed(() => props.id || uniqueId)

const searchQuery = ref('')

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }
  const q = searchQuery.value.toLowerCase().trim()
  return props.options.filter((opt) => opt.label.toLowerCase().includes(q))
})

// Mapeo interno para manejar opción "Todos" y tipos string/number
const internalValue = computed(() => {
  if (
    props.modelValue === null ||
    props.modelValue === undefined ||
    props.modelValue === props.allOptionValue
  ) {
    if (props.includeAllOption) {
      return '__all_option__'
    }
    return undefined
  }
  return String(props.modelValue)
})

const displayLabel = computed(() => {
  if (internalValue.value === '__all_option__') {
    return props.allOptionLabel
  }
  const match = props.options.find((opt) => String(opt.value) === internalValue.value)
  return match ? match.label : undefined
})

const handleUpdate = (val: string) => {
  if (val === '__all_option__') {
    emit('update:modelValue', props.allOptionValue)
    return
  }
  // Preservar tipo numérico si la opción original era number
  const originalOpt = props.options.find((opt) => String(opt.value) === val)
  if (originalOpt && typeof originalOpt.value === 'number') {
    emit('update:modelValue', Number(val))
  } else {
    emit('update:modelValue', val)
  }
}
</script>
