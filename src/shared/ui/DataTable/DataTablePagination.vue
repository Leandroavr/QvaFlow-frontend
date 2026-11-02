<template>
  <div
    class="border-border-default flex flex-wrap items-center justify-between gap-3 border-t bg-surface-card px-4 py-2.5 text-xs text-content-secondary"
  >
    <!-- Rango de elementos mostrados -->
    <div class="flex items-center gap-2">
      <span class="font-medium text-content-primary">
        {{ rangeText }}
      </span>
    </div>

    <!-- Controles de navegación y selector de página -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Selector de filas por página -->
      <div class="flex items-center gap-1.5">
        <span class="text-content-muted">Filas:</span>
        <div class="w-20">
          <BaseSelect
            :model-value="perPage"
            :options="pageSizeSelectOptions"
            :disabled="disabled"
            @update:model-value="handlePerPageChange"
          />
        </div>
      </div>

      <!-- Botones de paginación -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="disabled || page <= 1"
          class="border-border-default flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-card text-content-primary transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
          title="Primera página"
          aria-label="Primera página"
          @click="goToPage(1)"
        >
          <ChevronsLeft class="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          :disabled="disabled || page <= 1"
          class="border-border-default flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-card text-content-primary transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
          title="Página anterior"
          aria-label="Página anterior"
          @click="goToPage(page - 1)"
        >
          <ChevronLeft class="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <span class="px-2 text-xs font-medium text-content-primary">
          {{ page }} / {{ totalPages }}
        </span>

        <button
          type="button"
          :disabled="disabled || page >= totalPages"
          class="border-border-default flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-card text-content-primary transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
          title="Página siguiente"
          aria-label="Página siguiente"
          @click="goToPage(page + 1)"
        >
          <ChevronRight class="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          :disabled="disabled || page >= totalPages"
          class="border-border-default flex h-8 w-8 items-center justify-center rounded-lg border bg-surface-card text-content-primary transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
          title="Última página"
          aria-label="Última página"
          @click="goToPage(totalPages)"
        >
          <ChevronsRight class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import BaseSelect, { type SelectOption } from '../BaseSelect.vue'

interface Props {
  page: number
  perPage: number
  total: number
  pageSizeOptions?: number[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'update:perPage', perPage: number): void
}>()

const totalPages = computed(() => {
  if (props.total <= 0) return 1
  return Math.max(1, Math.ceil(props.total / props.perPage))
})

const rangeText = computed(() => {
  if (props.total === 0) {
    return '0 registros'
  }
  const from = (props.page - 1) * props.perPage + 1
  const to = Math.min(props.page * props.perPage, props.total)
  return `Mostrando ${from}–${to} de ${props.total}`
})

const pageSizeSelectOptions = computed<SelectOption[]>(() => {
  return props.pageSizeOptions.map((size) => ({
    label: String(size),
    value: size,
  }))
})

const goToPage = (newPage: number) => {
  const target = Math.max(1, Math.min(newPage, totalPages.value))
  if (target !== props.page) {
    emit('update:page', target)
  }
}

const handlePerPageChange = (val: string | number | null) => {
  if (!val) return
  const num = Number(val)
  if (num && num !== props.perPage) {
    emit('update:perPage', num)
    // Regresar a la página 1 cuando cambia el tamaño de página
    emit('update:page', 1)
  }
}
</script>
