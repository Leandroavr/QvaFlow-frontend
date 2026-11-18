# Guía de Traspaso para Backend (Handoff)

Esta guía documenta los aspectos arquitecturales, convenciones de integración, reglas de negocio autoritativas y el estado actual de los módulos frontend de QvaFlow para el equipo de desarrollo backend (Symfony / PHP).

---

## 1. Archivos que el Backend Debe Leer Primero

Antes de implementar o modificar endpoints en Symfony, es fundamental revisar estos archivos en el repositorio frontend:

1. **`docs/API_CONTRACT.md`**: Contrato exhaustivo de endpoints, estructuras JSON de petición/respuesta, códigos de estado HTTP y convenciones de redondeo multimoneda.
2. **`src/features/sales/types/index.ts`**: Definición formal de tipos TypeScript, DTOs y modelos de datos para ventas, turnos de caja, canjes de divisas y salidas.
3. **`src/shared/types/permissions.ts`**: Catálogo de permisos RBAC del sistema con nomenclatura `"modulo.accion"` (`KNOWN_PERMISSIONS`).
4. **`src/services/mock/mockCashService.ts`**: Implementación mock de referencia para turnos de caja, cierres con arqueo físico, canjes de divisas, salidas de caja y fórmula de conciliación de efectivo en gaveta.
5. **`src/services/mock/mockSalesService.ts`**: Implementación mock de referencia para el terminal POS, checkout de ventas con redondeo, anulación de tickets con reversión de existencias y filtrado por cajero.
6. **`src/services/mock/mockInventoryService.ts`**: Implementación mock para existencias físicas, traslados entre almacenes, deducción de stock en mostrador y generación de documentos de ajuste auditados.

---

## 2. Arquitectura de Integración y Regla de Contacto

El frontend de QvaFlow está diseñado desacoplado de la capa de transporte mediante inyección de dependencias basada en interfaces:

- **Componentes, Vistas y Composables:** Consumen exclusivamente las interfaces abstractas definidas en `src/services/interfaces/` (`CashService`, `SalesService`, `InventoryService`, etc.). No conocen URLs, cabeceras HTTP ni si los datos provienen de la memoria o de la red.
- **Implementaciones HTTP:** Residen en `src/services/http/` (`HttpCashService`, `HttpSalesService`, `HttpInventoryService`, etc.) y utilizan la instancia central de Axios (`httpClient`).
- **Regla de Contacto:** Al conectar con el backend real Symfony, **únicamente se modifican los clientes en `src/services/http/` y el backend Symfony**. Las vistas, componentes y reglas de UI no deben ser alterados.

---

## 3. Cómo Alternar entre Mocks y Backend Real

La selección del proveedor de servicios se gestiona automáticamente en `src/services/index.ts` mediante la variable de entorno `VITE_USE_MOCKS`:

- **Modo Mocks (desarrollo independiente y tests):**

  ```env
  VITE_USE_MOCKS=true
  ```

  El frontend opera con datos semilla en memoria local, validaciones simuladas y respuestas con retardo de red simulado (50-200ms).

- **Modo HTTP Real (conexión a Symfony):**
  ```env
  VITE_USE_MOCKS=false
  ```
  El frontend despacha las peticiones HTTP a `/api/*`. La configuración de proxy inverso de Vite (`vite.config.ts`) redirige estas peticiones al host local o remoto del backend Symfony (por defecto `http://localhost:8000`).

---

## 4. Reglas de Negocio que el Backend DEBE Garantizar

El frontend realiza validaciones ergonómicas para mejorar la experiencia de usuario (UX), pero **la seguridad, integridad contable y control de existencias recaen de forma autoritativa en el backend Symfony**:

### 4.1 Recálculo Autoritativo de Totales en el Servidor

- El cliente envía los ítems con sus cantidades, pero el backend **nunca debe confiar en `totalCUP`, `totalUSD` ni en los subtotales enviados por el navegador**.
- El servidor debe consultar el precio vigente del producto en BD, aplicar los redondeos comerciales obligatorios (CUP al entero más cercano, USD redondeo forzado hacia arriba `ceil`), calcular la tasa efectiva del día con el margen configurado y computar el vuelto exacto en CUP.

