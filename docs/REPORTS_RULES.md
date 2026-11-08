# Reglas de Negocio del Módulo de Reportes (Análisis del Código Legado)

Este documento extrae y consolida las especificaciones, fórmulas, indicadores, orígenes de datos, comportamientos y limitaciones encontrados en el módulo legado de Reportes y Analíticas (`src/modules/reports/`), con el fin de guiar su migración a la arquitectura moderna de QvaFlow (Vue 3, TypeScript estricto, CSS Tokens y Tailwind, sin Ant Design ni emojis).

---

## 1. Pantalla: Estructura General

La interfaz principal del módulo está implementada en [`src/modules/reports/views/ReportsDashboardView.vue`](file:///c:/Users/leandro.valdes/Desktop/Proyectos/qvaflow-frontend/src/modules/reports/views/ReportsDashboardView.vue). Los elementos visuales se organizan verticalmente en el siguiente orden estricto de aparición:

1. **Barra Superior de Control y Filtros** (`ReportsDashboardView.vue:4-77`):
   - Selector primario: período o mes de análisis (`ReportsDashboardView.vue:8-25`).
   - Selector secundario 1: tipo de operación (`ReportsDashboardView.vue:28-43`).
   - Selector secundario 2: categoría de producto (`ReportsDashboardView.vue:45-64`).
   - Botón de acción: "Actualizar Datos" con estado de carga (`ReportsDashboardView.vue:68-76`).
2. **Cuadrícula de Tarjetas de Indicadores Clave (KPIs)** (`ReportsDashboardView.vue:79-180`):
   - Tarjeta 1: Ventas / Ingresos del mes (`ReportsDashboardView.vue:81-102`).
   - Tarjeta 2: Compras / Egresos del mes (`ReportsDashboardView.vue:104-125`).
   - Tarjeta 3: Ganancia Bruta (Ventas - Compras) (`ReportsDashboardView.vue:127-154`).
   - Tarjeta 4: Rentabilidad Comercial / Margen sobre ventas (`ReportsDashboardView.vue:156-179`).
3. **Contenedor Principal de Pestañas (`a-tabs`)** (`ReportsDashboardView.vue:183-433`):
   - **Pestaña 1: "Balance de Ventas y Compras"** (`key="movements"`, `ReportsDashboardView.vue:186-285`):
     - Barra gráfica proporcional de flujo de fondos (proporción Ventas vs Compras) (`ReportsDashboardView.vue:188-214`).
     - Tabla detallada de movimientos financieros individuales del período (`ReportsDashboardView.vue:217-283`).
   - **Pestaña 2: "Rendimiento de Catálogo e Inventario"** (`key="products"`, `ReportsDashboardView.vue:287-432`):
     - Panel izquierdo: Tabla de "Top 5 Productos Más Vendidos" con barras de rotación porcentual (`ReportsDashboardView.vue:291-352`).
     - Panel derecho: Tabla de "Productos Ociosos (Sin Rotación > 30 días)" con indicador de capital inmovilizado y botón de acción para oferta (`ReportsDashboardView.vue:354-430`).

---

## 2. Filtros

El módulo legado cuenta con tres filtros visibles en la barra superior y uno adicional definido en el almacén de estado:

| Filtro | Implementación | Valores Posibles | Valor por Defecto | Comportamiento |
| :--- | :--- | :--- | :--- | :--- |
| **1. Período / Mes** | `a-select` (`ReportsDashboardView.vue:13-25`) | `'2026-10'`, `'2026-09'`, `'2026-08'`, `'ALL'` (`reportsService.ts:263-270`) | `'2026-10'` (`reportsStore.ts:25`) | Dispara `setMonthFilter` (`reportsStore.ts:101-118`), recargando el resumen financiero y los movimientos asociados al mes seleccionado. |
| **2. Tipo de Movimiento** | `a-select` (`ReportsDashboardView.vue:32-43`) | `'ALL'` (Ventas y Compras), `'VENTA'` (Solo Ventas), `'COMPRA'` (Solo Compras) | `'ALL'` (`reportsStore.ts:30`) | Filtro reactivo en cliente sobre la tabla de movimientos (`reportsStore.ts:59-60`). |
| **3. Categoría** | `a-select` (`ReportsDashboardView.vue:49-64`) | `'ALL'` (Todas las Categorías) y valores únicos deducidos de los movimientos (`reportsStore.ts:40-46`) | `'ALL'` (`reportsStore.ts:31`) | Filtro reactivo en cliente sobre la tabla de movimientos (`reportsStore.ts:61-62`). |
| **4. Almacén** *(Oculto en UI)* | Store (`reportsStore.ts:32, 48-54`) | `'ALL'` y almacenes presentes en los movimientos | `'ALL'` (`reportsStore.ts:32`) | Está programado en el getter `filteredMovements` (`reportsStore.ts:63-64`), pero **no tiene selector en el template** de la vista legada. |

### Definición de Períodos:
- **Meses Cerrados (`YYYY-MM`)**: Se basan en claves fijas provistas por `reportsService.getAvailableMonths()` (`src/modules/reports/services/reportsService.ts:263-270`). En el mock: `'2026-10'` ("Octubre 2026 (Mes Actual)"), `'2026-09'` ("Septiembre 2026") y `'2026-08'` ("Agosto 2026").
- **Acumulado Anual / Total (`'ALL'`)**: Etiquetado como `"Todos los Meses (Acumulado Anual)"` (`reportsService.ts:268`). Suma los registros de todos los meses disponibles (`reportsService.ts:276-301`).
- **Filtros por "Hoy", "Esta Semana" y "Rango Libre de Fechas"**: **No definido en el legado**. El prototipo no contempla selección por fechas arbitrarias ni selectores de tipo DatePicker.

---

## 3. Indicadores (KPIs)

En `ReportsDashboardView.vue` y `reportsService.ts` se definen los siguientes indicadores:

### 3.1 Ventas (Ingresos)
- **Campos del modelo:** `salesCUP: number`, `salesUSD: number`, `salesCount: number` (`types/reports.ts:43-45`).
- **Fórmula:** Suma del importe de todas las ventas del período (`reportsService.ts:279`).
- **Formateo en UI:**
  - Monto principal: `formatearMoneda(salesCUP, 'CUP')` en color verde esmeralda (`text-emerald-600`), ej: `145,850.00 CUP` (`ReportsDashboardView.vue:89-91`).
  - Subtexto complementario: `$${salesUSD.toFixed(2)} USD • ${salesCount} tickets` (`ReportsDashboardView.vue:92-95`).

### 3.2 Compras (Egresos)
- **Campos del modelo:** `purchasesCUP: number`, `purchasesUSD: number`, `purchasesCount: number` (`types/reports.ts:46-48`).
- **Fórmula:** Suma del importe de todas las compras a proveedores del período (`reportsService.ts:281`).
- **Formateo en UI:**
  - Monto principal: `formatearMoneda(purchasesCUP, 'CUP')` en color rojo (`text-rose-600`), ej: `84,200.00 CUP` (`ReportsDashboardView.vue:112-114`).
  - Subtexto complementario: `$${purchasesUSD.toFixed(2)} USD • ${purchasesCount} facturas` (`ReportsDashboardView.vue:115-118`).

### 3.3 Ganancia Bruta (Ventas - Compras)
- **Campos del modelo:** `grossProfitCUP: number`, `grossProfitUSD: number` (`types/reports.ts:49-50`).
- **Fórmulas:**
  `grossProfitCUP = salesCUP - purchasesCUP`
  `grossProfitUSD = salesUSD - purchasesUSD`
  Cálculo explícito en `reportsService.ts:283-284`.
- **Formateo en UI:**
  - Monto principal: `formatearMoneda(grossProfitCUP, 'CUP')` (`ReportsDashboardView.vue:143`).
  - Subtexto complementario: `$${grossProfitUSD.toFixed(2)} USD neto` (`ReportsDashboardView.vue:145-147`).
  - Color dinámico: `text-qvaflow-navy` (azul marino) si >= 0, o `text-rose-600` (rojo) si < 0 (`ReportsDashboardView.vue:137-141`).
- **Observación analítica (a confirmar con backend):** El legado define la "Ganancia Bruta" como la simple resta de caja entre ventas totales y compras totales del mes. No toma en consideración el costo de la mercancía efectivamente vendida (COGS / Cost of Goods Sold) ni el stock que permanece en almacén, lo que distorsiona el margen comercial real si se realiza una compra masiva para inventario.

### 3.4 Rentabilidad Comercial
- **Campo del modelo:** `marginPercent: number` (`types/reports.ts:51`).
- **Fórmula:**
  `marginPercent = salesCUP > 0 ? (grossProfitCUP / salesCUP) * 100 : 0`
  Redondeado a 2 decimales (`reportsService.ts:285-286`).
- **Formateo en UI:**
  - Texto principal: `${marginPercent}%` en tamaño grande `text-2xl font-black` (`ReportsDashboardView.vue:165-167`).
  - Badge fijo: `"Saludable"` con clases `bg-emerald-100 text-emerald-800` (`ReportsDashboardView.vue:168-170`).
  - Subtexto: `"Margen sobre ventas"` (`ReportsDashboardView.vue:172`).
- **Observación analítica (a confirmar con backend):** La etiqueta "Saludable" se muestra siempre fija y no evalúa si el porcentaje cae por debajo de umbrales críticos (ej. < 15% o negativo).

### 3.5 Indicadores en Modelo pero no Mostrados en Vista (`MonthlyKpis`) (datos mock sin uso en la vista, no migrar)
En [`src/modules/reports/types/reports.ts:27-33`](file:///c:/Users/leandro.valdes/Desktop/Proyectos/qvaflow-frontend/src/modules/reports/types/reports.ts#L27-L33) y en el mock (`reportsService.ts:11-17`), existen campos de un endpoint `/reports/kpis` (`reportsService.ts:327`) que **no se muestran** en las tarjetas de la vista legada (datos mock sin uso en la vista, no migrar):
- `totalRevenue: 145850`
- `estimatedProfit: 48200`
- `profitMarginPercent: 33.05`
- `totalTransactions: 384`
- `averageTicket: 379.8` (`averageTicket = totalRevenue / totalTransactions`)

### 3.6 Capital Inmovilizado / Retenido
- **Fórmulas:**
  `tiedUpCapital = stock * costPrice`
  `totalIdleCapital = sum(tiedUpCapital)`
  Definido en `reportsStore.ts:35-37` y `types/reports.ts:23`.
- **Formateo en UI:** `formatearMoneda(totalIdleCapital, 'CUP')` mostrado en la cabecera de la tabla de productos ociosos (`ReportsDashboardView.vue:371`).

---

## 4. Gráficos

El análisis de dependencias de [`package.json`](file:///c:/Users/leandro.valdes/Desktop/Proyectos/qvaflow-frontend/package.json) y del código de la vista confirma que:
- **Librería de Gráficos:** **No usa ninguna librería externa de gráficos** (no hay Chart.js, ApexCharts, ECharts ni Recharts instalados).
- **Componentes Gráficos Implementados en el Legado:**
  1. **Barra de Flujo Proporcional Ventas vs Compras** (`ReportsDashboardView.vue:188-214`):
     - Tipo: Barra horizontal proporcional de dos colores maquetada exclusivamente con HTML y Tailwind CSS.
     - Series:
       - Serie 1 (Ingresos por Ventas): Color `bg-emerald-500`. Ancho calculado con `:style="{ width: `${salesRatioPercent}%` }"`.
       - Serie 2 (Egresos por Compras): Color `bg-rose-500`. Ancho calculado con `:style="{ width: `${100 - salesRatioPercent}%` }"`.
     - Fórmula del ratio (`ReportsDashboardView.vue:450-456`):
       `salesRatioPercent = total <= 0 ? 50 : Math.round(sales / (sales + purchases) * 100)`
     - Agrupación temporal: No tiene ejes X ni Y, ni desglose temporal día a día; representa la relación estática del mes seleccionado.
  2. **Barras de Rotación Relativa de Productos** (`ReportsDashboardView.vue:335-340`):
     - Tipo: Componente `<a-progress>` de Ant Design Vue.
     - Color de trazo: Azul oscuro (`stroke-color="#1E3E6B"`).
     - Valor: Campo `percentage` (100% para el producto más vendido, escalado proporcionalmente para los demás).
- **Gráficos de series temporales (líneas, barras por día/semana, gráficos circulares de categorías)**: **No definido en el legado**.

---

## 5. Tablas y Detalle

El módulo legado presenta tres tablas:

### 5.1 Tabla de Movimientos Financieros (Pestaña 1)
Ubicada en `ReportsDashboardView.vue:217-283` y configurada en `movementsColumns` (`ReportsDashboardView.vue:459-503`):

| Columna | Clave (`key`) | Ancho | Alineación | Renderizado y Formato |
| :--- | :--- | :--- | :--- | :--- |
| **Fecha** | `date` | 140px | Izquierda | Texto simple en formato `"DD/MM/YYYY HH:mm"`. |
| **Tipo** | `type` | 110px | Izquierda | Badge: "[emoji de gráfico] Venta" (`bg-emerald-100 text-emerald-800`) o "[emoji de carrito] Compra" (`bg-rose-100 text-rose-800`) (los emojis no se migran). |
| **Referencia** | `reference` | 130px | Izquierda | Texto monoespaciado (`font-mono text-xs font-bold`). Ej: `TICK-908123`, `FAC-2026-001`. |
| **Concepto / Descripción** | `description` | Flexible | Izquierda | Título: `description` (`font-semibold`). Subtítulo: `${category} • ${warehouse}` (`text-[10px] text-slate-400`). |
| **Importe CUP** | `amountCUP` | 140px | Derecha | Con signo: `+` si Venta (verde `text-emerald-700`), `-` si Compra (rojo `text-rose-700`). Formateado con `formatearMoneda`. |
| **Importe USD** | `amountUSD` | 130px | Derecha | Texto monoespaciado: `$${amountUSD.toFixed(2)} USD`. |
| **Forma de Pago** | `paymentMethod` | 150px | Izquierda | Texto del método de pago (ej. `CUP Efectivo`, `Transferencia Bancaria`, `Transfermóvil QR`, `USD Efectivo`). |

- **Orden:** El array mock viene ordenado por fecha descendente. La tabla no define `sorter` interactivo en las columnas.
- **Paginación:** Paginación local en el cliente vía Ant Design Table (`pageSize: 8`) con texto de total: `Total ${t} operaciones en el mes` (`ReportsDashboardView.vue:221-224`).
- **Fila de Totales al Pie:** No tiene fila de totales al pie de la tabla.

### 5.2 Tabla Top 5 Productos Más Vendidos (Pestaña 2)
Ubicada en `ReportsDashboardView.vue:311-351` y configurada en `topColumns` (`ReportsDashboardView.vue:506-524`):

| Columna | Clave (`key`) | Ancho | Alineación | Renderizado y Formato |
| :--- | :--- | :--- | :--- | :--- |
| **Producto** | `product` | Flexible | Izquierda | Nombre del producto (`text-xs font-semibold`) y subtítulo `${category} • ${code}`. |
| **Rotación** | `performance` | 130px | Izquierda | Unidades vendidas (`${unitsSold} uds`), porcentaje (`${percentage}%`) y barra `<a-progress>`. |
| **Recaudado** | `revenue` | 120px | Derecha | Importe total formateado en CUP (`formatearMoneda(totalRevenue, 'CUP')`). |

- **Paginación:** Desactivada (`:pagination="false"`). Muestra exactamente 5 registros.

### 5.3 Tabla de Productos Ociosos / Sin Rotación (Pestaña 2)
Ubicada en `ReportsDashboardView.vue:375-427` y configurada en `idleColumns` (`ReportsDashboardView.vue:527-558`):

| Columna | Clave (`key`) | Ancho | Alineación | Renderizado y Formato |
| :--- | :--- | :--- | :--- | :--- |
| **Producto / Almacén** | `product` | Flexible | Izquierda | Nombre del producto y subtítulo con nombre del almacén (`warehouse`). |
| **Stock** | `stock` | 80px | Izquierda | Cantidad y unidad de medida: `${stock} ${unit}`. |
| **Retenido** | `tiedUpCapital` | 105px | Derecha | Capital inmovilizado en color rojo (`text-rose-600`), formateado en CUP. |
| **Inactividad** | `inactivity` | 85px | Izquierda | Badge: `${daysWithoutSale} días`. Si > 40 días fondo rojo (`bg-red-100 text-red-800`), si no fondo ámbar (`bg-amber-100 text-amber-800`). |
| **Acción** | `action` | 70px | Centro | Botón de enlace `"Ofertar"` (`ReportsDashboardView.vue:417-425`) que dispara `handleOfferAction` emitiendo un toast informativo. |

- **Paginación:** Desactivada (`:pagination="false"`).

---

## 6. Origen de los Datos

Las entidades del dominio legado que alimentan las analíticas son:

1. **Ventas (`CompletedSale`, en `src/modules/pos/types/pos.ts:40-57`)**:
   - Campos utilizados: `id`, `receiptNumber`, `date`, `total`, `currency`, `paymentMode`, `items: [{ code, name, quantity, total }]`.
   - Agregación: Suma de importes totales de venta (`salesCUP`), conteo de operaciones (`salesCount`), suma de unidades vendidas por producto para el Top 5 (`unitsSold`).
2. **Facturas de Compra (`PurchaseInvoice`, en `src/modules/purchases/types/purchases.ts:31-49`)**:
   - Campos utilizados: `id`, `noDocument` / `invoiceNumber`, `fechaMovimiento`, `importeTotal` / `total`, `moneda`, `items: [{ productCode, cantidad, unitCost }]`.
   - Agregación: Suma de costos de compra (`purchasesCUP`), conteo de facturas de proveedores (`purchasesCount`).
3. **Catálogo de Productos (`PosProduct` / `Product`, en `src/modules/catalog/types/product.ts` y `pos.ts`)**:
   - Campos utilizados: `id`, `code`, `name`, `category`, `costPrice`, `salePrice`.
4. **Existencias de Inventario (`InventoryItem`, en `src/modules/inventory/types/inventory.ts:20-33`)**:
   - Campos utilizados: `stock`, `unit`, `warehouse`, `costPrice`.
   - Agregación para inventario ocioso: Multiplicación de `stock * costPrice` y cálculo de días sin venta a partir de la fecha de última venta registrada.

---

## 7. Monedas y Conversión

El legado opera bajo un esquema bimonetario simplificado:
- **Monedas en reportes:** Cada registro financiero maneja importes paralelos en **CUP** y **USD** (`amountCUP`, `amountUSD`, `salesCUP`, `salesUSD`, `purchasesCUP`, `purchasesUSD`).
- **Conversión en el código:**
  - En los mocks de reportes (`reportsService.ts:20-60, 63-168`), los importes en USD están **fijos y precalculados** a una tasa de cambio aproximada de 1 USD ~ 360 CUP (ej. 145,850 CUP equivalen a 405.14 USD).
  - No existe un conversor dinámico ni llamada al servicio de tasas de cambio dentro del módulo de reportes.
- **Otras monedas (`MLC`, `EUR`, `CUP_TRANSFER`)**: Aparecen en el POS como formas de cobro (`pos.ts:8`), pero en los reportes solo se reflejan como texto en la columna "Forma de Pago" (ej. `"Transfermóvil QR"`, `"USD Efectivo"`), sin consolidar saldos específicos por cada moneda.

---

## 8. Exportación e Impresión

- **Estado en el legado:** **No definido en el legado**.
- No existen botones de exportación a formato Excel, CSV o PDF, ni vistas de impresión en `ReportsDashboardView.vue`, `reportsService.ts` ni `reportsStore.ts`.
- *(Nota arquitectural)*: En la lista de permisos de la nueva SPA existe `'reports.export'` (`src/shared/types/permissions.ts:43`), pero su funcionalidad en pantalla no tiene antecedente en el código legado.

---

## 9. Permisos Usados o Implícitos

1. **Permiso de Acceso a la Pantalla:**
   - En el enrutador legado (`src/core/router/index.ts:48`): la ruta `/reports` requiere el permiso `'VIEW_REPORTS'`.
   - En el enrutador nuevo (`src/app/router/index.ts:203`): la ruta `/reports` requiere el permiso `'reports.view'`.
2. **Ocultamiento de Costos y Márgenes:**
   - En la vista legada `ReportsDashboardView.vue`: **No existe ningún control de permisos por elemento (`v-if`)**. Cualquier usuario con acceso a la pantalla ve las compras, las ganancias y el margen.
   - En el sistema de permisos moderno (`src/shared/types/permissions.ts:34`): existe el permiso sensible `'products.view_cost'`. Se debe determinar con el backend si un usuario que solo tiene `reports.view` (ej. cajero o vendedor) puede ver compras y márgenes, o si estos bloques requieren obligatoriamente `products.view_cost`.

---

## 10. Estados: Carga, Vacío y Error

- **Carga (`loading`)** (`reportsStore.ts:23, 72, 94`):
  - El store expone `loading: ref<boolean>(false)`.
  - El botón "Actualizar Datos" muestra el estado de carga (`:loading="reportsStore.loading"`).
  - La tabla de movimientos y las tablas de productos activan el indicador de carga nativo de `<a-table>`.
  - Las tarjetas de KPI no tienen placeholders esqueléticos (`BaseSkeleton`); conservan el valor anterior o muestran 0.
- **Vacío (`empty`)**:
  - No existen componentes ni mensajes personalizados de estado vacío (`EmptyState`). Las tablas recurren al texto por defecto de Ant Design.
  - Si la suma de ventas y compras es 0, la barra proporcional asigna un 50% neutro (`ReportsDashboardView.vue:454`).
- **Error**:
  - Se gestiona mediante notificaciones flotantes con `message.error(errorMsg)` de Ant Design (`reportsStore.ts:92, 114`).
  - No hay pantalla de error completa ni botón de reintento en bloque (`retry`). En caso de excepción de red en `reportsService.ts:329, 341, 353`, el servicio captura el error y retorna silenciosamente los datos mock predeterminados.

---

## 11. Diferencias con el Nuevo Modelo de Datos de QvaFlow

| Aspecto | Prototipo Legado (`src/modules/reports/`) | Nueva Arquitectura SPA QvaFlow |
| :--- | :--- | :--- |
| **Representación Numérica** | Números de punto flotante de JavaScript (`number`), ej: `145850`, `405.14`. | Cadenas decimales exactas (`DecimalString`), ej: `'145850.00'`. Sin aritmética de punto flotante. |
| **Componentes de UI** | Componentes de `ant-design-vue` (`a-select`, `a-table`, `a-tabs`, `a-progress`, `a-button`) y emojis en textos (calendario, gráfico, carrito, bolsa de dinero, gráfico de barras, trofeo, advertencia; los emojis no se migran). | Componentes propios de `src/shared/ui` (`DataTable`, `BaseSelect`, `BaseButton`, `BaseCard`, `PageHeader`, `BaseBadge`), solo iconos de `lucide-vue-next` y sin emojis. |
| **Estilos y Colores** | Clases CSS arbitrarias (`text-emerald-600`, `text-rose-600`, `text-qvaflow-navy`). | Tokens CSS semánticos estrictos (`--state-success`, `--state-error`, `--primary`, `--surface-card`, `--content-primary`). |
| **Formato de Permisos** | Nombres en mayúsculas (`VIEW_REPORTS`, `VIEW_COSTS`). | Formato estándar `modulo.accion` (`reports.view`, `reports.export`, `products.view_cost`). |
| **Gestión de Notificaciones** | `message.error` / `message.info` de Ant Design. | `toast.error` / `toast.success` de `vue-sonner`. |
| **Consolidación Multidivisa** | Importes separados fijos CUP/USD calculados con tasa estática. | Moneda contable base USD con desglose por moneda real de cobro (`CUP`, `CUP_TRANSFER`, `USD`, `MLC`). |

---

## 12. Dudas y Requerimientos para el Backend Symfony

Para completar la migración sin forzar cálculos pesados en el cliente, se requiere definición del backend en los siguientes puntos:

1. **Agregados y Consolidación en el Servidor**:
   - ¿El backend dispondrá de un endpoint de resumen financiero (ej. `GET /api/reports/finance-summary?desde=...&hasta=...`) que devuelva los totales precalculados (`salesTotal`, `purchasesTotal`, `grossProfit`, `marginPercent`, `transactionsCount`) para evitar descargar miles de transacciones al navegador?
2. **Definición Contable de Ganancia y Margen**:
   - ¿La ganancia bruta debe mantenerse como en el legado (`Ventas - Compras`) o debe calcularse contablemente como `Ventas - Costo de Mercancía Vendida (COGS)`?
3. **Granularidad de Filtros de Período**:
   - ¿El backend admitirá rangos flexibles de fechas con parámetros estándar `desde` y `hasta` (ISO 8601 `YYYY-MM-DD`), además de atajos de conveniencia (mes actual, mes anterior, hoy, últimos 7 días)?
4. **Paginación del Detalle de Operaciones**:
   - ¿El listado de movimientos de auditoría financiera (`GET /api/reports/movements`) se entregará paginado en el servidor mediante el contrato estándar `PaginatedResponse<T>` (`page`, `perPage`, `sort`, `search`, `type`, `category`)?
5. **Criterio para Inventario Ocioso**:
   - ¿El umbral de días de inactividad para considerar un producto "ocioso" (actualmente 30 días en el legado) será configurable por parámetro en el endpoint (`GET /api/reports/idle-products?days=30`)?
6. **Manejo de Permisos sobre Costos (`products.view_cost`)**:
   - Si un usuario posee el permiso `reports.view` pero carece de `products.view_cost`, ¿el backend censura u omite los bloques de compras, margen bruto y costos retenidos, entregando únicamente las métricas de ventas y volumen?
