# Reglas de Negocio del Módulo de Inventario (Análisis del Código Legado)

Este documento detalla las entidades, validaciones, flujos de traslados/ajustes, datos mock y diferencias arquitectónicas encontradas en `src/modules/inventory/`, con el fin de guiar la implementación del nuevo sistema sin perder coherencia funcional.

---

## 1. Campos de cada Entidad en el Legado

### 1.1 Almacén (`Almacen`)
* `codigo: string` — Identificador del almacén (ej: `'ALM-CENTRAL'`). Si no se suministra en el formulario, se autogenera con prefijo `ALM-` y timestamp.
* `nombre: string` — Nombre legible del almacén (ej: `'Almacén Central'`).
* `localizaciones: Localizacion[]` — Array anidado con las localizaciones físicas pertenecientes al almacén.

### 1.2 Localización Física (`Localizacion`)
* `codigo: string` — Identificador único de la localización (ej: `'LOC-CEN-P1'`).
* `almacen: string` — Código del almacén padre al que pertenece la localización.
* `nombre?: string` — Nombre descriptivo de la zona física (ej: `'Pasillo 1 - Secos'`, `'Nevera Exhibidora Bebidas'`).

### 1.3 Existencia de Inventario (`InventoryItem`)
* `id: number` — Identificador numérico del producto en inventario.
* `code: string` — Código de barras o SKU del producto (ej: `'78910001'`).
* `name: string` — Nombre del producto (ej: `'Café Serrano Clásico 250g'`).
* `category: string` — Categoría del producto (ej: `'Alimentos'`, `'Bebidas'`).
* `costPrice: number` — Precio de costo en moneda local (tipo `number` con flotantes en el legado).
* `salePrice: number` — Precio de venta minorista al público.
* `currency: string` — Divisa monetaria (ej: `'CUP'`).
* `warehouse: string` — Almacén donde se encuentra ubicado el producto (en el mock se mezclaba nombre y código).
* `location?: string` — Código de la localización asignada (ej: `'LOC-TND-E1'`).
* `locationName?: string` — Nombre de la localización para presentación.
* `stock: number` — Cantidad de unidades físicas disponibles (tipo `number`).
* `minStock: number` — Umbral mínimo de stock asignado al producto.
* `unit: string` — Unidad de medida comercial (`'pqte'`, `'botella'`, `'lata'`, `'cajetilla'`, `'kg'`).
* `lastUpdated?: string` — Fecha y hora del último movimiento (`'YYYY-MM-DD HH:mm'`).

### 1.4 Movimientos y Traslados (`InventoryMovement` / `ItemMovAlmacenes`)
* `TipoMovimiento: 'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE'`
* Documento de traslado: `noDocument`, `fechaMovimiento`, `estado` (valor literal `'1'`; el significado no está confirmado en el legado), `activo` (`'1'`), `razon`, `items: [{ producto, cantidad, localizacion1, localizacion2 }]`.
* Registro histórico: `id`, `productId`, `productName`, `type`, `quantity`, `warehouse`, `location`, `targetWarehouse`, `targetLocation`, `reason`, `createdAt`.

---

## 2. Validaciones Encontradas en el Legado

1. **Creación de Almacén:**
   * El `nombre` es obligatorio (`required: true`).
   * Debe definirse al menos **una localización física** al crear el almacén (no permite almacenes sin localizaciones).
   * Los nombres de localizaciones añadidas dentro del mismo almacén no pueden repetirse (validación insensible a mayúsculas/minúsculas).
2. **Registro de Movimiento:**
   * `type`: Obligatorio (`'ENTRADA' | 'SALIDA' | 'TRASLADO' | 'AJUSTE'`).
   * `productId`: Obligatorio.
   * `quantity`: Obligatorio, numérico y mayor o igual a 1.
3. **Reglas para `TRASLADO`:**
   * `location` (origen) y `targetLocation` (destino) son obligatorios.
   * `location` y `targetLocation` **no pueden ser iguales**.
   * Debe existir stock suficiente en origen (`stock >= quantity`); en caso contrario lanza error bloqueante: *"Stock insuficiente para trasladar X unidades"*.
