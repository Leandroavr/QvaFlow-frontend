# Catálogo de Componentes UI — QvaFlow Design System

> **Nota de Arquitectura**: Este documento describe los componentes visuales primitivos ubicados en `src/shared/ui/`. Todos los componentes están diseñados para una SPA de escritorio 100% autónoma en red local, construidos sobre tokens CSS semánticos (`tokens.css`), accesibilidad WCAG AA, soporte completo de teclado y densidad compacta por defecto (36px).

---

## 1. Principios de Diseño
- **Tokens Semánticos**: Uso exclusivo de variables CSS (`--surface-page`, `--surface-card`, `--surface-skeleton`, `--state-success`, etc.). Sin colores hexadecimales sueltos.
- **Color como Estado**: Los colores expresan estados (*éxito*, *aviso*, *error/peligro*, *información*), nunca propósitos puramente decorativos.
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
<BaseTabs v-model="tabActiva" :items="[
  { id: 'activos', label: 'Activos', count: 12 },
  { id: 'cerrados', label: 'Cerrados', count: 48 },
]">
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
