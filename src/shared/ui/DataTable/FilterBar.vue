<template>
  <div class="flex w-full flex-col gap-2">
    <!-- Fila principal responsiva con wrap para pantallas estrechas -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <!-- Bloque de filtros (buscador + selects + limpiar) -->
      <div class="flex min-w-[280px] flex-1 flex-wrap items-center gap-2.5">
        <!-- Buscador con debounce y densidad compacta -->
        <div v-if="showSearch" class="w-full sm:w-64">
          <BaseInput
            :model-value="internalSearch"
            :placeholder="searchPlaceholder"
            density="compact"
            :prefix-icon="Search"
            clearable
            @update:model-value="handleSearchInput"
            @clear="handleClearSearch"
          />
        </div>

        <!-- Slot para controles de filtrado (BaseSelect, etc.) -->
        <slot name="filters">
          <slot />
        </slot>

        <!-- Botón Limpiar filtros (solo visible cuando hay filtros activos) -->
        <BaseButton
          v-if="canClear"
          variant="ghost"
          density="compact"
          :icon="RotateCcw"
          class="text-xs text-content-secondary hover:text-content-primary"
          @click="handleClearAll"
        >
          Limpiar filtros
        </BaseButton>
      </div>

      <!-- Slot derecho para acciones principales ("Nuevo", exportar, etc.) -->
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <!-- Chips de filtros activos opcionales -->
    <div
      v-if="(chips && chips.length > 0) || $slots.chips"
      class="flex flex-wrap items-center gap-1.5 pt-0.5"
    >
      <slot name="chips">
        <span class="text-[11px] font-medium text-content-muted">Filtros:</span>
        <span
          v-for="chip in chips"
          :key="chip.id"
          class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 text-xs text-content-primary"
        >
          <span>{{ chip.label }}</span>
          <button
            type="button"
            class="rounded p-0.5 text-content-muted hover:bg-surface-card hover:text-content-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            :aria-label="`Quitar filtro ${chip.label}`"
            @click="chip.onRemove"
          >
            <X class="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { Search, RotateCcw, X } from 'lucide-vue-next'
import BaseInput from '../BaseInput.vue'
import BaseButton from '../BaseButton.vue'

export interface FilterChip {
  id: string
  label: string
  onRemove: () => void
}

interface Props {
  search?: string
  searchPlaceholder?: string
  debounceMs?: number
  showSearch?: boolean
  hasActiveFilters?: boolean
  chips?: FilterChip[]
}

const props = withDefaults(defineProps<Props>(), {
  search: '',
  searchPlaceholder: 'Buscar...',
  debounceMs: 300,
  showSearch: true,
  hasActiveFilters: false,
  chips: () => [],
})

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'clear'): void
}>()

const internalSearch = ref(props.search)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.search,
  (newVal) => {
    if (newVal !== internalSearch.value) {
      internalSearch.value = newVal
    }
  }
)

const handleSearchInput = (value: string | number) => {
  const str = String(value)
  internalSearch.value = str

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    emit('update:search', str)
  }, props.debounceMs)
}

const handleClearSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  internalSearch.value = ''
  emit('update:search', '')
}

const canClear = computed(() => {
  return props.hasActiveFilters || internalSearch.value.trim().length > 0 || props.chips.length > 0
})

const handleClearAll = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  internalSearch.value = ''
  emit('update:search', '')
  emit('clear')
}

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>
