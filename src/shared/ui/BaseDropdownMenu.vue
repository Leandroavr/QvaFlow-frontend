<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="sideOffset"
        class="animate-in fade-in-80 zoom-in-95 z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-surface-card p-1 text-content-primary shadow-lg ring-1 ring-black/5 duration-100"
      >
        <template v-for="(item, index) in items" :key="item.id || index">
          <!-- Separador opcional previo al item -->
          <DropdownMenuSeparator v-if="item.separator" class="my-1 h-px bg-border-subtle" />

          <!-- Elemento del menú -->
          <DropdownMenuItem
            :disabled="item.disabled"
            :class="[
              'relative flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 text-xs outline-none transition-colors',
              'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
              item.danger
                ? 'text-state-error data-[highlighted]:bg-state-error-bg data-[highlighted]:text-state-error'
                : 'text-content-primary data-[highlighted]:bg-surface-sunken data-[highlighted]:text-content-primary',
            ]"
            @select="handleSelect(item)"
          >
            <!-- Icono opcional del item -->
            <component
              :is="item.icon"
              v-if="item.icon"
              :class="[
                'h-3.5 w-3.5 shrink-0',
                item.danger ? 'text-state-error' : 'text-content-muted',
              ]"
              aria-hidden="true"
            />

            <!-- Texto de la opción -->
            <span class="flex-1 truncate">{{ item.label }}</span>

            <!-- Atajo de teclado visual opcional -->
            <span v-if="item.shortcut" class="ml-auto font-mono text-[10px] text-content-muted">
              {{ item.shortcut }}
            </span>
          </DropdownMenuItem>
        </template>

        <!-- Slot por defecto para items libres si se prefiere template libre -->
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'

export interface DropdownMenuItemConfig {
  id: string
  label: string
  icon?: Component
  danger?: boolean
  disabled?: boolean
  separator?: boolean
  shortcut?: string
  onClick?: () => void
}

interface Props {
  items?: DropdownMenuItemConfig[]
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

withDefaults(defineProps<Props>(), {
  items: () => [],
  align: 'end',
  sideOffset: 4,
})

const emit = defineEmits<{
  (e: 'select', itemId: string): void
}>()

const handleSelect = (item: DropdownMenuItemConfig) => {
  if (item.disabled) return
  if (item.onClick) {
    item.onClick()
  }
  emit('select', item.id)
}
</script>
