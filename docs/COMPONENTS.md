# Catálogo de Componentes UI — QvaFlow Design System

> **Nota de Arquitectura**: Este documento describe los componentes visuales primitivos ubicados en `src/shared/ui/`. Todos los componentes están diseñados para una SPA de escritorio 100% autónoma en red local, construidos sobre tokens CSS semánticos (`tokens.css`), accesibilidad WCAG AA, soporte completo de teclado y densidad compacta por defecto (36px).

---

## 1. Principios de Diseño

- **Tokens Semánticos**: Uso exclusivo de variables CSS (`--surface-page`, `--surface-card`, `--surface-skeleton`, `--state-success`, etc.). Sin colores hexadecimales sueltos.
- **Color como Estado**: Los colores expresan estados (_éxito_, _aviso_, _error/peligro_, _información_), nunca propósitos puramente decorativos.
- **Foco Accesible (`focus-visible`)**: Foco visible con anillos de alta visibilidad para navegación por teclado, sin dejar anillos residuales tras clics de ratón.
- **Sin Emojis**: Iconografía basada en `lucide-vue-next`.
- **Ruta de Demostración**: Disponible en entorno de desarrollo en `/#/dev/components` (excluida del build de producción).

---

## 2. Catálogo de Componentes

### BaseBadge

Etiquetas semánticas de estado con soporte opcional de punto indicador.

- **Props**:
  - `variant`: `'neutral' | 'success' | 'warning' | 'danger' | 'info'` (por defecto: `'neutral'`)
  - `size`: `'sm' | 'md'` (por defecto: `'md'`)
  - `dot`: `boolean` (por defecto: `false`)
- **Ejemplo**:

```vue
<BaseBadge variant="success" dot>Completado</BaseBadge>
<BaseBadge variant="warning" size="sm">Stock crítico</BaseBadge>
```

---

### StatCard

Tarjetas de métricas operativas con valores destacados, tendencias y soporte de skeleton loading.

- **Props**:
  - `label`: `string` (etiqueta del indicador)
  - `value`: `string | number` (valor numérico o texto destacado)
  - `description?`: `string` (texto secundario descriptivo)
  - `trend?`: `{ value: string | number; label?: string; direction?: 'up' | 'down' | 'neutral' }`
  - `loading?`: `boolean` (activa esqueleto de carga)
  - `icon?`: `Component` (icono pequeño y neutro, sin color decorativo)
- **Ejemplo**:

```vue
<StatCard
  label="Ventas de hoy"
  value="$1,450.00"
  description="38 transacciones registradas"
  :trend="{ value: '+12.5%', label: 'vs ayer', direction: 'up' }"
  :icon="TrendingUp"
/>
```

---

### BaseSkeleton

Placeholders animados con el token `--surface-skeleton` adaptativo a tema claro y oscuro.

- **Props**:
  - `width?`: `string` (ej. `'100%'`, `'120px'`)
  - `height?`: `string` (ej. `'1.5rem'`, `'20px'`)
  - `rounded?`: `string` (ej. `'rounded-full'`, `'rounded-md'`)
- **Ejemplo**:

```vue
<BaseSkeleton height="1.5rem" width="60%" />
<BaseSkeleton height="2rem" width="2rem" rounded="rounded-full" />
```

---

### EmptyState

Contenedor centralizado para listas o tablas sin registros.

- **Props**:
  - `title`: `string`
  - `description?`: `string`
  - `icon?`: `Component` (icono de `lucide-vue-next`)
- **Slots**:
  - `actions`: Botones o controles de acción primaria/secundaria.
- **Ejemplo**:

```vue
<EmptyState
  title="Sin existencias"
  description="No hay artículos en este almacén con stock disponible."
  :icon="PackageX"
>
  <template #actions>
    <BaseButton variant="primary" density="compact">Añadir producto</BaseButton>
  </template>
</EmptyState>
```

---

### BaseSelect

Selector accesible de altura 36px construido sobre Reka UI Select con soporte de búsqueda interna y opción general "Todos".

- **Props**:
  - `modelValue`: `string | number | null`
  - `options`: `Array<{ label: string; value: string | number; disabled?: boolean }>`
  - `label?`: `string`
  - `placeholder?`: `string` (por defecto: `'Seleccionar...'`)
  - `includeAllOption?`: `boolean` (añade opción "Todos" al inicio)
  - `allOptionLabel?`: `string` (por defecto: `'Todos'`)
  - `searchable?`: `boolean` (habilita campo de búsqueda interno)
  - `error?`: `string` (mensaje y borde de error)
  - `disabled?`: `boolean`
