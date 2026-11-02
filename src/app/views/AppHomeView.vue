<template>
  <div class="space-y-6">
    <!-- Encabezado de página -->
    <PageHeader
      title="Inicio"
      description="Resumen operativo del negocio y métricas en tiempo real."
    />

    <!-- 4 Tarjetas Esqueleto (Dashboard Placeholder) -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in skeletonCards"
        :key="card.id"
        class="shadow-xs rounded-xl border border-border-subtle bg-surface-card p-5"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-content-muted">{{ card.label }}</span>
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken text-content-muted"
          >
            <component :is="card.icon" class="h-4 w-4" aria-hidden="true" />
          </div>
        </div>

        <!-- Barras de carga esqueleto animadas -->
        <div class="mt-4 animate-pulse space-y-2">
          <div class="h-7 w-24 rounded-md bg-surface-sunken"></div>
          <div class="bg-surface-sunken/80 h-3 w-36 rounded-md"></div>
        </div>
      </div>
    </div>

    <!-- Panel colapsable de información de sesión (solo DEV + MOCKS) -->
    <div
      v-if="isDevWithMocks"
      class="shadow-xs overflow-hidden rounded-xl border border-border-subtle bg-surface-card"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between p-4 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-expanded="isDevPanelOpen"
        @click="isDevPanelOpen = !isDevPanelOpen"
      >
        <div class="flex items-center gap-2">
          <Terminal class="h-4 w-4 text-amber-500" aria-hidden="true" />
          <span>Información de sesión (solo desarrollo)</span>
        </div>
        <ChevronDown
          class="h-4 w-4 text-content-muted transition-transform duration-200"
          :class="{ 'rotate-180': isDevPanelOpen }"
          aria-hidden="true"
        />
      </button>

      <div
        v-if="isDevPanelOpen"
        class="bg-surface-sunken/40 space-y-4 border-t border-border-subtle p-5"
      >
        <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex items-center gap-3">
            <div
              class="border-primary/20 bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold text-primary"
            >
              {{ initials }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-content-primary">
                  {{ authStore.user?.fullName }}
                </span>
                <span
                  class="inline-block rounded-md border border-border-subtle bg-surface-sunken px-2 py-0.5 text-[10px] font-medium text-content-secondary"
                >
                  {{ authStore.user?.role }}
                </span>
              </div>
              <p class="mt-0.5 font-mono text-xs text-content-muted">
                @{{ authStore.user?.username }} • ID: {{ authStore.user?.id }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-sunken px-3 py-1 text-xs text-content-secondary"
            >
              <ShieldCheck class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{{ authStore.permissions.length }} permisos activos</span>
            </span>
          </div>
        </div>

        <!-- Lista compacta de permisos para depuración -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          <span
            v-for="perm in authStore.permissions"
            :key="perm"
            class="rounded border border-border-subtle bg-surface-card px-2 py-0.5 font-mono text-[10px] text-content-muted"
          >
            {{ perm }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  TrendingUp,
  Receipt,
  Landmark,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  ChevronDown,
} from 'lucide-vue-next'
import { useAuthStore } from '../../features/auth/stores/authStore'
import PageHeader from '../../shared/ui/PageHeader.vue'

const authStore = useAuthStore()

const skeletonCards = [
  { id: 'sales-today', label: 'Ventas de hoy', icon: TrendingUp },
  { id: 'tickets-count', label: 'Tickets emitidos', icon: Receipt },
  { id: 'cash-status', label: 'Estado de caja', icon: Landmark },
  { id: 'low-stock', label: 'Stock crítico', icon: AlertTriangle },
]

const initials = computed(() => {
  const name = authStore.user?.fullName || authStore.user?.username || 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const isDevWithMocks = computed(() => {
  return import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'
})

const isDevPanelOpen = ref(false)
</script>