4. **Reglas para `SALIDA`:**
   * La cantidad debe ser menor o igual al stock actual (`stock >= quantity`), si no lanza error de existencia insuficiente.

---

## 3. Umbrales de Estado de Stock ("Stock Bajo" y "Agotado")

* **Agotado (`out` / `danger`):** Se evalúa estrictamente como `stock === 0`.
* **Stock Bajo (`low` / `warning`):** En el store y vistas del código legado se calcula con `stock > 0 && stock < 10` (umbral duro fijado en 10 unidades, a pesar de que cada ítem posee el campo `minStock`).
* **Stock Normal (`ok` / `success`):** `stock >= 10`.

---

## 4. Comportamiento de "Trasladar" y "Ajustar"

### 4.1 Trasladar (`TRASLADO`)
* Resta la cantidad indicada del stock de la localización de origen.
* En el modelo desnormalizado del legado (donde cada producto tenía un único campo `warehouse` y `location`), el traslado reasignaba la localización/almacén del producto y volvía a sumar el stock.
* En el servicio de movimientos de almacén (`recordWarehouseMovement`), traslada existencias entre dos localizaciones (`localizacion1 -> localizacion2`).
* Genera un registro de auditoría con tipo `TRASLADO`, fecha y razón.

### 4.2 Ajustar (`AJUSTE`)
* Se utiliza para cuadraturas de conteo físico o inventario ciego.
* La cantidad ingresada por el usuario reemplaza directamente el valor de stock existente: `stock = dto.quantity`.
* No valida suficiencia de stock, ya que puede aumentar o disminuir el inventario según el recuento real.
* Genera un registro de auditoría con tipo `AJUSTE` indicando el motivo justificado.

---

## 5. Datos Mock Existentes en el Legado

### 5.1 Almacenes y Localizaciones
1. **ALM-CENTRAL (Almacén Central):**
   * `LOC-CEN-P1` — Pasillo 1 - Secos
   * `LOC-CEN-EA` — Estante A - Enlatados
   * `LOC-CEN-EB` — Estante B - Licores
2. **ALM-TIENDA (Tienda Principal):**
   * `LOC-TND-M1` — Mostrador de Cobro
   * `LOC-TND-E1` — Estantería Expositora
3. **ALM-FRIO (Nevera y Frío):**
   * `LOC-NEV-B1` — Nevera Exhibidora Bebidas
   * `LOC-CONG-C1` — Congelador de Cárnicos

### 5.2 Productos de Inventario
1. `78910001` — Café Serrano Clásico 250g | Alimentos | Costo: $450 | Venta: $650 | Tienda Principal (`LOC-TND-E1`) | Stock: 24 | minStock: 10 | Unidad: pqte
2. `78910002` — Aceite de Girasol Criollo 1L | Alimentos | Costo: $700 | Venta: $950 | Almacén Central (`LOC-CEN-P1`) | Stock: 15 | minStock: 10 | Unidad: botella
3. `78910003` — Refresco Tukola Lata 330ml | Bebidas | Costo: $180 | Venta: $280 | Nevera y Frío (`LOC-NEV-B1`) | Stock: 48 | minStock: 10 | Unidad: lata
4. `78910004` — Cerveza Cristal Lata 355ml | Bebidas | Costo: $220 | Venta: $320 | Nevera y Frío (`LOC-NEV-B1`) | Stock: 72 | minStock: 10 | Unidad: lata
5. `78910005` — Cigarros H. Upmann Selecto | Tabacos | Costo: $210 | Venta: $300 | Tienda Principal (`LOC-TND-M1`) | Stock: 8 (**Stock Bajo**) | minStock: 10 | Unidad: cajetilla
6. `78910006` — Pollo Entero Congelado 1kg | Cárnicos | Costo: $980 | Venta: $1350 | Nevera y Frío (`LOC-CONG-C1`) | Stock: 0 (**Agotado**) | minStock: 10 | Unidad: kg

---

## 6. Diferencias entre el Legado y el Nuevo Modelo de Datos