- **Eventos**:
  - `update:modelValue`: Emitido al seleccionar una opción.
- **Ejemplo**:

```vue
<BaseSelect
  v-model="selectedWarehouse"
  label="Almacén de origen"
  placeholder="Seleccione almacén"
  include-all-option
  all-option-label="Todos los almacenes"
  searchable
  :options="warehouses"
/>
```

---

### BaseModal

Ventana de diálogo modal sobre Reka UI Dialog con foco atrapado, cierre con Escape y scroll interno del cuerpo.

- **Props**:
  - `open`: `boolean` (v-model:open)
  - `title`: `string`
  - `description?`: `string`
  - `size?`: `'sm' | 'md' | 'lg' | 'xl'` (por defecto: `'md'`)
- **Eventos**:
  - `update:open`: `(open: boolean) => void`
  - `close`: Emitido al cerrarse.
- **Slots**:
  - `default`: Cuerpo con scroll independiente.
  - `actions`: Pie con botones de acción.
- **Ejemplo**:

```vue
<BaseModal
  :open="isModalOpen"
  title="Confirmar Arqueo"
  description="Revise los totales antes de proceder con el cierre."
  @update:open="isModalOpen = $event"
>
  <p>Contenido del modal con scroll interno si excede la altura.</p>
  <template #actions>
    <BaseButton variant="secondary" density="compact" @click="isModalOpen = false">Cancelar</BaseButton>
    <BaseButton variant="primary" density="compact" @click="confirmar">Confirmar</BaseButton>
  </template>
</BaseModal>
```

---

### BaseDrawer

Panel deslizante lateral desde el borde derecho sobre Reka UI Dialog.

- **Props**:
  - `open`: `boolean` (v-model:open)
  - `title`: `string`
  - `description?`: `string`
  - `size?`: `'sm' | 'md' | 'lg'` (por defecto: `'md'`)
- **Eventos**:
  - `update:open`: `(open: boolean) => void`
  - `close`: Emitido al cerrarse.
- **Ejemplo**:

```vue
<BaseDrawer
  :open="isDrawerOpen"
  title="Detalle de Factura"
  description="Líneas de compra y proveedor"
  @update:open="isDrawerOpen = $event"
>
  <div>Detalles de factura</div>
</BaseDrawer>
```

---

### BaseTabs

Pestañas de estilo subrayado con soporte de contadores numéricos y navegación por teclado.

- **Props**:
  - `modelValue`: `string`
  - `items`: `Array<{ id: string; label: string; count?: number | string; disabled?: boolean }>`
- **Eventos**:
  - `update:modelValue`: `(tabId: string) => void`
- **Slots**:
  - `[item.id]`: Contenido específico de cada pestaña.
- **Ejemplo**:

```vue
<BaseTabs
  v-model="tabActiva"
  :items="[
    { id: 'activos', label: 'Activos', count: 12 },
    { id: 'cerrados', label: 'Cerrados', count: 48 },
  ]"
>
  <template #activos>Lista de activos...</template>
  <template #cerrados>Historial de cerrados...</template>
</BaseTabs>
```

---

### BaseDropdownMenu

Menú contextual flotante con soporte de iconos, elementos de peligro (rojo), separadores y accesos rápidos.

- **Props**:
  - `items`: `DropdownMenuItemConfig[]`
  - `align?`: `'start' | 'center' | 'end'` (por defecto: `'end'`)
- **Eventos**:
  - `select`: `(itemId: string) => void`
- **Slots**:
  - `trigger`: Elemento disparador (as-child).
- **Ejemplo**:

```vue
<BaseDropdownMenu
  :items="[
    { id: 'edit', label: 'Editar', icon: Edit },
    { id: 'del', label: 'Eliminar', icon: Trash, danger: true, separator: true },
  ]"
  @select="ejecutarAccion"
>
  <template #trigger>
    <BaseButton variant="secondary" density="compact">Opciones</BaseButton>
  </template>
</BaseDropdownMenu>
```

---

### BaseTooltip

Mensaje emergente accesible con flecha indicadora sobre Reka UI Tooltip.

- **Props**:
  - `content`: `string` (texto del tooltip)
  - `side?`: `'top' | 'right' | 'bottom' | 'left'` (por defecto: `'top'`)
  - `delayDuration?`: `number` (ms, por defecto: `150`)
- **Ejemplo**:

```vue
<BaseTooltip content="Exportar reporte a Excel" side="top">
  <BaseButton variant="secondary" density="compact">Exportar</BaseButton>
</BaseTooltip>
```

