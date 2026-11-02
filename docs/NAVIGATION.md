# Arquitectura de Navegación y Menú Dirigido por Datos - QvaFlow

Este documento describe la arquitectura del sistema de navegación de la SPA QvaFlow, cómo se filtran los menús mediante RBAC y la guía para registrar nuevos módulos en el sistema.

---

## 1. Filosofía Arquitectural y Seguridad

> [!IMPORTANT]
> **REGLA DE SEGURIDAD ARQUITECTURAL:**
> El filtrado de menú y los navigation guards en el frontend son **EXCLUSIVAMENTE para ergonomía de interfaz y control visual (UI/UX)** (ocultar opciones inaccesibles para mantener una interfaz limpia y evitar frustración al usuario).
>
> La seguridad, autorización, integridad y validación real de los datos es responsabilidad **única y definitiva del backend Symfony**, el cual valida en cada petición HTTP los permisos y tokens JWT mediante voters y políticas de acceso. El frontend **nunca** debe asumir que una acción no visible en la UI es segura por omisión.

---

## 2. Estructura del Menú (`src/app/navigation/menu.ts`)

La navegación principal no está codificada a mano en las plantillas HTML; se genera a partir de una estructura de datos fuertemente tipada:

```typescript
export interface MenuItem {
  id: string
  label: string
  icon?: Component
  to?: string
  permission?: AppPermission | string
  anyOf?: (AppPermission | string)[]
  children?: MenuItem[]
}
```

### Filtrado Reactivo por Permisos

La función pura `filterMenuByPermissions(menu, can)` evalúa el árbol de navegación recursivamente:

1. Si un ítem define `permission` y el usuario no lo posee, el ítem se excluye.
2. Si un ítem define `anyOf` y el usuario no posee ninguno de ellos, se excluye.
3. Si un grupo tiene submenús (`children`), se filtran recursivamente. **Si todos los hijos quedan ocultos por falta de permisos, el grupo padre completo se oculta automáticamente**, evitando encabezados vacíos.
4. Las opciones sin permiso (como _Inicio_) permanecen visibles para cualquier usuario autenticado.

---

## 3. Guía Paso a Paso: Cómo Añadir un Nuevo Módulo

Para incorporar un nuevo módulo o pantalla a QvaFlow, siga estos 4 pasos:

### Paso 1: Registrar el Permiso RBAC

Si el módulo requiere un nuevo permiso, agréguelo en `src/shared/types/permissions.ts`:

```typescript
export const KNOWN_PERMISSIONS = [
  // ...
  'crm.view_clients', // nuevo permiso
] as const
```

Y documéntelo en `docs/API_CONTRACT.md` bajo el catálogo de permisos.

### Paso 2: Registrar el Ítem en el Menú

Edite `src/app/navigation/menu.ts` e inserte el ítem dentro de `APP_MENU` con su icono de `lucide-vue-next`:

```typescript
import { Users2 } from 'lucide-vue-next'

// Si es un nuevo grupo:
{
  id: 'crm',
  label: 'Clientes',
  icon: Users2,
  children: [
    {
      id: 'crm-clients',
      label: 'Directorio de Clientes',
      icon: Users2,
      to: '/crm/clients',
      permission: 'crm.view_clients',
    },
  ],
}
```

### Paso 3: Registrar la Ruta en el Router

En `src/app/router/index.ts`, agregue la ruta como hija del layout principal `AppLayout`:

```typescript
{
  path: 'crm/clients',
  name: 'crm-clients',
  component: () => import('../../features/crm/views/ClientsView.vue'),
  meta: {
    permission: 'crm.view_clients',
    title: 'Directorio de Clientes - QvaFlow',
    breadcrumb: 'Clientes',
    parentBreadcrumb: 'CRM',
  },
}
```

> **Nota:** Durante el desarrollo previo a la implementación final de la vista, puede utilizar temporalmente `ModulePlaceholderView.vue` como componente de la ruta.

### Paso 4: Construir la Vista del Módulo

Cree la vista dentro de su correspondiente carpeta de características (`src/features/<modulo>/views/`). Utilice el componente estándar `PageHeader` para el título y descripción, y `density="compact"` para tablas, formularios y controles.

---

## 4. Características de la Interfaz Desktop

- **Sidebar Colapsable:** Ancho de 240px expandido y 64px colapsado (con tooltips accesibles).
- **Atajo Global:** <kbd>Ctrl</kbd> + <kbd>B</kbd> (o <kbd>Cmd</kbd> + <kbd>B</kbd> en macOS) para alternar el colapso del sidebar en cualquier momento.
- **Persistencia:** La preferencia de colapso se guarda automáticamente en `localStorage` (`qvaflow_sidebar_collapsed`).
- **Adaptabilidad Responsive:**
  - En resoluciones $\ge 1280\text{px}$: Responde a la preferencia del usuario (por defecto expandido).
  - En resoluciones $< 1280\text{px}$ y $\ge 1024\text{px}$: Se colapsa automáticamente a 64px para dar prioridad al contenido de trabajo.
  - En resoluciones $< 1024\text{px}$: Se convierte en panel lateral superpuesto (_off-canvas drawer_) con fondo translúcido y botón de menú en la barra superior.
- **Soporte Kiosco:** La opción `layout: 'fullscreen'` en el `meta` de una ruta permite renderizar vistas especiales (como terminales de autoservicio o pantallas completas de despacho) sin sidebar ni topbar.
- **Accesibilidad:** Enlace de salto directo al contenido principal (_skip link_), roles semánticos HTML5 (`aside`, `header`, `nav`, `main`) y navegación completa por teclado con indicador visible de foco.
