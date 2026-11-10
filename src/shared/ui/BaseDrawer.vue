<template>
  <DialogRoot :open="open" @update:open="handleOpenUpdate">
    <DialogPortal>
      <!-- Fondo oscuro con desenfoque accesible -->
      <DialogOverlay
        class="backdrop-blur-xs animate-in fade-in fixed inset-0 z-50 bg-black/60 duration-200"
      />

      <!-- Panel Lateral Deslizante desde la derecha -->
      <DialogContent
        :class="[
          'fixed inset-y-0 right-0 z-50 flex h-dvh flex-col border-l border-border bg-surface-card text-content-primary shadow-2xl duration-200',
          'animate-in slide-in-from-right',
          sizeClasses[size],
        ]"
        @open-auto-focus="handleOpenAutoFocus"
      >
        <!-- Cabecera del Drawer -->
        <div class="flex shrink-0 items-start justify-between border-b border-border-subtle p-5">
          <div class="pr-4">
            <DialogTitle class="text-base font-bold text-content-primary">
              {{ title }}
            </DialogTitle>
            <DialogDescription v-if="description" class="mt-0.5 text-xs text-content-muted">
              {{ description }}
            </DialogDescription>
          </div>

          <!-- Botón de cierre accesible -->
          <DialogClose
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-sunken hover:text-content-primary focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar panel lateral"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </DialogClose>
        </div>

        <!-- Cuerpo del Drawer con scroll interno independiente -->
        <div class="flex-1 overflow-y-auto p-5 text-sm text-content-primary">
          <slot />
        </div>

        <!-- Pie de acciones -->
        <div
          v-if="$slots.actions"
          class="bg-surface-sunken/40 flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle px-5 py-3.5"
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

export type DrawerSize = 'sm' | 'md' | 'lg'

interface Props {
  open: boolean
  title: string
  description?: string
  size?: DrawerSize
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

const sizeClasses: Record<DrawerSize, string> = {
  sm: 'max-w-md w-full',
  md: 'max-w-lg w-full',
  lg: 'max-w-2xl w-full',
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
