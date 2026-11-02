<template>
  <div
    :class="['shrink-0 transition-all duration-200 ease-in-out', collapsed ? 'lg:w-16' : 'lg:w-60']"
  >
    <!-- Backdrop móvil (pantallas < 1024px) -->
    <div
      v-if="mobileOpen"
      class="backdrop-blur-xs fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden"
      aria-hidden="true"
      @click="$emit('close-mobile')"
    />

    <!-- Panel Sidebar (100% de la altura del viewport) -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text shadow-xl transition-all duration-200 ease-in-out',
        // Comportamiento en escritorio (>= 1024px)
        'lg:static lg:z-auto lg:shadow-none',
        collapsed ? 'w-60 lg:w-16' : 'w-60',
        // Comportamiento en móvil (< 1024px)
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
      aria-label="Navegación principal"
    >
      <!-- Cabecera del Sidebar: Logo y botón de cerrar en móvil (56px) -->
      <div
        class="flex h-14 min-h-[56px] shrink-0 items-center border-b border-sidebar-border px-3"
        :class="collapsed ? 'justify-center' : 'justify-between'"
      >
        <!-- Logo expandido -->
        <router-link
          v-if="!collapsed || mobileOpen"
          to="/"
          class="flex items-center gap-2 rounded-md p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-bg"
          title="QvaFlow - Inicio"
        >
          <img :src="logoHorizontalWhite" alt="QvaFlow Logo" class="h-7 w-auto object-contain" />
        </router-link>

        <!-- Emblema / Icono colapsado (en placa redondeada) -->
        <router-link
          v-else
          to="/"
          class="shadow-xs flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 p-1 transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-bg"
          title="QvaFlow - Inicio"
        >
          <img :src="logoIcon" alt="QvaFlow" class="h-6 w-6 object-contain" />
        </router-link>

        <!-- Botón cerrar para vista móvil -->
        <button
          v-if="mobileOpen"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
          aria-label="Cerrar menú"
          @click="$emit('close-mobile')"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <!-- Navegación con scroll interno -->
      <nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="Menú de módulos">
        <ul class="space-y-1">
          <li v-for="item in menu" :key="item.id">
            <!-- 1. Ítem simple directo (ej: Inicio) -->
            <template v-if="!item.children || item.children.length === 0">
              <router-link
                :to="item.to || '/'"
                :class="[
                  'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                  isActiveRoute(item.to)
                    ? 'shadow-xs bg-sidebar-active font-semibold text-white'
                    : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                  collapsed && !mobileOpen ? 'justify-center' : '',
                ]"
                :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
                :title="collapsed && !mobileOpen ? item.label : undefined"
                @click="handleItemClick"
              >
                <!-- Indicador activo lateral -->
                <span
                  v-if="isActiveRoute(item.to)"
                  class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-sky-400"
                  aria-hidden="true"
                />

                <component
                  :is="item.icon"
                  class="h-4 w-4 shrink-0 transition-transform group-hover:scale-105"
                  :class="
                    isActiveRoute(item.to)
                      ? 'text-sky-300'
                      : 'text-sidebar-text-muted group-hover:text-white'
                  "
                  aria-hidden="true"
                />

                <span v-if="!collapsed || mobileOpen" class="truncate">
                  {{ item.label }}
                </span>
              </router-link>
            </template>

            <!-- 2. Grupo con hijos (ej: Ventas, Caja, Inventario) -->
            <template v-else>
              <div
                class="relative"
                @mouseenter="handleGroupMouseEnter($event, item.id)"
                @mouseleave="handleGroupMouseLeave"
              >
                <!-- Botón de cabecera del grupo -->
                <button
                  type="button"
                  :class="[
                    'group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    isGroupActive(item)
                      ? 'text-white'
                      : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                    collapsed && !mobileOpen ? 'justify-center' : 'justify-between',
                  ]"
                  :aria-expanded="isGroupOpen(item.id)"
                  :aria-haspopup="collapsed && !mobileOpen ? 'menu' : undefined"
                  :title="collapsed && !mobileOpen ? item.label : undefined"
                  @click="toggleGroup(item.id)"
                  @focusin="handleGroupFocusIn($event, item.id)"
                  @focusout="handleGroupFocusOut"
                  @keydown.enter.prevent="toggleGroup(item.id)"
                  @keydown.space.prevent="toggleGroup(item.id)"
                  @keydown.escape="closePopover"
                >
                  <!-- Indicador de grupo activo si está colapsado -->
                  <span
                    v-if="collapsed && !mobileOpen && isGroupActive(item)"
                    class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-sky-400"
                    aria-hidden="true"
                  />

                  <div
                    class="flex min-w-0 items-center gap-3"
                    :class="collapsed && !mobileOpen ? 'justify-center' : ''"
                  >
                    <component
                      :is="item.icon"
                      class="h-4 w-4 shrink-0 transition-transform group-hover:scale-105"
                      :class="
                        isGroupActive(item)
                          ? 'text-sky-300'
                          : 'text-sidebar-text-muted group-hover:text-white'
                      "
                      aria-hidden="true"
                    />
                    <span v-if="!collapsed || mobileOpen" class="truncate">
                      {{ item.label }}
                    </span>
                  </div>

                  <!-- Flecha Chevron expandible -->
                  <div v-if="!collapsed || mobileOpen" class="shrink-0">
                    <ChevronDown
                      v-if="isGroupOpen(item.id)"
                      class="h-3.5 w-3.5 text-sidebar-text-muted transition-transform"
                      aria-hidden="true"
                    />
                    <ChevronRight
                      v-else
                      class="h-3.5 w-3.5 text-sidebar-text-muted transition-transform"
                      aria-hidden="true"
                    />
                  </div>
                </button>

                <!-- Submenú de hijos en Modo Expandido (con animación suave y sangría) -->
                <transition name="submenu">
                  <ul
                    v-if="(!collapsed || mobileOpen) && isGroupOpen(item.id)"
                    class="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-4"
                  >
                    <li v-for="subItem in item.children" :key="subItem.id">
                      <router-link
                        :to="subItem.to || '/'"
                        :class="[
                          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                          isActiveRoute(subItem.to)
                            ? 'shadow-xs bg-sidebar-active font-medium text-white'
                            : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                        ]"
                        :aria-current="isActiveRoute(subItem.to) ? 'page' : undefined"
                        @click="handleItemClick"
                      >
                        <!-- Indicador activo de submódulo -->
                        <span
                          v-if="isActiveRoute(subItem.to)"
                          class="absolute -left-[17px] bottom-1.5 top-1.5 w-1 rounded-r bg-sky-400"
                          aria-hidden="true"
                        />

                        <component
                          :is="subItem.icon"
                          class="h-3.5 w-3.5 shrink-0"
                          :class="
                            isActiveRoute(subItem.to)
                              ? 'text-sky-300'
                              : 'text-sidebar-text-muted group-hover:text-white'
                          "
                          aria-hidden="true"
                        />
                        <span class="truncate">{{ subItem.label }}</span>
                      </router-link>
                    </li>
                  </ul>
                </transition>

                <!-- Popover flotante en Modo Colapsado (hover o foco de teclado) -->
                <div
                  v-if="activePopoverId === item.id && collapsed && !mobileOpen"
                  class="fixed left-16 z-50 ml-1.5 w-52 rounded-xl border border-border-subtle bg-sidebar-bg p-2 text-sidebar-text shadow-2xl ring-1 ring-black/20"
                  :style="{ top: `${popoverTop}px` }"
                  role="menu"
                  :aria-label="item.label"
                  @mouseenter="cancelPopoverClose"
                  @mouseleave="handleGroupMouseLeave"
                  @keydown.escape="closePopover"
                >
                  <!-- Cabecera del popover -->
                  <div
                    class="mb-1.5 flex items-center justify-between border-b border-sidebar-border px-2.5 py-1"
                  >
                    <span class="text-xs font-bold text-white">{{ item.label }}</span>
                    <span class="text-[10px] text-sidebar-text-muted"
                      >{{ item.children?.length }} opciones</span
                    >
                  </div>

                  <!-- Lista de submódulos -->
                  <ul class="space-y-0.5">
                    <li v-for="subItem in item.children" :key="subItem.id">
                      <router-link
                        :to="subItem.to || '/'"
                        :class="[
                          'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                          isActiveRoute(subItem.to)
                            ? 'shadow-xs bg-sidebar-active font-medium text-white'
                            : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                        ]"
                        :aria-current="isActiveRoute(subItem.to) ? 'page' : undefined"
                        role="menuitem"
                        @click="closePopover"
                      >
                        <span
                          v-if="isActiveRoute(subItem.to)"
                          class="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-sky-400"
                          aria-hidden="true"
                        />
                        <component
                          :is="subItem.icon"
                          class="h-4 w-4 shrink-0"
                          :class="
                            isActiveRoute(subItem.to)
                              ? 'text-sky-300'
                              : 'text-sidebar-text-muted group-hover:text-white'
                          "
                          aria-hidden="true"
                        />
                        <span class="truncate">{{ subItem.label }}</span>
                      </router-link>
                    </li>
                  </ul>
                </div>
              </div>
            </template>
          </li>
        </ul>
      </nav>

      <!-- Pie del Sidebar: Botón colapsar y versión de la app pegado abajo -->
      <div
        class="bg-sidebar-bg/60 mt-auto flex shrink-0 items-center justify-between border-t border-sidebar-border p-2.5"
        :class="collapsed ? 'flex-col gap-2' : ''"
      >
        <!-- Versión de la app -->
        <span
          class="font-mono text-[11px] text-sidebar-text-muted"
          :title="'QvaFlow POS Desktop v1.0.0 (Modo Red Local)'"
        >
          {{ collapsed && !mobileOpen ? 'v1.0' : 'v1.0.0 (Local)' }}
        </span>

        <!-- Botón de colapsar / expandir (Escritorio) -->
        <button
          type="button"
          class="hidden h-7 w-7 items-center justify-center rounded-md text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:flex"
          :aria-label="
            collapsed ? 'Expandir barra lateral (Ctrl+B)' : 'Colapsar barra lateral (Ctrl+B)'
          "
          :title="collapsed ? 'Expandir (Ctrl+B)' : 'Colapsar (Ctrl+B)'"
          @click="$emit('toggle-collapse')"
        >
          <PanelLeftOpen v-if="collapsed" class="h-4 w-4" aria-hidden="true" />
          <PanelLeftClose v-else class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { X, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { useNavigationMenu, type MenuItem } from '../navigation/menu'
import logoHorizontalWhite from '../../assets/logo-horizontal-white.png'
import logoIcon from '../../assets/logo-icon.png'

interface Props {
  collapsed: boolean
  mobileOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
  (e: 'close-mobile'): void
}>()

const route = useRoute()
const menu = useNavigationMenu()

// Estado reactivo de grupos abiertos en modo expandido
const openGroups = ref<Set<string>>(new Set())

// Estado reactivo de popovers flotantes en modo colapsado
const activePopoverId = ref<string | null>(null)
const popoverTop = ref<number>(0)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

const isGroupOpen = (groupId: string): boolean => {
  return openGroups.value.has(groupId)
}

const toggleGroup = (groupId: string) => {
  if (props.collapsed && !props.mobileOpen) {
    // Si está colapsado, al hacer clic en un grupo expandimos el sidebar
    emit('toggle-collapse')
    openGroups.value.add(groupId)
    activePopoverId.value = null
    return
  }

  const newSet = new Set(openGroups.value)
  if (newSet.has(groupId)) {
    newSet.delete(groupId)
  } else {
    newSet.add(groupId)
  }
  openGroups.value = newSet
}

const isActiveRoute = (path?: string): boolean => {
  if (!path) return false
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

const isGroupActive = (item: MenuItem): boolean => {
  if (!item.children) return false
  return item.children.some((child) => isActiveRoute(child.to))
}

// Abrir automáticamente el grupo que contiene la ruta activa
const autoExpandActiveGroup = () => {
  menu.value.forEach((item) => {
    if (item.children && isGroupActive(item)) {
      openGroups.value.add(item.id)
    }
  })
}

onMounted(() => {
  autoExpandActiveGroup()
})

watch(
  () => route.path,
  () => {
    autoExpandActiveGroup()
    closePopover()
  },
  { immediate: true }
)

const handleItemClick = () => {
  if (props.mobileOpen) {
    emit('close-mobile')
  }
}

// Control del Popover en modo colapsado
const handleGroupMouseEnter = (event: MouseEvent, groupId: string) => {
  if (!props.collapsed || props.mobileOpen) return
  if (closeTimeout) clearTimeout(closeTimeout)

  const trigger = event.currentTarget as HTMLElement
  const rect = trigger.getBoundingClientRect()
  popoverTop.value = Math.max(8, rect.top)
  activePopoverId.value = groupId
}

const handleGroupMouseLeave = () => {
  if (!props.collapsed || props.mobileOpen) return
  closeTimeout = setTimeout(() => {
    activePopoverId.value = null
  }, 150)
}

const cancelPopoverClose = () => {
  if (closeTimeout) clearTimeout(closeTimeout)
}

const handleGroupFocusIn = (event: FocusEvent, groupId: string) => {
  if (!props.collapsed || props.mobileOpen) return
  if (closeTimeout) clearTimeout(closeTimeout)

  const trigger = event.currentTarget as HTMLElement
  const rect = trigger.getBoundingClientRect()
  popoverTop.value = Math.max(8, rect.top)
  activePopoverId.value = groupId
}

const handleGroupFocusOut = (event: FocusEvent) => {
  if (!props.collapsed || props.mobileOpen) return
  // Si el foco se mueve a un hijo dentro del popover, mantener abierto
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (relatedTarget && relatedTarget.closest('[role="menu"]')) {
    return
  }
  closeTimeout = setTimeout(() => {
    activePopoverId.value = null
  }, 150)
}

const closePopover = () => {
  if (closeTimeout) clearTimeout(closeTimeout)
  activePopoverId.value = null
}
</script>

<style scoped>
/* Animación suave de apertura de submódulos respetando prefers-reduced-motion */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease-in-out;
  max-height: 400px;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .submenu-enter-active,
  .submenu-leave-active {
    transition: none !important;
  }
}
</style>
