<template>
  <div class="inline-flex items-center gap-2 text-xs font-medium" :title="computedTooltip">
    <span class="relative flex h-2.5 w-2.5">
      <!-- Pulso exterior para indicar actividad en tiempo real -->
      <span
        v-if="status === 'connected' || status === 'checking'"
        :class="[
          'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
          statusColors[status].ping,
        ]"
      />
      <!-- Punto central fijo -->
      <span
        :class="[
          'relative inline-flex rounded-full h-2.5 w-2.5',
          statusColors[status].dot,
        ]"
      />
    </span>
    <span v-if="showLabel" :class="statusColors[status].text">
      {{ computedLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ServerConnectionStatus = 'connected' | 'disconnected' | 'checking'

interface Props {
  status: ServerConnectionStatus
  showLabel?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  label: '',
})

const statusColors: Record<ServerConnectionStatus, { dot: string; ping: string; text: string }> = {
  connected: {
    dot: 'bg-emerald-500',
    ping: 'bg-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-400 font-medium',
  },
  disconnected: {
    dot: 'bg-rose-500',
    ping: 'bg-rose-400',
    text: 'text-rose-700 dark:text-rose-400 font-medium',
  },
  checking: {
    dot: 'bg-amber-500',
    ping: 'bg-amber-400',
    text: 'text-amber-700 dark:text-amber-400 font-medium',
  },
}

const defaultLabels: Record<ServerConnectionStatus, string> = {
  connected: 'Servidor conectado',
  disconnected: 'Servidor no disponible',
  checking: 'Comprobando conexión...',
}

const computedLabel = computed(() => props.label || defaultLabels[props.status])
const computedTooltip = computed(() => `Estado del servidor local: ${computedLabel.value}`)
</script>
