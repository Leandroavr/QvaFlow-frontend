<template>
  <button
    type="button"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :class="[
      'inline-flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-lg border transition-all duration-150 active:scale-95',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      onDark
        ? 'border-white/30 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white/60 focus-visible:ring-offset-[#162e56]'
        : 'border-border-default bg-surface-card/90 shadow-xs backdrop-blur-xs text-content-primary hover:bg-surface-subtle focus-visible:ring-primary',
    ]"
    @click="toggleTheme"
  >
    <!-- Icono Sol cuando está en modo oscuro (para volver a claro) -->
    <Sun
      v-if="isDark"
      class="h-4 w-4 transition-colors"
      :class="onDark ? 'text-white' : 'text-amber-400 hover:text-amber-300'"
      aria-hidden="true"
    />
    <!-- Icono Luna cuando está en modo claro (para cambiar a oscuro) -->
    <Moon
      v-else
      class="h-4 w-4 transition-colors"
      :class="onDark ? 'text-white' : 'text-slate-700 hover:text-primary dark:text-slate-300'"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

interface Props {
  onDark?: boolean
}

withDefaults(defineProps<Props>(), {
  onDark: false,
})

const { isDark, toggleTheme } = useTheme()
</script>
