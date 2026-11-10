<template>
  <DialogRoot :open="open" @update:open="handleOpenUpdate">
    <DialogPortal>
      <!-- Fondo oscuro con desenfoque accesible -->
      <DialogOverlay
        class="animate-in fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm duration-150"
      />

      <!-- Contenedor del Modal Centrado -->
      <DialogContent
        :class="[
          'fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface-card text-content-primary shadow-2xl duration-150',
          'animate-in fade-in zoom-in-95 max-h-[85vh]',
          sizeClasses[size],
        ]"
        @open-auto-focus="handleOpenAutoFocus"
      >
        <!-- Cabecera del modal -->
        <div
          class="flex shrink-0 items-start justify-between border-b border-border-subtle p-4 sm:p-5"
        >
          <div class="pr-4">
            <DialogTitle class="text-sm font-bold text-content-primary sm:text-base">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-0.5 text-xs text-content-muted">
              {{ description }}
            </DialogDescription>
          </div>

          <!-- Botón de cierre accesible -->
          <DialogClose
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-sunken hover:text-content-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar ventana modal"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </DialogClose>
        </div>

        <!-- Cuerpo del modal con scroll interno independiente -->
        <div class="flex-1 overflow-y-auto p-4 text-xs text-content-primary sm:p-5 sm:text-sm">
          <slot />
        </div>

        <!-- Pie con acciones si hay slot actions -->
        <div
          v-if="$slots.actions"
          class="bg-surface-sunken/40 flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle px-4 py-3 sm:px-5 sm:py-3.5"
        >
          <slot name="actions" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { X } from 'lucide-vue-next'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  open: boolean
  title: string
  description?: string
  size?: ModalSize
  autoFocusFirstInput?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  size: 'md',
  autoFocusFirstInput: true,
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
}>()

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

const handleOpenAutoFocus = (e: Event) => {
  if (!props.autoFocusFirstInput) return
  const el = e.currentTarget as HTMLElement | null
  if (!el) return
  const input = el.querySelector<HTMLElement>(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-autofocus]'
  )
  if (input) {
    e.preventDefault()
    input.focus()
  }
}

const handleOpenUpdate = (val: boolean) => {
  emit('update:open', val)
  if (!val) {
    emit('close')
  }
}
</script>
