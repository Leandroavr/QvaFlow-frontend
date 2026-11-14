# Reglas de Negocio del Módulo de Ventas y POS (Análisis del Código Legado)

Este documento extrae y consolida las especificaciones, modelos de datos, flujos operacionales, atajos de teclado, reglas monetarias y de arqueo encontrados en el código legado del Punto de Venta (`src/modules/pos/`), con el fin de guiar la migración a la arquitectura moderna de QvaFlow (Vue 3, TypeScript estricto, pantalla completa, CSS Tokens, Tailwind CSS, precisión decimal mediante `DecimalString`, sin Ant Design ni emojis).

---

## 1. Pantalla POS: Estructura, Zonas y Orden

La interfaz principal del terminal se encuentra implementada en [`src/modules/pos/views/PosTerminalView.vue`](../src/modules/pos/views/PosTerminalView.vue). El contenedor raíz está configurado con altura calculada de pantalla completa (`h-[calc(100vh-7rem)]`, [`PosTerminalView.vue:2`](../src/modules/pos/views/PosTerminalView.vue#L2)). La pantalla se estructura estrictamente en las siguientes zonas visuales:

### 1.1 Barra Operacional Superior (`PosTerminalView.vue:4-133`)
Barra horizontal flexible (`flex-wrap items-center justify-between`) con borde y fondo blanco, subdividida en dos extremos:
- **Extremo Izquierdo - Estado y Control del Turno de Caja** (`PosTerminalView.vue:8-43`):
  - Etiqueta de estado (`a-tag`, `PosTerminalView.vue:9-22`): indicador luminoso pulsante verde (`animate-pulse bg-emerald-500`) cuando `posStore.isShiftOpen` es verdadero, mostrando `Turno Abierto: {shift.id}` ([`PosTerminalView.vue:19`](../src/modules/pos/views/PosTerminalView.vue#L19)), o rojo (`bg-red-500`) mostrando `Turno de Caja Cerrado` ([`PosTerminalView.vue:20`](../src/modules/pos/views/PosTerminalView.vue#L20)).
  - Botón condicional de acción de turno (`PosTerminalView.vue:25-42`):
    - Si el turno está cerrado: botón primario "Abrir Turno" (`PosTerminalView.vue:25-33`) que ejecuta `openShiftModal('OPEN')`.
    - Si el turno está abierto: botón secundario "Arqueo / Cerrar Turno" (`PosTerminalView.vue:35-42`) que ejecuta `openShiftModal('CLOSE')`.
- **Extremo Derecho - Botones Operativos y Atajos** (`PosTerminalView.vue:46-132`):
  1. **Tasa de Cambio del Día**: botón verde claro (`PosTerminalView.vue:48-54`) que muestra `💵` (texto del legado, no migrar) `Tasa: 1 USD = {posStore.exchangeRates.USD} CUP` y abre el modal [`DailyExchangeRateModal.vue`](../src/modules/pos/components/DailyExchangeRateModal.vue).
  2. **Ventas y Cuadres**: botón neutro (`PosTerminalView.vue:57-63`) que muestra `🧾` (texto del legado, no migrar) `Ventas y Cuadres` y redirige a la vista de historial (`router.push('/sales-and-shifts')`).
  3. **Canje en Mostrador (F6)**: botón azul (`PosTerminalView.vue:66-73`) con badge de atajo `F6` que muestra `💱` (texto del legado, no migrar) `Canje Divisas` y abre el modal [`CurrencyExchangeModal.vue`](../src/modules/pos/components/CurrencyExchangeModal.vue).
  4. **Suspender Venta (F4)**: botón ámbar (`PosTerminalView.vue:76-84`) con badge de atajo `F4` que muestra `⏸️` (texto del legado, no migrar) `Suspender`, deshabilitado si el carrito está vacío (`posStore.cart.length === 0`).
  5. **Tickets en Espera (Popover)**: botón con badge numérico (`a-badge`, `PosTerminalView.vue:87-131`) que despliega una lista emergente con los tickets suspendidos, su hora, monto en CUP y acciones individuales para "Restaurar" o descartar ("✕").

### 1.2 Cuerpo Principal: Catálogo (68%) y Carrito (32%) (`PosTerminalView.vue:135-447`)
Disposición en dos columnas (`lg:flex-row gap-4`):
- **Columna Izquierda: Catálogo y Buscador** (`PosTerminalView.vue:138-228`):
  - **Barra de Entrada Superior**: input de búsqueda (`a-input`, `ref="searchInputRef"`, `PosTerminalView.vue:145-168`) con prefijo de lupa, sufijo con badge `F2` e icono de lector de barras USB, captura directa de escaneo (`@keydown.enter="handleBarcodeScanned"`), y botón adyacente para recargar catálogo (`ReloadOutlined`, `PosTerminalView.vue:170-177`).
  - **Píldoras de Categorías**: carrusel horizontal táctil (`PosTerminalView.vue:181-196`) con opción "Todos los Productos" (`all`) y las categorías dinámicas extraídas de los productos disponibles.
  - **Cuadrícula de Productos**: contenedor con scroll vertical independiente (`PosTerminalView.vue:199-227`) en grilla responsiva (2 a 4 columnas) que renderiza tarjetas [`PosProductCard.vue`](../src/modules/pos/components/PosProductCard.vue).
- **Columna Derecha: Carrito de Venta y Panel de Cobro** (`PosTerminalView.vue:231-446`):
  - **Encabezado del Carrito**: icono de compras, título "Carrito de Venta", contador de unidades físicas (`posStore.totalUnitsInCart`, `PosTerminalView.vue:241-245`) y botón de texto "Vaciar" protegido con diálogo de confirmación (`a-popconfirm`, `PosTerminalView.vue:249-265`).
  - **Listado de Ítems del Carrito**: área scrollable (`PosTerminalView.vue:268-294`) que renderiza componentes [`PosCartItem.vue`](../src/modules/pos/components/PosCartItem.vue).
  - **Panel Inferior Fijo de Cobro**: botonera ágil de 1 clic para selección de medio de cobro (`PosTerminalView.vue:319-362`), desglose comparativo de tasas e importes (`PosTerminalView.vue:365-425`) y botón principal "Cobrar (F8)" de altura táctil destacada (`h-12`, `PosTerminalView.vue:428-444`).

---

## 2. Búsqueda de Producto y Lector de Código de Barras

Implementado en [`PosTerminalView.vue:145-168, 520-524, 556-564`](../src/modules/pos/views/PosTerminalView.vue) y [`src/modules/pos/store/posStore.ts:58-69, 226-240`](../src/modules/pos/store/posStore.ts):

- **Foco del Input**:
  - Al montar la vista, se ejecuta automáticamente el foco sobre el input: `searchInputRef.value?.focus()` ([`PosTerminalView.vue:548`](../src/modules/pos/views/PosTerminalView.vue#L548)).
  - Atajo de teclado global `F2`: intercepta `e.key === 'F2'`, ejecuta `e.preventDefault()` y devuelve el foco inmediatamente al input ([`PosTerminalView.vue:520-524`](../src/modules/pos/views/PosTerminalView.vue#L520-L524)).
- **Comportamiento del Enter y Lector USB**:
  - Las pistolas de código de barras USB emulan un teclado físico HID que escribe los caracteres del SKU y emite un `Enter` al final.
  - El input captura el evento `@keydown.enter="handleBarcodeScanned"` ([`PosTerminalView.vue:152`](../src/modules/pos/views/PosTerminalView.vue#L152)).
  - `handleBarcodeScanned` toma el valor de `posStore.searchQuery.trim()`, invoca `posStore.addByBarcode(query)` y, si el producto existe, limpia el input `posStore.searchQuery = ''` para permitir lecturas consecutivas sin intervención manual ([`PosTerminalView.vue:556-564`](../src/modules/pos/views/PosTerminalView.vue#L556-L564)).
- **Filtrado Reactivo por Texto**:
  - El getter computado `filteredProducts` ([`posStore.ts:58-69`](../src/modules/pos/store/posStore.ts#L58-L69)) evalúa en minúsculas si el valor tecleado coincide con el nombre (`p.name.toLowerCase().includes(query)`) o con el código (`p.code.toLowerCase().includes(query)`), combinándolo con la categoría activa (`selectedCategory === 'all' || p.category === selectedCategory`).
- **Manejo de Duplicados al Escanear**:
  - En `addByBarcode(scannedCode)` ([`posStore.ts:226-240`](../src/modules/pos/store/posStore.ts#L226-L240)), se busca por código exacto (`p.code.toLowerCase() === cleanCode.toLowerCase()`).
  - Si el producto ya se encuentra en el carrito, no añade una fila duplicada; delega en `addToCart(found, 1)` ([`posStore.ts:192-207`](../src/modules/pos/store/posStore.ts#L192-L207)), incrementando la cantidad existente en `+1` y recalculando el subtotal (`currentItem.quantity += 1; currentItem.subtotal = currentItem.quantity * currentItem.unitPrice`). Emite una notificación flotante `+1 {nombre}` ([`posStore.ts:234`](../src/modules/pos/store/posStore.ts#L234)).
- **Validaciones de Stock en Búsqueda y Adición**:
  - Si el stock es `<= 0`: bloquea la adición y notifica `message.warning('El producto "..." no tiene existencias disponibles.')` ([`posStore.ts:187-190`](../src/modules/pos/store/posStore.ts#L187-L190)).
  - Si la nueva cantidad acumulada supera las existencias: bloquea la adición y advierte `message.warning('Stock máximo disponible para "...": X unidad')` ([`posStore.ts:198-203`](../src/modules/pos/store/posStore.ts#L198-L203)).
- **Prefijos de Cantidad en el Lector (ej. `3*78910001`)**:
  - **No definido en el legado**. El lector siempre asume incremento de `1` unidad por escaneo ([`posStore.ts:233`](../src/modules/pos/store/posStore.ts#L233)). Cualquier soporte para prefijos de multiplicación en el lector se clasifica como funcionalidad nueva posterior y opcional (véase Decisión J en la Sección 15).

---

## 3. Carrito: Líneas, Cantidades, Descuentos, Eliminar, Vaciar

La entidad del carrito se define en [`src/modules/pos/types/pos.ts:25-31`](../src/modules/pos/types/pos.ts) y se opera en [`src/modules/pos/store/posStore.ts:184-271`](../src/modules/pos/store/posStore.ts) y [`src/modules/pos/components/PosCartItem.vue`](../src/modules/pos/components/PosCartItem.vue):

### 3.1 Estructura de la Línea (`CartItem`)
- `id: number` — ID del producto.
- `product: PosProduct` — Objeto completo del producto (código, nombre, categoría, unidad, imagen, stock, precios).
- `quantity: number` — Cantidad comercial adquirida.
- `unitPrice: number` — Precio unitario base en CUP (`product.price`).
- `subtotal: number` — Subtotal calculado (`quantity * unitPrice`).

### 3.2 Modificación de Cantidades
- En [`PosCartItem.vue:34-57`](../src/modules/pos/components/PosCartItem.vue#L34-L57):
  - Botón decremento (`<MinusOutlined />`): emite `update-quantity` con `quantity - 1`.
  - Indicador numérico central: solo lectura tipográfica (`w-7 text-center font-mono`). **No existe input numérico editable directo en la fila**.
  - Botón incremento (`<PlusOutlined />`): emite `update-quantity` con `quantity + 1`. Deshabilitado visual y funcionalmente cuando `item.quantity >= item.product.stock` ([`PosCartItem.vue:51`](../src/modules/pos/components/PosCartItem.vue#L51)).
- En [`posStore.ts:245-263`](../src/modules/pos/store/posStore.ts#L245-L263) (`updateQuantity`):
  - Si `newQty <= 0`: elimina el ítem llamando a `removeFromCart(productId)` ([`posStore.ts:252`](../src/modules/pos/store/posStore.ts#L252)).
  - Si `newQty > item.product.stock`: aborta la operación y lanza advertencia de límite de stock ([`posStore.ts:257`](../src/modules/pos/store/posStore.ts#L257)).
  - Recálculo inmediato: `item.quantity = newQty; item.subtotal = item.quantity * item.unitPrice`.

### 3.3 Descuentos (Por Línea o Global)
- **No definido en el legado**. Ni `CartItem` ni `CompletedSale` contemplan campos de descuento (`discountPercent`, `discountAmount`, `couponCode`). Tampoco existen controles en la interfaz para rebajas porcentuales o de importe fijo.

### 3.4 Eliminación y Vaciado
- **Eliminar una línea**: botón de papelera en la fila ([`PosCartItem.vue:21-28`](../src/modules/pos/components/PosCartItem.vue#L21-L28)), que dispara `removeFromCart(productId)` ([`posStore.ts:265-267`](../src/modules/pos/store/posStore.ts#L265-L267)), filtrando el array reactivo `cart.value`.
- **Vaciar carrito completo**: botón "Vaciar" en cabecera ([`PosTerminalView.vue:249-265`](../src/modules/pos/views/PosTerminalView.vue#L249-L265)) protegido con popconfirm ("¿Desea vaciar todos los artículos del carrito?"), ejecutando `clearCart()` ([`posStore.ts:269-271`](../src/modules/pos/store/posStore.ts#L269-L271)), que reinicia `cart.value = []`.

### 3.5 Totales Globales del Carrito
- `totalUnitsInCart` ([`posStore.ts:72-74`](../src/modules/pos/store/posStore.ts#L72-L74)): suma de todas las unidades físicas del carrito.
- `totalCUP` ([`posStore.ts:77-81`](../src/modules/pos/store/posStore.ts#L77-L81)): suma de subtotales redondeada estrictamente al entero más cercano con `Math.round(rawTotal)` (en Cuba no circulan centavos de CUP en efectivo).
- `totalUSD` ([`posStore.ts:103-107`](../src/modules/pos/store/posStore.ts#L103-L107)): `Number((totalCUP / exchangeRates.USD).toFixed(2))`.

---

## 4. Cobro: Formas de Pago, Multimoneda, Pago Mixto, Vuelto, Redondeo

Implementado en [`src/modules/pos/store/posStore.ts:31-45, 76-136, 417-484`](../src/modules/pos/store/posStore.ts) y [`src/modules/pos/components/PosPaymentDrawer.vue`](../src/modules/pos/components/PosPaymentDrawer.vue):

### 4.1 Modos de Cobro y Pasarelas Soportadas
El backend y tipos definen:
- Métodos de pago base (`PaymentMethod`, [`pos.ts:6`](../src/modules/pos/types/pos.ts#L6)): `'CASH' | 'TRANSFER_QR'`.
- Pasarelas bancarias QR (`TransferGateway`, [`pos.ts:7`](../src/modules/pos/types/pos.ts#L7)): `'TRANSFERMOVIL' | 'ENZONA'`.
- Modalidades de cobro ágil (`PosPaymentMode`, [`pos.ts:8`](../src/modules/pos/types/pos.ts#L8)): `'CUP_CASH' | 'CUP_TRANSFER' | 'USD_CASH' | 'EUR_CASH' | 'MLC_TRANSFER'`.
- En la botonera ágil de 1 clic del terminal ([`PosTerminalView.vue:320-362`](../src/modules/pos/views/PosTerminalView.vue#L320-L362)), se exponen directamente las 3 modalidades operativas más frecuentes:
  1. `CUP_CASH` con icono `💵` (texto del legado, no migrar): Efectivo en Pesos Cubanos.
  2. `CUP_TRANSFER` con icono `📱` (texto del legado, no migrar): Transferencia nacional electrónica por QR.
  3. `USD_CASH` con icono `🇺🇸` (texto del legado, no migrar): Efectivo en Dólares con canje implícito.

### 4.2 Flujo del Drawer de Cobro (`PosPaymentDrawer.vue`)
Se abre pulsando el botón "Cobrar (F8)" o mediante el atajo de teclado `F8`.
- **Pestaña Efectivo (`key="CASH"`, `PosPaymentDrawer.vue:37-131`)**, identificada con `💵` (texto del legado, no migrar) `Efectivo y Vuelto`:
  - Entrada de efectivo recibido con precisión `0` para CUP y USD, o `2` para otras divisas ([`PosPaymentDrawer.vue:47`](../src/modules/pos/components/PosPaymentDrawer.vue#L47)).
  - Botón de importe exacto ("Exacto") ([`PosPaymentDrawer.vue:62-66`](../src/modules/pos/components/PosPaymentDrawer.vue#L62-L66)).
  - Botonera de billetes rápidos configurada según divisa ([`PosPaymentDrawer.vue:313-321`](../src/modules/pos/components/PosPaymentDrawer.vue#L313-L321)):
    - CUP: `+500`, `+1000`, `+2000`, `+5000`.
    - USD: `+1`, `+5`, `+10`, `+20`, `+50`, `+100`.
    - EUR: `+10`, `+20`, `+50`, `+100`.
  - Validación de suficiencia: `isCashSufficient = changeDue >= -0.001` ([`PosPaymentDrawer.vue:332-334`](../src/modules/pos/components/PosPaymentDrawer.vue#L332-L334)). Si el dinero entregado no cubre el monto adeudado, el botón "Confirmar Cobro e Imprimir" se deshabilita ([`PosPaymentDrawer.vue:229, 345`](../src/modules/pos/components/PosPaymentDrawer.vue#L229)).
- **Pestaña Transferencia / QR (`key="TRANSFER_QR"`, `PosPaymentDrawer.vue:134-215`)**, identificada con `📱` (texto del legado, no migrar) `Transferencia / QR`:
  - Selector táctil de pasarela: `TRANSFERMOVIL` (con icono `📲`, texto del legado, no migrar) o `ENZONA` (con icono `💳`, texto del legado, no migrar) ([`PosPaymentDrawer.vue:137-165`](../src/modules/pos/components/PosPaymentDrawer.vue#L137-L165)).
  - Código QR visual estático con monto en CUP ([`PosPaymentDrawer.vue:168-196`](../src/modules/pos/components/PosPaymentDrawer.vue#L168-L196)).
  - Campo obligatorio: `transferReference` ("Número de Referencia / ID Transacción: *", placeholder "Ej. FT2629812450") ([`PosPaymentDrawer.vue:199-213`](../src/modules/pos/components/PosPaymentDrawer.vue#L199-L213)). El botón de confirmar se bloquea si el campo está vacío ([`PosPaymentDrawer.vue:349`](../src/modules/pos/components/PosPaymentDrawer.vue#L349)). No genera vuelto físico.

### 4.3 Reglas Estrictas de Conversión, Vuelto y Redondeo
1. **Cobro en CUP Efectivo**:
   - Total adeudado: `totalCUP` redondeado a entero (`Math.round`, [`posStore.ts:80`](../src/modules/pos/store/posStore.ts#L80)).
   - Vuelto a entregar: `Math.round(cashReceived - totalCUP)` ([`posStore.ts:437`](../src/modules/pos/store/posStore.ts#L437)).
2. **Cobro en USD Efectivo (Regla de Canje y Billetes Enteros)**:
   - Margen de canje en mostrador: `usdExchangeMargin = 10` CUP ([`posStore.ts:33`](../src/modules/pos/store/posStore.ts#L33)).
   - Tasa aplicada para cobrar: `effectiveRateUSD = Math.max(1, exchangeRates.USD - 10)` ([`posStore.ts:84-87`](../src/modules/pos/store/posStore.ts#L84-L87)).
   - Total en USD a cobrar al cliente: **redondeo hacia arriba estricto al entero superior** mediante `Math.ceil(totalCUP / effectiveRateUSD)` ([`posStore.ts:121, 443, 453`](../src/modules/pos/store/posStore.ts#L121)). **Nunca centavos de dólar** (en Cuba solo circulan billetes enteros de USD). Si el cálculo arroja `4.12 USD`, se cobran `5 USD`.
   - Vuelto al cliente: **se entrega en CUP** ([`posStore.ts:130-135`](../src/modules/pos/store/posStore.ts#L130-L135), [`PosPaymentDrawer.vue:108-113, 337-342`](../src/modules/pos/components/PosPaymentDrawer.vue#L108-L113)). Fórmula: `changeInCUP = Math.round(cashReceivedUSD * effectiveRateUSD - totalCUP)`.

### 4.4 Pago Mixto (Dividir cobro en dos monedas o métodos)
- **No definido en el legado**. Cada venta registrada en `CompletedSale` ([`pos.ts:40-56`](../src/modules/pos/types/pos.ts#L40-L56)) solo puede tener un único `paidCurrency`, un único `paymentMethod` y un único importe `cashReceived`. No es posible cobrar parte en CUP efectivo y parte por Transfermóvil, ni parte en USD y parte en CUP.

---

## 5. Tasa de Cambio y Monedas (USD, CUP, CUP_TRANSFER, MLC)

Implementado en [`src/modules/pos/services/posService.ts:80-86, 449-462`](../src/modules/pos/services/posService.ts), [`src/modules/pos/store/posStore.ts:38-45, 83-95, 512-529`](../src/modules/pos/store/posStore.ts) y [`src/modules/pos/components/DailyExchangeRateModal.vue`](../src/modules/pos/components/DailyExchangeRateModal.vue):

### 5.1 Divisas y Valores por Defecto en el Legado
En el legado (`TASAS_CAMBIO_DEFAULT`, [`posService.ts:81-86`](../src/modules/pos/services/posService.ts#L81-L86)):
- `CUP: 1` — Moneda base contable nacional.
- `USD: 360` — Moneda principal de referencia económica.
- `EUR: 380` — Divisa europea en efectivo (en el nuevo modelo queda excluida).
- `MLC: 275` — Moneda Libremente Convertible electrónica.

### 5.2 Fijación y Modificación de la Tasa
- **Fijación en la Apertura del Turno**: al abrir turno en [`CashShiftModal.vue:56-73`](../src/modules/pos/components/CashShiftModal.vue#L56-L73), se solicita la "Tasa de Cambio Diaria (CUP x USD)" obligatoria (default `360`). Esta tasa se graba en el turno (`shift.dailyRateUSD`, [`posService.ts:363`](../src/modules/pos/services/posService.ts#L363)) y congela el tipo de cambio durante la vigencia de dicho turno ([`posStore.ts:170-173`](../src/modules/pos/store/posStore.ts#L170-L173)).
- **Edición Dinámica de Tasas**: a través de [`DailyExchangeRateModal.vue`](../src/modules/pos/components/DailyExchangeRateModal.vue) mediante `posStore.setDailyRates(newRates)` ([`posStore.ts:512-529`](../src/modules/pos/store/posStore.ts#L512-L529)). Al guardar, actualiza el objeto `exchangeRates` y propaga la nueva tasa a `currentShift.value.dailyRateUSD`.
- **Sincronización Automática con Mercados (ej. elTOQUE)**:
  - **No definido en el legado**. Todas las tasas son ingresadas y editadas manualmente por los usuarios en cliente/mock.

### 5.3 Pregunta para el Backend Symfony (Tasas de CUP_TRANSFER y MLC)
- **Pregunta**: ¿Cuál es la tasa de cambio oficial o factor de paridad de `CUP_TRANSFER` y de `MLC` respecto al `CUP`? En el legado, `MLC` contaba con una tasa estática por defecto de 275 CUP ([`posService.ts:85`](../src/modules/pos/services/posService.ts#L85)), mientras que `CUP_TRANSFER` operaba con paridad 1:1 respecto al CUP pero sin admitir vuelto físico ([`posStore.ts:112-114`](../src/modules/pos/store/posStore.ts#L112-L114)). ¿Se gestionan estas tasas como parámetros globales del negocio fijadas una vez por día en el backend, o se fijan de forma granular e independiente por cada turno de caja?

---

## 6. Turno y Caja: Apertura, Cierre, Arqueo, Canje

Implementado en [`src/modules/pos/types/pos.ts:59-102`](../src/modules/pos/types/pos.ts), [`src/modules/pos/services/posService.ts:89-109, 331-422, 465-494`](../src/modules/pos/services/posService.ts), [`src/modules/pos/store/posStore.ts:338-413`](../src/modules/pos/store/posStore.ts), [`src/modules/pos/components/CashShiftModal.vue`](../src/modules/pos/components/CashShiftModal.vue) y [`src/modules/pos/components/CurrencyExchangeModal.vue`](../src/modules/pos/components/CurrencyExchangeModal.vue):

### 6.1 Estructura del Turno de Caja (`CashShift`)
- `id: string` — Identificador correlativo del turno (ej. `TURNO-2026-001`).
- `cashierName: string` — Nombre del cajero o responsable asignado.
- `openedAt: string` — Fecha y hora de apertura (`YYYY-MM-DD HH:mm`).
- `closedAt?: string` — Fecha y hora de cierre y cuadre.
- `status: 'OPEN' | 'CLOSED'` — Estado operativo del turno.
- `dailyRateUSD: number` — Tasa fija de cambio pactada para el turno.
- `initialFunds: { CUP: number, USD: number }` — Fondo de cambio dual entregado al inicio.
- `salesTotals: { CUP: number, cupCash?: number, cupTransfer?: number, USD: number }` — Recaudación acumulada por ventas.
- `exchangeAdjustments: { CUP: number, USD: number }` — Ajustes por compra de divisas (canje).
- `countedFunds?: { CUP: number, USD: number }` — Efectivo real contado físicamente por el cajero.
- `differences?: { CUP: number, USD: number }` — Descuadre (`> 0` sobrante, `< 0` faltante).
- `discrepancyReason?: string` — Justificación obligatoria del descuadre.
- `notes?: string` — Observaciones generales del turno.

### 6.2 Flujo de Apertura de Turno (`CashShiftModal.vue:13-75`)
- Solicita:
  1. Nombre del cajero (`openForm.cashierName`, default `'Caja Principal'`).
  2. Fondo inicial en CUP (etiquetado con `🇨🇺`, texto del legado, no migrar) (`openForm.initialCUP`, default `5000`, entero sin centavos).
  3. Fondo inicial en USD (etiquetado con `🇺🇸`, texto del legado, no migrar) (`openForm.initialUSD`, default `50`, billetes).
  4. Tasa diaria CUP x USD (`openForm.dailyRateUSD`, default `360`).
- Validaciones: cajero no vacío y tasa mayor a 0 ([`CashShiftModal.vue:308-315`](../src/modules/pos/components/CashShiftModal.vue#L308-L315)).
- Llama a `posStore.openCashShift()` ([`posStore.ts:340-360`](../src/modules/pos/store/posStore.ts#L340-L360)) y actualiza `currentShift`.

### 6.3 Cálculo de Fondos Esperados en Caja
Al operar ventas y canjes, el sistema calcula lo que debe haber físicamente en la gaveta:
- `expectedCUP = initialFunds.CUP + salesTotals.cupCash + exchangeAdjustments.CUP` ([`posService.ts:386-390`](../src/modules/pos/services/posService.ts#L386-L390), [`posStore.ts:138-145`](../src/modules/pos/store/posStore.ts#L138-L145)).
  > _Nota:_ Las ventas por transferencia QR (`cupTransfer`) ingresan a la cuenta bancaria, por lo que **no se suman al efectivo físico esperado en la gaveta** ([`CashShiftModal.vue:100-103`](../src/modules/pos/components/CashShiftModal.vue#L100-L103)).
- `expectedUSD = initialFunds.USD + salesTotals.USD + exchangeAdjustments.USD` ([`posService.ts:391-395`](../src/modules/pos/services/posService.ts#L391-L395), [`posStore.ts:147-154`](../src/modules/pos/store/posStore.ts#L147-L154)).

### 6.4 Flujo de Cierre y Arqueo de Caja (`CashShiftModal.vue:77-225`)
- Muestra el resumen de lo recaudado y solicita el conteo físico de billetes (`countedCUP` y `countedUSD`).
- Calcula las diferencias:
  - `diffCUP = closeForm.countedCUP - expectedCUP` ([`CashShiftModal.vue:291`](../src/modules/pos/components/CashShiftModal.vue#L291)).
  - `diffUSD = closeForm.countedUSD - expectedUSD` ([`CashShiftModal.vue:292`](../src/modules/pos/components/CashShiftModal.vue#L292)).
- **Regla Estricta de Faltantes/Sobrantes**:
  - Si `diffCUP === 0 && diffUSD === 0`: arqueo perfecto, justificación opcional.
  - Si `diffCUP < 0 || diffUSD < 0` (Faltante): alerta visual con icono `⚠️` (texto del legado, no migrar) ([`CashShiftModal.vue:176-189`](../src/modules/pos/components/CashShiftModal.vue#L176-L189)). **Es obligatorio registrar el motivo o justificación en `notes`** ([`CashShiftModal.vue:318-325`](../src/modules/pos/components/CashShiftModal.vue#L318-L325)). El sistema bloquea el cierre si el cajero no justifica el faltante.
  - Si `diffCUP > 0 || diffUSD > 0` (Sobrante): alerta visual con icono `ℹ️` (texto del legado, no migrar) ([`CashShiftModal.vue:191-204`](../src/modules/pos/components/CashShiftModal.vue#L191-L204)). Es obligatorio justificar la procedencia del dinero extra.

### 6.5 Operaciones de Canje de Divisas en Mostrador (`CurrencyExchangeModal.vue`)
- Permite la compra de divisas extranjeras entregadas por clientes para fondear la caja ([`CurrencyExchangeModal.vue:14-22`](../src/modules/pos/components/CurrencyExchangeModal.vue#L14-L22)).
- `currencyFrom`: `USD`, `EUR`, `MLC`.
- `currencyTo`: siempre `CUP`.
- **Regla de Tasa de Canje**: toma la tasa diaria oficial y descuenta automáticamente el margen fijo operativo de **-10 CUP** (`effectiveExchangeRate = Math.max(1, dailyBaseRate - 10)`, [`CurrencyExchangeModal.vue:191-195`](../src/modules/pos/components/CurrencyExchangeModal.vue#L191-L195)). El campo de tasa es de solo lectura no editable.
- Importe entregado en CUP: `amountToCUP = Math.round(amountFrom * effectiveExchangeRate)` (estricto sin centavos, [`CurrencyExchangeModal.vue:198-201`](../src/modules/pos/components/CurrencyExchangeModal.vue#L198-L201)).
- **Impacto directo en arqueo del turno** ([`posService.ts:483-491`](../src/modules/pos/services/posService.ts#L483-L491)):
  - Sube el saldo en divisa extranjera: `activeShift.exchangeAdjustments.USD += amountFrom`.
  - Disminuye el efectivo en CUP: `activeShift.exchangeAdjustments.CUP -= amountToCUP`.

---

## 7. Suspender/Reanudar Venta (Espera / Hold Tickets)

Implementado en [`src/modules/pos/types/pos.ts:104-111`](../src/modules/pos/types/pos.ts), [`src/modules/pos/store/posStore.ts:25, 290-335`](../src/modules/pos/store/posStore.ts) y [`src/modules/pos/views/PosTerminalView.vue:76-131, 526-530`](../src/modules/pos/views/PosTerminalView.vue):

### 7.1 Estructura del Ticket Suspendido (`HeldOrder`)
- `id: string` — Generado como `HOLD-{timestamp_4_digitos}` ([`posStore.ts:302`](../src/modules/pos/store/posStore.ts#L302)).
- `name: string` — Nombre personalizable o autogenerado: `Ticket en espera #{heldOrders.length + 1}` ([`posStore.ts:303`](../src/modules/pos/store/posStore.ts#L303)).
- `cart: CartItem[]` — Copia superficial/profunda del array de ítems ([`posStore.ts:304`](../src/modules/pos/store/posStore.ts#L304)).
- `createdAt: string` — Hora de creación formateada (`HH:mm`, [`posStore.ts:305`](../src/modules/pos/store/posStore.ts#L305)).
- `totalCUP: number` — Monto total acumulado de la orden ([`posStore.ts:306`](../src/modules/pos/store/posStore.ts#L306)).

### 7.2 Flujo de Suspensión (Hold)
- Accionado mediante el botón con icono `⏸️` (texto del legado, no migrar) "Suspender (F4)" o con el atajo global de teclado `F4`.
- Validación: si `posStore.cart.length === 0`, notifica `message.warning('No hay artículos en el carrito para poner en espera.')` y aborta ([`posStore.ts:296-299`](../src/modules/pos/store/posStore.ts#L296-L299)).
- Inserta el ticket al inicio de la lista: `heldOrders.value.unshift(newHeld)` ([`posStore.ts:309`](../src/modules/pos/store/posStore.ts#L309)).
- Vacía el carrito activo (`clearCart()`, [`posStore.ts:310`](../src/modules/pos/store/posStore.ts#L310)) para atender al siguiente cliente inmediatamente.

### 7.3 Flujo de Reanudación (Restore)
- El cajero hace clic en la píldora de badge "En Espera (N)" en la barra superior ([`PosTerminalView.vue:126-130`](../src/modules/pos/views/PosTerminalView.vue#L126-L130)).
- En la lista de tickets, pulsa "Restaurar" ([`PosTerminalView.vue:102-109`](../src/modules/pos/views/PosTerminalView.vue#L102-L109)).
- En `restoreHeldOrder(orderId)` ([`posStore.ts:318-331`](../src/modules/pos/store/posStore.ts#L318-L331)):
  - **Manejo de conflicto si el carrito actual ya tiene productos**: suspende automáticamente el carrito actual bajo el nombre `'Ticket anterior'` ([`posStore.ts:324`](../src/modules/pos/store/posStore.ts#L324)) antes de cargar la orden solicitada.
  - Carga los productos guardados en `cart.value = [...order.cart]`.
  - Remueve la orden de `heldOrders`.

### 7.4 Descarte de Ticket Suspendido
- Botón "✕" en el popover ([`PosTerminalView.vue:110-117`](../src/modules/pos/views/PosTerminalView.vue#L110-L117)), que ejecuta `deleteHeldOrder(orderId)` ([`posStore.ts:333-335`](../src/modules/pos/store/posStore.ts#L333-L335)), eliminando el ticket de memoria.

### 7.5 Persistencia
- **No definido en el legado**. Los tickets en espera se almacenan en un `ref` de Pinia en memoria RAM ([`posStore.ts:25`](../src/modules/pos/store/posStore.ts#L25)). Si se recarga la página o se cierra el navegador, las órdenes en espera se pierden por completo.

---

## 8. Atajos de Teclado

Implementados en [`PosTerminalView.vue:518-553`](../src/modules/pos/views/PosTerminalView.vue#L518-L553) mediante `window.addEventListener('keydown', handleGlobalKeydown)`:

| Tecla / Atajo | Acción Asociada | Implementación en Código Legado |
| :--- | :--- | :--- |
| **`F2`** | Enfocar Buscador de Productos / Lector USB | `searchInputRef.value?.focus()` ([`PosTerminalView.vue:520-524`](../src/modules/pos/views/PosTerminalView.vue#L520-L524)) |
| **`F4`** | Poner Venta en Espera (Suspender) | `handleHoldOrder()` / `posStore.holdCurrentCart()` ([`PosTerminalView.vue:526-530`](../src/modules/pos/views/PosTerminalView.vue#L526-L530)) |
| **`F6`** | Abrir Modal de Canje de Divisas en Mostrador | `isExchangeModalVisible.value = true` ([`PosTerminalView.vue:532-536`](../src/modules/pos/views/PosTerminalView.vue#L532-L536)) |
| **`F8`** | Abrir Drawer de Cobro y Pasarelas de Pago | `openPaymentDrawer()` ([`PosTerminalView.vue:538-542`](../src/modules/pos/views/PosTerminalView.vue#L538-L542)) |
| **`Enter`** (en buscador) | Procesar Código de Barras Escaneado | `handleBarcodeScanned()` ([`PosTerminalView.vue:152, 556-564`](../src/modules/pos/views/PosTerminalView.vue#L152)) |

### Atajos No Definidos en el Legado
- Atajos para selección de forma de cobro directa (ej. `1` para CUP, `2` para Transferencia, `3` para USD).
- Atajos para confirmar cobro rápido (`Ctrl + Enter` o `F9`).
- Atajos para incrementar o decrementar cantidades desde teclado (`+`, `-`).
- Atajos para vaciar carrito o cancelar modal.

---

## 9. Ticket / Recibo e Impresión

Implementado en [`src/modules/pos/views/SalesAndShiftsView.vue:497-567, 717-719`](../src/modules/pos/views/SalesAndShiftsView.vue) y [`src/modules/pos/components/PosPaymentDrawer.vue:230-234`](../src/modules/pos/components/PosPaymentDrawer.vue):

### 9.1 Estructura del Comprobante Fiscal en Modal (`SalesAndShiftsView.vue:504-558`)
- **Cabecera**:
  - Título comercial: "QvaFlow POS" ([`SalesAndShiftsView.vue:506`](../src/modules/pos/views/SalesAndShiftsView.vue#L506)).
  - Subtítulo: "Comprobante Fiscal de Operación" ([`SalesAndShiftsView.vue:507`](../src/modules/pos/views/SalesAndShiftsView.vue#L507)).
  - Identificador: `Ticket #{selectedSale.id}` ([`SalesAndShiftsView.vue:509`](../src/modules/pos/views/SalesAndShiftsView.vue#L509)).
  - Fecha y hora: `formatearFechaHora(selectedSale.createdAt)` ([`SalesAndShiftsView.vue:512`](../src/modules/pos/views/SalesAndShiftsView.vue#L512)).
- **Cuerpo (Detalle de Productos)**:
  - Iteración de `selectedSale.items`: nombre del producto, `{quantity} x {unitPrice} CUP` y `subtotal` en CUP ([`SalesAndShiftsView.vue:518-533`](../src/modules/pos/views/SalesAndShiftsView.vue#L518-L533)).
- **Pie de Totales**:
  - "Total Facturado": importe en CUP ([`SalesAndShiftsView.vue:539`](../src/modules/pos/views/SalesAndShiftsView.vue#L539)).
  - "Equivalente en USD": `${selectedSale.totalUSD.toFixed(2)} USD` ([`SalesAndShiftsView.vue:543`](../src/modules/pos/views/SalesAndShiftsView.vue#L543)).
  - "Moneda Cobrada": `{paidCurrency} ({paymentMethod})` ([`SalesAndShiftsView.vue:547`](../src/modules/pos/views/SalesAndShiftsView.vue#L547)).
  - "Ref. Transferencia": número de referencia si `transferReference` existe ([`SalesAndShiftsView.vue:552-557`](../src/modules/pos/views/SalesAndShiftsView.vue#L552-L557)).

### 9.2 Mecanismo de Impresión
- En [`SalesAndShiftsView.vue:717-719`](../src/modules/pos/views/SalesAndShiftsView.vue#L717-L719): la función `handlePrint` se limita a emitir `message.success('Enviando ticket a impresora térmica local.')`.
- En [`PosPaymentDrawer.vue:230-234`](../src/modules/pos/components/PosPaymentDrawer.vue#L230-L234): el botón "Confirmar Cobro e Imprimir" confirma el pago, pero no envía comandos a ninguna impresora física.
- **No definido en el legado**:
  - Comandos ESC/POS para impresoras térmicas de 58mm / 80mm.
  - Llamada nativa a `window.print()` con CSS media `@media print`.
  - Apertura automática de gaveta portamonedas mediante pulso de solenoide RJ11/RJ12.
  - Configuración de cabecera/pie personalizable (NIT/RUT fiscal, dirección, teléfono, mensaje de despedida).

---

## 10. Historial de Ventas: Columnas, Filtros, Detalle, Anulación/Devolución y Separación Modular

Implementado en [`src/modules/pos/views/SalesAndShiftsView.vue:68-263, 623-764`](../src/modules/pos/views/SalesAndShiftsView.vue):

### 10.1 Problema del Enfoque Legado: Mezcla de Ventas y Cuadres
En la vista legada [`src/modules/pos/views/SalesAndShiftsView.vue`](../src/modules/pos/views/SalesAndShiftsView.vue), se agruparon en una misma pantalla mediante pestañas (`a-tabs`, [`SalesAndShiftsView.vue:69, 266`](../src/modules/pos/views/SalesAndShiftsView.vue#L69)) dos conceptos operativos y de seguridad completamente diferentes:
1. Pestaña 1 (`key="sales"`): Historial de Ventas comerciales (tickets a clientes).
2. Pestaña 2 (`key="shifts"`): Cuadres de Caja (arqueos físicos, turnos, fondos iniciales, diferencias de dinero).

**Propuesta de Reparto para la Nueva Arquitectura**:
Se establece la separación formal en **dos pantallas independientes**, cada una asignada a su respectiva ruta y con su permiso RBAC granular:
- **Pantalla 1: Historial de Ventas** (Ruta: `/sales/history`):
  - Permiso exigido: `sales.view`.
  - Audiencia: Cajeros, dependientes y auditores de operaciones.
  - Funcionalidad: Listado de tickets emitidos, búsqueda por folio/cajero, detalle del comprobante de venta e inicio de anulaciones/devoluciones (`sales.cancel`).
- **Pantalla 2: Historial de Cuadres de Caja** (Ruta: `/cash/shifts` o `/cash/history`):
  - Permiso exigido: `cash.view_history`.
  - Audiencia: Administradores, encargados de negocio y supervisores de caja.
  - Funcionalidad: Auditoría de aperturas y cierres de turno, fondos de cambio entregados, ingresos en efectivo vs banco (transferencias), canjes de mostrador, conteos físicos y justificación obligatoria de faltantes y sobrantes.

### 10.2 Tarjetas de Métricas Superiores (KPIs en el Legado)
Ubicadas en [`SalesAndShiftsView.vue:4-63`](../src/modules/pos/views/SalesAndShiftsView.vue#L4-L63):
1. **Ventas Registradas**: con icono `🧾` (texto del legado, no migrar), total de tickets en el filtro activo (`filteredSales.length`).
2. **Cobrado en CUP (Caja / Transf.)**: con icono `🇨🇺` (texto del legado, no migrar), total acumulado recaudado en pesos cubanos (`totalChargedCUP`, [`SalesAndShiftsView.vue:692-696`](../src/modules/pos/views/SalesAndShiftsView.vue#L692-L696)).
3. **Cobrado en USD (Billetes)**: con icono `💵` (texto del legado, no migrar), total acumulado recaudado en dólares enteros (`totalChargedUSD`, [`SalesAndShiftsView.vue:698-702`](../src/modules/pos/views/SalesAndShiftsView.vue#L698-L702)).

### 10.3 Filtros Disponibles en la Barra de Herramientas de Ventas
En [`SalesAndShiftsView.vue:75-164`](../src/modules/pos/views/SalesAndShiftsView.vue#L75-L164):
1. **Turno (`selectedShiftFilter`)**: `'ALL'` o ID del turno (`shiftId`, derivado dinámicamente de las ventas).
2. **Fecha (`selectedDatePreset`)**: `'ALL'`, `'TODAY'` (fecha de hoy ISO), `'YESTERDAY'` (fecha de ayer ISO), o `'CUSTOM'` (despliega un `a-date-picker` en formato `YYYY-MM-DD`).
3. **Moneda (`selectedCurrencyFilter`)**: `'ALL'`, `'CUP'`, `'USD'`.
4. **Buscador de Texto (`salesSearchQuery`)**: filtra en tiempo real sobre el código del ticket (`id`) o el nombre del cajero (`cashierName`).
5. **Botón "Limpiar filtros"**: visible condicionalmente si hay algún filtro o búsqueda activa ([`SalesAndShiftsView.vue:134-146`](../src/modules/pos/views/SalesAndShiftsView.vue#L134-L146)).
6. **Botón "Actualizar"**: invoca `posStore.fetchSalesHistory()`.

### 10.4 Columnas de la Tabla de Ventas (`salesColumns`, `SalesAndShiftsView.vue:722-764`)
1. **Ticket (`id`)**: ancho 140px, muestra el código en monospace negrita (`TICK-908123`) y debajo la cantidad de productos (`N productos`).
2. **Turno (`shiftId`)**: ancho 140px, badge gris en monospace con el ID del turno o `'Sin Turno'`.
3. **Fecha / Hora (`createdAt`)**: ancho 150px, formateada con `formatearFechaHora` (`DD/MM/YYYY HH:mm`).
4. **Cajero (`cashierName`)**: ancho 130px, nombre del cajero responsable.
5. **Total (`total`)**: ancho 140px, alineación derecha. Si la venta fue en USD muestra el importe entero cobrado (ej. `$5 USD`) y debajo `Base: $X CUP`. Si fue en CUP muestra el total en pesos y debajo la referencia en USD.
6. **Cobro (`payment`)**: ancho 140px, badge con la divisa cobrada (`CUP` o `USD`) y texto con el método (`Efectivo` o `Transferencia`).
7. **Acción (`actions`)**: ancho 100px, botón enlace "Ver Ticket" que abre el modal del recibo detallado.

### 10.5 Paginación
- Paginación local del cliente con `a-table`: `pageSize: 8` y texto de totalización `Total {t} tickets` ([`SalesAndShiftsView.vue:171`](../src/modules/pos/views/SalesAndShiftsView.vue#L171)).

### 10.6 Anulación y Devolución de Ventas
- **No definido en el legado**. En la tabla de ventas legada no existe ninguna acción para cancelar o anular tickets, reintegrar stock al almacén ni registrar devolución de dinero. La única acción permitida es "Ver Ticket" ([`SalesAndShiftsView.vue:251-258`](../src/modules/pos/views/SalesAndShiftsView.vue#L251-L258)).

---

## 11. Permisos Usados o Implícitos

El análisis revela una divergencia importante entre el router legado, el router moderno y los componentes de UI:

### 11.1 Permisos en el Router Legado ([`src/core/router/index.ts`](../src/core/router/index.ts))
- `POS_ACCESS`: asignado a la ruta `/pos` ([`src/core/router/index.ts:24`](../src/core/router/index.ts#L24)).
  - _Excepción especial codificada_: si el usuario tiene rol `CASHIER`, el router le concede acceso inmediato a `/pos` sin verificar el array de permisos (`if (to.name === 'pos' && user?.role === 'CASHIER') next()`, [`src/core/router/index.ts:124-127`](../src/core/router/index.ts#L124-L127)).
- `VIEW_ALL_SALES`: asignado a la ruta `/sales-and-shifts` ([`src/core/router/index.ts:60`](../src/core/router/index.ts#L60)).

### 11.2 Permisos en el Router Moderno ([`src/app/router/index.ts`](../src/app/router/index.ts))
- `sales.create`: asignado a la ruta `sales/pos` ([`src/app/router/index.ts:55`](../src/app/router/index.ts#L55)).
- `sales.view`: asignado a la ruta `sales/history` ([`src/app/router/index.ts:66`](../src/app/router/index.ts#L66)).
- `cash.shift_manage`: asignado a la ruta `cash/shift` en la **línea 77** ([`src/app/router/index.ts:77`](../src/app/router/index.ts#L77)):
  ```ts
  // src/app/router/index.ts:77
  permission: 'cash.shift_manage',
  ```

### 11.3 Comparación con el Catálogo RBAC ([`src/shared/types/permissions.ts:13-22`](../src/shared/types/permissions.ts#L13-L22))
En el catálogo canónico de permisos de QvaFlow (`KNOWN_PERMISSIONS`), los permisos definidos para Ventas y Caja son:
- `sales.create` (Registrar ventas en terminal POS).
- `sales.cancel` (Anular ventas y tickets).
- `sales.view` (Consultar historial de ventas).
- `cash.manage` (Gestión general de caja).
- `cash.open_close` (Abrir y cerrar turnos con arqueo).
- `cash.exchange` (Modificar tasas de cambio y registrar canjes).
- `cash.view_history` (Consultar historial de cuadres y turnos).

> [!WARNING] INCOHERENCIA DE PERMISOS DETECTADA (PENDIENTE DE SUBSANAR)
> El permiso `'cash.shift_manage'` presente en [`src/app/router/index.ts:77`](../src/app/router/index.ts#L77) **NO EXISTE** dentro de `KNOWN_PERMISSIONS` en [`src/shared/types/permissions.ts`](../src/shared/types/permissions.ts). Esta discrepancia impide la validación estricta de TypeScript y el chequeo en guards de navegación.

### 11.4 Asignación Recomendada de Permisos por Ruta de Menú
Para subsanar la incoherencia y alinear el router con `KNOWN_PERMISSIONS`, cada pantalla del menú debe exigir:
1. **Punto de Venta / Terminal de Cobro** (`/sales/pos`): debe exigir **`sales.create`**.
2. **Historial de Ventas** (`/sales/history`): debe exigir **`sales.view`** (y `sales.cancel` para la acción de anular).
3. **Turno y Arqueo (Apertura y Cierre)** (`/cash/shift` o `/cash/turn`): debe exigir **`cash.open_close`** (en sustitución de `cash.shift_manage`).
4. **Cambio y Canje (Tasa Diaria y Mostrador)** (`/cash/exchange`): debe exigir **`cash.exchange`**.
5. **Cuadres (Historial de Turnos y Arqueos)** (`/cash/history`): debe exigir **`cash.view_history`**.
6. **Gestión Administrativa Global de Caja** (`/cash/manage`): debe exigir **`cash.manage`**.

### 11.5 Permisos Evaluados Dentro de los Componentes Legados
- **Ninguno**. Dentro de [`PosTerminalView.vue`](../src/modules/pos/views/PosTerminalView.vue), [`PosPaymentDrawer.vue`](../src/modules/pos/components/PosPaymentDrawer.vue) y [`SalesAndShiftsView.vue`](../src/modules/pos/views/SalesAndShiftsView.vue) **no existe ninguna evaluación de permisos**.
- Todo usuario que consiga entrar al POS puede:
  - Realizar cobros.
  - Abrir y cerrar turnos de cualquier cajero.
  - Modificar las tasas oficiales de cambio del día.
  - Ejecutar canjes de divisas.
  - Suspender y descartar tickets.
- En la nueva arquitectura, las operaciones críticas (como cambiar tasas del día o autorizar arqueos con faltantes) deben protegerse obligatoriamente con `v-permission` y `usePermissions()`.

---

## 12. Estados: Carga, Vacío, Error

Implementado en [`src/modules/pos/store/posStore.ts`](../src/modules/pos/store/posStore.ts), [`src/modules/pos/views/PosTerminalView.vue`](../src/modules/pos/views/PosTerminalView.vue) y [`src/modules/pos/views/SalesAndShiftsView.vue`](../src/modules/pos/views/SalesAndShiftsView.vue):

### 12.1 Estado de Carga (`loading` / `loadingHistory`)
- `loading = ref<boolean>(false)` ([`posStore.ts:27`](../src/modules/pos/store/posStore.ts#L27)): activado durante la carga del catálogo y turno inicial (`loadInitialData`, [`posStore.ts:162`](../src/modules/pos/store/posStore.ts#L162)), apertura/cierre de turnos (`posStore.ts:345, 363`), canjes (`posStore.ts:389`), registro de venta (`posStore.ts:428`) y actualización de tasas (`posStore.ts:513`).
- `loadingHistory = ref<boolean>(false)` ([`posStore.ts:100`](../src/modules/pos/store/posStore.ts#L100)): activado durante la consulta de historial de ventas y turnos (`posStore.ts:489, 501`).
- **En la Interfaz Visual**:
  - Botón "Cobrar (F8)": muestra spinner con `:loading="posStore.loading"` ([`PosTerminalView.vue:433`](../src/modules/pos/views/PosTerminalView.vue#L433)).
  - Botones de recarga: muestran icono giratorio con `:loading` ([`SalesAndShiftsView.vue:160, 273`](../src/modules/pos/views/SalesAndShiftsView.vue#L160)).
  - Tablas de Ventas y Cuadres: muestran máscara translúcida de carga nativa con `:loading="posStore.loadingHistory"` ([`SalesAndShiftsView.vue:170, 283`](../src/modules/pos/views/SalesAndShiftsView.vue#L170)).
  - Modales: los botones OK reflejan `:confirm-loading="loading"`.
  - **No definido en el legado**: estados esqueleto (`BaseSkeleton`) durante la carga de las tarjetas de productos en el POS.

### 12.2 Estado Vacío (Empty State)
- **Búsqueda sin resultados en Catálogo** ([`PosTerminalView.vue:214-226`](../src/modules/pos/views/PosTerminalView.vue#L214-L226)):
  - Icono `🔍` (texto del legado, no migrar).
  - Mensaje: `No se encontraron productos para "{posStore.searchQuery}"`.
  - Botón de recuperación: "Limpiar búsqueda" (`posStore.searchQuery = ''`).
- **Carrito Vacío** ([`PosTerminalView.vue:280-293`](../src/modules/pos/views/PosTerminalView.vue#L280-L293)):
  - Círculo gris con icono `🛒` (texto del legado, no migrar).
  - Título: "Carrito Vacío".
  - Descripción: "Escanee con la pistola USB o seleccione productos del catálogo."
- **Tickets en Espera Vacío** ([`PosTerminalView.vue:121-123`](../src/modules/pos/views/PosTerminalView.vue#L121-L123)):
  - Texto central en popover: "No hay tickets en espera."
- **Tablas de Historial Vacías**:
  - Delegan en el componente vacío estándar por defecto de `a-table` de Ant Design ("No Data").

### 12.3 Estado de Error
- **Gestión de Errores en Store**:
  - Los métodos del store capturan excepciones en bloques `try/catch`, extraen el mensaje mediante `err instanceof Error ? err.message : '...'` y emiten toasts flotantes mediante `message.error(errorMsg)` de Ant Design ([`posStore.ts:177, 355, 372, 408, 479, 494, 506, 524`](../src/modules/pos/store/posStore.ts)).
- **Resiliencia de Servicios Mock**:
  - En [`src/modules/pos/services/posService.ts`](../src/modules/pos/services/posService.ts), todas las llamadas a `apiClient` capturan el fallo y retornan datos mock en memoria, por lo que en desarrollo o desconexión el terminal nunca muestra pantallas de fallo catastrófico.
  - **No definido en el legado**: componentes visuales de alerta persistente (`BaseAlert`) o banners con botón "Reintentar conexión" en caso de caída de la red local.

---

## 13. Diferencias con el Nuevo Modelo (Float vs DecimalString, Ant Design, Emojis, Permisos)

| Aspecto | Implementación Legada (`src/modules/pos/**`) | Arquitectura Nueva de QvaFlow | Impacto en la Migración |
| :--- | :--- | :--- | :--- |
| **Precisión Monetaria** | Primitivos `number` (punto flotante de JS) en precios, subtotales y totales ([`pos.ts:15-18, 28-30, 44-50`](../src/modules/pos/types/pos.ts#L15-L18)). Uso de `Math.round()` y `toFixed(2)`. | `DecimalString = string` (`"1250.00"`) con operaciones exactas mediante [`src/shared/utils/decimal.ts`](../src/shared/utils/decimal.ts). | Reemplazar toda la aritmética de punto flotante por `decimalAdd`, `decimalMultiply`, `decimalRound` para evitar imprecisiones de coma flotante. |
| **Librería de Componentes** | Acoplamiento absoluto a `ant-design-vue` (`a-button`, `a-input`, `a-table`, `a-modal`, `a-drawer`, `a-select`, `a-tabs`, `a-popconfirm`). Mensajería con `message`. | Componentes compartidos propios basados en Tailwind CSS y tokens de diseño: `BaseButton`, `BaseInput`, `DataTable`, `FilterBar`, `BaseModal`, `BaseDrawer`, `useToast`. | Erradicar Ant Design y sus clases; usar únicamente el Design System de QvaFlow. |
| **Iconografía y Estética** | Uso masivo de emojis Unicode como iconos en la UI (`☕`, `🍺`, `💵`, `🧾`, `💱`, `⏸️`, `🔍`, `🛒`, `📱`, `🇺🇸`, `🇨🇺`, `💳`, `🟢`, `⚠️`, `ℹ️`, `💡`) (texto del legado, no migrar). | Iconografía formal SVG consistente (Lucide Icons o iconos vectoriales limpios sin emojis decorativos). | Sustituir todos los emojis hardcodeados por componentes SVG semánticos. |
| **Esquema de Monedas** | `PaymentCurrency = 'CUP' \| 'USD' \| 'MLC' \| 'EUR'` ([`pos.ts:5`](../src/modules/pos/types/pos.ts#L5)). Incluye Euro (`EUR`). | `Currency = 'USD' \| 'CUP' \| 'CUP_TRANSFER' \| 'MLC'` ([`src/shared/types/currency.ts:9`](../src/shared/types/currency.ts#L9)). El Euro **no existe**. | Eliminar `EUR` y normalizar `CUP_TRANSFER` como tipo de moneda específico no efectivo. |
| **Control de Permisos** | Roles en mayúsculas (`POS_ACCESS`, `VIEW_ALL_SALES`) y chequeo de rol hardcodeado `user?.role === 'CASHIER'`. Sin validaciones en componentes. | Permisos dinámicos en formato dot-notation (`sales.create`, `sales.view`, `cash.open_close`, `cash.exchange`). Directiva `v-permission` y composable `usePermissions()`. | Proteger acciones críticas de caja y POS con los permisos del nuevo modelo sin comprobar nombres de roles. |
| **Contenedor y Pantalla** | Embebido dentro del layout tradicional con barra superior de navegación y menú lateral (`h-[calc(100vh-7rem)]`, [`PosTerminalView.vue:2`](../src/modules/pos/views/PosTerminalView.vue#L2)). | Pantalla completa nativa (Fullscreen / Kiosk Mode), ocultando menús del sistema para maximizar espacio táctil en mostrador. | Migrar a una vista dedicada a pantalla completa con atajo para salir o conmutar pantalla completa. |

---

## 14. Dudas para el Backend

Las siguientes definiciones son indispensables para coordinar la integración de los nuevos endpoints con Symfony:

1. **Rutas y Contrato de Endpoints**:
   - En [`docs/API_CONTRACT.md`](API_CONTRACT.md) aún no existe la sección del módulo de Ventas y Caja. ¿Cuáles serán las rutas exactas? ¿`POST /api/sales` para emitir venta? ¿`GET /api/sales` con paginación para el historial? ¿`POST /api/cash-shifts/open` y `POST /api/cash-shifts/close` para turnos?
2. **Validación y Cálculo de Precios en el Servidor**:
   - Al registrar una venta vía `POST /api/sales`, ¿el backend espera que el frontend envíe solo `{ productId, quantity }` y el servidor recalcula precios vigentes, subtotales y tasa de cambio, o el frontend debe enviar la instantánea de precios pactada en el carrito?
3. **Mecanismo de Descuento de Existencias**:
   - ¿A qué almacén físico (`warehouseId`) se imputa la venta del POS? ¿El terminal POS tiene un almacén predeterminado vinculado a su estación de trabajo, o el backend descuenta automáticamente del almacén central o de la tienda asignada al usuario autenticado?
4. **Política de Anulación de Ventas (`sales.cancel`)**:
   - ¿Qué reglas de negocio aplican para anular un ticket? ¿Se requiere el código/PIN de un supervisor? ¿La anulación revierte el stock al inventario y genera un egreso negativo en el arqueo del turno activo? ¿Existe un límite de tiempo para anular una venta (ej. solo mientras el turno de caja siga abierto)?
5. **Persistencia de Órdenes Suspendidas (Hold Tickets)**:
   - ¿Los tickets en espera deben sincronizarse con la base de datos de Symfony para permitir recuperarlos desde otro terminal en la misma red LAN, o deben guardarse exclusivamente en el almacenamiento local del cliente (`localStorage` / IndexedDB)?
6. **Definición sobre la Moneda EUR**:
   - El catálogo unificado de monedas en [`src/shared/types/currency.ts`](../src/shared/types/currency.ts) solo soporta `USD`, `CUP`, `CUP_TRANSFER` y `MLC`. ¿El backend Symfony soportará cobros o canjes en `EUR`, o se descarta de forma definitiva?
7. **Soporte de Pagos Mixtos (Split Payments)**:
   - ¿El backend soportará recibir pagos divididos (ej. una parte en CUP efectivo y otra por Transfermóvil, o parte en USD y parte en CUP)? De ser así, ¿cuál será la estructura del payload (ej. `payments: [{ method, currency, amount }]`)?
8. **Descuentos Comerciales**:
   - ¿Se prevé soporte en base de datos para descuentos por línea de producto o descuento global sobre el ticket (porcentaje o monto fijo)?

---

## 15. Decisiones Propuestas

A continuación se consolidan las propuestas técnicas y operativas para el nuevo módulo de Ventas y POS, numeradas de la A a la L:

| Ref | Área | Propuesta Técnica / Funcional | Valor por Defecto | Pregunta / Requerimiento al Backend |
| :---: | :--- | :--- | :--- | :--- |
| **A1** | **Redondeo de Cobro en Efectivo (Multimoneda)** | Mantener la regla del mercado cubano implementada en el legado: en CUP efectivo redondeo exacto al entero más cercano (`Math.round`, sin centavos); en USD efectivo redondeo forzado hacia arriba al entero superior (`Math.ceil`) cobrando billetes enteros sin centavos de dólar y entregando el vuelto restante en CUP ([`posStore.ts:80, 121, 130-135`](../src/modules/pos/store/posStore.ts#L80)). | CUP entero (`precision: 0`), USD entero (`Math.ceil`), vuelto en CUP. | ¿El backend Symfony valida y almacena los importes en `DECIMAL(12, 2)` con montos redondeados a enteros para cobros en efectivo de CUP y USD, o almacena los decimales teóricos y registra el redondeo como ajuste contable? |
| **A2** | **Cálculo de Totales, Tasas y Vuelto (Servidor vs Cliente)** | El servidor debe calcular de forma autoritativa el total de la orden, la tasa de cambio aplicable, el importe a cobrar y el vuelto correspondiente; el cliente solo actúa como interfaz de captura y visualización reactiva sin aplicar lógica financiera crítica unilateralmente. | Servidor autoritativo calcula y valida; cliente muestra estimación previa y renderiza el resultado final retornado por la API. | ¿El backend Symfony proporcionará un endpoint de cotización previa (`POST /api/sales/quote` o similar) para validar el cobro antes de confirmar la venta, o la validación y cálculo de vuelto y tasa se devuelven directamente en la respuesta del `POST /api/sales`? |
| **B** | **Pantalla Completa POS (Kiosk Mode)** | Diseñar el terminal POS en modo Kiosk / Fullscreen real ocupando el 100% del viewport sin barra lateral ni cabecera de la SPA. La ruta exige el permiso `sales.create`. Para salir del modo pantalla completa, se proporciona un botón visible accesible en la cabecera ("Salir del POS" / icono de cierre) y atajos de teclado (`Escape` y `F11`) para conmutar pantalla completa o retornar al menú principal de la aplicación. | Pantalla completa activa por defecto al ingresar a `/sales/pos`. Exige permiso `sales.create`. Salida con botón visible o tecla `Escape`/`F11`. | N/A (Decisión exclusiva de Frontend y Ergonomía de Mostrador). |
| **C** | **Persistencia de Tickets Suspendidos (Hold Tickets)** | Almacenar las órdenes en espera en `localStorage` del navegador para evitar su pérdida accidental por recarga o corte eléctrico local. Si el backend implementa endpoint, sincronizarlos. | Almacenamiento local en `localStorage` (`qvaflow_pos_held_orders`). | ¿Implementará el backend un endpoint `GET/POST /api/pos/held-orders` para compartir tickets en espera entre varios terminales LAN? |
| **D** | **Pagos Mixtos (Split Payments)** | En la primera fase de migración, mantener cobro monomodal (un solo método y divisa por ticket) tal como en el legado. Diseñar el tipo TypeScript de forma extensible (`PaymentAllocation[]`) para soportar pagos combinados cuando el backend lo admita. | Pago único (1 divisa, 1 método). | ¿Se requiere soporte de pagos mixtos en el lanzamiento inicial o se pospone para una segunda fase? |
| **E** | **Depuración de Divisa EUR** | Alinear el terminal POS estrictamente con [`src/shared/types/currency.ts`](../src/shared/types/currency.ts), suprimiendo la moneda `EUR` y conservando exclusivamente `USD`, `CUP`, `CUP_TRANSFER` y `MLC`. | `EUR` eliminado del POS. | ¿Confirmar si algún cliente o flujo requerirá cobro o canje de Euros en efectivo? |
| **F** | **Almacén de Imputación de Stock** | Vincular cada venta al almacén asignado a la estación de trabajo local o al usuario autenticado. En el frontend, leer el `warehouseId` predeterminado desde la configuración o sesión. | Almacén asignado al usuario / Almacén Central. | ¿El backend deducirá el almacén automáticamente según la sesión o el frontend debe enviar `warehouseId` en el payload de la venta? |
| **G** | **Descuentos Comerciales** | Mantener la ausencia de descuentos en la primera fase de migración para replicar con fidelidad el legado. Proponer controles de descuento por porcentaje o importe en una actualización posterior sujeta a permisos. | Sin descuentos (0%). | ¿Se requiere incorporar descuento manual con autorización de supervisor en esta versión? |
| **H** | **Anulación de Ventas (`sales.cancel`)** | Incorporar en el Historial de Ventas la acción "Anular Ticket", visible solo para usuarios con permiso `sales.cancel`, solicitando confirmación y motivo de anulación. | Botón "Anular" protegido por `v-permission="'sales.cancel'"`. | ¿Cuál es la ruta y payload para la anulación (`POST /api/sales/{id}/cancel` con `{ reason }`)? |
| **I** | **Impresión de Tickets** | Implementar generación de recibo imprimible mediante estilos `@media print` optimizados para ancho de 80mm / 58mm térmico y botón directo de `window.print()`. Dejar la integración ESC/POS nativa desacoplada. | Impresión nativa del navegador con plantilla CSS térmica. | ¿El backend generará algún formato PDF o cadena de texto ESC/POS para impresión remota en servidor de impresión LAN? |
| **J** | **Entrada Rápida con Prefijo en Lector (OPCIONAL y POSTERIOR)** | Función nueva (no existente en el legado, no es migración). Permitir que el cajero teclee un multiplicador con asterisco antes del código (ej. `5*78910001`) para añadir de una sola vez varias unidades de dicho producto al escanear. **Riesgo identificado:** existen estándares y códigos de barras/SKU comerciales que legítimamente contienen el carácter `*` (ej. simbología Code 39 o códigos alfanuméricos internos), lo que generaría falsos positivos, parseos truncados o errores de lectura si no se delimita estrictamente. | No incluida en la primera fase | N/A (Función exclusiva de frontend; validar si algún SKU de catálogo contiene o puede contener el carácter `*`). |
| **K** | **Margen de Canje en Mostrador (Parámetro del Sistema)** | El margen de canje de divisas (fijado rígidamente en 10 CUP en el legado, [`posStore.ts:33`](../src/modules/pos/store/posStore.ts#L33)) debe ser un parámetro configurable del sistema administrable de forma dinámica, no una constante hardcodeada en el código fuente. | `10.00` CUP (configurable en parámetros generales de configuración de caja o negocio). | ¿Dónde se almacena y configura este parámetro en el backend Symfony (`/api/system/config` o configuración del terminal/tienda) y qué permiso RBAC se requiere para consultarlo y modificarlo (ej. `system.config` o `cash.manage`)? |
| **L** | **Payload de Emisión de Venta (`POST /api/sales`)** | El cliente envía únicamente las referencias mínimas de la transacción: `{ items: [{ productCode, quantity }], paidCurrency, paymentMethod, cashReceived, transferGateway?, transferReference? }`. El servidor Symfony es el único responsable de fijar los precios unitarios vigentes, la tasa de cambio activa, calcular subtotales, aplicar margen de canje y determinar el vuelto exacto para evitar manipulación o desincronización en cliente. | Payload ligero y autoritativo en servidor. | ¿Acepta el backend este contrato de payload mínimo con `productCode` (o `productId`) y `quantity` por línea, encargándose el servidor de resolver existencias, precios, tasa diaria y totales? |
