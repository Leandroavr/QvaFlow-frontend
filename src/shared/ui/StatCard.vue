<template>
  <div class="shadow-xs rounded-xl border border-border-subtle bg-surface-card p-4 sm:p-5">
    <!-- Encabezado: Etiqueta e Icono neutro opcional -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <span class="truncate text-xs font-medium text-content-muted">
          {{ label }}
        </span>
        <slot name="badge" />
      </div>
      <div v-if="icon || $slots.icon" class="shrink-0 text-content-muted" aria-hidden="true">
        <slot name="icon">
          <component :is="icon" class="h-4 w-4" />
        </slot>
      </div>
    </div>

    <!-- Estado Loading con Skeleton -->
    <template v-if="loading">
      <div class="mt-3 space-y-2" aria-busy="true" aria-live="polite">
        <BaseSkeleton height="1.75rem" width="60%" rounded="rounded-md" />
        <BaseSkeleton v-if="description || trend" height="0.875rem" width="80%" rounded="rounded" />
      </div>
    </template>

    <!-- Estado Normal -->
    <template v-else>
      <!-- Valor destacado -->
      <div
        :class="[
          'mt-2 flex flex-wrap items-baseline gap-2 text-2xl font-bold tracking-tight',
          valueClass || 'text-content-primary',
        ]"
      >
        <slot name="value">{{ value }}</slot>
        <slot name="value-extra" />
      </div>

      <!-- Texto secundario y/o tendencia -->
      <div
        v-if="description || trend || $slots.footer"
        class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-content-muted"
      >
        <!-- Tendencia opcional -->
        <div
          v-if="trend"
          :class="[
            'inline-flex items-center gap-1 font-medium',
            trend.direction === 'up' && 'text-state-success',
            trend.direction === 'down' && 'text-state-error',
            (!trend.direction || trend.direction === 'neutral') && 'text-content-muted',
          ]"
        >
          <TrendingUp
            v-if="trend.direction === 'up'"
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <TrendingDown
            v-else-if="trend.direction === 'down'"
            class="h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <Minus v-else class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{{ trend.value }}</span>
          <span v-if="trend.label" class="font-normal text-content-muted">{{ trend.label }}</span>
        </div>

        <!-- Descripción secundaria -->
        <span v-if="description" class="line-clamp-2" :title="description">
          {{ description }}
        </span>

        <slot name="footer" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import BaseSkeleton from './BaseSkeleton.vue'

export interface StatTrend {
  value: string | number
  label?: string
  direction?: 'up' | 'down' | 'neutral'
}

interface Props {
  label: string
  value: string | number
  description?: string
  trend?: StatTrend
  loading?: boolean
  icon?: Component
  valueClass?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  loading: false,
  valueClass: '',
})
</script>
