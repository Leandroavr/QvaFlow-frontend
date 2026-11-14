# Auditoría de Código y Arquitectura - QvaFlow Frontend

**Fecha de Auditoría:** 30 de Octubre de 2026  
**Entorno:** SPA Offline-First para MIPYMES (LAN sin conexión a Internet)  
**Objetivo:** Clasificar el estado de todos los archivos del repositorio tras la implantación de la arquitectura por capas (`src/app`, `src/features`, `src/services`, `src/shared`, `src/mocks`), identificando código legado, duplicidades, violación de convenciones, dependencias en desuso y riesgos de conectividad offline.

---

## 1. Inventario y Clasificación de Archivos en `src/`

Cada archivo se clasifica en una de las cuatro categorías:
* **[NUEVO]**: Pertenece a la arquitectura actual desacoplada y al sistema de diseño con Tailwind y CSS tokens.
* **[LEGADO]**: Funcionalidad del prototipo anterior pendiente de migración o integración con la nueva arquitectura.
* **[DUPLICADO]**: Posee un equivalente directo superior en la nueva arquitectura.
* **[MUERTO]**: Archivo huérfano, plantilla inicial o carpeta vacía sin referencias activas.

| Ruta del Archivo | Clasificación | Descripción / Rol |
| :--- | :--- | :--- |
| `src/App.vue` | **NUEVO** | Componente raíz con inicializador de tema sin parpadeo (FOUC). |
| `src/main.ts` | **NUEVO** | Entrada de la SPA; registra Pinia, router de `src/app` y directiva `v-can`. |
| `src/style.css` | **NUEVO** | Tailwind base, import de fuentes Inter locales y `tokens.css`. |
| `src/app/directives/vCan.ts` | **NUEVO** | Directiva RBAC dinámica `v-can="'modulo.accion'"`. |
| `src/app/router/index.ts` | **NUEVO** | Router configurable (`hash`/`history`), guard de login y guard RBAC. |
| `src/app/router/__tests__/routerGuard.spec.ts` | **NUEVO** | Pruebas unitarias completas de navegación y permisos en Vitest. |
| `src/app/views/AppHomeView.vue` | **NUEVO** | Vista placeholder post-login con datos de usuario y permisos activos. |
| `src/app/views/ForbiddenView.vue` | **NUEVO** | Vista de error 403 accesible para rutas no autorizadas. |
| `src/features/auth/components/MockQuickAccess.vue` | **NUEVO** | Panel colapsable de perfiles mock (Superadmin, Vendedor, Almacenero). |
| `src/features/auth/stores/authStore.ts` | **NUEVO** | Store Pinia de autenticación desacoplado de la API real. |
| `src/features/auth/stores/__tests__/authStore.spec.ts` | **NUEVO** | Pruebas unitarias de login, logout y permisos RBAC en Vitest. |
| `src/features/auth/views/LoginView.vue` | **NUEVO** | Pantalla de login accesible (WCAG AA, dark mode, shake y ping local). |
| `src/mocks/users.ts` | **NUEVO** | Datos descriptivos de los 3 usuarios mock. |
| `src/services/index.ts` | **NUEVO** | Factoría de servicios que conmuta según `VITE_USE_MOCKS`. |
| `src/services/api/httpClient.ts` | **NUEVO** | Axios con interceptor Bearer, manejo de 401 y detector de red local. |
| `src/services/http/httpAuthService.ts` | **NUEVO** | Implementación HTTP real para conexión con backend Symfony. |
| `src/services/interfaces/authService.ts` | **NUEVO** | Contrato de interfaz `AuthService`. |
| `src/services/interfaces/baseService.ts` | **NUEVO** | Contrato de interfaz genérica `BaseCrudService`. |
| `src/services/mock/mockAuthService.ts` | **NUEVO** | Implementación simulada de autenticación en memoria. |
| `src/shared/composables/usePermissions.ts` | **NUEVO** | Composable reactivo con `can()`, `canAny()` y `canAll()`. |
| `src/shared/composables/useServerStatus.ts` | **NUEVO** | Composable para monitorización en segundo plano de la salud del servidor. |
| `src/shared/composables/useTheme.ts` | **NUEVO** | Composable para modo claro, oscuro y sincronización con el sistema. |
| `src/shared/composables/__tests__/usePermissions.spec.ts` | **NUEVO** | Pruebas unitarias de evaluación de permisos. |
| `src/shared/stores/uiStore.ts` | **NUEVO** | Store Pinia de estado del servidor local y preferencias de UI. |
| `src/shared/styles/tokens.css` | **NUEVO** | Design tokens en variables CSS para modo claro y `.dark`. |
| `src/shared/types/api.ts` | **NUEVO** | Interfaces de errores tipados `ApiError`, paginación y health check. |
| `src/shared/types/auth.ts` | **NUEVO** | Interfaces `User`, `LoginCredentials`, `AuthResponse`. |
| `src/shared/types/currency.ts` | **NUEVO** | Tipado de divisas y montos exactos como `DecimalString`. |
| `src/shared/types/permissions.ts` | **NUEVO** | Lista exhaustiva de permisos formato `modulo.accion`. |
| `src/shared/ui/BaseAlert.vue` | **NUEVO** | Componente de alerta semántica con `aria-live`. |
| `src/shared/ui/BaseButton.vue` | **NUEVO** | Botón accesible con estados loading, disabled y variantes. |
| `src/shared/ui/BaseInput.vue` | **NUEVO** | Input accesible de 48px con soporte de icono y toggle de visibilidad. |
| `src/shared/ui/BaseSpinner.vue` | **NUEVO** | Spinner vectorial SVG con tamaños y colores personalizables. |
| `src/shared/ui/Can.vue` | **NUEVO** | Componente declarativo `<Can>` para control visual RBAC. |
| `src/shared/ui/StatusDot.vue` | **NUEVO** | Indicador con pulso de actividad del servidor local. |
| `src/shared/ui/ThemeToggle.vue` | **NUEVO** | Selector de tema (Claro / Oscuro / Sistema). |
| `src/shared/utils/formatDate.ts` | **NUEVO** | Utilitario de formateo `dd/mm/aaaa` y hora militar. |
| `src/shared/utils/formatMoney.ts` | **NUEVO** | Utilitario financiero seguro para string decimal. |
| `src/assets/logo.png` | **NUEVO** | Isotipo y logotipo oficial de QvaFlow. |
| `src/assets/logo-horizontal-white.png` | **NUEVO** | Variante horizontal clara para fondos oscuros. |
| `src/assets/logo-horizontal.png` | **NUEVO** | Variante horizontal para fondos claros. |
| `src/assets/logo-icon.png` | **NUEVO** | Favicon / icono cuadrado de la marca. |
| `src/core/router/index.ts` | **DUPLICADO** | Router legado que usaba lógica de roles fijos y rutas antiguas. |
| `src/core/axios.ts` | **DUPLICADO** | Cliente Axios anterior reemplazado por `src/services/api/httpClient.ts`. |
| `src/core/pinia.ts` | **DUPLICADO** | Instancia aislada de Pinia reemplazada por instanciación en `main.ts`. |
| `src/modules/auth/views/LoginView.vue` | **DUPLICADO** | Vista anterior de login (Ant Design Vue) reemplazada por `src/features/auth`. |
| `src/modules/auth/store/authStore.ts` | **DUPLICADO** | Store antiguo acoplado a Ant Design y roles fijos (`ADMIN`, `CASHIER`). |
| `src/modules/auth/types/auth.ts` | **DUPLICADO** | Tipos antiguos reemplazados por `src/shared/types/auth.ts`. |
| `src/modules/auth/services/authService.ts` | **DUPLICADO** | Servicio anterior sin contrato desacoplado Mock/Http. |
| `src/shared/composables/useFormatoFecha.ts` | **DUPLICADO** | Composable anterior reemplazado por `src/shared/utils/formatDate.ts`. |
| `src/shared/composables/useFormatoMoneda.ts` | **DUPLICADO** | Composable anterior reemplazado por `src/shared/utils/formatMoney.ts`. |
| `src/shared/directives/vPermission.ts` | **DUPLICADO** | Directiva antigua reemplazada por `src/app/directives/vCan.ts`. |
| `src/modules/auth/components/UserRoleModal.vue` | **LEGADO** | Modal de edición de roles basado en Ant Design Vue. |
| `src/modules/auth/views/UserRoleManagerView.vue` | **LEGADO** | Panel de administración de usuarios y roles previo. |
| `src/modules/backups/services/backupService.ts` | **LEGADO** | Servicio de salvas y copias de seguridad de base de datos. |
| `src/modules/backups/store/backupStore.ts` | **LEGADO** | Store Pinia del módulo de respaldos. |
| `src/modules/backups/types/backup.ts` | **LEGADO** | Tipos TypeScript de respaldos. |
| `src/modules/backups/views/BackupManagerView.vue` | **LEGADO** | Vista de copias de seguridad (Ant Design Vue). |
| `src/modules/catalog/components/ProductFormModal.vue` | **LEGADO** | Modal de creación/edición de productos. |
| `src/modules/catalog/services/catalogService.ts` | **LEGADO** | Servicio de productos y precios. |
| `src/modules/catalog/store/catalogStore.ts` | **LEGADO** | Store de catálogo. |
| `src/modules/catalog/types/product.ts` | **LEGADO** | Tipos de productos. |
| `src/modules/catalog/views/CatalogProductsView.vue` | **LEGADO** | Vista de catálogo y productos. |
| `src/modules/inventory/components/InventoryMovementModal.vue` | **LEGADO** | Modal de albaranes y movimientos entre localizaciones. |
| `src/modules/inventory/components/WarehouseFormModal.vue` | **LEGADO** | Modal de gestión de almacenes y localizaciones. |
| `src/modules/inventory/services/inventoryService.ts` | **LEGADO** | Servicio de almacenes y stock. |
| `src/modules/inventory/store/inventoryStore.ts` | **LEGADO** | Store Pinia de inventario. |
| `src/modules/inventory/types/inventory.ts` | **LEGADO** | Tipos de almacenes y localizaciones. |
| `src/modules/inventory/views/InventoryStockView.vue` | **LEGADO** | Vista de stock por almacén y localización. |
| `src/modules/pos/components/CashShiftModal.vue` | **LEGADO** | Modal de apertura y cuadre de turno de caja. |
| `src/modules/pos/components/CurrencyExchangeModal.vue` | **LEGADO** | Modal de canje de divisas en caja. |
| `src/modules/pos/components/DailyExchangeRateModal.vue` | **LEGADO** | Modal de tasa de cambio diaria. |
| `src/modules/pos/components/PosCartItem.vue` | **LEGADO** | Fila de producto en el carrito de venta. |
| `src/modules/pos/components/PosPaymentDrawer.vue` | **LEGADO** | Drawer de cobro multimoneda. |
| `src/modules/pos/components/PosPaymentModal.vue` | **LEGADO** | Modal de pago anterior. |
| `src/modules/pos/components/PosProductCard.vue` | **LEGADO** | Tarjeta de producto táctil en TPV. |
| `src/modules/pos/services/posService.ts` | **LEGADO** | Servicio de cobro y ventas. |
| `src/modules/pos/store/posStore.ts` | **LEGADO** | Store de terminal de ventas. |
| `src/modules/pos/types/pos.ts` | **LEGADO** | Tipado de ticket de venta y turnos. |
| `src/modules/pos/views/PosTerminalView.vue` | **LEGADO** | Terminal principal de cobro rápido. |
| `src/modules/pos/views/SalesAndShiftsView.vue` | **LEGADO** | Historial de ventas y cierres de turno. |
| `src/modules/purchases/components/PurchaseInvoiceDrawer.vue` | **LEGADO** | Drawer de facturas de compra y recepción. |
| `src/modules/purchases/services/purchasesService.ts` | **LEGADO** | Servicio de compras a proveedores. |
| `src/modules/purchases/store/purchasesStore.ts` | **LEGADO** | Store de compras. |
| `src/modules/purchases/types/purchases.ts` | **LEGADO** | Tipos de facturas e items de compra. |
| `src/modules/purchases/views/PurchasesView.vue` | **LEGADO** | Listado de compras y estado de mercancías. |
| `src/modules/reports/services/reportsService.ts` | **LEGADO** | Servicio de agregaciones y reportes. |
| `src/modules/reports/store/reportsStore.ts` | **LEGADO** | Store de estadísticas y ventas mensuales. |
| `src/modules/reports/types/reports.ts` | **LEGADO** | Tipos de reportes. |
| `src/modules/reports/views/ReportsDashboardView.vue` | **LEGADO** | Vista de analíticas y gráficos. |
| `src/shared/layouts/MainLayout.vue` | **LEGADO** | Layout con sidebar desplegable del prototipo anterior. |
| `src/components/` | **MUERTO** | Directorio vacío sin ningún componente. |
| `src/assets/hero.png` | **MUERTO** | Gráfico no utilizado. |
| `src/assets/logo.jpg` | **MUERTO** | Duplicado JPG sin transparencia de `logo.png`. |
| `src/assets/vite.svg` | **MUERTO** | Icono por defecto de Vite. |
| `src/assets/vue.svg` | **MUERTO** | Icono por defecto de Vue. |

