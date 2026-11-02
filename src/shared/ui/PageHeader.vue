<template>
  <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-xl font-bold tracking-tight text-content-primary">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-1 text-xs text-content-muted">
        {{ description }}
      </p>
    </div>

    <!-- Acciones u opciones de cabecera -->
    <div v-if="$slots.actions || $slots.default" class="flex flex-wrap items-center gap-2">
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>
