<template>
  <div
    role="radiogroup"
    aria-label="Selector de tema visual"
    class="inline-flex items-center p-1 rounded-lg bg-surface-subtle/90 dark:bg-[#151F3A]/90 border border-border-default shadow-xs backdrop-blur-xs"
  >
    <!-- Opción: Claro -->
    <button
      type="button"
      role="radio"
      :aria-checked="theme === 'light'"
      aria-label="Tema Claro"
      title="Claro"
      :class="[
        'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        theme === 'light'
          ? 'bg-surface-card text-content-primary shadow-xs font-semibold border border-border-subtle'
          : 'text-content-muted hover:text-content-primary hover:bg-surface-card/40 border border-transparent',
      ]"
      @click="setTheme('light')"
    >
      <Sun class="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
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
        'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        theme === 'dark'
          ? 'bg-surface-card dark:bg-[#222E52] text-content-primary shadow-xs font-semibold border border-border-subtle'
          : 'text-content-muted hover:text-content-primary hover:bg-surface-card/40 border border-transparent',
      ]"
      @click="setTheme('dark')"
    >
      <Moon class="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
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
        'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        theme === 'system'
          ? 'bg-surface-card dark:bg-[#222E52] text-content-primary shadow-xs font-semibold border border-border-subtle'
          : 'text-content-muted hover:text-content-primary hover:bg-surface-card/40 border border-transparent',
      ]"
      @click="setTheme('system')"
    >
      <Monitor class="w-3.5 h-3.5 text-content-muted" aria-hidden="true" />
      <span class="hidden sm:inline">Sistema</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const { theme, setTheme } = useTheme()
</script>