| Aspecto | Modelo Legado | Nuevo Modelo de Datos |
| :--- | :--- | :--- |
| **Entidad Almacén** | Objeto con localizaciones anidadas (`localizaciones: []`). | Entidad normalizada independiente `Warehouse { code, name }`. |
| **Entidad Localización** | Solo existía como propiedad interna del almacén. | Entidad normalizada `Location { code, warehouseCode, name? }`. |
| **Existencias de Stock** | Modelo desnormalizado (`InventoryItem`) que mezclaba catálogo con localización única. | Entidad `StockItem { productCode, productName, category, unit, warehouseCode, locationCode, quantity, cost?, price, minStock?, updatedAt }`. |
| **Tipos Monetarios y Cantidades** | `number` con flotantes en JS (`costPrice: 450, stock: 24`). | `DecimalString` (`"450.00"`, `"24.00"`) para máxima precisión contable y consistencia con Symfony `DECIMAL`. |
| **Paginación y Filtrado** | Todo en memoria en el cliente con Pinia. | Modelo cliente y servidor con contrato API unificado (`page`, `perPage`, `sort`, `search`). |
| **Control de Costos** | Propiedad booleana en store con visualización en componente. | El backend Symfony **omite** los campos `cost` y `costValue` en la respuesta si no hay permiso `products.view_cost`. |

---

## 7. Traslados (`Movimiento_almacenes` / `Items_Mov_almacenes`)

Análisis exhaustivo extraído del prototipo legado (`src/modules/inventory/`).

### 7.1 Campos del Documento y de cada Ítem

#### Documento Cabecera (`MovimientoAlmacenes` / `Movimiento_almacenes`)
* `noDocument: string` — Número identificador del documento autogenerado con prefijo `'MOV-ALM-'` seguido de 6 dígitos de timestamp (`src/modules/inventory/services/inventoryService.ts:231`, `src/modules/inventory/types/inventory.ts:58`).
* `fechaMovimiento: string` — Fecha y hora del movimiento en formato `'YYYY-MM-DD HH:mm'` (`src/modules/inventory/services/inventoryService.ts:232`, `src/modules/inventory/types/inventory.ts:59`).
* `estado?: string` — Estado de control interno en base de datos: valor literal `'1'`; el significado no está confirmado en el legado (`src/modules/inventory/services/inventoryService.ts:270`, `src/modules/inventory/types/inventory.ts:60`).
* `activo?: string` — Flag de registro activo / borrado lógico; fijado con valor literal `'1'` (`src/modules/inventory/services/inventoryService.ts:271`, `src/modules/inventory/types/inventory.ts:61`).
* `razon?: string` — Motivo u observación textual del traslado (`src/modules/inventory/services/inventoryService.ts:222,273`, `src/modules/inventory/types/inventory.ts:63`).
* `items: ItemMovAlmacenes[]` — Colección de líneas o ítems trasladados (`src/modules/inventory/types/inventory.ts:62`).
* *Usuario / Creador (`userId`, `createdBy`):* **No definido en el legado** (la interfaz y servicios no persisten el identificador del usuario que ejecuta el movimiento).
* *Almacén Origen / Almacén Destino en cabecera:* **No definido en el legado** (las localizaciones de origen y destino se definen a nivel de cada ítem en `ItemMovAlmacenes`).

#### Ítem del Traslado (`ItemMovAlmacenes` / `Items_Mov_almacenes`)
* `producto: string` — Código alfanumérico o identificador del producto en inventario (`src/modules/inventory/types/inventory.ts:47`).
* `productName?: string` — Nombre legible del producto (`src/modules/inventory/types/inventory.ts:48`).
* `cantidad: number` — Cantidad de unidades físicas a trasladar (`src/modules/inventory/types/inventory.ts:49`). Tipo numérico de punto flotante en JS.
* `localizacion1: string` — Código identificador de la localización física de origen (`src/modules/inventory/types/inventory.ts:50`).
* `localizacion2: string` — Código identificador de la localización física de destino (`src/modules/inventory/types/inventory.ts:51`).

