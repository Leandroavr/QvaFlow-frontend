<template>
  <div class="relative inline-block text-left">
    <button
      type="button"
      :class="[
        'h-9 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer',
        'bg-surface-card/80 hover:bg-surface-card border-border-default/60 hover:border-border-default text-content-secondary hover:text-content-primary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-xs shadow-xs',
      ]"
      :title="`Tema actual: ${currentLabel}. Clic para cambiar.`"
      :aria-label="`Tema actual: ${currentLabel}. Clic para cambiar.`"
      @click="toggleTheme"
    >
      <Sun v-if="theme === 'light'" class="w-4 h-4 text-amber-500" aria-hidden="true" />
      <Moon v-else-if="theme === 'dark'" class="w-4 h-4 text-sky-400" aria-hidden="true" />
      <Monitor v-else class="w-4 h-4 text-content-muted" aria-hidden="true" />
      <span class="hidden sm:inline">{{ currentLabel }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()

const currentLabel = computed(() => {
  if (theme.value === 'light') return 'Claro'
  if (theme.value === 'dark') return 'Oscuro'
  return 'Sistema'
})
</script>
