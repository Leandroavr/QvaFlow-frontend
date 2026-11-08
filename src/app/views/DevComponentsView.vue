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

      <!-- 9. TABLA DE DATOS (DataTable, FilterBar & MoneyCell) -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold text-content-primary">9. DataTable & FilterBar</h2>
              <p class="text-xs text-content-muted">
                Tabla de alto rendimiento construida sobre TanStack Table v9 con modos cliente y
                servidor, cabecera fija, ordenación, MoneyCell alineado a la derecha, acciones por
                fila con BaseDropdownMenu, navegación por teclado y FilterBar reactiva.
              </p>
            </div>

            <!-- Controles de estado de la demo -->
            <div class="flex flex-wrap items-center gap-2">
              <!-- Alternar modo cliente / servidor -->
              <div
                class="border-border-default flex items-center rounded-lg border bg-surface-card p-0.5 text-xs"
              >
                <button
                  type="button"
                  :class="[
                    'rounded-md px-2.5 py-1 font-medium transition-colors',
                    tableDemoMode === 'client'
                      ? 'shadow-xs bg-primary text-white'
                      : 'text-content-secondary hover:text-content-primary',
                  ]"
                  @click="tableDemoMode = 'client'"
                >
                  Modo Cliente
                </button>
                <button
                  type="button"
                  :class="[
                    'rounded-md px-2.5 py-1 font-medium transition-colors',
                    tableDemoMode === 'server'
                      ? 'shadow-xs bg-primary text-white'
                      : 'text-content-secondary hover:text-content-primary',
                  ]"
                  @click="tableDemoMode = 'server'"
                >
                  Modo Servidor (300ms)
                </button>
              </div>

              <!-- Forzar Loading -->
              <BaseButton
                :variant="isTableLoading ? 'primary' : 'secondary'"
                density="compact"
                @click="isTableLoading = !isTableLoading"
              >
                {{ isTableLoading ? 'Quitar Loading' : 'Forzar Loading' }}
              </BaseButton>

              <!-- Forzar Error -->
              <BaseButton
                :variant="tableError ? 'danger' : 'secondary'"
                density="compact"
                @click="
                  tableError = tableError
                    ? null
                    : 'Fallo de conexión 500: No se pudo sincronizar con la base de datos local SQLite.'
                "
              >
                {{ tableError ? 'Quitar Error' : 'Forzar Error' }}
              </BaseButton>

              <!-- Forzar Vacío -->
              <BaseButton
                :variant="isTableEmpty ? 'primary' : 'secondary'"
                density="compact"
                @click="isTableEmpty = !isTableEmpty"
              >
                {{ isTableEmpty ? 'Restaurar Datos' : 'Forzar Vacío' }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Barra de filtros reactiva -->
        <FilterBar
          v-model:search="tableSearchQuery"
          search-placeholder="Buscar producto por nombre o código..."
          :has-active-filters="hasActiveTableFilters"
          :chips="activeFilterChips"
          @clear="handleClearTableFilters"
        >
          <!-- Selector de Categoría -->
          <template #filters>
            <div class="w-44">
              <BaseSelect
                v-model="selectedCategoryFilter"
                :options="productCategoryOptions"
                placeholder="Todas las categorías"
                include-all-option
                all-option-label="Todas las categorías"
                all-option-value=""
              />
            </div>

            <!-- Selector de Almacén -->
            <div class="w-44">
              <BaseSelect
                v-model="selectedWarehouseFilter"
                :options="productWarehouseOptions"
                placeholder="Todos los almacenes"
                include-all-option
                all-option-label="Todos los almacenes"
                all-option-value=""
              />
            </div>

            <!-- Selector de Estado de Stock -->
            <div class="w-36">
              <BaseSelect
                v-model="selectedStockFilter"
                :options="productStockOptions"
                placeholder="Cualquier stock"
                include-all-option
                all-option-label="Cualquier stock"
                all-option-value=""
              />
            </div>
          </template>

          <!-- Acciones principales a la derecha -->
          <template #actions>
            <BaseButton
              variant="primary"
              density="compact"
              @click="toast.info('Acción disparada: Nuevo Producto')"
            >
              <Plus class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Nuevo Producto
            </BaseButton>
          </template>
        </FilterBar>

        <!-- Tabla en Modo Cliente -->
        <div v-if="tableDemoMode === 'client'" class="space-y-2">
          <div class="flex items-center justify-between text-xs text-content-muted">
            <span>Demostración en memoria: ordenación y paginación en el cliente.</span>
            <span>Usa las flechas ↑ y ↓ para navegar filas; Enter abre la acción principal.</span>
          </div>

          <DataTable
            mode="client"
            :data="isTableEmpty ? [] : clientFilteredProducts"
            :columns="productColumns"
            :loading="isTableLoading"
            :error="tableError"
            selectable
            v-model:selected-keys="selectedProductKeys"
            :actions="getProductRowActions"
            :primary-action="handlePrimaryProductAction"
            @retry="tableError = null"
          >
            <!-- Slot de acciones en lote -->
            <template #batch-actions="{ selectedRows }">
              <BaseButton
                variant="secondary"
                density="compact"
                @click="
                  toast.success(`Ajuste de inventario aplicado a ${selectedRows.length} productos.`)
                "
              >
                Ajustar stock en lote
              </BaseButton>
              <BaseButton
                variant="danger"
                density="compact"
                @click="toast.error(`Eliminación en lote para ${selectedRows.length} productos.`)"
              >
                Eliminar lote
              </BaseButton>
            </template>

            <!-- Render personalizado de la celda de stock con BaseBadge semántico -->
            <template #cell-stock="{ row }">
              <BaseBadge
                :variant="row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'"
                size="sm"
                dot
              >
                {{
                  row.stock > 10
                    ? `${row.stock} un.`
                    : row.stock > 0
                      ? `${row.stock} (Bajo)`
                      : 'Agotado'
                }}
              </BaseBadge>
            </template>
          </DataTable>
        </div>

        <!-- Tabla en Modo Servidor -->
        <div v-else class="space-y-2">
          <div class="flex items-center justify-between text-xs text-content-muted">
            <span>Demostración con servidor simulado (300 ms de latencia y paginación real).</span>
            <span
              >Contrato emitido: <code>page={{ serverPage }}</code
              >, <code>perPage={{ serverPerPage }}</code
              >, <code>sort={{ serverSort || 'ninguno' }}</code></span
            >
          </div>

          <DataTable
            mode="server"
            :data="
              isTableEmpty
                ? { items: [], total: 0, page: 1, perPage: serverPerPage }
                : serverProductsResponse
            "
            :columns="productColumns"
            :loading="isServerLoading || isTableLoading"
            :error="tableError"
            :page="serverPage"
            :per-page="serverPerPage"
            :sort="serverSort"
            selectable
            v-model:selected-keys="selectedProductKeys"
            :actions="getProductRowActions"
            :primary-action="handlePrimaryProductAction"
            @update:page="handleServerPageChange"
            @update:per-page="handleServerPerPageChange"
            @update:sort="handleServerSortChange"
            @retry="tableError = null"
          >
            <!-- Slot de acciones en lote -->
            <template #batch-actions="{ selectedRows }">
              <BaseButton
                variant="secondary"
                density="compact"
                @click="
                  toast.success(`Ajuste aplicado a ${selectedRows.length} productos del servidor.`)
                "
              >
                Ajustar stock
              </BaseButton>
            </template>

            <!-- Render personalizado de la celda de stock -->
            <template #cell-stock="{ row }">
              <BaseBadge
                :variant="row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'"
                size="sm"
                dot
              >
                {{
                  row.stock > 10
                    ? `${row.stock} un.`
                    : row.stock > 0
                      ? `${row.stock} (Bajo)`
                      : 'Agotado'
                }}
              </BaseBadge>
            </template>
          </DataTable>
        </div>
      </section>

      <!-- 13. BASE CHART -->
      <section class="space-y-4">
        <div class="border-b border-border-subtle pb-2">
          <h2 class="text-base font-bold text-content-primary">
            13. BaseChart (ECharts con Tree-shaking y renderizado SVG)
          </h2>
          <p class="text-xs text-content-muted">
            Componente gráfico reactivo con carga diferida, adaptación automática al tema
            claro/oscuro, soporte de accesibilidad (role="img", alternativa en tabla accesible) y
            estados de carga/vacío.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Ejemplo 1: Barras Agrupadas -->
          <div class="border-border-default space-y-3 rounded-xl border bg-surface-card p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-content-primary">
                  Ventas vs Compras (Barras agrupadas)
                </h3>
                <p class="text-xs text-content-muted">
                  Valores financieros expresados en string decimal
                </p>
              </div>
              <div class="flex items-center gap-2">
                <BaseButton
                  variant="secondary"
                  density="compact"
                  @click="chartDemoLoading = !chartDemoLoading"
                >
                  {{ chartDemoLoading ? 'Quitar Loading' : 'Simular Loading' }}
                </BaseButton>
                <BaseButton
                  variant="secondary"
                  density="compact"
                  @click="chartDemoEmpty = !chartDemoEmpty"
                >
                  {{ chartDemoEmpty ? 'Quitar Vacío' : 'Simular Vacío' }}
                </BaseButton>
              </div>
            </div>

            <BaseChart
              :option="groupedBarChartOption"
              aria-label="Gráfico de barras agrupadas comparando ventas y compras por mes"
              ariaLabel="Gráfico de barras agrupadas comparando ventas y compras por mes"
              :loading="chartDemoLoading"
              :empty="chartDemoEmpty"
              height="280px"
            >
              <template #table>
                <table>
                  <caption>
                    Ventas y Compras por Mes
                  </caption>
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Ventas (CUP)</th>
                      <th>Compras (CUP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in barDataRows" :key="d.month">
                      <td>{{ d.month }}</td>
                      <td>{{ d.sales }}</td>
                      <td>{{ d.purchases }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </BaseChart>
          </div>

          <!-- Ejemplo 2: Líneas de Tendencia -->
          <div class="border-border-default space-y-3 rounded-xl border bg-surface-card p-4">
            <div>
              <h3 class="text-sm font-semibold text-content-primary">
                Evolución de Margen Comercial (Línea)
              </h3>
              <p class="text-xs text-content-muted">Histórico de rentabilidad mensual (%)</p>
            </div>

            <BaseChart
              :option="lineChartOption"
              aria-label="Gráfico de línea con la evolución del porcentaje de margen comercial"
              ariaLabel="Gráfico de línea con la evolución del porcentaje de margen comercial"
              height="280px"
            >
              <template #table>
                <table>
                  <caption>
                    Margen Comercial por Mes
                  </caption>
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Margen (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="d in lineDataRows" :key="d.month">
                      <td>{{ d.month }}</td>
                      <td>{{ d.margin }}%</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </BaseChart>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  Eye,
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
import BaseChart from '../../shared/ui/BaseChart/BaseChart.vue'
import {
  DataTable,
  FilterBar,
  type DataTableColumn,
  type FilterChip,
  type ServerDataResponse,
} from '../../shared/ui/DataTable'
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

// ==========================================
// SECCIÓN 9: DATATABLE & FILTERBAR DEMO
// ==========================================

export interface MockProduct {
  id: number
  code: string
  name: string
  category: string
  warehouse: string
  cost: string
  price: string
  stock: number
}

const mockProductsList: MockProduct[] = [
  {
    id: 1,
    code: 'PRD-001',
    name: 'Refresco Ciego Montero 330ml',
    category: 'Bebidas',
    warehouse: 'Almacén Central',
    cost: '35.00',
    price: '85.00',
    stock: 120,
  },
  {
    id: 2,
    code: 'PRD-002',
    name: 'Cerveza Cristal 355ml',
    category: 'Bebidas',
    warehouse: 'Almacén Central',
    cost: '120.00',
    price: '220.00',
    stock: 45,
  },
  {
    id: 3,
    code: 'PRD-003',
    name: 'Cerveza Bucanero 355ml',
    category: 'Bebidas',
    warehouse: 'Punto de Venta Playa',
    cost: '125.00',
    price: '230.00',
    stock: 8,
  },
  {
    id: 4,
    code: 'PRD-004',
    name: 'Agua Mineral Los Portales 1.5L',
    category: 'Bebidas',
    warehouse: 'Bodega Habana Vieja',
    cost: '40.00',
    price: '90.00',
    stock: 0,
  },
  {
    id: 5,
    code: 'PRD-005',
    name: 'Arroz Criollo Especial 1kg',
    category: 'Alimentos',
    warehouse: 'Almacén Central',
    cost: '140.00',
    price: '210.00',
    stock: 85,
  },
  {
    id: 6,
    code: 'PRD-006',
    name: 'Frijoles Negros 1kg',
    category: 'Alimentos',
    warehouse: 'Bodega Habana Vieja',
    cost: '160.00',
    price: '250.00',
    stock: 4,
  },
  {
    id: 7,
    code: 'PRD-007',
    name: 'Aceite Vegetal Cocinero 1L',
    category: 'Alimentos',
    warehouse: 'Almacén Central',
    cost: '420.00',
    price: '650.00',
    stock: 32,
  },
  {
    id: 8,
    code: 'PRD-008',
    name: 'Café Serrano Molido 250g',
    category: 'Alimentos',
    warehouse: 'Punto de Venta Playa',
    cost: '280.00',
    price: '450.00',
    stock: 0,
  },
  {
    id: 9,
    code: 'PRD-009',
    name: 'Jabón de Tocador Nácar 120g',
    category: 'Aseo',
    warehouse: 'Almacén Central',
    cost: '50.00',
    price: '95.00',
    stock: 75,
  },
  {
    id: 10,
    code: 'PRD-010',
    name: 'Detergente Omo 500g',
    category: 'Aseo',
    warehouse: 'Punto de Venta Playa',
    cost: '180.00',
    price: '290.00',
    stock: 12,
  },
  {
    id: 11,
    code: 'PRD-011',
    name: 'Pasta Dental Colgate 100ml',
    category: 'Aseo',
    warehouse: 'Bodega Habana Vieja',
    cost: '130.00',
    price: '220.00',
    stock: 2,
  },
  {
    id: 12,
    code: 'PRD-012',
    name: 'Cigarros H. Upmann Selecto',
    category: 'Cigarros',
    warehouse: 'Almacén Central',
    cost: '110.00',
    price: '180.00',
    stock: 150,
  },
  {
    id: 13,
    code: 'PRD-013',
    name: 'Cigarros Popular Auténtico',
    category: 'Cigarros',
    warehouse: 'Punto de Venta Playa',
    cost: '100.00',
    price: '170.00',
    stock: 60,
  },
  {
    id: 14,
    code: 'PRD-014',
    name: 'Ron Havana Club 7 Años 700ml',
    category: 'Bebidas',
    warehouse: 'Almacén Central',
    cost: '850.00',
    price: '1450.00',
    stock: 18,
  },
  {
    id: 15,
    code: 'PRD-015',
    name: 'Galletas de Sal Soda 200g',
    category: 'Alimentos',
    warehouse: 'Bodega Habana Vieja',
    cost: '65.00',
    price: '120.00',
    stock: 0,
  },
]

// Definición tipada de columnas
const productColumns: DataTableColumn<MockProduct>[] = [
  { key: 'code', title: 'Código', width: '100px', sortable: true },
  { key: 'name', title: 'Nombre del producto', sortable: true },
  { key: 'category', title: 'Categoría', width: '130px', sortable: true },
  { key: 'warehouse', title: 'Almacén', width: '160px' },
  { key: 'cost', title: 'Coste', currency: 'CUP', align: 'right', width: '110px', sortable: true },
  {
    key: 'price',
    title: 'Precio venta',
    currency: 'CUP',
    align: 'right',
    width: '120px',
    sortable: true,
  },
  { key: 'stock', title: 'Stock', align: 'center', width: '120px', sortable: true },
]

// Opciones de filtros
const productCategoryOptions = [
  { label: 'Bebidas', value: 'Bebidas' },
  { label: 'Alimentos', value: 'Alimentos' },
  { label: 'Aseo', value: 'Aseo' },
  { label: 'Cigarros', value: 'Cigarros' },
]

const productWarehouseOptions = [
  { label: 'Almacén Central', value: 'Almacén Central' },
  { label: 'Punto de Venta Playa', value: 'Punto de Venta Playa' },
  { label: 'Bodega Habana Vieja', value: 'Bodega Habana Vieja' },
]

const productStockOptions = [
  { label: 'Normal (>10)', value: 'normal' },
  { label: 'Bajo (1–10)', value: 'low' },
  { label: 'Agotado (0)', value: 'out' },
]

// Estados de control de la demo
const tableDemoMode = ref<'client' | 'server'>('client')
const isTableLoading = ref(false)
const tableError = ref<string | null>(null)
const isTableEmpty = ref(false)
const selectedProductKeys = ref<(string | number)[]>([])

// Filtros reactivos
const tableSearchQuery = ref('')
const selectedCategoryFilter = ref('')
const selectedWarehouseFilter = ref('')
const selectedStockFilter = ref('')

const hasActiveTableFilters = computed(() => {
  return (
    tableSearchQuery.value.trim().length > 0 ||
    !!selectedCategoryFilter.value ||
    !!selectedWarehouseFilter.value ||
    !!selectedStockFilter.value
  )
})

const activeFilterChips = computed<FilterChip[]>(() => {
  const chips: FilterChip[] = []
  if (tableSearchQuery.value.trim()) {
    chips.push({
      id: 'search',
      label: `Búsqueda: "${tableSearchQuery.value.trim()}"`,
      onRemove: () => {
        tableSearchQuery.value = ''
      },
    })
  }
  if (selectedCategoryFilter.value) {
    chips.push({
      id: 'cat',
      label: `Categoría: ${selectedCategoryFilter.value}`,
      onRemove: () => {
        selectedCategoryFilter.value = ''
      },
    })
  }
  if (selectedWarehouseFilter.value) {
    chips.push({
      id: 'wh',
      label: `Almacén: ${selectedWarehouseFilter.value}`,
      onRemove: () => {
        selectedWarehouseFilter.value = ''
      },
    })
  }
  if (selectedStockFilter.value) {
    const label =
      selectedStockFilter.value === 'normal'
        ? 'Stock: Normal'
        : selectedStockFilter.value === 'low'
          ? 'Stock: Bajo'
          : 'Stock: Agotado'
    chips.push({
      id: 'stock',
      label,
      onRemove: () => {
        selectedStockFilter.value = ''
      },
    })
  }
  return chips
})

const handleClearTableFilters = () => {
  tableSearchQuery.value = ''
  selectedCategoryFilter.value = ''
  selectedWarehouseFilter.value = ''
  selectedStockFilter.value = ''
}

// Filtrado común para ambas demos
const filterProducts = (products: MockProduct[]) => {
  return products.filter((p) => {
    if (tableSearchQuery.value.trim()) {
      const q = tableSearchQuery.value.toLowerCase().trim()
      const matchName = p.name.toLowerCase().includes(q)
      const matchCode = p.code.toLowerCase().includes(q)
      if (!matchName && !matchCode) return false
    }
    if (selectedCategoryFilter.value && p.category !== selectedCategoryFilter.value) {
      return false
    }
    if (selectedWarehouseFilter.value && p.warehouse !== selectedWarehouseFilter.value) {
      return false
    }
    if (selectedStockFilter.value) {
      if (selectedStockFilter.value === 'normal' && p.stock <= 10) return false
      if (selectedStockFilter.value === 'low' && (p.stock === 0 || p.stock > 10)) return false
      if (selectedStockFilter.value === 'out' && p.stock !== 0) return false
    }
    return true
  })
}

// Datos filtrados en modo cliente (TanStack se encarga de paginación y ordenación)
const clientFilteredProducts = computed(() => {
  return filterProducts(mockProductsList)
})

// Simulación de servidor con 300 ms de latencia
const serverPage = ref(1)
const serverPerPage = ref(10)
const serverSort = ref('')
const isServerLoading = ref(false)
const serverProductsResponse = ref<ServerDataResponse<MockProduct>>({
  items: [],
  total: 0,
  page: 1,
  perPage: 10,
})

let serverFetchTimer: ReturnType<typeof setTimeout> | null = null

const executeServerFetch = () => {
  if (serverFetchTimer) {
    clearTimeout(serverFetchTimer)
  }

  isServerLoading.value = true

  serverFetchTimer = setTimeout(() => {
    let result = filterProducts([...mockProductsList])

    // Ordenación según el contrato "campo:asc|desc"
    if (serverSort.value) {
      const [field, dir] = serverSort.value.split(':')
      const isDesc = dir === 'desc'
      result.sort((a: any, b: any) => {
        let valA = a[field]
        let valB = b[field]
        if (field === 'cost' || field === 'price' || field === 'stock') {
          valA = Number(valA)
          valB = Number(valB)
        }
        if (valA < valB) return isDesc ? 1 : -1
        if (valA > valB) return isDesc ? -1 : 1
        return 0
      })
    }

    const total = result.length
    const start = (serverPage.value - 1) * serverPerPage.value
    const sliced = result.slice(start, start + serverPerPage.value)

    serverProductsResponse.value = {
      items: sliced,
      total,
      page: serverPage.value,
      perPage: serverPerPage.value,
    }

    isServerLoading.value = false
  }, 300)
}

watch(
  [
    serverPage,
    serverPerPage,
    serverSort,
    tableSearchQuery,
    selectedCategoryFilter,
    selectedWarehouseFilter,
    selectedStockFilter,
  ],
  () => {
    if (tableDemoMode.value === 'server') {
      executeServerFetch()
    }
  },
  { immediate: true }
)

const handleServerPageChange = (p: number) => {
  serverPage.value = p
}

const handleServerPerPageChange = (pp: number) => {
  serverPerPage.value = pp
  serverPage.value = 1
}

const handleServerSortChange = (s: string) => {
  serverSort.value = s
}

// Acciones por fila
const getProductRowActions = (row: MockProduct): DropdownMenuItemConfig[] => [
  {
    id: 'view',
    label: `Ver detalle (${row.code})`,
    icon: Eye,
    onClick: () => toast.info(`Detalles del producto: ${row.name}`),
  },
  {
    id: 'edit',
    label: 'Editar producto',
    icon: Edit,
    onClick: () => toast.info(`Modificar: ${row.name}`),
  },
  {
    id: 'adjust',
    label: 'Ajuste de inventario',
    icon: FileSpreadsheet,
    onClick: () => toast.success(`Ajuste de inventario abierto para ${row.code}`),
  },
  {
    id: 'delete',
    label: 'Eliminar producto',
    icon: Trash2,
    danger: true,
    separator: true,
    onClick: () => toast.error(`Eliminar producto: ${row.name}`),
  },
]

const handlePrimaryProductAction = (row: MockProduct) => {
  toast.info(`Acción primaria disparada por tecla Enter: ${row.name}`)
}

// Demos para BaseChart
const chartDemoLoading = ref(false)
const chartDemoEmpty = ref(false)

const barDataRows = [
  { month: 'Junio', sales: '115400.00', purchases: '72300.00' },
  { month: 'Julio', sales: '132100.00', purchases: '81500.00' },
  { month: 'Agosto', sales: '124000.00', purchases: '69000.00' },
  { month: 'Septiembre', sales: '141800.00', purchases: '89400.00' },
  { month: 'Octubre', sales: '145850.00', purchases: '84200.00' },
]

const groupedBarChartOption = computed(() => ({
  legend: { data: ['Ventas', 'Compras'] },
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value: any) => `${value} CUP`,
  },
  xAxis: {
    type: 'category',
    data: barDataRows.map((d) => d.month),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Ventas',
      type: 'bar',
      data: barDataRows.map((d) => Number(d.sales)),
    },
    {
      name: 'Compras',
      type: 'bar',
      data: barDataRows.map((d) => Number(d.purchases)),
    },
  ],
}))

const lineDataRows = [
  { month: 'Junio', margin: '37.35' },
  { month: 'Julio', margin: '38.30' },
  { month: 'Agosto', margin: '44.35' },
  { month: 'Septiembre', margin: '36.95' },
  { month: 'Octubre', margin: '42.27' },
]

const lineChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value: any) => `${value}%`,
  },
  xAxis: {
    type: 'category',
    data: lineDataRows.map((d) => d.month),
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}%',
    },
  },
  series: [
    {
      name: 'Margen Comercial',
      type: 'line',
      smooth: true,
      data: lineDataRows.map((d) => Number(d.margin)),
    },
  ],
}))
</script>
