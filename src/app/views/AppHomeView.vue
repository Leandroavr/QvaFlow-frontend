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

    <!-- Panel de bienvenida e información de sesión -->
    <div class="shadow-xs rounded-xl border border-border-subtle bg-surface-card p-6">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div class="flex items-center gap-4">
          <div
            class="bg-primary/10 border-primary/20 flex h-12 w-12 items-center justify-center rounded-full border text-lg font-bold text-primary"
          >
            {{ initials }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-content-primary">
                {{ authStore.user?.fullName }}
              </h2>
              <span
                class="bg-primary/10 border-primary/20 rounded-full border px-2 py-0.5 text-[11px] font-semibold text-primary"
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
            class="border-border-default inline-flex items-center gap-1.5 rounded-lg border bg-surface-subtle px-3 py-1 text-xs text-content-secondary"
          >
            <ShieldCheck class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{{ authStore.permissions.length }} permisos activos</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, Receipt, Landmark, AlertTriangle, ShieldCheck } from 'lucide-vue-next'
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
</script>