#### Estructura alternativa para modal unitario (`CreateMovementDto` / `InventoryMovement`)
En el modal de la interfaz de usuario se utilizaba un registro unitario por producto con:
* `id: string` — Prefijo `'TRF-'` o `'MOV-'` + timestamp (`src/modules/inventory/services/inventoryService.ts:253,328`).
* `productId: number`, `productName: string`, `type: 'TRASLADO'`, `quantity: number`, `warehouse: string`, `location?: string`, `targetWarehouse?: string`, `targetLocation?: string`, `reason: string`, `createdAt: string` (`src/modules/inventory/types/inventory.ts:66-89`).

### 7.2 Estados Posibles y Transiciones
* `estado`: Único valor registrado es el valor literal `'1'`; el significado no está confirmado en el legado (`src/modules/inventory/services/inventoryService.ts:270`).
* Flujo de estados (Borrador / En Tránsito / Recibido / Cancelado): **No definido en el legado**. El traslado se liquida y asienta inmediatamente al enviar la solicitud sin transiciones intermedias.

### 7.3 Validaciones
1. **Producto obligatorio:** `productId` / `producto` requerido (`src/modules/inventory/components/InventoryMovementModal.vue:241`).
2. **Cantidad obligatoria y positiva:** `quantity` requerida, de tipo numérico con valor mínimo de 1 (`min: 1`, `src/modules/inventory/components/InventoryMovementModal.vue:135,242-245`).
3. **Localizaciones obligatorias:** `location` (origen) y `targetLocation` (destino) requeridas (`src/modules/inventory/components/InventoryMovementModal.vue:83,107,253-256`).
4. **Origen distinto de destino:** `location !== targetLocation`. El formulario filtra dinámicamente las opciones de destino para excluir el origen seleccionado (`src/modules/inventory/components/InventoryMovementModal.vue:207-209`), y en la validación del submit emite error bloqueante: *"La localización de origen y destino no pueden ser la misma."* (`src/modules/inventory/components/InventoryMovementModal.vue:257-260`).
5. **Stock suficiente en origen:** `stock >= quantity`. Se valida en el servicio antes de aplicar el movimiento. Si el stock en origen es menor a la cantidad a trasladar, lanza error bloqueante: *"Stock insuficiente de \"[producto]\" para realizar el traslado."* o *"Stock insuficiente para trasladar X unidades."* (`src/modules/inventory/services/inventoryService.ts:241-245,310-312`).

### 7.4 Efecto sobre el Stock
* **Momento de modificación:** Inmediato al invocar `recordWarehouseMovement` o `recordMovement`.
* **Mecanismo:**
  1. Resta la cantidad al stock de la localización origen: `productItem.stock -= item.cantidad` (`src/modules/inventory/services/inventoryService.ts:246,313`).
  2. En el modelo desnormalizado del legado (donde el producto tenía una sola localización global en memoria), reasignaba `location = item.localizacion2` y sumaba la cantidad: `productItem.stock += item.cantidad` (`src/modules/inventory/services/inventoryService.ts:247-248,318-320`).
  3. Actualiza el campo `lastUpdated` del producto con la fecha/hora actual (`src/modules/inventory/services/inventoryService.ts:249,325`).
  4. Inserta un registro de auditoría en la lista de movimientos con `type: 'TRASLADO'`, `location: origen`, `targetLocation: destino`, cantidad y fecha (`src/modules/inventory/services/inventoryService.ts:252-264`).

### 7.5 Pantallas (Listado y Formulario)
* **Pantalla de Listado de Traslados:** **No definido en el legado**.
  * No existía una vista dedicada para listar documentos de traslados (`/inventory/transfers`).
  * Las existencias se visualizaban en la vista consolidada de stock (`src/modules/inventory/views/InventoryStockView.vue:81-286`), que cuenta con:
    * *KPIs superiores:* Unidades Totales, Valor en Costo (si tiene permiso), Bajo Stock (< 10), Agotados (0) (`src/modules/inventory/views/InventoryStockView.vue:4-79`).
    * *Filtros:* Input de búsqueda (código o nombre), select de Almacén, select de Localización, select de Categoría y botón Refrescar (`src/modules/inventory/views/InventoryStockView.vue:89-155`).
    * *Columnas de tabla:* Código (120px), Producto (con sorter y fecha actualización), Categoría (120px), Almacén y Localización (210px), P. Costo (110px, condicional), P. Venta (110px), Stock Actual (160px con badge de color y tag de alerta) y Acciones (130px) (`src/modules/inventory/views/InventoryStockView.vue:327-390`).
    * *Acciones:* Botón global *"Movimiento / Traslado"* en cabecera (`src/modules/inventory/views/InventoryStockView.vue:175`) y botón en cada fila *"Trasladar / Ajustar"* (`src/modules/inventory/views/InventoryStockView.vue:281`).
