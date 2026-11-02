<template>
  <div class="flex flex-col gap-1 text-left">
    <!-- Etiqueta asociada con el control -->
    <label
      v-if="label"
      :for="fieldId"
      class="flex items-center gap-1 text-xs font-medium text-content-primary"
    >
      <span>{{ label }}</span>
      <span v-if="required" class="text-state-error" aria-hidden="true">*</span>
    </label>

    <!-- Slot para el control (BaseInput, BaseSelect, etc.) con props accesibles -->
    <div>
      <slot :id="fieldId" :described-by="ariaDescribedBy" :has-error="!!error" :error="error" />
    </div>

    <!-- Texto de ayuda complementario -->
    <p v-if="help && !error" :id="`${fieldId}-help`" class="text-[11px] text-content-muted">
      {{ help }}
    </p>

    <!-- Mensaje de error semántico accesible -->
    <p v-if="error" :id="`${fieldId}-error`" class="text-xs text-state-error" role="alert">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  label?: string
  help?: string
  error?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  label: '',
  help: '',
  error: '',
  required: false,
})

const uniqueId = `field-${Math.random().toString(36).substring(2, 9)}`
const fieldId = computed(() => props.id || uniqueId)

const ariaDescribedBy = computed(() => {
  const ids: string[] = []
  if (props.error) ids.push(`${fieldId.value}-error`)
  if (props.help && !props.error) ids.push(`${fieldId.value}-help`)
  return ids.length > 0 ? ids.join(' ') : undefined
})
</script>