### 4.2 Precisión Decimal Estricta (`DecimalString`)

- Todos los valores monetarios y cantidades físicas deben gestionarse con tipos de alta precisión (ej. `DECIMAL(12,2)` o `DECIMAL(14,4)` en base de datos y strings o librerías de precisión fija tipo `Brick\Math` / `bcmath` en PHP).
- Está terminantemente prohibido utilizar números de punto flotante (`float`, `double`) en cálculos monetarios para evitar discrepancias por redondeo binario.

### 4.3 Control de Permisos por Endpoint (RBAC Dinámico)

- El backend debe validar los permisos en cada endpoint mediante anotaciones Symfony (`#[IsGranted('...')]` o Voters).
- Los roles de usuario son dinámicos: el backend **nunca debe verificar nombres de roles hardcodeados** (como `'ROLE_ADMIN'` o `'ROLE_CAJERO'`); debe verificar el permiso granular específico (`sales.create`, `cash.open_close`, etc.).

### 4.4 Autorización por Objeto (Row-Level Security)

- **Historial de Ventas (`GET /api/sales`):**
  - Si el usuario cuenta con `sales.view_all`, el backend retorna las ventas de todos los cajeros.
  - Si el usuario solo tiene `sales.view` (vendedor estándar), el backend **debe forzar en BD la cláusula `WHERE s.cashier_id = :current_user_id`**, devolviendo únicamente sus propias ventas.
- **Listado de Cajeros (`GET /api/sales/cashiers`):**
  - Si el usuario carece de `sales.view_all`, el endpoint debe retornar únicamente su propia identidad para prevenir la enumeración de usuarios del sistema.

### 4.5 Trazabilidad y Auditoría Inmutable

- **Anulaciones de Venta (`POST /api/sales/{id}/cancel`):** Requiere permiso `sales.cancel`, motivo obligatorio con mínimo 10 caracteres, registro del usuario que anula y fecha/hora inmutable, revirtiendo el stock físico en almacén.
- **Cierre y Arqueo de Turno (`POST /api/cash/shifts/{id}/close`):** Exclusivo de administración (`cash.open_close`). Si existe descuadre entre lo contado y lo esperado, el motivo es estrictamente obligatorio (`REASON_REQUIRED`, >= 10 caracteres).
- **Salidas desde el POS (`POST /api/cash/withdrawals`):** Motivo obligatorio con mínimo 10 caracteres y beneficiario identificado. Genera la deducción contable del efectivo o el movimiento de inventario con estado `CONFIRMED`.

### 4.6 Filtrado de Datos Sensibles en Respuestas

- **Costos de Compra (`products.view_cost`):** Si el usuario autenticado no posee el claim `products.view_cost`, el backend **bajo ninguna circunstancia debe incluir** las propiedades `cost` (en ítems de inventario) ni `costValue` (en resúmenes financieros). El frontend omite visualmente las columnas, pero la confidencialidad de los márgenes depende del backend.
- **Aislamiento de Cierres para Vendedores:** Los datos de arqueo y esperado de otros turnos no deben enviarse a usuarios con perfil de vendedor.

---

## 5. Matriz de Permisos Clave del Sistema

