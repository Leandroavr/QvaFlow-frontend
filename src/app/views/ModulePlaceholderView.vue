<template>
  <div class="space-y-6">
    <PageHeader :title="pageTitle" :description="pageDescription" />

    <div class="shadow-xs rounded-xl border border-border-subtle bg-surface-card p-10 text-center">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      >
        <Construction class="h-8 w-8" aria-hidden="true" />
      </div>

      <h2 class="text-lg font-bold text-content-primary">Módulo en construcción</h2>
      <p class="mx-auto mt-2 max-w-md text-xs text-content-muted">
        Esta sección de QvaFlow se encuentra actualmente en desarrollo y se integrará de forma
        desacoplada con la capa de servicios.
      </p>

      <div
        v-if="requiredPermission"
        class="mt-6 inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-sunken px-3 py-1.5 text-xs text-content-secondary"
      >
        <span class="font-medium text-content-muted">Permiso requerido:</span>
        <code class="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
          {{ requiredPermission }}
        </code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Construction } from 'lucide-vue-next'
import PageHeader from '../../shared/ui/PageHeader.vue'

const route = useRoute()

const pageTitle = computed(() => {
  return (route.meta.breadcrumb as string) || (route.meta.title as string) || 'Módulo'
})

const pageDescription = computed(() => {
  return `Espacio reservado para la vista ${pageTitle.value.toLowerCase()} en QvaFlow POS.`
})

const requiredPermission = computed(() => {
  return (route.meta.permission as string) || null
})
</script>