* **Pantalla de Formulario (Modal de Movimiento):**
  * Implementado en `src/modules/inventory/components/InventoryMovementModal.vue`.
  * *Campos mostrados al seleccionar tipo "TRASLADO":*
    * Select de Tipo: Valor fijo `'TRASLADO'` ("Traslado entre Localizaciones").
    * Select de Producto: Búsqueda con autocompletado mostrando nombre y badge de stock actual (`src/modules/inventory/components/InventoryMovementModal.vue:29-54`).
    * Select Localización Origen: Lista de localizaciones (`src/modules/inventory/components/InventoryMovementModal.vue:80-101`).
    * Select Localización Destino: Lista filtrada excluyendo el origen (`src/modules/inventory/components/InventoryMovementModal.vue:104-125`).
    * Input numérico Cantidad: Etiqueta "Cantidad a Mover" con `:min="1"` y leyenda informativa de stock disponible (`src/modules/inventory/components/InventoryMovementModal.vue:129-150`).
    * Textarea Motivo: Justificación textual (`src/modules/inventory/components/InventoryMovementModal.vue:152-159`).
  * *Acciones del modal:* Botón principal *"Procesar Movimiento"* y botón secundario *"Cancelar"* (`src/modules/inventory/components/InventoryMovementModal.vue:6-10`).

### 7.6 Permisos Usados o Implícitos
* Permiso en módulo de autenticación legado: `'MANAGE_INVENTORY'` (`src/modules/auth/types/auth.ts:10`, `src/modules/auth/components/UserRoleModal.vue:164-166`). Asignado a los perfiles `ADMIN` y `WAREHOUSE`.
* En la vista legada `InventoryStockView.vue`: El acceso al modal de traslados no poseía chequeo de permiso específico a nivel de botón; cualquier usuario que ingresaba a la pantalla podía ejecutar traslados.
* En el contrato API moderno (`docs/API_CONTRACT.md:164,354`): Se formalizó el permiso granular `'inventory.transfer'`.

---

## 8. Ajustes (`Ajuste_inventario` / `Items_ajuste_inventario`)

Análisis exhaustivo extraído del prototipo legado (`src/modules/inventory/`).

### 8.1 Campos del Documento y de cada Ítem

#### Documento Cabecera (`Ajuste_inventario`)
* En el código frontend legado, **no existe una interfaz de cabecera formal `AjusteInventario`** con número de folio de documento propio.
* Los ajustes se guardaban como entradas de auditoría unitaria `InventoryMovement` (`src/modules/inventory/types/inventory.ts:66-78`):
  * `id: string` — Identificador autogenerado con prefijo `'MOV-'` seguido de 6 dígitos de timestamp (`src/modules/inventory/services/inventoryService.ts:328`).
  * `productId: number` — Identificador numérico del producto ajustado (`src/modules/inventory/types/inventory.ts:68`).
  * `productName: string` — Nombre del producto (`src/modules/inventory/types/inventory.ts:69`).
  * `type: TipoMovimiento` — Valor fijo `'AJUSTE'` (`src/modules/inventory/types/inventory.ts:70`).
  * `quantity: number` — Nuevo valor absoluto de stock físico resultante (`src/modules/inventory/types/inventory.ts:71`).
  * `warehouse: string` — Almacén donde se ubica el ítem (`src/modules/inventory/types/inventory.ts:72`).
  * `location?: string` — Localización donde se ubica el ítem (`src/modules/inventory/types/inventory.ts:73`).
  * `reason: string` — Justificación o motivo del ajuste (`src/modules/inventory/types/inventory.ts:76`).
  * `createdAt: string` — Fecha y hora del ajuste en formato `'YYYY-MM-DD HH:mm'` (`src/modules/inventory/types/inventory.ts:77`).