| Permiso             | Módulo | Alcance y Acciones Habilitadas                                                                                                                                                                                              | Segregación de Roles         |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `sales.create`      | Ventas | Emitir tickets en POS, abrir turno propio en POS, canjear divisas en mostrador (F6) y registrar salidas autorizadas de caja/inventario (F7).                                                                                | Vendedor, Cajero, Admin      |
| `sales.view`        | Ventas | Consultar historial de tickets emitidos (restringido a ventas propias si no tiene `sales.view_all`).                                                                                                                        | Vendedor, Cajero, Admin      |
| `sales.view_all`    | Ventas | Consultar el historial completo de ventas de todos los cajeros y turnos; habilita el filtro de cajeros.                                                                                                                     | Admin, Auditor, Supervisor   |
| `sales.cancel`      | Ventas | Anular tickets emitidos revirtiendo stock con motivo obligatorio (>= 10 caracteres).                                                                                                                                        | Admin, Supervisor            |
| `cash.open_close`   | Caja   | Acceso a la pantalla **Turno y arqueo** (`/cash/shift`), listado de turnos abiertos concurrentes (`GET /api/cash/shifts?status=OPEN`) y **cierre formal de turnos con arqueo físico** (`POST /api/cash/shifts/{id}/close`). | **Exclusivo Administración** |
| `cash.exchange`     | Caja   | Acceso a pantalla **Cambio y canje** (`/cash/exchange`), fijar tasas del día y margen comercial de canje.                                                                                                                   | **Exclusivo Administración** |
| `cash.view_history` | Caja   | Acceso a pantalla **Cuadres** (`/cash/shifts`), historial de turnos cerrados (`status=CLOSED`) y detalle de arqueos históricos.                                                                                             | Admin, Auditor, Contador     |

> [!IMPORTANT] REGLA DE SEGREGACIÓN VENDEDOR vs ADMINISTRACIÓN
> El vendedor **únicamente** posee permisos `sales.*` y opera en el POS. El cierre de turno de caja es **exclusivo de administración** (`cash.open_close`).

---

## 6. Estado y Pendientes del Frontend

El desarrollo del frontend de QvaFlow se encuentra estructurado en fases. A continuación se resume el estado de cada módulo para planificar el despliegue del backend:

| Módulo / Pantalla                             | Ruta Frontend     | Estado Frontend             | Observaciones para Backend                                                                                                                          |
| --------------------------------------------- | ----------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Punto de Venta (POS)**                      | `/sales/pos`      | **Completado y verificado** | Catálogo, lector de barras, carrito, retención F4, canje F6, salida F7 y checkout F8 con idempotencia (`clientRequestId`).                          |
| **Historial de Ventas**                       | `/sales/history`  | **Completado y verificado** | Listado paginado, filtrado por cajero (según `sales.view_all`), anulación con reversión de existencias e impresión de ticket.                       |
| **Turno y Arqueo**                            | `/cash/shift`     | **Completado y verificado** | Vista administrativa que lista turnos abiertos de todos los cajeros y modal de cierre con arqueo físico y control de diferencias.                   |
| **Salidas de Caja e Inventario**              | Modal en POS (F7) | **Completado y verificado** | Registro con idempotencia, descuento de efectivo esperado o existencias en almacén. Endpoints `/api/cash/withdrawals`.                              |
| **Inventario (Stock, Traslados, Ajustes)**    | `/inventory/*`    | **Completado y verificado** | Gestión multialmacén, control de localizaciones físicas y documentos inmutables `CONFIRMED`.                                                        |
| **Reportes y Analíticas**                     | `/reports`        | **Completado y verificado** | Cuadros de mando, KPIs de margen (gating con `products.view_cost`), series temporales y exportación.                                                |
| **Cambio y Canje / Tasa del Día**             | `/cash/exchange`  | **Pendiente**               | Pantalla administrativa dedicada para consultar y fijar tasas del día y margen de canje en mostrador. Hoy se consume mediante mocks en POS y Turno. |
| **Cuadres de Caja**                           | `/cash/shifts`    | **Pendiente**               | Pantalla administrativa dedicada para consultar el histórico paginado de turnos cerrados y arqueos archivados.                                      |
| **Catálogo General de Productos**             | `/products/*`     | **Pendiente**               | Módulo administrativo para creación, edición masiva, categorización y fijación de costos comerciales de compra.                                     |
| **Compras y Proveedores**                     | `/purchases/*`    | **Pendiente**               | Módulo de órdenes de compra, recepción de mercancía y facturación de proveedores.                                                                   |
| **Administración (Usuarios, Roles, Backups)** | `/admin/*`        | **Pendiente**               | Módulo de gestión de usuarios, roles RBAC dinámicos y respaldos de base de datos.                                                                   |
| **Limpieza de Código Legado**                 | `/legacy/*`       | **En proceso**              | Las vistas legadas se mantienen como referencia temporal y se eliminarán una vez completada la migración a los módulos modernos.                    |