---

## 2. Hallazgos Específicos por Tipo de Riesgo

### 2.1 Recursos Externos (URLs http/https que fallarían sin Internet)
* **Archivo:** `src/modules/catalog/services/catalogService.ts` (Línea 42)
  * **Hallazgo:** URL externa de Unsplash hardcodeada como imagen de muestra:
    `url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=150'`
  * **Gravedad:** **Alta**. En la red local offline de la MIPYME, la imagen no cargará, generando peticiones colgantes y tiempos de espera.
  * **Acción recomendada:** Migrar a un placeholder SVG local o a un asset en `src/assets/`.

### 2.2 Comparaciones por Nombre de Rol Fijo en Lugar de Permisos RBAC
El requerimiento arquitectural exige evaluar permisos dinámicos en formato `modulo.accion` (ej: `sales.create`), nunca nombres de rol (`ADMIN`, `CASHIER`).
* **Archivos Afectados:**
  1. `src/core/router/index.ts` (Líneas 99, 100, 125, 131): Compara `user.role === 'SUPERADMIN'`, `ADMIN`, `CASHIER`, `WAREHOUSE`.
  2. `src/modules/auth/store/authStore.ts` (Líneas 41, 45, 58, 213): Getters como `canManageUsers` computados con `user.role === 'ADMIN'`.
  3. `src/modules/auth/views/UserRoleManagerView.vue` (Líneas 38, 51, 114): Filtros y etiquetas condicionales por nombre de rol.
  4. `src/modules/auth/components/UserRoleModal.vue` (Líneas 49, 221): Presets hardcodeados de roles.
  5. `src/shared/layouts/MainLayout.vue`: Verificaciones de permisos mezcladas con getters antiguos.