---

### BaseFormField

Envoltorio accesible que asocia etiquetas, textos de ayuda y mensajes de error con el control subyacente mediante `aria-describedby` y `for`.

- **Props**:
  - `id?`: `string`
  - `label?`: `string`
  - `help?`: `string`
  - `error?`: `string`
  - `required?`: `boolean`
- **Scoped Slot**:
  - Recibe `{ id, describedBy, error, hasError }` para enlazar directamente con `BaseInput` o `BaseSelect`.
- **Ejemplo**:

```vue
<BaseFormField id="codigo" label="Código de Producto" help="Escanee el código" required>
  <template #default="{ id, describedBy }">
    <BaseInput :id="id" :aria-describedby="describedBy" density="compact" />
  </template>
</BaseFormField>
```

---

### useToast (Notificaciones vue-sonner)

Composable para emitir notificaciones semánticas configurado con los tokens de diseño de la aplicación. Montado globalmente en `AppLayout.vue`.

- **Métodos**:
  - `toast.success(message, options?)`
  - `toast.warning(message, options?)`
  - `toast.error(message, options?)`
  - `toast.info(message, options?)`
  - `toast.dismiss(id?)`
- **Ejemplo**:

```ts
import { useToast } from '@/shared/composables/useToast'

const toast = useToast()
toast.success('Venta #1042 registrada exitosamente.')
toast.error('No se pudo conectar con el servidor local.')
```

---

## 3. Componentes de Datos y Tablas Avanzadas

### DataTable

Tabla de datos de alto rendimiento construida sobre `@tanstack/vue-table` v9, compatible con modos de procesamiento en memoria (`client`) y paginación/ordenación remota (`server`). Incluye cabecera fija (sticky) con tokens `--surface-sunken`, filas compactas (~40px), soporte de selección múltiple con acciones en lote, menú desplegable de acciones por fila mediante `BaseDropdownMenu`, renderizado de estados (`loading`, `empty`, `error` con reintento) y navegación accesible por teclado (flechas ↑ y ↓, Enter para acción principal) **sin robar el foco al montarse**.

- **Props**:
  - `mode`: `'client' | 'server'` (por defecto `'client'`).
  - `data`: `T[] | ServerDataResponse<T>` (`{ items, total, page, perPage }`).
  - `columns`: `DataTableColumn<T>[]` (definición tipada: `key`, `title`, `currency?`, `width?`, `align?`, `sortable?`, `visible?`, etc.).
  - `total?`: `number` (total de filas en modo servidor).
  - `page?`: `number` (página actual base 1).
  - `perPage?`: `number` (filas por página, por defecto `10`).
  - `sort?`: `string` (formato del contrato API `"campo:asc"` o `"campo:desc"`).
  - `loading?`: `boolean` (activa esqueleto de filas compactas con `BaseSkeleton`).
  - `error?`: `string | Error | null` (muestra estado de error accesible).
  - `selectable?`: `boolean` (activa columna de casillas de selección múltiple).
  - `selectedKeys?`: `(string | number)[]` (claves de filas seleccionadas con soporte `v-model:selected-keys`).
  - `rowKey?`: `string | ((row: T) => string | number)` (identificador de fila, por defecto `'id'`).
  - `emptyTitle?`: `string` (título para `EmptyState`).
  - `emptyDescription?`: `string` (descripción para `EmptyState`).
  - `actions?`: `(row: T) => DropdownMenuItemConfig[]` (resuelve los items del menú "⋯" por fila).
  - `primaryAction?`: `(row: T) => void` (disparada al pulsar Enter sobre la fila activa).
- **Eventos**:
  - `update:page`: `(page: number)`
  - `update:perPage`: `(perPage: number)`
  - `update:sort`: `(sort: string)`
  - `update:selectedKeys`: `(keys: (string | number)[])`
  - `query-change`: `({ page: number, perPage: number, sort: string })`
  - `row-click`: `(row: T)`
  - `row-action`: `({ actionId: string, row: T })`
  - `retry`: `()`
- **Slots**:
  - `#cell-{key}`: Scoped slot personalizado para cada celda (`{ row, value, column, index }`).
  - `#batch-actions`: Barra de acciones en lote mostrada cuando hay filas seleccionadas (`{ selectedRows, selectedKeys, clearSelection }`).
  - `#empty-actions`: Botones o controles dentro del estado vacío.
- **Ejemplo**:

