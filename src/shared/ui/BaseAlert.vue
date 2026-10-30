<template>
  <div
    :role="variant === 'error' ? 'alert' : 'status'"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
    :class="[
      'p-3.5 rounded-lg border text-sm flex items-start gap-3 transition-colors',
      variantStyles[variant].container,
    ]"
  >
    <component
      :is="variantStyles[variant].icon"
      :class="['w-5 h-5 shrink-0 mt-0.5', variantStyles[variant].iconColor]"
      aria-hidden="true"
    />
    <div class="flex-1 leading-relaxed">
      <div v-if="title" class="font-bold mb-0.5" :class="variantStyles[variant].titleColor">
        {{ title }}
      </div>
      <div :class="variantStyles[variant].textColor">
        <slot>{{ message }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-vue-next'

interface Props {
  variant?: 'error' | 'warning' | 'info' | 'success'
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: '',
  message: '',
})

const variantStyles = {
  error: {
    container: 'bg-state-error-bg border-state-error-border',
    icon: AlertCircle,
    iconColor: 'text-state-error',
    titleColor: 'text-state-error',
    textColor: 'text-content-primary',
  },
  warning: {
    container: 'bg-state-warning-bg border-state-warning-border',
    icon: AlertTriangle,
    iconColor: 'text-state-warning',
    titleColor: 'text-state-warning',
    textColor: 'text-content-primary',
  },
  info: {
    container: 'bg-state-info-bg border-state-info-border',
    icon: Info,
    iconColor: 'text-state-info',
    titleColor: 'text-state-info',
    textColor: 'text-content-primary',
  },
  success: {
    container: 'bg-state-success-bg border-state-success-border',
    icon: CheckCircle2,
    iconColor: 'text-state-success',
    titleColor: 'text-state-success',
    textColor: 'text-content-primary',
  },
}
</script>
