<template>
  <header
    class="shadow-xs sticky top-0 z-30 flex h-14 min-h-[56px] w-full items-center justify-between border-b border-topbar-border bg-topbar-bg px-4 text-topbar-text transition-colors"
    role="banner"
  >
    <!-- Zona Izquierda: Botón de menú móvil + Breadcrumbs -->
    <div class="flex min-w-0 items-center gap-3">
      <!-- Botón de menú móvil (< 1024px) -->
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg text-topbar-text-muted hover:bg-topbar-hover hover:text-topbar-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
        aria-label="Abrir menú de navegación"
        @click="$emit('open-mobile')"
      >
        <Menu class="h-5 w-5" aria-hidden="true" />
      </button>

      <!-- Migas de pan (Breadcrumbs) -->
      <nav class="flex items-center gap-1.5 text-xs font-medium" aria-label="Migas de pan">
        <router-link
          to="/"
          class="flex items-center gap-1 rounded px-1 py-0.5 text-topbar-text-muted transition-colors hover:text-topbar-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Ir a Inicio"
        >
          <Home class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span class="hidden sm:inline">Inicio</span>
        </router-link>

        <template v-if="breadcrumbs.length > 0">
          <ChevronRight class="text-topbar-text-muted/60 h-3.5 w-3.5 shrink-0" aria-hidden="true" />

          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.label">
            <span
              v-if="index === breadcrumbs.length - 1"
              class="max-w-[180px] truncate font-semibold text-topbar-text sm:max-w-xs"
              aria-current="page"
            >
              {{ crumb.label }}
            </span>
            <template v-else>
              <span class="max-w-[120px] truncate text-topbar-text-muted">
                {{ crumb.label }}
              </span>
              <ChevronRight
                class="text-topbar-text-muted/60 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
            </template>
          </template>
        </template>
      </nav>
    </div>

    <!-- Zona Derecha: Estado de Servidor, ThemeToggle y Menú de Usuario -->
    <div class="flex items-center gap-3">
      <!-- Estado del Servidor Local (Reutiliza StatusDot) -->
      <div
        class="bg-surface-subtle/50 hidden items-center rounded-lg border border-border-subtle px-2.5 py-1 sm:flex"
        :title="'Conexión con el backend Symfony en red local'"
      >
        <StatusDot :status="serverStatus" :show-label="true" />
      </div>

      <!-- Icono simplificado en pantallas muy pequeñas -->
      <div class="flex items-center sm:hidden" title="Conexión de servidor">
        <StatusDot :status="serverStatus" :show-label="false" />
      </div>

      <!-- Selector de Tema (onDark=false según especificación) -->
      <ThemeToggle :on-dark="false" />

      <!-- Menú desplegable de usuario -->
      <div ref="userMenuRef" class="relative">
        <button
          type="button"
          :class="[
            'flex items-center gap-2 rounded-lg p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            userMenuOpen ? 'bg-topbar-hover' : 'hover:bg-topbar-hover',
          ]"
          :aria-expanded="userMenuOpen"
          aria-haspopup="true"
          aria-label="Menú de perfil de usuario"
          @click="toggleUserMenu"
          @keydown.escape="closeUserMenu"
        >
          <!-- Avatar con iniciales -->
          <div
            class="bg-primary/10 border-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-primary"
          >
            {{ initials }}
          </div>

          <!-- Nombre y Rol (visible en escritorio) -->
          <div class="hidden flex-col text-left leading-tight md:flex">
            <span class="max-w-[130px] truncate text-xs font-semibold text-topbar-text">
              {{ authStore.user?.fullName || authStore.user?.username }}
            </span>
            <span class="max-w-[130px] truncate text-[10px] text-topbar-text-muted">
              {{ authStore.user?.role }}
            </span>
          </div>

          <ChevronDown
            class="hidden h-3.5 w-3.5 text-topbar-text-muted md:block"
            aria-hidden="true"
          />
        </button>

        <!-- Dropdown del usuario -->
        <div
          v-if="userMenuOpen"
          class="border-border-default animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-1.5 w-56 rounded-xl border bg-surface-card p-2 text-content-primary shadow-lg ring-1 ring-black/5 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          <!-- Info de usuario dentro del menú -->
          <div class="border-b border-border-subtle px-3 py-2">
            <p class="truncate text-xs font-bold text-content-primary">
              {{ authStore.user?.fullName }}
            </p>
            <p class="truncate font-mono text-[11px] text-content-muted">
              @{{ authStore.user?.username }}
            </p>
            <div class="mt-1.5">
              <span
                class="bg-primary/10 inline-block rounded px-2 py-0.5 text-[10px] font-semibold text-primary"
                title="Rol asignado (solo informativo en el frontend)"
              >
                {{ authStore.user?.role }}
              </span>
            </div>
          </div>

          <!-- Opciones de menú -->
          <div class="py-1">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-state-error transition-colors hover:bg-state-error-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-state-error"
              role="menuitem"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Home, ChevronRight, ChevronDown, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../../features/auth/stores/authStore'
import StatusDot, { type ServerConnectionStatus } from '../../shared/ui/StatusDot.vue'
import ThemeToggle from '../../shared/ui/ThemeToggle.vue'

interface Props {
  serverStatus: ServerConnectionStatus
}

defineProps<Props>()

defineEmits<{
  (e: 'open-mobile'): void
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Breadcrumbs reactivos calculados desde meta
const breadcrumbs = computed(() => {
  const crumbs: { label: string }[] = []
  if (route.path === '/') {
    return crumbs
  }

  if (route.meta.parentBreadcrumb) {
    crumbs.push({ label: String(route.meta.parentBreadcrumb) })
  }
  if (route.meta.breadcrumb) {
    crumbs.push({ label: String(route.meta.breadcrumb) })
  } else if (route.meta.title) {
    crumbs.push({ label: String(route.meta.title).split('-')[0].trim() })
  }

  return crumbs
})

// Iniciales del usuario
const initials = computed(() => {
  const name = authStore.user?.fullName || authStore.user?.username || 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

// Control del menú desplegable de usuario
const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

// Click fuera para cerrar el menú desplegable
const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    closeUserMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = async () => {
  closeUserMenu()
  await authStore.logout()
  router.replace('/login')
}
</script>
