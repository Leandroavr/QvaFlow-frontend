<template>
  <TabsRoot :model-value="modelValue" @update:model-value="handleUpdate">
    <!-- Lista de Pestañas con estilo subrayado -->
    <TabsList class="flex gap-1 border-b border-border-subtle" aria-label="Pestañas de navegación">
      <TabsTrigger
        v-for="item in items"
        :key="item.id"
        :value="item.id"
        :disabled="item.disabled"
        :class="[
          'group relative flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors',
          'text-content-muted hover:text-content-primary',
          'rounded-t-lg focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'data-[state=active]:font-semibold data-[state=active]:text-primary',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
        ]"
      >
        <span>{{ item.label }}</span>

        <!-- Contador opcional por pestaña -->
        <span
          v-if="item.count !== undefined"
          :class="[
            'inline-flex items-center rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none transition-colors',
            'group-data-[state=active]:bg-primary/10 bg-surface-sunken text-content-secondary group-data-[state=active]:text-primary',
          ]"
        >
          {{ item.count }}
        </span>

        <!-- Línea activa inferior -->
        <span
          class="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 bg-primary transition-transform duration-150 group-data-[state=active]:scale-x-100"
          aria-hidden="true"
        />
      </TabsTrigger>
    </TabsList>

    <!-- Contenido de las pestañas -->
    <TabsContent
      v-for="item in items"
      :key="`content-${item.id}`"
      :value="item.id"
      class="rounded-lg pt-4 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <slot :name="item.id">
        <slot />
      </slot>
    </TabsContent>
  </TabsRoot>
</template>

<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'

export interface TabItem {
  id: string
  label: string
  count?: number | string
  disabled?: boolean
}

interface Props {
  modelValue?: string
  items: TabItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const handleUpdate = (val: string) => {
  emit('update:modelValue', val)
}
</script>
