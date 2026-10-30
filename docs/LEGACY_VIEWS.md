# Vistas Legadas de Referencia Visual (QvaFlow POS)

> [!WARNING]
> **Herramienta Temporal de Desarrollo**: Estas rutas están diseñadas **únicamente** para permitir la toma de capturas de pantalla de referencia y validación visual de los flujos preexistentes antes de su migración completa al nuevo sistema de diseño (Tailwind + CSS Tokens). **No deben utilizarse en producción.**

---

## 1. Rutas Disponibles

Todas las vistas legadas se encuentran aisladas bajo el prefijo `/legacy/*` y envueltas en el contenedor `LegacyShell.vue`:

| Ruta en Navegador     | Componente Asociado        | Módulo y Propósito                                              |
| :-------------------- | :------------------------- | :-------------------------------------------------------------- |
| `#/legacy/pos`        | `PosTerminalView.vue`      | Terminal TPV de ventas rápidas, carrito, teclado y atajos.      |
| `#/legacy/ventas`     | `SalesAndShiftsView.vue`   | Historial de transacciones, arqueos y cierres de turno de caja. |
| `#/legacy/inventario` | `InventoryStockView.vue`   | Existencias por almacén, localizaciones y movimientos.          |
| `#/legacy/catalogo`   | `CatalogProductsView.vue`  | Listado y formularios de alta/edición de productos y precios.   |
| `#/legacy/compras`    | `PurchasesView.vue`        | Facturas de compra de mercancías y recepción de stock.          |
| `#/legacy/reportes`   | `ReportsDashboardView.vue` | Métricas financieras, gráficos y productos más vendidos.        |
| `#/legacy/usuarios`   | `UserRoleManagerView.vue`  | Gestión de usuarios, asignación de roles y permisos.            |
| `#/legacy/respaldos`  | `BackupManagerView.vue`    | Salvas locales de base de datos y restauración.                 |

---

## 2. Cómo Acceder

1. Inicia sesión en la aplicación (`#/login`) con cualquiera de los usuarios de prueba (por ejemplo, **Superadmin** mediante el panel "Acceso rápido").
2. Navega en la barra de direcciones a cualquiera de las rutas anteriores, por ejemplo:
   ```text
   http://localhost:5173/#/legacy/pos
   ```
3. En la parte superior de la pantalla verás una franja fija ámbar con el mensaje `VISTA LEGADA (solo referencia)` y botones directos para saltar entre cualquiera de las 8 vistas o volver a la SPA moderna.

---

## 3. Arquitectura y Aislamiento Técnico

- **Control de Acceso**: Las rutas `/legacy/*` exigen sesión válida en el nuevo `authStore`. Si se accede sin sesión, el guard redirige inmediatamente a `#/login?redirect=/legacy/...`.
- **Adaptador de Sesión (`legacyAuthBridge.ts`)**: Al ingresar a una ruta `/legacy/*`, se sincroniza automáticamente el usuario y permisos del store nuevo hacia los getters y propiedades que el código legado requiere (`canAccessPos`, `canAccessInventory`, `isSuperadmin`, etc.), asegurando que todos los menús y vistas se visualicen sin errores.
- **Aislamiento en Producción**: Las rutas `/legacy/*` se registran mediante importación dinámica dentro del bloque condicional `if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false')`. En el empaquetado final de producción (`npm run build`), Rollup elimina este bloque por completo y ningún archivo legado entra en el bundle.
- **Contenedor `LegacyShell.vue`**: Registra `ant-design-vue` bajo demanda únicamente dentro de este contexto, evitando alterar los estilos o el comportamiento de la pantalla de login u otras vistas nuevas.

---

## 4. Cómo Retirarlas Tras Completar la Migración

Una vez que todas las pantallas hayan sido capturadas y migradas a la nueva arquitectura:

1. Eliminar la carpeta `src/app/legacy/`.
2. Eliminar el archivo `src/app/views/LegacyShell.vue`.
3. Eliminar el archivo `src/app/router/legacyRoutes.ts`.
4. Eliminar el archivo de pruebas `src/app/router/__tests__/legacyRoutes.spec.ts`.
5. En `src/app/router/index.ts`, retirar el bloque condicional que registra `legacyRoutes`.
6. Eliminar este documento `docs/LEGACY_VIEWS.md`.