```vue
<DataTable
  mode="server"
  :data="serverData"
  :columns="columns"
  :page="query.page"
  :per-page="query.perPage"
  :sort="query.sort"
  selectable
  v-model:selected-keys="selectedIds"
  :actions="getRowActions"
  @query-change="query.handleQueryChange"
/>
```

---

### MoneyCell

Celda monetaria formateada para listados financieros basada en `formatMoney`. Garantiza el uso seguro de string decimal (`"1250.50"`), alineación a la derecha y tipografía tabular (`font-mono tabular-nums`). Cumple la directriz del sistema de diseño de no repetir la divisa en cada fila cuando esta ya figura en la cabecera de la columna.

- **Props**:
  - `value`: `DecimalString | number | null` (importe a formatear).
  - `currency?`: `Currency` (divisa soportada, ej: `'CUP'`, `'USD'`).
  - `showCurrency?`: `boolean` (por defecto `false` para no saturar las celdas de datos).
  - `class?`: `string` (estilos CSS adicionales).
- **Ejemplo**:

```vue
<MoneyCell :value="row.cost" currency="CUP" />
```

---

### FilterBar

Barra de filtros de una sola fila con comportamiento responsivo (`wrap` en pantallas estrechas), buscador con debounce integrado, selects compactos para filtrado paramétrico, botón "Limpiar filtros" (solo visible cuando existen filtros activos o búsqueda) y slot para acciones principales a la derecha ("Nuevo producto", etc.). Incluye chips de filtros activos opcionales con botón de descarte individual.

- **Props**:
  - `search`: `string` (texto del buscador, `v-model:search`).
  - `searchPlaceholder?`: `string` (por defecto `'Buscar...'`).
  - `debounceMs?`: `number` (retraso en ms, por defecto `300`).
  - `hasActiveFilters?`: `boolean` (indica si hay filtros activos más allá del buscador).
  - `chips?`: `FilterChip[]` (`Array<{ id: string, label: string, onRemove: () => void }>`).
- **Eventos**:
  - `update:search`: `(value: string)`
  - `clear`: `()` (disparado al pulsar "Limpiar filtros").
- **Slots**:
  - `#filters` / default: Selectores y controles de filtro (`BaseSelect`).
  - `#actions`: Botones de acción principales (ej. `BaseButton` "Nuevo").
  - `#chips`: Personalización libre de la tira de chips activos.
- **Ejemplo**:

```vue
<FilterBar
  v-model:search="query.search"
  :has-active-filters="query.hasActiveFilters"
  :chips="activeChips"
  @clear="query.resetFilters"
>
  <template #filters>
    <div class="w-44">
      <BaseSelect v-model="query.filters.category" :options="categoryOptions" />
    </div>
  </template>
  <template #actions>
    <BaseButton variant="primary" density="compact">Nuevo Producto</BaseButton>
  </template>
</FilterBar>
```

---

### useDataTableQuery (Composable)

Composable para gestión de estado de listados tabulares con sincronización bidireccional en la query string de la URL (compatible con modo hash `/#/ruta?page=2&sort=name:asc`), normalización de parámetros y generación del objeto de consulta listo para la API de Symfony.

- **Opciones (`DataTableQueryOptions`)**:
  - `initialPage?`: `number` (por defecto `1`).
  - `initialPerPage?`: `number` (por defecto `10`).
  - `initialSort?`: `string` (ej. `'name:asc'`).
  - `initialSearch?`: `string` (por defecto `''`).
  - `initialFilters?`: `TFilters` (diccionario de filtros específicos).
  - `syncUrl?`: `boolean` (por defecto `true`).
- **Retorno**:
  - `page`, `perPage`, `sort`, `search`, `filters`: Refs reactivos.
  - `queryParams`: Computed con el objeto final listo para enviar al cliente HTTP: `{ page, perPage, sort?, search?, ...filters }`.
  - `hasActiveFilters`, `activeFiltersCount`: Banderas de estado de filtros.
  - `setPage`, `setPerPage`, `setSort`, `setSearch`, `setFilter`, `resetFilters`, `resetAll`.
  - `handleQueryChange`: Controlador directo para el evento `@query-change` de `DataTable`.

---

### ConfirmDialog

Diálogo modal accesible para confirmaciones críticas o acciones destructivas (como eliminar almacenes o localizaciones), construido sobre `BaseModal`. Aplica por defecto la variante `'danger'`, icono de advertencia, y foco automático (autofocus programático accesible) en el botón "Cancelar" para prevenir eliminaciones accidentales al pulsar Enter.