* **Gravedad:** **Media-Alta**. Impide que el administrador cree roles personalizados en Symfony y les asigne permisos arbitrarios.
* **Acción recomendada:** Conservar temporalmente mientras se mantengan los módulos legados y migrar progresivamente a `usePermissions().can(...)` y directiva `v-can`.

### 2.3 Estilos con Colores Sueltos (Hexadecimales Hardcodeados)
Se encontraron colores hardcodeados en lugar de variables de tokens:
* **Archivos Afectados:**
  1. `src/shared/layouts/MainLayout.vue` (Líneas 11, 30, 176, 191, 473-535): Hexadecimales `#1E3E6B`, `#122645`, `#D62738`, `#F1F5F9` incrustados en estilos en línea y CSS interno.
  2. `src/modules/pos/components/PosProductCard.vue` (Línea 15): Color `#1E3E6B`.
  3. `src/modules/reports/views/ReportsDashboardView.vue` (Línea 286): Color `#1E3E6B`.
* **Gravedad:** **Media**. Impide la adaptación limpia al modo oscuro y rompe la consistencia del design system.
* **Acción recomendada:** Migrar a clases semánticas de Tailwind (`bg-primary`, `bg-surface-card`, `border-border`) cuando se refactoricen esos módulos.

### 2.4 Llamadas Directas a Fetch / Axios en Componentes
* **Hallazgo:** Ningún componente `.vue` invoca directamente `fetch()` ni `axios`. Todos los componentes legados interactúan mediante sus respectivos stores o servicios de módulo.
* **Gravedad:** **Baja (Cumple)**. La separación modular de llamadas a API ya se respeta en los componentes.

