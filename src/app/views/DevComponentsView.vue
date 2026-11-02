<template>
  <div class="min-h-screen bg-surface-page text-content-primary transition-colors">
    <!-- Barra superior de la página de demostración -->
    <header
      class="border-border-default shadow-xs sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-surface-card px-4 sm:px-8"
    >
      <div class="flex items-center gap-3">
        <router-link
          to="/"
          class="flex items-center gap-1.5 rounded p-1 text-xs font-medium text-content-secondary transition-colors hover:text-primary focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-primary"
          title="Regresar a Inicio"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          <span>Volver al sistema</span>
        </router-link>

        <span class="text-border-default">|</span>

        <h1 class="text-sm font-bold text-content-primary">Catálogo de Componentes UI</h1>
        <BaseBadge variant="warning" size="sm">DEV ONLY</BaseBadge>
      </div>

      <!-- Conmutador de tema visible -->
      <div class="flex items-center gap-3">
        <span class="hidden text-xs text-content-muted sm:inline">Tema:</span>
        <ThemeToggle />
      </div>
    </header>

    <!-- Contenedor del catálogo -->
    <main class="mx-auto max-w-7xl space-y-12 p-4 sm:p-8">
      <!-- 1. BASE BADGE -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">1. BaseBadge</h2>
          <p class="text-xs text-content-muted">
            Etiquetas de estado semánticas (neutral, success, warning, danger, info) con y sin punto
            indicador.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseBadge variant="neutral">Neutral</BaseBadge>
          <BaseBadge variant="success">Completado</BaseBadge>
          <BaseBadge variant="warning">Pendiente</BaseBadge>
          <BaseBadge variant="danger">Cancelado</BaseBadge>
          <BaseBadge variant="info">En proceso</BaseBadge>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseBadge variant="neutral" dot>Neutral con punto</BaseBadge>
          <BaseBadge variant="success" dot>Servidor activo</BaseBadge>
          <BaseBadge variant="warning" dot>Stock crítico</BaseBadge>
          <BaseBadge variant="danger" dot>Error de caja</BaseBadge>
          <BaseBadge variant="info" dot>Sincronizando</BaseBadge>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseBadge variant="success" size="sm" dot>Tamaño pequeño (sm)</BaseBadge>
          <BaseBadge variant="info" size="md" dot>Tamaño mediano (md)</BaseBadge>
        </div>
      </section>

      <!-- 2. STAT CARD -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">2. StatCard</h2>
          <p class="text-xs text-content-muted">
            Tarjetas de métricas operativas con valores destacados, tendencias y soporte de skeleton
            loading sin colores decorativos.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ventas totales hoy"
            value="$1,450.00"
            description="38 transacciones registradas"
            :trend="{ value: '+12.5%', label: 'vs ayer', direction: 'up' }"
            :icon="TrendingUp"
          />
          <StatCard
            label="Devoluciones"
            value="$45.00"
            description="2 tickets devueltos"
            :trend="{ value: '-2.1%', label: 'vs ayer', direction: 'down' }"
            :icon="Receipt"
          />
          <StatCard
            label="Efectivo en caja"
            value="$8,920.00"
            description="Turno de mañana activo"
            :trend="{ value: '0.0%', label: 'estable', direction: 'neutral' }"
            :icon="Coins"
          />
          <StatCard
            label="Métrica en carga"
            value="---"
            loading
            description="Calculando métricas..."
            :icon="Boxes"
          />
        </div>
      </section>

      <!-- 3. BASE SKELETON & EMPTY STATE -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">3. BaseSkeleton & EmptyState</h2>
          <p class="text-xs text-content-muted">
            Placeholders de carga con token --surface-skeleton y contenedores para estados vacíos.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Ejemplos de Skeleton -->
          <div class="space-y-3 rounded-xl border border-border-subtle bg-surface-card p-5">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
              Esqueletos de carga
            </h3>
            <div class="space-y-2">
              <BaseSkeleton height="1.5rem" width="40%" />
              <BaseSkeleton height="1rem" width="90%" />
              <BaseSkeleton height="1rem" width="75%" />
              <div class="flex items-center gap-3 pt-2">
                <BaseSkeleton height="2.25rem" width="2.25rem" rounded="rounded-full" />
                <div class="flex-1 space-y-1">
                  <BaseSkeleton height="0.875rem" width="50%" />
                  <BaseSkeleton height="0.75rem" width="30%" />
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <EmptyState
            title="No se encontraron productos"
            description="No hay artículos registrados en este almacén que coincidan con los filtros actuales."
            :icon="PackageX"
          >
            <template #actions>
              <BaseButton variant="primary" density="compact">
                <Plus class="mr-1.5 h-4 w-4" />
                Nuevo producto
              </BaseButton>
              <BaseButton variant="secondary" density="compact"> Limpiar filtros </BaseButton>
            </template>
          </EmptyState>
        </div>
      </section>

      <!-- 4. BASE SELECT -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">4. BaseSelect</h2>
          <p class="text-xs text-content-muted">
            Selector accesible de 36px sobre Reka UI con soporte de opción "Todos", búsqueda interna
            y estado de error.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <!-- Select Normal -->
          <BaseSelect
            v-model="selectNormalValue"
            label="Almacén principal"
            placeholder="Seleccione un almacén"
            :options="warehouseOptions"
          />

          <!-- Select con opción "Todos" y buscador interno -->
          <BaseSelect
            v-model="selectAllValue"
            label="Categoría (con búsqueda y 'Todos')"
            placeholder="Filtrar categoría"
            include-all-option
            all-option-label="Todas las categorías"
            searchable
            :options="categoryOptions"
          />

          <!-- Select con error -->
          <BaseSelect
            v-model="selectErrorValue"
            label="Moneda de cobro"
            placeholder="Seleccione moneda"
            error="Debe seleccionar una moneda válida para el cierre."
            :options="currencyOptions"
          />
        </div>
      </section>

      <!-- 5. BASE MODAL & BASE DRAWER -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">5. BaseModal & BaseDrawer</h2>
          <p class="text-xs text-content-muted">
            Diálogos sobre Reka UI con atrapamiento de foco, cierre con Escape, scroll interno y
            tamaños configurables.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseButton variant="secondary" density="compact" @click="isModalOpen = true">
            Abrir BaseModal (md)
          </BaseButton>

          <BaseButton variant="secondary" density="compact" @click="isDrawerOpen = true">
            Abrir BaseDrawer (md)
          </BaseButton>
        </div>

        <!-- Componente Modal -->
        <BaseModal
          :open="isModalOpen"
          title="Confirmar Arqueo de Caja"
          description="Revise los totales antes de proceder con el cierre de turno definitivo."
          size="md"
          @update:open="isModalOpen = $event"
        >
          <div class="space-y-3">
            <p class="text-content-secondary">
              Se registrarán todos los movimientos de efectivo y canje de divisas para el usuario
              actual.
            </p>
            <div
              class="space-y-1 rounded-lg border border-border-subtle bg-surface-sunken p-3 text-xs"
            >
              <div class="flex justify-between">
                <span class="text-content-muted">Efectivo en caja:</span>
                <span class="font-bold text-content-primary">$8,920.00 CUP</span>
              </div>
              <div class="flex justify-between">
                <span class="text-content-muted">Divisas (USD):</span>
                <span class="font-bold text-content-primary">$120.00 USD</span>
              </div>
            </div>
          </div>

          <template #actions>
            <BaseButton variant="secondary" density="compact" @click="isModalOpen = false">
              Cancelar
            </BaseButton>
            <BaseButton variant="primary" density="compact" @click="handleConfirmModal">
              Confirmar cierre
            </BaseButton>
          </template>
        </BaseModal>

        <!-- Componente Drawer -->
        <BaseDrawer
          :open="isDrawerOpen"
          title="Detalle de Factura de Compra"
          description="Información detallada de mercancía recibida y proveedores."
          size="md"
          @update:open="isDrawerOpen = $event"
        >
          <div class="space-y-4">
            <div
              class="space-y-1.5 rounded-lg border border-border-subtle bg-surface-sunken p-3 text-xs"
            >
              <div class="flex justify-between">
                <span class="text-content-muted">Proveedor:</span>
                <span class="font-semibold text-content-primary"
                  >Distribuidora Central S.U.R.L.</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-content-muted">Factura No:</span>
                <span class="font-mono text-content-primary">FC-2026-0891</span>
              </div>
              <div class="flex justify-between">
                <span class="text-content-muted">Fecha:</span>
                <span class="text-content-primary">02/11/2026</span>
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-semibold text-content-secondary">Artículos incluidos (3)</h4>
              <ul class="divide-y divide-border-subtle text-xs">
                <li class="flex justify-between py-2">
                  <span>Cerveza Cristal 355ml x24</span>
                  <span class="font-mono font-medium">10 cajas</span>
                </li>
                <li class="flex justify-between py-2">
                  <span>Refresco TuKola 1.5L x6</span>
                  <span class="font-mono font-medium">15 paquetes</span>
                </li>
                <li class="flex justify-between py-2">
                  <span>Agua Mineral 500ml x12</span>
                  <span class="font-mono font-medium">20 paquetes</span>
                </li>
              </ul>
            </div>
          </div>

          <template #actions>
            <BaseButton variant="secondary" density="compact" @click="isDrawerOpen = false">
              Cerrar
            </BaseButton>
            <BaseButton variant="primary" density="compact" @click="isDrawerOpen = false">
              Imprimir comprobante
            </BaseButton>
          </template>
        </BaseDrawer>
      </section>

      <!-- 6. BASE TABS -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">6. BaseTabs</h2>
          <p class="text-xs text-content-muted">
            Pestañas de estilo subrayado con soporte de contadores numéricos y navegación por
            flechas de teclado.
          </p>
        </div>

        <div class="rounded-xl border border-border-subtle bg-surface-card p-5">
          <BaseTabs v-model="activeTab" :items="tabItems">
            <template #active>
              <div class="text-xs text-content-secondary">
                Mostrando lista de <strong>24 pedidos activos</strong> pendientes de despacho.
              </div>
            </template>
            <template #completed>
              <div class="text-xs text-content-secondary">
                Mostrando historial de <strong>142 pedidos completados</strong> en los últimos 7
                días.
              </div>
            </template>
            <template #cancelled>
              <div class="text-xs text-content-secondary">
                Se registran <strong>3 cancelaciones</strong> en este período.
              </div>
            </template>
          </BaseTabs>
        </div>
      </section>

      <!-- 7. BASE DROPDOWN MENU & BASE TOOLTIP -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">
            7. BaseDropdownMenu & BaseTooltip
          </h2>
          <p class="text-xs text-content-muted">
            Menús contextuales flotantes con acciones peligrosas y separadores, junto a tooltips
            accesibles con flecha indicadora.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-6">
          <!-- Dropdown Menu -->
          <BaseDropdownMenu :items="dropdownItems" @select="handleDropdownSelect">
            <template #trigger>
              <BaseButton variant="secondary" density="compact">
                <span>Opciones de registro</span>
                <ChevronDown class="ml-1 h-3.5 w-3.5" />
              </BaseButton>
            </template>
          </BaseDropdownMenu>

          <!-- Tooltips en diferentes posiciones -->
          <div class="flex items-center gap-3">
            <BaseTooltip content="Exportar reporte en formato Excel local" side="top">
              <BaseButton variant="secondary" density="compact"> Tooltip Arriba </BaseButton>
            </BaseTooltip>

            <BaseTooltip content="Acción disponible solo para perfil Superadmin" side="bottom">
              <BaseButton variant="secondary" density="compact"> Tooltip Abajo </BaseButton>
            </BaseTooltip>
          </div>
        </div>
      </section>

      <!-- 8. SISTEMA DE TOASTS -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">
            8. Notificaciones Toast (vue-sonner)
          </h2>
          <p class="text-xs text-content-muted">
            Notificaciones emitidas mediante el composable useToast() con tokens del tema.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseButton
            variant="secondary"
            density="compact"
            class="border-state-success-border bg-state-success-bg text-state-success"
            @click="toast.success('Venta #1042 registrada exitosamente.')"
          >
            Toast Éxito
          </BaseButton>

          <BaseButton
            variant="secondary"
            density="compact"
            class="border-state-warning-border bg-state-warning-bg text-state-warning"
            @click="toast.warning('Existencias bajas: quedan solo 3 unidades de TuKola 1.5L.')"
          >
            Toast Aviso
          </BaseButton>

          <BaseButton
            variant="secondary"
            density="compact"
            class="border-state-error-border bg-state-error-bg text-state-error"
            @click="toast.error('No se pudo establecer conexión con la gaveta de dinero.')"
          >
            Toast Error
          </BaseButton>

          <BaseButton
            variant="secondary"
            density="compact"
            class="border-state-info-border bg-state-info-bg text-state-info"
            @click="toast.info('Sincronización de tarifas completada en red local.')"
          >
            Toast Info
          </BaseButton>
        </div>
      </section>

      <!-- 9. BASE FORM FIELD -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">9. BaseFormField</h2>
          <p class="text-xs text-content-muted">
            Envoltorio accesible para campos de formulario con etiquetas, textos de ayuda y errores
            vinculados vía aria-describedby.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- Campo con ayuda -->
          <BaseFormField
            id="barcode-input"
            label="Código de barras"
            help="Escanee con la pistola lectora o introduzca el código manualmente."
            required
          >
            <template #default="{ id, describedBy }">
              <BaseInput
                :id="id"
                placeholder="Ej: 7891234567890"
                density="compact"
                :aria-describedby="describedBy"
              />
            </template>
          </BaseFormField>

          <!-- Campo con error semántico -->
          <BaseFormField
            id="price-input"
            label="Precio de venta (CUP)"
            error="El precio unitario debe ser mayor a cero."
            required
          >
            <template #default="{ id, describedBy, error }">
              <BaseInput
                :id="id"
                placeholder="0.00"
                density="compact"
                :error="error"
                :aria-describedby="describedBy"
              />
            </template>
          </BaseFormField>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowLeft,
  TrendingUp,
  Receipt,
  Coins,
  Boxes,
  PackageX,
  Plus,
  ChevronDown,
  Edit,
  Copy,
  Trash2,
  FileSpreadsheet,
} from 'lucide-vue-next'
import BaseBadge from '../../shared/ui/BaseBadge.vue'
import StatCard from '../../shared/ui/StatCard.vue'
import BaseSkeleton from '../../shared/ui/BaseSkeleton.vue'
import EmptyState from '../../shared/ui/EmptyState.vue'
import BaseSelect from '../../shared/ui/BaseSelect.vue'
import BaseModal from '../../shared/ui/BaseModal.vue'
import BaseDrawer from '../../shared/ui/BaseDrawer.vue'
import BaseTabs from '../../shared/ui/BaseTabs.vue'
import BaseDropdownMenu, { type DropdownMenuItemConfig } from '../../shared/ui/BaseDropdownMenu.vue'
import BaseTooltip from '../../shared/ui/BaseTooltip.vue'
import BaseFormField from '../../shared/ui/BaseFormField.vue'
import BaseButton from '../../shared/ui/BaseButton.vue'
import BaseInput from '../../shared/ui/BaseInput.vue'
import ThemeToggle from '../../shared/ui/ThemeToggle.vue'
import { useToast } from '../../shared/composables/useToast'

