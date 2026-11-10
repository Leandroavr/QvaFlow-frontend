<template>
  <span
    :class="[
      'inline-flex select-none items-center whitespace-nowrap font-medium transition-colors',
      sizeClasses[size],
      variantClasses[variant],
    ]"
  >
    <span
      v-if="dot"
      :class="['h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[variant]]"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>

<script setup lang="ts">
export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md'

interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
  dot: false,
})

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-1.5 py-0.5 rounded gap-1 leading-tight',
  md: 'text-xs px-2 py-0.5 rounded-md gap-1.5 leading-normal',
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-sunken text-content-secondary border border-border',
  success: 'bg-state-success-bg text-state-success border border-state-success-border',
  warning: 'bg-state-warning-bg text-state-warning border border-state-warning-border',
  danger: 'bg-state-error-bg text-state-error border border-state-error-border',
  info: 'bg-state-info-bg text-state-info border border-state-info-border',
}

const dotClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-content-muted',
  success: 'bg-state-success',
  warning: 'bg-state-warning',
  danger: 'bg-state-error',
  info: 'bg-state-info',
}
</script>