* *Número de documento formal (ej: `AJU-2026-0001`):* **No definido en el legado**.
* *Estado (`estado` / `status`):* **No definido en el legado**.
* *Usuario ejecutor / aprobador (`appliedBy`, `approvedBy`):* **No definido en el legado**.

#### Ítem del Ajuste (`Items_ajuste_inventario`)
* En el legado, el formulario no admitía ajustes multi-línea; cada ajuste se procesaba unitariamente por producto mediante `CreateMovementDto` (`src/modules/inventory/types/inventory.ts:80-89`):
  * `productId: number` — ID del producto.
  * `type: 'AJUSTE'` — Tipo de movimiento.
  * `quantity: number` — Cantidad física contada.
  * `warehouse: string` — Almacén.
  * `location?: string` — Localización.
  * `reason: string` — Justificación.
* *Stock del sistema previo al ajuste (`systemStock`):* **No definido en el legado** como campo persistido en el movimiento (solo se consultaba para mostrarlo en el texto de ayuda del modal).
* *Diferencia calculada (`difference = physical - system`):* **No definido en el legado** (no se calculaba ni persistía la variación cuantitativa).
* *Costo unitario del ajuste y valorización monetaria de la diferencia:* **No definido en el legado**.

### 8.2 Estados Posibles y Transiciones
* Estados y ciclo de vida (Borrador / Pendiente de Aprobación / Aplicado / Rechazado): **No definido en el legado**.
* El ajuste se aplicaba de manera inmediata e irrevocable sobre el stock al presionar el botón del modal.

### 8.3 Validaciones
1. **Tipo de movimiento:** Requerido con valor `'AJUSTE'` (`src/modules/inventory/components/InventoryMovementModal.vue:240`).
2. **Producto obligatorio:** Requerido (`src/modules/inventory/components/InventoryMovementModal.vue:241`).
3. **Cantidad obligatoria y positiva:** `:min="1"` (`src/modules/inventory/components/InventoryMovementModal.vue:135,242-245`).
   * *Inconsistencia del legado:* Al exigir `:min="1"`, el modal impedía ajustar un stock a 0 unidades mediante esta vía, a pesar de que 0 era un stock válido (Agotado).
4. **Localización obligatoria:** Requerida a través del campo simple `location` (`src/modules/inventory/components/InventoryMovementModal.vue:58-75`).
5. **Validación de suficiencia de stock:** **No aplica** por diseño. El ajuste puede fijar un stock superior o inferior al actual (`docs/INVENTORY_RULES.md:81`).
6. **Validación de diferencia máxima permitida o tolerancia:** **No definido en el legado**.

### 8.4 Efecto sobre el Stock
* **Momento de modificación:** Inmediato al invocar `inventoryService.recordMovement` con `type === 'AJUSTE'`.
* **Mecanismo:**
  * En `src/modules/inventory/services/inventoryService.ts:321-323`, la cantidad introducida reemplaza directamente el valor de stock existente: `stock = dto.quantity`.
  * Actualiza la fecha de último movimiento `lastUpdated` del producto con la fecha/hora actual (`src/modules/inventory/services/inventoryService.ts:325`).
  * Genera el registro de auditoría en `localMovements` con `type: 'AJUSTE'`, la cantidad resultante y el motivo (`src/modules/inventory/services/inventoryService.ts:327-342`).

### 8.5 Pantallas (Listado y Formulario)
* **Pantalla de Listado de Ajustes:** **No definido en el legado**.
  * No existía una pantalla o pestaña exclusiva para consultar el historial de ajustes de inventario. Solo se gestionaban desde la tabla de existencias de `InventoryStockView.vue`.
