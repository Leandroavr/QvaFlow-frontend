<template>
  <div
    :class="['shrink-0 transition-all duration-200 ease-in-out', collapsed ? 'lg:w-16' : 'lg:w-60']"
  >
    <!-- Backdrop móvil (pantallas < 1024px) -->
    <div
      v-if="mobileOpen"
      class="backdrop-blur-xs fixed inset-0 z-[var(--z-sidebar)] bg-black/60 transition-opacity lg:hidden"
      aria-hidden="true"
      @click="$emit('close-mobile')"
    />

    <!-- Panel Sidebar (100% de la altura del viewport) -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-[var(--z-sidebar)] flex h-dvh flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-text shadow-xl transition-all duration-200 ease-in-out',
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
          class="flex items-center gap-2 rounded-md p-1 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-bg"
          title="QvaFlow - Inicio"
        >
          <img :src="logoHorizontalWhite" alt="QvaFlow Logo" class="h-7 w-auto object-contain" />
        </router-link>

        <!-- Emblema / Icono colapsado (en placa clara redondeada de 32px y alto contraste) -->
        <router-link
          v-else
          to="/"
          class="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-white/20 transition-all hover:bg-slate-100 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-bg"
          title="QvaFlow - Inicio"
        >
          <img :src="logoIcon" alt="QvaFlow" class="h-8 w-8 object-contain" />
        </router-link>

        <!-- Botón cerrar para vista móvil -->
        <button
          v-if="mobileOpen"
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:hidden"
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
                  'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                  isActiveRoute(item.to)
                    ? 'shadow-xs bg-sidebar-active font-semibold text-white'
                    : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                  collapsed && !mobileOpen ? 'justify-center' : '',
                ]"
                :aria-current="isActiveRoute(item.to) ? 'page' : undefined"
                :title="item.label"
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

                <span v-if="!collapsed || mobileOpen" class="truncate" :title="item.label">
                  {{ item.label }}
                </span>
              </router-link>
            </template>

            <!-- 2. Grupo con hijos (ej: Ventas, Caja, Inventario) -->
            <template v-else>
              <div class="relative">
                <!-- Botón de cabecera del grupo -->
                <button
                  type="button"
                  :data-sidebar-group="item.id"
                  :class="[
                    'group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                    'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    isGroupActive(item)
                      ? 'text-white'
                      : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                    collapsed && !mobileOpen ? 'justify-center' : 'justify-between',
                  ]"
                  :aria-expanded="isGroupOpen(item.id)"
                  :aria-haspopup="collapsed && !mobileOpen ? 'menu' : undefined"
                  :title="item.label"
                  @click="toggleGroup(item.id)"
                  @pointerenter="handleTriggerPointerEnter($event, item.id)"
                  @pointerleave="handleTriggerPointerLeave(item.id)"
                  @mouseenter="handleTriggerPointerEnter($event, item.id)"
                  @mouseleave="handleTriggerPointerLeave(item.id)"
                  @focusin="handleGroupFocusIn($event, item.id)"
                  @focusout="handleGroupFocusOut($event, item.id)"
                  @keydown="handleGroupKeydown($event, item.id)"
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
                          'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                          isActiveRoute(subItem.to)
                            ? 'shadow-xs bg-sidebar-active font-medium text-white'
                            : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                        ]"
                        :aria-current="isActiveRoute(subItem.to) ? 'page' : undefined"
                        :title="subItem.label"
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
                        <span class="truncate" :title="subItem.label">{{ subItem.label }}</span>
                      </router-link>
                    </li>
                  </ul>
                </transition>

                <!-- Popover flotante en Modo Colapsado con Teleport al body -->
                <Teleport to="body">
                  <div
                    v-if="activePopoverId === item.id && collapsed && !mobileOpen"
                    :id="`popover-${item.id}`"
                    class="fixed z-[var(--z-popover)] w-52 rounded-xl border border-border-subtle bg-sidebar-bg p-2 text-sidebar-text shadow-2xl ring-1 ring-black/20"
                    :style="{ top: `${popoverTop}px`, left: `${popoverLeft}px` }"
                    role="menu"
                    data-sidebar-popover
                    :aria-label="item.label"
                    tabindex="-1"
                    @pointerenter="handlePopoverPointerEnter"
                    @pointerleave="handlePopoverPointerLeave(item.id)"
                    @mouseenter="handlePopoverPointerEnter"
                    @mouseleave="handlePopoverPointerLeave(item.id)"
                    @keydown="handlePopoverKeydown"
                    @focusout="handlePopoverFocusOut($event, item.id)"
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
                            'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                            isActiveRoute(subItem.to)
                              ? 'shadow-xs bg-sidebar-active font-medium text-white'
                              : 'text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white',
                          ]"
                          :aria-current="isActiveRoute(subItem.to) ? 'page' : undefined"
                          :title="subItem.label"
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
                          <span class="truncate" :title="subItem.label">{{ subItem.label }}</span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </Teleport>
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
          class="hidden h-7 w-7 items-center justify-center rounded-md text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:flex"
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
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
const popoverLeft = ref<number>(70)
const lastTriggerElement = ref<HTMLElement | null>(null)
let closeTimeout: ReturnType<typeof setTimeout> | null = null
let isRestoringFocus = false

// Funciones de navegación y estado de grupos
const isGroupOpen = (groupId: string): boolean => {
  return openGroups.value.has(groupId)
}