const toast = useToast()

// Estados para BaseSelect
const selectNormalValue = ref('wh-1')
const selectAllValue = ref('__all_option__')
const selectErrorValue = ref('')

const warehouseOptions = [
  { label: 'Almacén Central (Vedado)', value: 'wh-1' },
  { label: 'Punto de Venta Playa', value: 'wh-2' },
  { label: 'Bodega Habana Vieja', value: 'wh-3' },
  { label: 'Depósito Alamar (Deshabilitado)', value: 'wh-4', disabled: true },
]

const categoryOptions = [
  { label: 'Bebidas y refrescos', value: 'cat-bev' },
  { label: 'Alimentos y conservas', value: 'cat-food' },
  { label: 'Cigarros y tabacos', value: 'cat-tobacco' },
  { label: 'Aseo y limpieza', value: 'cat-clean' },
]

const currencyOptions = [
  { label: 'Peso Cubano (CUP)', value: 'cup' },
  { label: 'Dólar Estadounidense (USD)', value: 'usd' },
]

// Estados para Modal y Drawer
const isModalOpen = ref(false)
const isDrawerOpen = ref(false)

const handleConfirmModal = () => {
  isModalOpen.value = false
  toast.success('Turno de caja cerrado correctamente.')
}

// Estados para BaseTabs
const activeTab = ref('active')
const tabItems = [
  { id: 'active', label: 'Pedidos activos', count: 24 },
  { id: 'completed', label: 'Completados', count: 142 },
  { id: 'cancelled', label: 'Cancelados', count: 3 },
  { id: 'archived', label: 'Archivados', disabled: true },
]

// Elementos para BaseDropdownMenu
const dropdownItems: DropdownMenuItemConfig[] = [
  { id: 'edit', label: 'Editar información', icon: Edit },
  { id: 'duplicate', label: 'Duplicar registro', icon: Copy },
  { id: 'export', label: 'Exportar informe', icon: FileSpreadsheet, separator: true },
  { id: 'delete', label: 'Eliminar definitivamente', icon: Trash2, danger: true, separator: true },
]

const handleDropdownSelect = (id: string) => {
  toast.info(`Acción seleccionada del menú: ${id}`)
}
</script>
