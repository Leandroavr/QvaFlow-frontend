<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side"
          :side-offset="sideOffset"
          class="border-border-default animate-in fade-in zoom-in-95 z-50 select-none rounded-md border bg-surface-card px-2.5 py-1 text-xs font-medium text-content-primary shadow-md duration-100"
        >
          {{ content }}
          <TooltipArrow class="stroke-border-default fill-surface-card" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup lang="ts">
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui'

interface Props {
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  delayDuration?: number
}

withDefaults(defineProps<Props>(), {
  side: 'top',
  sideOffset: 4,
  delayDuration: 150,
})
</script>
