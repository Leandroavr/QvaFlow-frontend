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
* Documento de traslado: `noDocument`, `fechaMovimiento`, `estado` (`'1'` completado), `activo` (`'1'`), `razon`, `items: [{ producto, cantidad, localizacion1, localizacion2 }]`.
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
* La cantidad ingresada por el usuario reemplaza directamente el valor de stock existente:
  $$\text{stock} = \text{cantidad\_ingresada}$$
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

## 7. A Definir con el Backend

1. **Cálculo de Stock Bajo (Umbral):**
   * ¿Se considerará bajo stock cuando `quantity <= minStock` a nivel de producto/localización, o existirá un umbral porcentual/global definido por empresa?
2. **Generación de Códigos de Almacenes y Localizaciones:**
   * ¿El backend permitirá al usuario ingresar un código alfanumérico manual (ej. `ALM-CENTRAL`) o generará automáticamente slugs / códigos secuenciales si viene vacío?
3. **Distribución Multi-Localización por Producto:**
   * En el listado `/api/inventory/stock`, ¿cada fila representa la existencia en una localización específica o existirá una vista agregada que sume el stock global del producto entre todos sus almacenes?
4. **Validación de Integridad Referencial al Eliminar:**
   * Se requiere confirmar si al intentar eliminar una localización con stock en cero pero con movimientos históricos pasados, se debe archivar/inactivar (soft-delete) o si solo se bloquea con 409 cuando el stock actual es mayor a cero.