- **Props**:
  - `open`: `boolean` (controla la visibilidad del modal).
  - `title?`: `string` (título de la acción, por defecto `¿Confirmar acción?`).
  - `message?`: `string` (mensaje explicativo de la consecuencia).
  - `confirmText?`: `string` (etiqueta del botón de confirmación, por defecto `Confirmar`).
  - `cancelText?`: `string` (etiqueta del botón de cancelación, por defecto `Cancelar`).
  - `variant?`: `'danger' | 'warning' | 'primary'` (por defecto `'danger'`).
  - `loading?`: `boolean` (estado de carga mientras se ejecuta la acción remota).
  - `size?`: `'sm' | 'md' | 'lg' | 'xl'` (por defecto `'sm'`).
- **Eventos**:
  - `update:open`: `(open: boolean)` (soporte para `v-model:open`).
  - `confirm`: `()` (disparado al pulsar el botón de confirmación).
  - `cancel`: `()` (disparado al pulsar cancelar, backdrop o Escape).
- **Accesibilidad**:
  - Vincula el mensaje a la descripción accesible de `DialogContent`.
  - Foco programático seguro en el botón de cancelación mediante `nextTick()`.
- **Ejemplo**:

```vue
<ConfirmDialog
  :open="isDeleteOpen"
  title="¿Eliminar almacén?"
  :message="`¿Está seguro de eliminar '${warehouse.name}'? Esta acción no se puede deshacer.`"
  confirm-text="Eliminar almacén"
  variant="danger"
  :loading="isDeleting"
  @update:open="isDeleteOpen = $event"
  @confirm="handleConfirmDelete"
  @cancel="isDeleteOpen = false"
/>
```

---

### BaseChart

Componente gráfico universal basado en Apache ECharts con tree-shaking estricto (`BarChart`, `LineChart`, `GridComponent`, `TooltipComponent`, `LegendComponent`, `AriaComponent`, `SVGRenderer`), renderizado SVG accesible, carga diferida (dynamic import) en un chunk independiente y adaptación automática a los tokens CSS del tema activo.

- **Props**:
  - `option`: `Record<string, any>` (configuración y series de ECharts).
  - `height?`: `string` (altura del contenedor, por defecto `'280px'`).
  - `ariaLabel`: `string` (etiqueta descriptiva obligatoria para tecnologías de asistencia).
  - `loading?`: `boolean` (activa esqueleto de carga mediante `BaseSkeleton`).
  - `empty?`: `boolean` (muestra contenedor `EmptyState` cuando no existen datos para graficar).
- **Slots**:
  - `table`: Alternativa textual estructurada (tabla accesible con clase `sr-only`) recomendada para usuarios de lectores de pantalla.
- **Características Técnicas**:
  - **Tree-shaking estricto**: Importa únicamente los módulos registrados en `echartsCore.ts`, impidiendo importar el bundle completo de ECharts.
  - **Renderizado SVG**: Utiliza exclusivamente `SVGRenderer` para nitidez vectorial óptima y menor consumo de memoria.
  - **Redimensionamiento Reactivo**: Controlado con `ResizeObserver` para responder inmediatamente a cambios de ventana o colapso del sidebar de navegación.
  - **Movimiento Reducido**: Detecta `prefers-reduced-motion` para anular o limitar animaciones a menos de 300 ms.
  - **Valores y Formateo**: El componente no manipula ni convierte los importes monetarios o cantidades; el consumidor proporciona el formateo deseado (por ejemplo, mediante callbacks `valueFormatter` o `formatter`).
  - **Paleta Categórica (`--chart-1` a `--chart-8`)**: El composable `useChartTheme` expone una paleta categórica de 8 colores derivada de los tokens CSS `--chart-1` a `--chart-8` (configurados en modo claro y oscuro garantizando contraste WCAG AA >= 4.5:1), utilizada automáticamente para series y categorías cuando no se especifiquen colores personalizados.
- **Ejemplo**:

```vue
<BaseChart
  :option="chartOption"
  aria-label="Balance mensual de ventas y compras"
  height="280px"
  :loading="isLoading"
  :empty="!hasData"
>
  <template #table>
    <table>
      <caption>Balance de Ventas y Compras</caption>
      <thead>
        <tr><th>Mes</th><th>Ventas</th><th>Compras</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.month">
          <td>{{ row.month }}</td>
          <td>{{ row.sales }} CUP</td>
          <td>{{ row.purchases }} CUP</td>
        </tr>
      </tbody>
    </table>
  </template>
</BaseChart>
```
