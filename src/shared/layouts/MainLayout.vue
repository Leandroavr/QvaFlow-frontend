<template>
  <a-layout class="min-h-screen bg-slate-100">
    <!-- Sidebar Colapsable -->
    <a-layout-sider
      v-model:collapsed="isCollapsed"
      :trigger="null"
      collapsible
      width="260"
      collapsed-width="80"
      class="min-h-screen border-r border-slate-800 shadow-md"
      style="background: #122645"
    >
      <!-- Logo y Nombre del Sistema -->
      <div
        class="shadow-xs flex h-16 shrink-0 items-center justify-center overflow-hidden border-b border-slate-200 bg-white px-3"
      >
        <div v-if="!isCollapsed" class="flex w-full items-center justify-center">
          <img
            src="/logo-horizontal.png"
            alt="QvaFlow"
            class="h-9 w-auto max-w-[215px] object-contain transition-all"
          />
        </div>
        <div v-else class="flex items-center justify-center">
          <img src="/logo-icon.png" alt="Q" class="h-9 w-auto object-contain transition-all" />
        </div>
      </div>

      <!-- Menú de Navegación Estructurado por Módulos (Sub-menús Dropdown / Colapsables) -->
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        theme="dark"
        class="qvaflow-sidebar-menu border-r-0 py-2 font-medium"
        style="background: #122645"
      >
        <!-- MÓDULO 1: VENTAS Y OPERACIONES -->
        <a-sub-menu
          v-if="authStore.canAccessPos || authStore.canAccessSalesAndShifts"
          key="sub-ventas"
        >
          <template #icon>
            <ShopOutlined class="text-base text-sky-400" />
          </template>
          <template #title>
            <span class="font-semibold text-white">Ventas y Caja</span>
          </template>

          <a-menu-item v-if="authStore.canAccessPos" key="/pos" @click="navigateTo('/pos')">
            <template #icon>
              <ShoppingCartOutlined class="text-sm" />
            </template>
            <span>Punto de Venta</span>
          </a-menu-item>

          <a-menu-item
            v-if="authStore.canAccessSalesAndShifts"
            key="/sales-and-shifts"
            @click="navigateTo('/sales-and-shifts')"
          >
            <template #icon>
              <FileTextOutlined class="text-sm" />
            </template>
            <span>Ventas y Cuadres</span>
          </a-menu-item>
        </a-sub-menu>

        <!-- MÓDULO 2: INVENTARIO Y ALMACÉN -->
        <a-sub-menu
          v-if="
            authStore.canAccessCatalog ||
            authStore.canAccessInventory ||
            authStore.canAccessPurchases
          "
          key="sub-inventario"
        >
          <template #icon>
            <AppstoreOutlined class="text-base text-amber-400" />
          </template>
          <template #title>
            <span class="font-semibold text-white">Inventario y Stock</span>
          </template>

          <a-menu-item
            v-if="authStore.canAccessCatalog"
            key="/catalog"
            @click="navigateTo('/catalog')"
          >
            <template #icon>
              <TagsOutlined class="text-sm" />
            </template>
            <span>Productos</span>
          </a-menu-item>

          <a-menu-item
            v-if="authStore.canAccessInventory"
            key="/inventory"
            @click="navigateTo('/inventory')"
          >
            <template #icon>
              <InboxOutlined class="text-sm" />
            </template>
            <span>Gestión de Almacenes</span>
          </a-menu-item>

          <a-menu-item
            v-if="authStore.canAccessPurchases"
            key="/purchases"
            @click="navigateTo('/purchases')"
          >
            <template #icon>
              <ShoppingOutlined class="text-sm" />
            </template>
            <span>Compras</span>
          </a-menu-item>
        </a-sub-menu>

        <!-- MÓDULO 3: REPORTES Y ANALÍTICAS -->
        <a-sub-menu v-if="authStore.canAccessReports" key="sub-reportes">
          <template #icon>
            <BarChartOutlined class="text-base text-emerald-400" />
          </template>
          <template #title>
            <span class="font-semibold text-white">Reportes</span>
          </template>

          <a-menu-item key="/reports" @click="navigateTo('/reports')">
            <template #icon>
              <LineChartOutlined class="text-sm" />
            </template>
            <span>Balance Financiero</span>
          </a-menu-item>
        </a-sub-menu>

        <!-- MÓDULO 4: ADMINISTRACIÓN Y SEGURIDAD -->
        <a-sub-menu v-if="authStore.canManageUsers || authStore.canAccessBackups" key="sub-admin">
          <template #icon>
            <SettingOutlined class="text-base text-indigo-400" />
          </template>
          <template #title>
            <span class="font-semibold text-white">Administración</span>
          </template>

          <a-menu-item v-if="authStore.canManageUsers" key="/roles" @click="navigateTo('/roles')">
            <template #icon>
              <TeamOutlined class="text-sm" />
            </template>
            <span>Personal y Roles</span>
          </a-menu-item>

          <a-menu-item
            v-if="authStore.canAccessBackups"
            key="/backups"
            @click="navigateTo('/backups')"
          >
            <template #icon>
              <DatabaseOutlined class="text-sm" />
            </template>
            <span>Seguridad y Respaldos</span>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>

      <!-- Indicador de red local / Offline-first en el pie del Sidebar -->
      <div class="absolute bottom-4 left-0 right-0 px-3">
        <div
          v-if="!isCollapsed"
          class="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0E1E36] p-2.5 text-xs text-slate-300 shadow-inner"
        >
          <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400"></span>
          <span>Red Local: <strong class="text-white">Conectado</strong></span>
        </div>
        <div v-else class="flex justify-center">
          <span
            class="h-3 w-3 animate-pulse rounded-full bg-emerald-400"
            title="Red Local: Conectado"
          ></span>
        </div>
      </div>
    </a-layout-sider>

    <!-- Área Principal de la Aplicación -->
    <a-layout class="flex min-h-screen flex-col">
      <!-- Header Superior -->
      <a-layout-header
        class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#1E3E6B]/60 bg-qvaflow-navy-dark px-6 shadow-sm"
      >
        <!-- Botón para colapsar y título -->
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="cursor-pointer rounded p-1.5 text-lg text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            @click="toggleCollapse"
          >
            <MenuUnfoldOutlined v-if="isCollapsed" />
            <MenuFoldOutlined v-else />
          </button>

          <div>
            <h1 class="text-lg font-semibold leading-tight text-white">
              {{ currentTitle }}
            </h1>
            <p class="m-0 text-xs text-slate-200">Sistema POS Offline-first para MIPYMES</p>
          </div>
        </div>

        <!-- Acciones del Header: Tasa del Día, Estado, Usuario y Cierre de Sesión -->
        <div class="flex items-center gap-3">
          <!-- Widget Interactivo Tasa del Día -->
          <button
            type="button"
            class="hidden cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-white/15 md:flex"
            title="Haga clic para actualizar la tasa oficial del día"
            @click="isDailyRateModalVisible = true"
          >
            <span>💵 1 USD = {{ posStore.exchangeRates.USD }} CUP</span>
            <span class="rounded bg-amber-400/20 px-1 text-[10px] text-amber-200">Editar</span>
          </button>

          <a-tag color="success" class="m-0 flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <WifiOutlined />
            <span>Servidor Symfony Activo</span>
          </a-tag>

          <!-- Perfil del Cajero / Administrador -->
          <div class="flex items-center gap-2 border-l border-white/15 pl-4">
            <a-avatar
              size="small"
              class="border border-white/20 bg-qvaflow-navy font-bold text-white"
            >
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <div class="hidden text-left text-xs sm:block">
              <div class="font-medium leading-tight text-white">
                {{ authStore.userName }}
              </div>
              <div class="text-slate-200">{{ authStore.userRole }}</div>
            </div>

            <!-- Botón Salir / Logout Seguro (Con Bloqueo si hay Turno Abierto) -->
            <button
              type="button"
              class="ml-2 flex cursor-pointer items-center justify-center rounded p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-red-400"
              title="Cerrar Sesión"
              @click="handleLogoutClick"
            >
              <LogoutOutlined class="text-base" />
            </button>
          </div>
        </div>
      </a-layout-header>

      <!-- Contenido Dinámico según la Ruta -->
      <a-layout-content class="flex-1 overflow-auto bg-slate-50 p-6">
        <router-view />
      </a-layout-content>
    </a-layout>

    <!-- Modal Global de Tasa de Cambio del Día -->
    <DailyExchangeRateModal v-model:visible="isDailyRateModalVisible" />

    <!-- Modal Confirmación Normal de Cierre de Sesión -->
    <a-modal
      v-model:open="isLogoutConfirmVisible"
      title="Cerrar Sesión"
      centered
      width="380px"
      ok-text="Sí, salir"
      cancel-text="Cancelar"
      :ok-button-props="{ danger: true }"
      @ok="confirmLogout"
    >
      <div class="py-2 text-sm text-slate-700">
        ¿Está seguro de que desea salir del sistema QvaFlow?
      </div>
    </a-modal>

    <!-- Modal Bloqueo de Salida: Turno de Caja Abierto -->
    <a-modal
      v-model:open="isShiftBlockModalVisible"
      title="⚠️ Turno de Caja Abierto - Acción Requerida"
      :footer="null"
      centered
      width="480px"
    >
      <div class="space-y-4 py-2">
        <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          <div class="mb-1 flex items-center gap-1.5 text-sm font-bold text-red-700">
            <span>🛑 Cierre de Sesión Bloqueado</span>
          </div>
          <div>
            El turno <strong class="font-mono">{{ posStore.currentShift?.id }}</strong> a nombre de
            <strong>{{ posStore.currentShift?.cashierName }}</strong> se encuentra actualmente
            <span class="font-bold text-red-700 underline">ABIERTO</span>.
          </div>
          <div class="mt-1 text-slate-700">
            El sistema no permite cerrar sesión dejando turnos abiertos en el aire. Debes realizar
            el arqueo y cerrar el turno para cuadrar el efectivo antes de salir.
          </div>
        </div>

        <div class="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
          <div class="flex justify-between">
            <span class="text-slate-500">Hora de Apertura:</span>
            <span class="font-semibold">{{ posStore.currentShift?.openedAt }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Cobrado en CUP (Efectivo):</span>
            <span class="font-bold text-slate-800">{{
              formatearMoneda(
                posStore.currentShift?.salesTotals.cupCash ??
                  posStore.currentShift?.salesTotals.CUP ??
                  0,
                'CUP'
              )
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Cobrado en USD (Billetes):</span>
            <span class="font-bold text-emerald-700"
              >${{ posStore.currentShift?.salesTotals.USD || 0 }} USD</span
            >
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
          <a-button @click="isShiftBlockModalVisible = false"> Seguir trabajando </a-button>
          <a-button
            type="primary"
            class="border-none bg-qvaflow-navy"
            @click="openShiftCloseFromWarning"
          >
            Arqueo / Cerrar Turno Ahora
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- Modal Global de Arqueo y Cierre de Turno -->
    <CashShiftModal
      v-model:visible="isShiftModalVisible"
      mode="CLOSE"
      :shift="posStore.currentShift"
      :expected-c-u-p="posStore.expectedCUP"
      :expected-u-s-d="posStore.expectedUSD"
      :loading="posStore.loading"
      @close-shift="handleCloseShiftFromLayout"
    />
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ShopOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  TagsOutlined,
  InboxOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  LineChartOutlined,
  SettingOutlined,
  TeamOutlined,
  DatabaseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WifiOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import useAuthStore from '@/modules/auth/store/authStore'
import usePosStore from '@/modules/pos/store/posStore'
import DailyExchangeRateModal from '@/modules/pos/components/DailyExchangeRateModal.vue'
import CashShiftModal from '@/modules/pos/components/CashShiftModal.vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const posStore = usePosStore()
const { formatearMoneda } = useFormatoMoneda()

// Modal de tasa de cambio del día
const isDailyRateModalVisible = ref<boolean>(false)

// Modales de control seguro de cierre de sesión
const isLogoutConfirmVisible = ref<boolean>(false)
const isShiftBlockModalVisible = ref<boolean>(false)
const isShiftModalVisible = ref<boolean>(false)

onMounted(async () => {
  // Asegurar sincronización y carga inicial del turno activo y tasas
  await posStore.loadInitialData()
})

// Estado reactivo del sidebar colapsable
const isCollapsed = ref<boolean>(false)

// Clave del menú seleccionada actualmente según la ruta activa
const selectedKeys = ref<string[]>([route.path])

// Módulos desplegados (dropdowns) en el sidebar
const openKeys = ref<string[]>(['sub-ventas', 'sub-inventario', 'sub-reportes', 'sub-admin'])

// Sincronizar submenú abierto según la ruta visitada
const updateOpenKeysByRoute = (path: string) => {
  if (path.includes('/pos') || path.includes('/sales-and-shifts')) {
    if (!openKeys.value.includes('sub-ventas')) openKeys.value.push('sub-ventas')
  } else if (
    path.includes('/catalog') ||
    path.includes('/inventory') ||
    path.includes('/purchases')
  ) {
    if (!openKeys.value.includes('sub-inventario')) openKeys.value.push('sub-inventario')
  } else if (path.includes('/reports')) {
    if (!openKeys.value.includes('sub-reportes')) openKeys.value.push('sub-reportes')
  } else if (path.includes('/roles') || path.includes('/backups')) {
    if (!openKeys.value.includes('sub-admin')) openKeys.value.push('sub-admin')
  }
}

// Mantiene sincronizado el menú con los cambios de URL
watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath]
    updateOpenKeysByRoute(newPath)
  },
  { immediate: true }
)

