<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex cursor-pointer select-none items-center justify-center font-semibold transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
      'active:scale-[0.98]',
      variantClasses[variant],
      sizeClasses[size],
      block ? 'w-full' : '',
    ]"
    v-bind="$attrs"
  >
    <!-- Spinner en estado Loading -->
    <BaseSpinner
      v-if="loading"
      :size="size === 'sm' ? 'sm' : 'md'"
      :color="variant === 'primary' || variant === 'danger' ? 'white' : 'primary'"
      class="mr-2"
    />

    <!-- Icono prefijo opcional -->
    <span v-if="$slots.prefix && !loading" class="mr-2 inline-flex items-center">
      <slot name="prefix" />
    </span>

    <!-- Texto o contenido del botón -->
    <span :class="{ 'opacity-90': loading }">
      <slot>{{ loading ? loadingText : '' }}</slot>
    </span>

    <!-- Icono sufijo opcional -->
    <span v-if="$slots.suffix && !loading" class="ml-2 inline-flex items-center">
      <slot name="suffix" />
    </span>
  </button>
</template>

<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  block?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  loadingText: 'Cargando...',
  block: false,
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

const sizeClasses: Record<string, string> = {
  sm: 'h-9 px-3 text-xs rounded-md',
  md: 'h-12 min-h-12 px-5 text-sm rounded-lg', // 48px para accesibilidad táctil y desktop
  lg: 'h-14 min-h-14 px-6 text-base rounded-xl',
}
</script>