const toggleGroup = (groupId: string) => {
  if (props.collapsed && !props.mobileOpen) {
    if (activePopoverId.value === groupId) {
      closePopover()
    } else {
      const trigger = document.querySelector(
        `[data-sidebar-group="${groupId}"]`
      ) as HTMLElement | null
      if (trigger) {
        openPopover(groupId, trigger)
      }
    }
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

const handleItemClick = (e?: Event) => {
  if (e && 'detail' in e && (e as MouseEvent).detail !== 0) {
    ;(e.currentTarget as HTMLElement)?.blur()
  }
  if (props.mobileOpen) {
    emit('close-mobile')
  }
}

// Control del Popover en modo colapsado
const cancelCloseTimer = () => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

const openPopover = (groupId: string, trigger: HTMLElement) => {
  if (!props.collapsed || props.mobileOpen) return
  cancelCloseTimer()
  lastTriggerElement.value = trigger
  const rect = trigger.getBoundingClientRect()
  popoverTop.value = Math.max(8, rect.top)
  popoverLeft.value = Math.round(rect.right + 6)
  activePopoverId.value = groupId
}

const scheduleClosePopover = (groupId?: string) => {
  if (!props.collapsed || props.mobileOpen) return
  cancelCloseTimer()
  closeTimeout = setTimeout(() => {
    // Si se especificó groupId, solo cerramos si el popover activo no ha cambiado
    if (!groupId || activePopoverId.value === groupId) {
      activePopoverId.value = null
    }
    closeTimeout = null
  }, 150)
}

const closePopover = (e?: Event) => {
  if (e && 'detail' in e && (e as MouseEvent).detail !== 0) {
    ;(e.currentTarget as HTMLElement)?.blur()
  }
  cancelCloseTimer()
  activePopoverId.value = null
}

const closePopoverAndRestoreFocus = () => {
  const trigger = lastTriggerElement.value
  closePopover()
  if (trigger && typeof trigger.focus === 'function') {
    isRestoringFocus = true
    trigger.focus()
    queueMicrotask(() => {
      isRestoringFocus = false
    })
  }
}

const handleTriggerPointerEnter = (event: Event, groupId: string) => {
  if (!props.collapsed || props.mobileOpen) return
  const el = event.currentTarget as HTMLElement
  const trigger = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el
  openPopover(groupId, trigger)
}

const handleTriggerPointerLeave = (groupId: string) => {
  if (!props.collapsed || props.mobileOpen) return
  scheduleClosePopover(groupId)
}

const handlePopoverPointerEnter = () => {
  cancelCloseTimer()
}

const handlePopoverPointerLeave = (groupId: string) => {
  scheduleClosePopover(groupId)
}

const handleGroupKeydown = (event: KeyboardEvent, groupId: string) => {
  if (props.collapsed && !props.mobileOpen) {
    const trigger = event.currentTarget as HTMLElement
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      if (activePopoverId.value === groupId) {
        closePopover()
      } else {
        openPopover(groupId, trigger)
      }
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      if (activePopoverId.value === groupId) {
        event.preventDefault()
        const popoverEl = document.querySelector(`[data-sidebar-popover]`)
        const firstLink = popoverEl?.querySelector('a') as HTMLElement | null
        firstLink?.focus()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        openPopover(groupId, trigger)
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closePopoverAndRestoreFocus()
    }
  } else {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      toggleGroup(groupId)
    }
  }
}

const handlePopoverKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' || event.key === 'ArrowLeft') {
    event.preventDefault()
    closePopoverAndRestoreFocus()
  }
}

const handleGroupFocusIn = (event: FocusEvent, groupId: string) => {
  if (isRestoringFocus) return
  if (!props.collapsed || props.mobileOpen) return
  const el = event.currentTarget as HTMLElement
  const trigger = el.tagName === 'BUTTON' ? el : el.querySelector('button') || el
  openPopover(groupId, trigger)
}

const handleGroupFocusOut = (event: FocusEvent, groupId: string) => {
  if (!props.collapsed || props.mobileOpen) return
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (
    relatedTarget &&
    (relatedTarget.closest('[data-sidebar-popover]') ||
      relatedTarget.closest('[data-sidebar-group]'))
  ) {
    return
  }
  scheduleClosePopover(groupId)
}

const handlePopoverFocusOut = (event: FocusEvent, groupId: string) => {
  if (!props.collapsed || props.mobileOpen) return
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (
    relatedTarget &&
    (relatedTarget.closest('[data-sidebar-popover]') ||
      relatedTarget.closest('[data-sidebar-group]'))
  ) {
    return
  }
  scheduleClosePopover(groupId)
}

const handleClickOutside = (event: MouseEvent | PointerEvent) => {
  if (!activePopoverId.value) return
  const target = event.target as HTMLElement | null
  if (
    target &&
    (target.closest('[data-sidebar-popover]') || target.closest('[data-sidebar-group]'))
  ) {
    return
  }
  closePopover()
}

const handleDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && activePopoverId.value) {
    closePopoverAndRestoreFocus()
  }
}

// Ciclo de vida y observadores
onMounted(() => {
  autoExpandActiveGroup()
  document.addEventListener('pointerdown', handleClickOutside)
  document.addEventListener('keydown', handleDocumentKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
  document.removeEventListener('keydown', handleDocumentKeyDown)
  cancelCloseTimer()
})

watch(
  () => route.path,
  () => {
    autoExpandActiveGroup()
    closePopover()
  },
  { immediate: true }
)
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