// Título contextual en el encabezado
const currentTitle = computed(() => {
  return (route.meta?.title as string) || 'QvaFlow POS'
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const navigateTo = (path: string) => {
  router.push(path)
}

// Intercepción estricta del cierre de sesión: no permitir salir con turno abierto
const handleLogoutClick = () => {
  if (posStore.isShiftOpen) {
    isShiftBlockModalVisible.value = true
  } else {
    isLogoutConfirmVisible.value = true
  }
}

const confirmLogout = () => {
  isLogoutConfirmVisible.value = false
  authStore.logout()
}

const openShiftCloseFromWarning = () => {
  isShiftBlockModalVisible.value = false
  isShiftModalVisible.value = true
}

const handleCloseShiftFromLayout = async (payload: {
  countedCUP: number
  countedUSD: number
  notes?: string
}) => {
  const result = await posStore.closeCashShift(
    payload.countedCUP,
    payload.countedUSD,
    payload.notes
  )
  if (result) {
    isShiftModalVisible.value = false
    message.success(
      'Turno cerrado y arqueado con éxito. Ahora puede cerrar sesión de forma segura.'
    )
  }
}
</script>

<style scoped>
:deep(.ant-layout-header) {
  line-height: normal;
  background: #122645 !important;
}

:deep(.ant-layout-sider) {
  background: #122645 !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark) {
  background: #122645 !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-submenu-title) {
  color: #e2e8f0 !important;
  margin: 4px 6px !important;
  width: calc(100% - 12px) !important;
  border-radius: 8px !important;
  padding-left: 12px !important;
  transition: all 0.2s ease !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-submenu-title:hover) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-sub) {
  background: #0a182b !important;
  border-radius: 8px !important;
  margin: 2px 6px !important;
  padding: 4px 0 !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-sub .ant-menu-item) {
  width: calc(100% - 8px) !important;
  margin: 2px 4px !important;
  padding-left: 14px !important;
  font-size: 13px !important;
  height: 38px !important;
  line-height: 38px !important;
  border-radius: 6px !important;
  color: #cbd5e1 !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-title-content) {
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-item:hover) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-item-selected) {
  background: #1e3e6b !important;
  color: #ffffff !important;
  border-left: 4px solid #d62738 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}

:deep(.qvaflow-sidebar-menu.ant-menu-dark .ant-menu-item-selected .anticon) {
  color: #e94655 !important;
}
</style>
