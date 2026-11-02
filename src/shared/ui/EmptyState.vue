<template>
  <div
    class="border-border-default bg-surface-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center sm:px-12 sm:py-14"
  >
    <!-- Icono neutral en superficie hundida -->
    <div
      v-if="icon"
      class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-content-muted"
      aria-hidden="true"
    >
      <component :is="icon" class="h-6 w-6" />
    </div>

    <!-- Título accesible -->
    <h3 class="text-sm font-semibold text-content-primary">
      {{ title }}
    </h3>

    <!-- Descripción explicativa -->
    <p v-if="description" class="mt-1 max-w-sm text-xs text-content-muted">
      {{ description }}
    </p>

    <!-- Slot para acciones (BaseButton, etc.) -->
    <div v-if="$slots.actions || $slots.default" class="mt-4 flex flex-wrap justify-center gap-2">
      <slot name="actions">
        <slot />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  title: string
  description?: string
  icon?: Component
}

defineProps<Props>()
</script>
