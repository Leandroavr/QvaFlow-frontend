<template>
  <div class="w-full">
    <!-- Etiqueta accesible (Sin asteriscos rojos conforme a especificación) -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1.5"
    >
      {{ label }}
    </label>

    <div class="relative flex items-center">
      <!-- Icono prefijo (Izquierda) -->
      <div
        v-if="$slots.prefix"
        class="absolute left-3.5 inset-y-0 flex items-center pointer-events-none text-content-muted"
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
          'w-full h-12 min-h-12 text-sm bg-surface-card text-content-primary rounded-lg border transition-all duration-150',
          'placeholder:text-content-muted/80',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          'disabled:bg-surface-subtle disabled:text-content-muted disabled:cursor-not-allowed',
          $slots.prefix ? 'pl-11' : 'pl-4',
          isPassword || $slots.suffix ? 'pr-11' : 'pr-4',
          error
            ? 'border-state-error ring-1 ring-state-error focus:ring-state-error focus:border-state-error'
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
        class="absolute right-3.5 inset-y-0 flex items-center text-content-muted hover:text-content-primary focus:outline-none cursor-pointer"
        @click="togglePasswordVisibility"
      >
        <EyeOff v-if="showPassword" class="w-5 h-5" aria-hidden="true" />
        <Eye v-else class="w-5 h-5" aria-hidden="true" />
      </button>

      <!-- Icono o contenido sufijo opcional -->
      <div
        v-else-if="$slots.suffix"
        class="absolute right-3.5 inset-y-0 flex items-center pointer-events-none text-content-muted"
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
      class="mt-1.5 text-xs text-state-error font-medium flex items-center gap-1"
    >
      <AlertCircle class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
