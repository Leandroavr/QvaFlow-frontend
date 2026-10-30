<template>
  <div class="flex min-h-screen flex-col bg-surface-app text-content-primary">
    <!-- Barra superior de navegación / cabecera -->
    <header
      class="border-border-default shadow-xs flex items-center justify-between border-b bg-surface-card px-6 py-4"
    >
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="QvaFlow" class="h-8 w-auto object-contain" />
        <div>
          <h1 class="m-0 text-sm font-bold leading-tight text-content-primary">QvaFlow POS</h1>
          <span class="text-[11px] text-content-muted"> Panel de Inicio (Placeholder SPA) </span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Indicador de Servidor -->
        <StatusDot :status="uiStore.serverStatus" />
        <!-- Selector de Tema -->
        <ThemeToggle />
        <!-- Botón Cerrar Sesión -->
        <BaseButton variant="secondary" size="sm" class="gap-1.5" @click="handleLogout">
          <LogOut class="h-4 w-4 text-content-muted" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </BaseButton>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6">
      <!-- Tarjeta de bienvenida de usuario -->
      <div class="border-border-default rounded-xl border bg-surface-card p-6 shadow-sm">
        <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex items-center gap-4">
            <div
              class="bg-primary/10 border-primary/20 flex h-14 w-14 items-center justify-center rounded-full border text-xl font-bold text-primary"
            >
              {{ initials }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="m-0 text-lg font-bold text-content-primary">
                  {{ authStore.user?.fullName }}
                </h2>
                <span
                  class="bg-primary/10 border-primary/20 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary"
                >
                  {{ authStore.user?.role }}
                </span>
              </div>
              <p class="mb-0 mt-1 font-mono text-xs text-content-muted">
                @{{ authStore.user?.username }} • ID: {{ authStore.user?.id }}
              </p>
            </div>
          </div>

          <BaseButton variant="danger" size="md" class="w-full sm:w-auto" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </BaseButton>
        </div>
      </div>

      <!-- Sección de Permisos Activos RBAC Dinámicos -->
      <div class="border-border-default space-y-4 rounded-xl border bg-surface-card p-6 shadow-sm">
        <div class="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h3 class="m-0 flex items-center gap-2 text-sm font-bold text-content-primary">
              <ShieldCheck class="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Permisos Asignados en Sesión (RBAC Dinámico)</span>
            </h3>
            <p class="mb-0 mt-1 text-xs text-content-muted">
              El frontend evalúa únicamente permisos con formato <code>modulo.accion</code>, nunca
              nombres fijos de rol.
            </p>
          </div>
          <span class="bg-primary/10 rounded-md px-2.5 py-1 text-xs font-bold text-primary">
            {{ authStore.permissions.length }} permisos
          </span>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="perm in authStore.permissions"
            :key="perm"
            class="border-border-default inline-flex items-center gap-1.5 rounded-lg border bg-surface-subtle px-3 py-1.5 font-mono text-xs font-medium text-content-secondary"
          >
            <Check class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>{{ perm }}</span>
          </span>
        </div>
      </div>

      <!-- Demostración del componente visual <Can> y permisos de costos -->
      <div class="border-border-default space-y-3 rounded-xl border bg-surface-card p-6 shadow-sm">
        <h3 class="m-0 flex items-center gap-2 text-sm font-bold text-content-primary">
          <span>Demostración de Control Visual con &lt;Can&gt;:</span>
        </h3>

        <!-- Control de Costos Sensibles -->
        <Can permission="products.view_cost">
          <template #default>
            <BaseAlert
              variant="success"
              title="Permiso products.view_cost activo"
              message="Este usuario tiene acceso a consultar precios de coste y márgenes de ganancia mayoristas."
            />
          </template>
          <template #fallback>
            <BaseAlert
              variant="warning"
              title="Permiso products.view_cost restringido"
              message="Este usuario NO tiene autorización para visualizar los costos de adquisición de mercancías."
            />
          </template>
        </Can>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, ShieldCheck, Check } from 'lucide-vue-next'
import { useAuthStore } from '../../features/auth/stores/authStore'
import { useUiStore } from '../../shared/stores/uiStore'
import BaseButton from '../../shared/ui/BaseButton.vue'
import BaseAlert from '../../shared/ui/BaseAlert.vue'
import StatusDot from '../../shared/ui/StatusDot.vue'
import ThemeToggle from '../../shared/ui/ThemeToggle.vue'
import Can from '../../shared/ui/Can.vue'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const initials = computed(() => {
  const name = authStore.user?.fullName || authStore.user?.username || 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const handleLogout = async () => {
  await authStore.logout()
  router.replace('/login')
}
</script>