* **Pantalla de Formulario (Modal de Movimiento):**
  * Mismo modal unitario `InventoryMovementModal.vue`.
  * Al seleccionar `type === 'AJUSTE'`:
    * La etiqueta del campo de cantidad cambia dinámicamente a **"Nuevo Stock Total Resultante"** (`src/modules/inventory/components/InventoryMovementModal.vue:130`).
    * El texto de ayuda muestra el stock actual de referencia: *"Stock actual: X [unidad] en [Almacén] ([Localización])"* (`src/modules/inventory/components/InventoryMovementModal.vue:140-148`).
    * Muestra un único selector de localización (`src/modules/inventory/components/InventoryMovementModal.vue:57-75`), a diferencia del grid de origen/destino usado en traslados.
    * Textarea de motivo para justificar la descuadratura o merma (`src/modules/inventory/components/InventoryMovementModal.vue:152-159`).

### 8.6 Permisos Usados o Implícitos
* Permiso general en módulo auth legado: `'MANAGE_INVENTORY'` (`src/modules/auth/types/auth.ts:10`, `src/modules/auth/components/UserRoleModal.vue:164-166`: *"Ajustes físicos, mermas y traslados entre almacenes"*).
* En el contrato API moderno (`docs/API_CONTRACT.md:353`): Se formalizó el permiso específico `'inventory.adjust'` (*"Registrar cuadraturas y ajustes de conteo físico"*).

---

## 9. Dudas para el Backend

Aspectos técnicos y de negocio que **no están definidos en el legado** y requieren definición con el equipo de backend para la nueva implementación:

1. **Modelo de Documentos de Traslado (Cabecera y Detalle):**
   * En el legado coexistían dos conceptos: la interfaz `MovimientoAlmacenes` (diseñada como documento cabecera con múltiples ítems `ItemMovAlmacenes[]`), pero en la interfaz de usuario solo existía un modal unitario (`InventoryMovementModal`) para mover un solo producto a la vez. ¿El nuevo endpoint `/api/inventory/transfers` recibirá documentos con múltiples líneas de productos en una sola transacción o traslados individuales?
2. **Modelo de Documentos de Ajuste (`Ajuste_inventario`):**
   * El legado no poseía entidad de documento para ajustes (solo sobreescritura `stock = quantity`). ¿Cuál será el esquema canónico del backend para un documento de ajuste? Se sugiere:
     * Cabecera: `id`, `documentNumber` (ej. `AJU-0001`), `warehouseCode`, `status` (`DRAFT`, `APPLIED`, `CANCELLED`), `reason`, `createdAt`, `appliedAt`, `createdBy`.
     * Líneas: `id`, `productCode`, `locationCode`, `systemQuantity` (stock antes del conteo), `countedQuantity` (físico), `differenceQuantity` (+/-), `unitCost`, `totalDifferenceValue`.
3. **Flujo de Estados y Ciclo de Vida:**
   * En el legado los traslados y ajustes se aplicaban de forma instantánea e irrevocable sin estados intermedios. ¿Habrá flujo de estados formal en el backend?
     * Para traslados: ¿Habrá estado `IN_TRANSIT` (para mercancía que sale de un almacén pero aún no ha sido recibida en el destino) o confirmación de recepción?
     * Para ajustes: ¿Habrá estado `DRAFT` que requiera aprobación de un supervisor si la diferencia monetaria supera un umbral fijado?
4. **Permisión de Ajustes a Cero:**
   * El validador `:min="1"` del formulario legado impedía ajustar el stock a `0` unidades (ej. por pérdida total o merma). Se requiere confirmar que el backend aceptará `countedQuantity: 0`.
5. **Alcance de Traslados (Internos vs. Entre Almacenes):**
   * Con el nuevo modelo normalizado donde cada localización pertenece a un almacén (`Location.warehouseCode`), ¿un traslado puede realizarse entre dos localizaciones del mismo almacén (reubicación interna) y entre localizaciones de distintos almacenes (traslado externo)? ¿Se enviará `sourceWarehouseCode` y `targetWarehouseCode` en la cabecera?
6. **Tratamiento Contable de Costos en Ajustes:**
   * Al registrar un ajuste que incrementa el stock, ¿con qué costo unitario ingresan las nuevas unidades (costo promedio actual, último costo de compra o costo manual especificado en la línea)?
7. **Permisos Granulares:**
   * En `docs/API_CONTRACT.md` se definieron `inventory.transfer` e `inventory.adjust`. ¿Se requerirán permisos diferenciados para crear borradores vs. autorizar/aprobar ajustes con impacto económico?
