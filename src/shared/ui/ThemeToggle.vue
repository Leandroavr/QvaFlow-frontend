<template>
  <button
    type="button"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :class="[
      'inline-flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-lg transition-all duration-150',
      'border-border-default shadow-xs backdrop-blur-xs border',
      'bg-surface-card/90 hover:bg-surface-subtle active:scale-95',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'text-content-primary',
    ]"
    @click="toggleTheme"
  >
    <!-- Icono Sol cuando está en modo oscuro (para volver a claro) -->
    <Sun
      v-if="isDark"
      class="h-4 w-4 text-amber-400 transition-colors hover:text-amber-300"
      aria-hidden="true"
    />
    <!-- Icono Luna cuando está en modo claro (para cambiar a oscuro) -->
    <Moon
      v-else
      class="h-4 w-4 text-slate-700 transition-colors hover:text-primary"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>
