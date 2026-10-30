<template>
  <div
    role="radiogroup"
    aria-label="Selector de tema visual"
    class="bg-surface-subtle/90 border-border-default shadow-xs backdrop-blur-xs inline-flex items-center rounded-lg border p-1 dark:bg-[#151F3A]/90"
  >
    <!-- Opción: Claro -->
    <button
      type="button"
      role="radio"
      :aria-checked="theme === 'light'"
      aria-label="Tema Claro"
      title="Claro"
      :class="[
        'flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        theme === 'light'
          ? 'shadow-xs border border-border-subtle bg-surface-card font-semibold text-content-primary'
          : 'hover:bg-surface-card/40 border border-transparent text-content-muted hover:text-content-primary',
      ]"
      @click="setTheme('light')"
    >
      <Sun class="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
      <span class="hidden sm:inline">Claro</span>
    </button>

    <!-- Opción: Oscuro -->
    <button
      type="button"
      role="radio"
      :aria-checked="theme === 'dark'"
      aria-label="Tema Oscuro"
      title="Oscuro"
      :class="[
        'flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        theme === 'dark'
          ? 'shadow-xs border border-border-subtle bg-surface-card font-semibold text-content-primary dark:bg-[#222E52]'
          : 'hover:bg-surface-card/40 border border-transparent text-content-muted hover:text-content-primary',
      ]"
      @click="setTheme('dark')"
    >
      <Moon class="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
      <span class="hidden sm:inline">Oscuro</span>
    </button>

    <!-- Opción: Sistema -->
    <button
      type="button"
      role="radio"
      :aria-checked="theme === 'system'"
      aria-label="Tema del Sistema"
      title="Sistema"
      :class="[
        'flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        theme === 'system'
          ? 'shadow-xs border border-border-subtle bg-surface-card font-semibold text-content-primary dark:bg-[#222E52]'
          : 'hover:bg-surface-card/40 border border-transparent text-content-muted hover:text-content-primary',
      ]"
      @click="setTheme('system')"
    >
      <Monitor class="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
      <span class="hidden sm:inline">Sistema</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const { theme, setTheme } = useTheme()
</script>