### 2.5 Dependencias en `package.json`
* **Hallazgos:**
  * `ant-design-vue` (`^4.2.6`) y `@ant-design/icons-vue` (`^7.0.1`): Utilizados exclusivamente por los módulos legados en `src/modules/*` y `src/shared/layouts/MainLayout.vue`. La nueva base (`src/app`, `src/features/auth`, `src/shared/ui`) usa exclusivamente Tailwind CSS y `lucide-vue-next`.
* **Gravedad:** **Baja**.
* **Acción recomendada:** Conservar ambas dependencias mientras coexistan los módulos legados en `src/modules/` para evitar roturas de compilación. Eliminar una vez aprobada la migración definitiva de todos los módulos a la nueva arquitectura base.

---

## 3. Matriz Resumen de Acciones Recomendadas

| Ruta / Componente | Estado Actual | Gravedad | Acción Propuesta |
| :--- | :--- | :---: | :--- |
| `src/core/*` | Duplicado | Media | Eliminar una vez que el usuario confirme que no se requiere el enrutador anterior. |
| `src/modules/auth/*` | Duplicado | Alta | Conservar temporalmente hasta aprobación; sustituido completamente por `src/features/auth/*`. |
| `src/modules/catalog/services/catalogService.ts` | Legado | Alta | Eliminar URL de Unsplash y sustituir por placeholder offline. |
| `src/modules/{pos, inventory, purchases, reports, backups}/*` | Legado | Media | Conservar intacto; migrar progresivamente a la nueva capa de servicios `src/services/` y `shared/ui/`. |
| `src/shared/layouts/MainLayout.vue` | Legado | Media | Conservar intacto; rediseñar cuando se aborden los módulos de navegación principal. |
| `src/components/` | Muerto | Baja | Eliminar carpeta vacía. |
| `src/assets/{hero.png, logo.jpg, vue.svg, vite.svg}` | Muerto | Baja | Eliminar para aligerar el repositorio. |
| `ant-design-vue` | Legado en uso | Baja | Mantener instalada hasta completar la migración de todas las pantallas legadas. |

> **Nota:** Conforme a las instrucciones del usuario, **ningún archivo legado o duplicado ha sido eliminado**. Este reporte sirve de base para la posterior aprobación y plan de limpieza.
