<template>
  <div class="w-full">
    <!-- Etiqueta accesible (Sin asteriscos rojos conforme a especificación) -->
    <label
      v-if="label"
      :for="inputId"
      class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-content-secondary"
    >
      {{ label }}
    </label>

    <div class="relative flex items-center">
      <!-- Icono prefijo (Izquierda) -->
      <div
        v-if="$slots.prefix"
        class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-content-muted"
        aria-hidden="true"
      >
        <slot name="prefix" />
      </div>

      <!-- Campo de entrada -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="computedType"
        :value="modelValue"
        :name="name"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :class="[
          'h-12 min-h-12 w-full rounded-lg border bg-surface-card text-sm text-content-primary transition-all duration-150',
          'placeholder:text-content-muted/80',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary',
          'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-content-muted',
          $slots.prefix ? 'pl-11' : 'pl-4',
          isPassword || $slots.suffix ? 'pr-11' : 'pr-4',
          error
            ? 'border-state-error ring-1 ring-state-error focus:border-state-error focus:ring-state-error'
            : 'border-border-default hover:border-border-hover',
        ]"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @keydown.enter="$emit('enter', $event)"
      />

      <!-- Botón para alternar visibilidad de contraseña -->
      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
        class="absolute inset-y-0 right-3.5 flex cursor-pointer items-center text-content-muted hover:text-content-primary focus:outline-none"
        @click="togglePasswordVisibility"
      >
        <EyeOff v-if="showPassword" class="h-5 w-5" aria-hidden="true" />
        <Eye v-else class="h-5 w-5" aria-hidden="true" />
      </button>

      <!-- Icono o contenido sufijo opcional -->
      <div
        v-else-if="$slots.suffix"
        class="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-content-muted"
        aria-hidden="true"
      >
        <slot name="suffix" />
      </div>
    </div>

    <!-- Mensaje de error inline con aria-live -->
    <p
      v-if="error"
      :id="`${inputId}-error`"
      role="alert"
      class="mt-1.5 flex items-center gap-1 text-xs font-medium text-state-error"
    >
      <AlertCircle class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{{ error }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  id?: string
  name?: string
  placeholder?: string
  disabled?: boolean
  error?: string | null
  autocomplete?: string
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  type: 'text',
  id: '',
  name: '',
  placeholder: '',
  disabled: false,
  error: null,
  autocomplete: 'off',
  autofocus: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
  (e: 'enter', event: KeyboardEvent): void
}>()

const generatedId = useId()
const inputId = computed(() => props.id || `input-${generatedId}`)

const inputRef = ref<HTMLInputElement | null>(null)
const showPassword = ref(false)

const isPassword = computed(() => props.type === 'password')

const computedType = computed(() => {
  if (isPassword.value) {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select(),
})
</script>
