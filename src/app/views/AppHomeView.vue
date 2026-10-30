<template>
  <div class="min-h-screen bg-surface-app text-content-primary flex flex-col">
    <!-- Barra superior de navegación / cabecera -->
    <header class="bg-surface-card border-b border-border-default px-6 py-4 flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="QvaFlow"
          class="h-8 w-auto object-contain"
        />
        <div>
          <h1 class="text-sm font-bold text-content-primary m-0 leading-tight">
            QvaFlow POS
          </h1>
          <span class="text-[11px] text-content-muted">
            Panel de Inicio (Placeholder SPA)
          </span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Indicador de Servidor -->
        <StatusDot :status="uiStore.serverStatus" />
        <!-- Selector de Tema -->
        <ThemeToggle />
        <!-- Botón Cerrar Sesión -->
        <BaseButton
          variant="secondary"
          size="sm"
          class="gap-1.5"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4 text-content-muted" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </BaseButton>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
      <!-- Tarjeta de bienvenida de usuario -->
      <div class="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
              {{ initials }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-content-primary m-0">
                  {{ authStore.user?.fullName }}
                </h2>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {{ authStore.user?.role }}
                </span>
              </div>
              <p class="text-xs text-content-muted mt-1 mb-0 font-mono">
                @{{ authStore.user?.username }} • ID: {{ authStore.user?.id }}
              </p>
            </div>
          </div>

          <BaseButton
            variant="danger"
            size="md"
            class="w-full sm:w-auto"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Cerrar Sesión</span>
          </BaseButton>
        </div>
      </div>

      <!-- Sección de Permisos Activos RBAC Dinámicos -->
      <div class="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h3 class="text-sm font-bold text-content-primary m-0 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Permisos Asignados en Sesión (RBAC Dinámico)</span>
            </h3>
            <p class="text-xs text-content-muted mt-1 mb-0">
              El frontend evalúa únicamente permisos con formato <code>modulo.accion</code>, nunca nombres fijos de rol.
            </p>
          </div>
          <span class="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-md">
            {{ authStore.permissions.length }} permisos
          </span>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="perm in authStore.permissions"
            :key="perm"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-subtle border border-border-default text-content-secondary"
          >
            <Check class="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>{{ perm }}</span>
          </span>
        </div>
      </div>

      <!-- Demostración del componente visual <Can> y permisos de costos -->
      <div class="bg-surface-card border border-border-default rounded-xl p-6 shadow-sm space-y-3">
        <h3 class="text-sm font-bold text-content-primary m-0 flex items-center gap-2">
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
