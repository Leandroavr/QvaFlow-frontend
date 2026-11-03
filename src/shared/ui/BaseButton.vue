<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
      'active:scale-[0.98]',
      variantClasses[variant],
      densityClasses[density],
      block ? 'w-full' : '',
    ]"
    v-bind="$attrs"
  >
    <!-- Spinner en estado Loading -->
    <BaseSpinner
      v-if="loading"
      :size="density === 'compact' ? 'sm' : 'md'"
      :color="variant === 'primary' || variant === 'danger' ? 'white' : 'primary'"
      class="shrink-0"
    />

    <!-- Icono opcional como prop -->
    <component
      :is="icon"
      v-if="icon && !loading && !$slots.prefix"
      class="h-4 w-4 shrink-0"
      aria-hidden="true"
    />

    <!-- Icono prefijo opcional por slot -->
    <span v-if="$slots.prefix && !loading" class="inline-flex shrink-0 items-center">
      <slot name="prefix" />
    </span>

    <!-- Texto o contenido del botón -->
    <span
      v-if="$slots.default || loading"
      class="inline-flex items-center gap-1.5 whitespace-nowrap"
      :class="{ 'opacity-90': loading }"
    >
      <slot>{{ loading ? loadingText : '' }}</slot>
    </span>

    <!-- Icono sufijo opcional -->
    <span v-if="$slots.suffix && !loading" class="inline-flex shrink-0 items-center">
      <slot name="suffix" />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import BaseSpinner from './BaseSpinner.vue'

export type ControlDensity = 'comfortable' | 'compact'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  density?: ControlDensity
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  block?: boolean
  icon?: Component
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  density: 'compact',
  type: 'button',
  disabled: false,
  loading: false,
  loadingText: 'Cargando...',
  block: false,
  icon: undefined,
})

const variantClasses: Record<string, string> = {
  primary:
    'bg-primary hover:bg-primary-hover active:bg-primary-active text-white shadow-md shadow-primary/20 border border-transparent',
  secondary:
    'bg-surface-subtle hover:bg-surface-muted active:bg-surface-elevated text-content-primary border border-border-default shadow-xs',
  ghost:
    'bg-transparent hover:bg-surface-subtle text-content-secondary hover:text-content-primary border border-transparent',
  danger:
    'bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/20 border border-transparent',
}

const densityClasses: Record<ControlDensity, string> = {
  comfortable:
    'h-[var(--control-height-comfortable,48px)] min-h-[var(--control-height-comfortable,48px)] px-5 text-sm rounded-lg',
  compact:
    'h-[var(--control-height-compact,36px)] min-h-[var(--control-height-compact,36px)] px-3 text-xs rounded-md',
}
</script>
