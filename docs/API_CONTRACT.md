# Contrato de API REST - QvaFlow (Symfony Backend <-> Frontend SPA)

Este documento define el contrato de comunicación formal entre el frontend (SPA Vue 3) y el backend (Symfony / PHP). Ha sido diseñado para permitir una integración desacoplada y directa mediante reemplazo de la capa de servicios sin modificar la interfaz de usuario ni las vistas.

---

## 1. Convenciones Globales y Arquitectura

- **Protocolo y Formato:** REST sobre HTTP/1.1 o HTTP/2, con intercambio de datos estrictamente en formato `application/json; charset=UTF-8`.
- **Entorno de Red:** Red de Área Local (LAN) sin conexión a Internet pública. La SPA se sirve desde el mismo host local (Apache/XAMPP o Docker) bajo la ruta base de API configurada en `/api`.
- **Manejo de Fechas:** Fechas y horas en formato **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ssZ`). Ej: `2026-10-30T14:30:00Z`.
- **Precisión Monetaria y Decimales:** Todos los valores de moneda e importes se transmiten como **string decimal** (ej: `"1250.50"`), **NUNCA** como float de punto flotante para prevenir imprecisiones de redondeo en JavaScript. En la base de datos Symfony, estos campos deben ser de tipo `DECIMAL(12, 2)`.
- **Autenticación:** Cabecera estándar HTTP `Authorization: Bearer <accessToken>`.
- **Identificadores (IDs):** El frontend trata los IDs como valores opacos (`type Id = string | number`). Cada entidad usa el tipo de su clave en la base de datos (códigos string donde la clave natural es un código, como `noDocument` o `codigo` de producto; enteros autoincrementales en catálogos simples como monedas o categorías).

---

## 2. Formato Estándar de Errores

Toda respuesta con código de estado HTTP 4xx o 5xx debe retornar un objeto JSON con la siguiente estructura uniforme:

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Usuario o contraseña incorrectos.",
  "details": {
    "username": ["El campo es obligatorio."],
    "password": ["El campo es obligatorio."]
  }
}
```

- `code` _(string)_: Código de error legible por máquina en **UPPER_SNAKE_CASE** para condicionales del frontend (ej: `AUTH_INVALID_CREDENTIALS`, `SERVER_UNAVAILABLE`).
- `message` _(string)_: Mensaje descriptivo y amigable en español apto para mostrar directamente al usuario.
- `details` _(object, opcional)_: Diccionario con errores específicos campo por campo (validaciones 422).

---

## 3. Formato Estándar de Paginación y Listados

Para todos los endpoints que retornen colecciones paginadas de elementos (productos, ventas, inventario, clientes, movimientos de caja):

### 3.1 Parámetros de Consulta (Query Params)

El frontend (`DataTable`, `FilterBar` y `useDataTableQuery`) emite de forma estandarizada los siguientes parámetros en la URL:

| Parámetro   | Tipo            | Requerido | Descripción                                                                                      | Ejemplo                                           |
| :---------- | :-------------- | :-------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| `page`      | `integer`       | No        | Número de página (base 1, por defecto `1`).                                                      | `page=2`                                          |
| `perPage`   | `integer`       | No        | Cantidad de elementos por página (por defecto `10`, opciones estándar: `10`, `20`, `50`, `100`). | `perPage=20`                                      |
| `sort`      | `string`        | No        | Campo y dirección separados por dos puntos con formato `campo:asc` o `campo:desc`.               | `sort=price:desc`                                 |
| `search`    | `string`        | No        | Término de búsqueda general (insensible a mayúsculas/minúsculas).                                | `search=cerveza`                                  |
| _(filtros)_ | `string/number` | No        | Filtros paramétricos adicionales específicos de cada módulo.                                     | `category=Bebidas&warehouse=wh-1&stockStatus=low` |

### 3.2 Ejemplo de Petición HTTP

```http
GET /api/catalog/products?page=2&perPage=10&sort=price:asc&search=cristal&category=Bebidas&warehouse=wh-central HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

### 3.3 Estructura Estándar del Cuerpo de Respuesta (JSON)

Todo listado paginado debe retornar una estructura con las claves exactas `items`, `total`, `page` y `perPage`. Los importes monetarios deben enviarse siempre como **string decimal** con 2 decimales (`"220.00"`):

```json
{
  "items": [
    {
      "id": 2,
      "code": "PRD-002",
      "name": "Cerveza Cristal 355ml",
      "category": "Bebidas",
      "warehouse": "Almacén Central",
      "cost": "120.00",
      "price": "220.00",
      "stock": 45,
      "stockStatus": "normal",
      "createdAt": "2026-10-15T08:30:00Z"
    },
    {
      "id": 3,
      "code": "PRD-003",
      "name": "Cerveza Bucanero 355ml",
      "category": "Bebidas",
      "warehouse": "Punto de Venta Playa",
      "cost": "125.00",
      "price": "230.00",
      "stock": 8,
      "stockStatus": "low",
      "createdAt": "2026-10-16T11:15:00Z"
    }
  ],
  "total": 42,
  "page": 2,
  "perPage": 10
}
```

---

## 4. Estructura del Token JWT y Roles RBAC

### Claims recomendados en el JWT Payload

```json
{
  "sub": "1",
  "username": "carlos_vendedor",
  "roles": ["ROLE_USER"],
  "permissions": ["sales.create", "sales.cancel", "sales.view", "cash.manage", "products.view"],
  "iat": 1793370000,
  "exp": 1793456400
}
```

> **Regla de Autorización Dinámica:**
> El frontend **NO** evalúa `roles`. Los roles son dinámicos y el administrador puede crear roles nuevos en la base de datos.
> El frontend valida **exclusivamente** el array `permissions` con formato `modulo.accion` (ej: `sales.create`, `inventory.adjust`, `products.view_cost`).

---

## 5. Endpoints de Autenticación y Sesión

### 5.1 Iniciar Sesión (Login)

- **Método:** `POST`
- **Ruta:** `/api/auth/login`
- **Autenticación requerida:** No (pública).
- **Duración de sesión:** La sesión dura hasta el cierre explícito por el usuario. Los campos `refreshToken` y `expiresIn` son **OPCIONALES**.

#### Request Body

```json
{
  "username": "superadmin",
  "password": "password123"
}
```

#### Response 200 OK

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "7f8b9c0d1e2f3a4b...",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "username": "superadmin",
    "fullName": "Administrador General",
    "role": "Superadministrador",
    "permissions": [
      "sales.create",
      "sales.cancel",
      "sales.view",
      "cash.manage",
      "cash.open_close",
      "inventory.view",
      "inventory.create",
      "inventory.adjust",
      "inventory.transfer",
      "products.view",
      "products.create",
      "products.edit",
      "products.view_cost",
      "purchases.view",
      "purchases.create",
      "purchases.confirm",
      "reports.view",
      "reports.export",
      "users.manage",
      "roles.manage",
      "backups.manage",
      "system.config"
    ],
    "lastLoginAt": "2026-10-30T14:00:00Z"
  }
}
```

#### Errores Posibles

- `400 Bad Request`: JSON malformado o campos requeridos ausentes (`code: "VALIDATION_FAILED"`).
- `401 Unauthorized`: Credenciales no válidas (`code: "AUTH_INVALID_CREDENTIALS"`).
- `403 Forbidden`: Cuenta de usuario desactivada o bloqueada (`code: "USER_INACTIVE"`).
- `422 Unprocessable Entity`: Formato de usuario o contraseña inválido.
- `500 Internal Server Error`: Fallo interno en la base de datos o servidor.

---

### 5.2 Obtener Usuario Actual (Validar Sesión)

- **Método:** `GET`
- **Ruta:** `/api/auth/me`
- **Autenticación requerida:** Sí (`Authorization: Bearer <token>`).
- **Propósito:** Se ejecuta al recargar o abrir la SPA para revalidar el token persistido en `localStorage`.

#### Response 200 OK

```json
{
  "id": 1,
  "username": "superadmin",
  "fullName": "Administrador General",
  "role": "Superadministrador",
  "permissions": ["sales.create", "sales.cancel", "inventory.view", "products.view_cost"],
  "lastLoginAt": "2026-10-30T14:00:00Z"
}
```

#### Errores Posibles

- `401 Unauthorized`: Token ausente, inválido o expirado (`code: "AUTH_EXPIRED_TOKEN"`). La SPA automáticamente cerrará la sesión local, limpiará el almacenamiento y mostrará el mensaje _"Su sesión ha expirado"_, redirigiendo a `/login`.

---

### 5.3 Cerrar Sesión (Logout)

- **Método:** `POST`
- **Ruta:** `/api/auth/logout`
- **Autenticación requerida:** Sí (`Authorization: Bearer <token>`).
- **Propósito:** Notificar el cierre de sesión al servidor.
- **Nota Arquitectural:** Revocar activamente un token JWT sin estado requiere mantener una lista negra (blacklist) en el backend (ej: en Redis o base de datos). Si el backend Symfony no implementa lista negra, el logout puede resolverse de forma puramente cliente eliminando el token de `localStorage`. La decisión queda a criterio de la arquitectura backend.

#### Request Body

Vacío `{}`.

#### Response 200 OK

```json
{
  "success": true,
  "message": "Sesión cerrada correctamente."
}
```

---

### 5.4 Comprobación de Salud del Servidor Local (Health Check)

- **Método:** `GET`
- **Ruta:** `/api/health`
- **Autenticación requerida:** No.
- **Propósito:** Ping ligero ejecutado periódicamente por el frontend para mostrar el estado de conexión ("Servidor conectado" vs "Servidor no disponible").

#### Response 200 OK

```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-10-30T14:35:10Z",
  "database": "connected"
}
```

---

## 6. Permisos y Roles (BORRADOR - Módulo Usuarios y Roles)

> **Nota:** Esta sección es un borrador de diseño a detallar e implementar en la fase del módulo de Usuarios y Roles.

El frontend **NUNCA** hardcodea el catálogo de permisos disponibles en el sistema: lo solicita dinámicamente al backend para renderizar la matriz de asignación al crear o editar roles.

### 6.1 Catálogo de Permisos del Sistema

- **Método:** `GET`
- **Ruta:** `/api/permissions`
- **Autenticación requerida:** Sí (`users.manage` o `roles.manage`).

#### Response 200 OK

```json
[
  {
    "module": "Ventas y Caja",
    "permissions": [
      {
        "code": "sales.create",
        "label": "Registrar Ventas",
        "description": "Permite emitir tickets de venta en el terminal POS."
      },
      {
        "code": "sales.cancel",
        "label": "Anular Ventas",
        "description": "Permite cancelar tickets y devolver mercancía."
      },
      {
        "code": "cash.manage",
        "label": "Gestión de Caja",
        "description": "Permite aperturar turnos, canjes de divisas y cuadres."
      },
      {
        "code": "cash.exchange",
        "label": "Tasa de Cambio y Canje de Divisas",
        "description": "Permite registrar la tasa diaria de cambio y canje de divisas. [PROPUESTA]"
      },
      {
        "code": "cash.view_history",
        "label": "Historial de Cuadres de Caja",
        "description": "Permite consultar cierres de turno y arqueos históricos de caja. [PROPUESTA]"
      }
    ]
  },
  {
    "module": "Inventario",
    "permissions": [
      {
        "code": "inventory.view",
        "label": "Consultar Stock",
        "description": "Visualizar existencias por almacén y localización."
      },
      {
        "code": "products.view_cost",
        "label": "Ver Costos de Compra",
        "description": "Visualizar precios de adquisición y márgenes comerciales."
      }
    ]
  }
]
```

### 6.2 CRUD de Roles Dinámicos

- `GET /api/roles`: Listado de roles con cantidad de usuarios asignados.
- `POST /api/roles`: Crear nuevo rol.
- `GET /api/roles/{id}`: Detalle de un rol y sus permisos.
- `PUT /api/roles/{id}`: Modificar nombre, descripción o permisos de un rol.
- `DELETE /api/roles/{id}`: Eliminar rol (si no tiene usuarios vinculados).

#### Estructura de Rol

```json
{
  "id": 2,
  "name": "Cajero Principal",
  "description": "Atención al cliente en mostrador con cobro multimoneda",
  "permissions": ["sales.create", "sales.view", "cash.manage", "products.view"]
}
```

---

## 7. Módulo de Inventario y Almacenes [PROPUESTA]

Esta sección define el contrato de API para la gestión de almacenes físicos, zonas/localizaciones y control de existencias de inventario.

### 7.1 Permisos RBAC Asociados

- `inventory.view`: Consultar existencias de stock y listados de almacenes/localizaciones.
- `inventory.adjust`: Registrar cuadraturas y ajustes de conteo físico.
- `inventory.transfer`: Registrar traslados de mercancía entre almacenes y localizaciones.
- `warehouses.manage`: **[PROPUESTA]** Crear, modificar y eliminar almacenes y localizaciones físicas.
- `products.view_cost`: Permiso sensible para visualizar importes de costo unitario y capital invertido.

> [!IMPORTANT] SEGURIDAD Y CONFIDENCIALIDAD DE COSTOS (`products.view_cost`)
> Si el usuario autenticado **NO** posee el permiso `products.view_cost` en sus claims JWT, el backend Symfony **NUNCA DEBE INCLUIR** los campos `cost` (en cada ítem de stock) ni `costValue` (en el resumen) en los JSONs retornados. El frontend oculta estas columnas y tarjetas por ergonomía visual, pero la seguridad de la información financiera sensible depende estrictamente de que el backend filtre estos campos en la respuesta.

---

### 7.2 Endpoints de Almacenes (`/api/warehouses`)

#### 7.2.1 Listar Almacenes

- **Método:** `GET`
- **Ruta:** `/api/warehouses`
- **Respuesta Exitosa (200 OK):**

```json
[
  {
    "code": "ALM-CENTRAL",
    "name": "Almacén Central",
    "locationsCount": 3,
    "stockUnits": 1500
  },
  {
    "code": "ALM-TIENDA",
    "name": "Tienda Principal",
    "locationsCount": 2,
    "stockUnits": 320
  }
]
```

#### 7.2.2 Crear Almacén

- **Método:** `POST`
- **Ruta:** `/api/warehouses`
- **Permiso requerido:** `warehouses.manage`
- **Request Body:**

```json
{
  "code": "ALM-PLAYA",
  "name": "Punto de Venta Playa"
}
```

- **Validaciones:**
  - `code`: Obligatorio, string alfanumérico en mayúsculas sin espacios, máx. 32 caracteres. Único.
  - `name`: Obligatorio, máx. 60 caracteres.
- **Respuesta Exitosa (201 Created):** Retorna el objeto `Warehouse` creado.
- **Errores específicos:**
  - `409 Conflict`: `{ "code": "CODE_ALREADY_EXISTS", "message": "Ya existe un almacén con el código ALM-PLAYA." }`
  - `422 Unprocessable Entity`: `{ "code": "VALIDATION_FAILED", "message": "Datos inválidos", "details": { "name": ["El nombre es obligatorio."] } }`

#### 7.2.3 Obtener Almacén

- **Método:** `GET`
- **Ruta:** `/api/warehouses/{code}`

#### 7.2.4 Actualizar Almacén

- **Método:** `PUT`
- **Ruta:** `/api/warehouses/{code}`
- **Permiso requerido:** `warehouses.manage`
- **Request Body:** `{ "name": "Almacén Central Principal" }`

#### 7.2.5 Eliminar Almacén

- **Método:** `DELETE`
- **Ruta:** `/api/warehouses/{code}`
- **Permiso requerido:** `warehouses.manage`
- **Regla de Integridad (409):** Si el almacén tiene existencias físicas asignadas (`stockUnits > 0`), el backend debe responder con código HTTP 409:

```json
{
  "code": "WAREHOUSE_HAS_STOCK",
  "message": "No se puede eliminar el almacén porque contiene existencias asignadas."
}
```

---

### 7.3 Endpoints de Localizaciones Físicas (`/api/locations`)

#### 7.3.1 Listar Localizaciones de un Almacén

- **Método:** `GET`
- **Ruta:** `/api/warehouses/{code}/locations`
- **Respuesta Exitosa (200 OK):**

```json
[
  {
    "code": "LOC-CEN-P1",
    "warehouseCode": "ALM-CENTRAL",
    "name": "Pasillo 1 - Secos",
    "stockUnits": 850
  },
  {
    "code": "LOC-CEN-EA",
    "warehouseCode": "ALM-CENTRAL",
    "name": "Estante A - Enlatados",
    "stockUnits": 650
  }
]
```

#### 7.3.2 Crear Localización

- **Método:** `POST`
- **Ruta:** `/api/locations`
- **Permiso requerido:** `warehouses.manage`
- **Request Body:**

```json
{
  "code": "LOC-CEN-EB",
  "warehouseCode": "ALM-CENTRAL",
  "name": "Estante B - Licores"
}
```

- **Errores:**
  - `409 Conflict`: `{ "code": "CODE_ALREADY_EXISTS", "message": "Ya existe una localización con este código." }`

#### 7.3.3 Modificar Localización

- **Método:** `PUT`
- **Ruta:** `/api/locations/{code}`
- **Request Body:** `{ "name": "Estante B - Licores Finos" }`

#### 7.3.4 Eliminar Localización

- **Método:** `DELETE`
- **Ruta:** `/api/locations/{code}`
- **Permiso requerido:** `warehouses.manage`
- **Regla de Integridad (409):**

```json
{
  "code": "LOCATION_HAS_STOCK",
  "message": "No se puede eliminar la localización porque contiene existencias de productos."
}
```

---

### 7.4 Endpoints de Existencias y Stock (`/api/inventory`)

#### 7.4.1 Listado Paginado de Stock

- **Método:** `GET`
- **Ruta:** `/api/inventory/stock`
- **Parámetros de consulta (Query Params):**
  - `page`: int (base 1, defecto 1).
  - `perPage`: int (defecto 10, opciones 10, 20, 50, 100).
  - `sort`: string con formato `campo:asc` o `campo:desc` (ej. `productName:asc`, `quantity:desc`).
  - `search`: string de búsqueda por código o nombre de producto.
  - `warehouse`: string (código de almacén opcional).
  - `location`: string (código de localización opcional).
  - `category`: string (categoría opcional).
  - `status`: string (`'ok'` | `'low'` | `'out'`).
- **Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "productCode": "78910001",
      "productName": "Café Serrano Clásico 250g",
      "category": "Alimentos",
      "unit": "pqte",
      "warehouseCode": "ALM-TIENDA",
      "warehouseName": "Tienda Principal",
      "locationCode": "LOC-TND-E1",
      "locationName": "Estantería Expositora",
      "quantity": "24.00",
      "cost": "450.00",
      "price": "650.00",
      "minStock": "10.00",
      "status": "ok",
      "updatedAt": "2026-10-25T10:30:00Z"
    },
    {
      "productCode": "78910005",
      "productName": "Cigarros H. Upmann Selecto",
      "category": "Tabacos",
      "unit": "cajetilla",
      "warehouseCode": "ALM-TIENDA",
      "warehouseName": "Tienda Principal",
      "locationCode": "LOC-TND-M1",
      "locationName": "Mostrador de Cobro",
      "quantity": "8.00",
      "cost": "210.00",
      "price": "300.00",
      "minStock": "10.00",
      "status": "low",
      "updatedAt": "2026-10-23T11:45:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "perPage": 10
}
```

_(Nota: Si el usuario carece de `products.view_cost`, el campo `cost` es omitido)._

#### 7.4.2 Resumen Global de Stock

- **Método:** `GET`
- **Ruta:** `/api/inventory/summary`
- **Respuesta Exitosa (200 OK):**

```json
{
  "totalUnits": 1820,
  "lowStockCount": 4,
  "outOfStockCount": 2,
  "costValue": "145200.00"
}
```

_(Nota: Si el usuario carece de `products.view_cost`, el campo `costValue` es omitido)._

---

### 7.5 Endpoints de Traslados de Inventario (`/api/inventory/transfers`)

> **Nota:** Esta sección es una **PROPUESTA, pendiente de confirmar con backend** (ver [INVENTORY_RULES.md](INVENTORY_RULES.md), sección 10).

#### 7.5.1 Listado Paginado de Traslados

- **Método:** `GET`
- **Ruta:** `/api/inventory/transfers`
- **Permiso requerido:** `inventory.transfer` o `inventory.view`
- **Parámetros de consulta (Query Params):**
  - `page`: int (base 1, defecto 1).
  - `perPage`: int (defecto 10, opciones 10, 20, 50, 100).
  - `sort`: string con formato `campo:asc` o `campo:desc` (ej. `date:desc`, `noDocument:asc`).
  - `search`: string de búsqueda por número de documento o motivo.
  - `desde`: string ISO 8601 o fecha (`YYYY-MM-DD`).
  - `hasta`: string ISO 8601 o fecha (`YYYY-MM-DD`).
  - `status`: string (`'DRAFT'` | `'CONFIRMED'` | `'CANCELLED'`).
- **Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "noDocument": "TRF-2026-0001",
      "date": "2026-10-25T14:30:00Z",
      "status": "CONFIRMED",
      "reason": "Reabastecimiento de mostrador por alta demanda",
      "createdBy": "carlos_almacen",
      "items": [
        {
          "productCode": "78910001",
          "productName": "Café Serrano Clásico 250g",
          "quantity": "20.00",
          "sourceLocationCode": "LOC-CEN-P1",
          "sourceWarehouseName": "Almacén Central",
          "targetLocationCode": "LOC-TND-E1",
          "targetWarehouseName": "Tienda Principal"
        }
      ]
    }
  ],
  "total": 15,
  "page": 1,
  "perPage": 10
}
```

#### 7.5.2 Obtener Detalle de Traslado

- **Método:** `GET`
- **Ruta:** `/api/inventory/transfers/{id}`
- **Permiso requerido:** `inventory.transfer` o `inventory.view`
- **Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "noDocument": "TRF-2026-0001",
  "date": "2026-10-25T14:30:00Z",
  "status": "CONFIRMED",
  "reason": "Reabastecimiento de mostrador por alta demanda",
  "createdBy": "carlos_almacen",
  "items": [
    {
      "productCode": "78910001",
      "productName": "Café Serrano Clásico 250g",
      "quantity": "20.00",
      "sourceLocationCode": "LOC-CEN-P1",
      "sourceWarehouseName": "Almacén Central",
      "targetLocationCode": "LOC-TND-E1",
      "targetWarehouseName": "Tienda Principal"
    },
    {
      "productCode": "78910005",
      "productName": "Cigarros H. Upmann Selecto",
      "quantity": "10.00",
      "sourceLocationCode": "LOC-CEN-EA",
      "sourceWarehouseName": "Almacén Central",
      "targetLocationCode": "LOC-TND-M1",
      "targetWarehouseName": "Tienda Principal"
    }
  ]
}
```

- **Errores específicos:**
  - `403 Forbidden`: `{ "code": "FORBIDDEN", "message": "No posee permisos para consultar traslados de inventario." }`
  - `404 Not Found`: `{ "code": "NOT_FOUND", "message": "El documento de traslado solicitado no existe." }`

#### 7.5.3 Crear Documento de Traslado

- **Método:** `POST`
- **Ruta:** `/api/inventory/transfers`
- **Permiso requerido:** `inventory.transfer`
- **Request Body:**

```json
{
  "reason": "Reubicación de stock por temporada",
  "items": [
    {
      "productCode": "78910001",
      "quantity": "15.00",
      "sourceLocationCode": "LOC-CEN-P1",
      "targetLocationCode": "LOC-TND-E1"
    }
  ]
}
```

_(Nota: El estado del documento es asignado automáticamente por el servidor como `'CONFIRMED'`, aplicando los movimientos de inventario de forma inmediata)._

- **Respuesta Exitosa (201 Created):** Retorna el objeto `StockTransfer` creado.
- **Errores específicos:**
  - `400 Bad Request` (`VALIDATION_ERROR`):
    - Origen igual a destino (`sourceLocationCode === targetLocationCode`):
      ```json
      {
        "code": "VALIDATION_ERROR",
        "message": "La localización de origen no puede ser igual a la de destino.",
        "details": {
          "targetLocationCode": ["El destino debe ser diferente al origen."]
        }
      }
      ```
    - Lista de items vacía (`items: []`):
      ```json
      {
        "code": "VALIDATION_ERROR",
        "message": "El traslado debe contener al menos un producto.",
        "details": {
          "items": ["Debe especificar al menos una línea de producto."]
        }
      }
      ```
    - Cantidad menor o igual a cero (`quantity <= 0`):
      ```json
      {
        "code": "VALIDATION_ERROR",
        "message": "La cantidad a trasladar debe ser mayor que cero.",
        "details": {
          "quantity": ["La cantidad debe ser un valor positivo mayor que cero."]
        }
      }
      ```
  - `403 Forbidden`:
    ```json
    {
      "code": "FORBIDDEN",
      "message": "No posee permisos para registrar traslados de inventario."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "code": "NOT_FOUND",
      "message": "Producto o localización no encontrados en el catálogo."
    }
    ```
  - `409 Conflict` (`STOCK_INSUFFICIENT`):
    ```json
    {
      "code": "STOCK_INSUFFICIENT",
      "message": "Stock insuficiente en la localización de origen para completar el traslado.",
      "details": {
        "productCode": "78910001",
        "requestedQuantity": "15.00",
        "availableQuantity": "8.00",
        "sourceLocationCode": "LOC-CEN-P1"
      }
    }
    ```

---

### 7.6 Endpoints de Ajustes de Inventario (`/api/inventory/adjustments`)

> **Nota:** Esta sección es una **PROPUESTA, pendiente de confirmar con backend** (ver [INVENTORY_RULES.md](INVENTORY_RULES.md), sección 10).

#### 7.6.1 Listado Paginado de Ajustes

- **Método:** `GET`
- **Ruta:** `/api/inventory/adjustments`
- **Permiso requerido:** `inventory.adjust` o `inventory.view`
- **Parámetros de consulta (Query Params):**
  - `page`: int (base 1, defecto 1).
  - `perPage`: int (defecto 10, opciones 10, 20, 50, 100).
  - `sort`: string con formato `campo:asc` o `campo:desc` (ej. `date:desc`, `noDocument:asc`).
  - `search`: string de búsqueda por número de documento o motivo.
  - `desde`: string ISO 8601 o fecha (`YYYY-MM-DD`).
  - `hasta`: string ISO 8601 o fecha (`YYYY-MM-DD`).
  - `status`: string (`'DRAFT'` | `'CONFIRMED'` | `'CANCELLED'`).
- **Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "id": 1,
      "noDocument": "AJU-2026-0001",
      "date": "2026-10-25T16:00:00Z",
      "status": "CONFIRMED",
      "reason": "Ajuste por rotura de envase en exhibición",
      "createdBy": "laura_supervisor",
      "items": [
        {
          "productCode": "78910001",
          "productName": "Café Serrano Clásico 250g",
          "locationCode": "LOC-TND-E1",
          "locationName": "Estantería Expositora",
          "warehouseName": "Tienda Principal",
          "systemQuantity": "24.00",
          "countedQuantity": "22.00",
          "difference": "-2.00"
        }
      ]
    }
  ],
  "total": 8,
  "page": 1,
  "perPage": 10
}
```

#### 7.6.2 Obtener Detalle de Ajuste

- **Método:** `GET`
- **Ruta:** `/api/inventory/adjustments/{id}`
- **Permiso requerido:** `inventory.adjust` o `inventory.view`
- **Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "noDocument": "AJU-2026-0001",
  "date": "2026-10-25T16:00:00Z",
  "status": "CONFIRMED",
  "reason": "Cuadratura semanal y baja por merma",
  "createdBy": "laura_supervisor",
  "items": [
    {
      "productCode": "78910001",
      "productName": "Café Serrano Clásico 250g",
      "locationCode": "LOC-TND-E1",
      "locationName": "Estantería Expositora",
      "warehouseName": "Tienda Principal",
      "systemQuantity": "24.00",
      "countedQuantity": "22.00",
      "difference": "-2.00"
    },
    {
      "productCode": "78910005",
      "productName": "Cigarros H. Upmann Selecto",
      "locationCode": "LOC-TND-M1",
      "locationName": "Mostrador de Cobro",
      "warehouseName": "Tienda Principal",
      "systemQuantity": "8.00",
      "countedQuantity": "0.00",
      "difference": "-8.00"
    }
  ]
}
```

- **Errores específicos:**
  - `403 Forbidden`: `{ "code": "FORBIDDEN", "message": "No posee permisos para consultar ajustes de inventario." }`
  - `404 Not Found`: `{ "code": "NOT_FOUND", "message": "El documento de ajuste solicitado no existe." }`

#### 7.6.3 Crear Documento de Ajuste

- **Método:** `POST`
- **Ruta:** `/api/inventory/adjustments`
- **Permiso requerido:** `inventory.adjust`
- **Request Body:**

```json
{
  "reason": "Conteo físico fin de mes y baja por deterioro",
  "items": [
    {
      "productCode": "78910001",
      "locationCode": "LOC-TND-E1",
      "countedQuantity": "22.00"
    },
    {
      "productCode": "78910005",
      "locationCode": "LOC-TND-M1",
      "countedQuantity": "0.00"
    }
  ]
}
```

> **Reglas de Negocio Críticas:**
>
> - **Conteo Cero es Válido:** El valor `countedQuantity: "0.00"` es **completamente VÁLIDO** (representa rotura total, merma total o producto agotado).
> - **Cálculo Atómico en Servidor:** El cliente envía únicamente la cantidad física contada (`countedQuantity`). El backend consulta el stock actual en dicha localización (`systemQuantity`) y calcula atómicamente la variación (`difference = countedQuantity - systemQuantity`).
> - **Estado Asignado por Servidor:** El servidor asigna automáticamente `'CONFIRMED'` y asienta el nuevo valor de stock inmediatamente.

- **Respuesta Exitosa (201 Created):** Retorna el objeto `InventoryAdjustment` creado con las cantidades del sistema y diferencias calculadas.
- **Errores específicos:**
  - `400 Bad Request` (`VALIDATION_ERROR`):
    - Lista de items vacía (`items: []`):
      ```json
      {
        "code": "VALIDATION_ERROR",
        "message": "El ajuste debe contener al menos un producto.",
        "details": {
          "items": ["Debe especificar al menos una línea de producto."]
        }
      }
      ```
    - Localización inválida o faltante:
      ```json
      {
        "code": "VALIDATION_ERROR",
        "message": "La localización es obligatoria para cada producto.",
        "details": {
          "locationCode": ["Localización no válida o requerida."]
        }
      }
      ```
    - Cantidad contada negativa (`countedQuantity < 0`):
      ```json
      {
        "code": "VALIDATION_ERROR",
        "message": "La cantidad física contada no puede ser negativa.",
        "details": {
          "countedQuantity": ["La cantidad física contada no puede ser menor que 0."]
        }
      }
      ```
  - `403 Forbidden`:
    ```json
    {
      "code": "FORBIDDEN",
      "message": "No posee permisos para registrar ajustes de inventario."
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "code": "NOT_FOUND",
      "message": "Producto o localización no encontrados en el catálogo."
    }
    ```

---

## 8. Pendiente por Definir con el Backend

1. **El Contrato es una PROPUESTA Adaptable:**
   - Esta especificación es una propuesta de arquitectura limpia. Si el backend Symfony ya implementa otra estructura (por ejemplo el bundle estándar `LexikJWTAuthenticationBundle` respondiendo `{ "token": "..." }` en `POST /api/login_check`), **la adaptación se realiza en la capa de servicios HTTP**, sin necesidad de modificar ningún componente visual, store ni vista del frontend.
2. **Cálculo de Estado de Stock (`status: 'ok' | 'low' | 'out'`):**
   - **Propuesta recomendada:** El campo `status` es del producto, calculado e incluido por el backend en cada registro de existencias evaluando el total acumulado entre todas las localizaciones: `total <= 0 ? 'out' : total <= minStock ? 'low' : 'ok'` (con un umbral por defecto de 10 si no se especifica `minStock`). Un producto sin filas de stock computa como `'out'`. Asimismo, los contadores globales `lowStockCount` y `outOfStockCount` de `/api/inventory/summary` cuantifican productos únicos, no filas físicas.
   - **Alternativa:** Si el backend prefiere no calcularlo, el frontend puede derivarlo en tiempo de ejecución.
3. **Campo de Stock Mínimo en Producto:**
   - La entidad Producto actual no dispone de un campo explícito para stock mínimo (`minStock`). Queda pendiente coordinar si se añade dicha columna en la tabla de productos o si se estandariza un umbral mínimo global por defecto a nivel de configuración del sistema.
4. **Almacenes sin Localizaciones:**
   - Se permite la creación y existencia de almacenes sin localizaciones asignadas de forma obligatoria, eliminando la restricción del legado que exigía al menos una localización para dar de alta un almacén.
5. **Estrategia de Sesión y Expiración en Red Local (LAN):**
   - Token JWT de larga duración (ej: 12 a 24 horas, coincidente con la jornada de operación), sin necesidad de refresh token ni rotación compleja.
6. **Precisión Numérica en Base de Datos:**
   - Todos los importes y cantidades de inventario deben viajar como `DecimalString` (`"24.00"`, `"1250.50"`), mapeados en Symfony a columnas `DECIMAL(12,2)`.
7. **Catálogo de Monedas y Tasas de Cambio:**
   - Monedas admitidas: `USD`, `CUP`, `CUP_TRANSFER` y `MLC`.

---

## 9. Módulo de Reportes y Analíticas (PROPUESTA)

> **PROPUESTA, pendiente de confirmar con backend.**  
> Esta sección define el contrato de API para la migración del módulo de Reportes. Las decisiones de arquitectura subyacentes se encuentran detalladas en la [sección 13 de REPORTS_RULES.md](REPORTS_RULES.md#13-decisiones-de-diseño-propuestas-pendientes-de-confirmar-con-el-backend).
>
> **Permiso de exportación reservado:** El permiso `reports.export` queda reservado en la matriz de roles y permisos de la aplicación. En esta fase inicial de migración **no se expone ningún endpoint de exportación** (la generación de archivos CSV, Excel o PDF no se implementa en esta etapa).

### 9.1 Consideraciones Generales y Seguridad RBAC

- **Permiso base:** Todos los endpoints del módulo de reportes requieren autenticación y el permiso `reports.view`.
- **Control de datos sensibles (`products.view_cost`):**
  - Si el usuario **posee** `products.view_cost`, el backend entrega métricas de compras a proveedores (`purchasesTotal`, `purchasesCount`), costo de mercancía vendida (`cogsTotal`), ganancia bruta (`grossProfit`), margen sobre ventas (`marginPercent`, `marginHealth`), balance de caja (`cashBalance`), capital retenido (`tiedUpCapital`) y movimientos de tipo `PURCHASE`.
  - Si el usuario **carece** de `products.view_cost`, el backend **omite por completo estos campos** del objeto JSON (ausentes, no enviados en `0.00` ni `null`). Los movimientos devueltos en `/api/reports/movements` se restringen automáticamente a solo `SALE`.
- **Rango de fechas:** Parámetros `desde` y `hasta` en formato ISO 8601 (`YYYY-MM-DD`). Si no se envían, el backend asume por defecto el mes en curso (`current_month`).
- **Valores monetarios y cantidades:** Transmitidos estrictamente como `DecimalString` (ej. `"145850.00"`). Moneda contable base: `USD`.

---

### 9.2 GET /api/reports/finance-summary

Entrega los totales agregados e indicadores financieros clave del período.

- **Permiso requerido:** `reports.view` (los campos sensibles se omiten si falta `products.view_cost`).
- **Parámetros de consulta (Query Params):**
  - `desde` _(string, opcional)_: Fecha de inicio (`YYYY-MM-DD`).
  - `hasta` _(string, opcional)_: Fecha de fin (`YYYY-MM-DD`).
  - `warehouseCode` _(string, opcional)_: Código de almacén para consolidar un centro específico.

#### Ejemplo de Petición HTTP
```http
GET /api/reports/finance-summary?desde=2026-10-01&hasta=2026-10-31 HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Ejemplo de Respuesta CON permiso `products.view_cost` (200 OK)
```json
{
  "currency": "USD",
  "salesTotal": "145850.00",
  "salesCount": 384,
  "salesByCurrency": [
    { "currency": "CUP", "amount": "98200.00" },
    { "currency": "CUP_TRANSFER", "amount": "32150.00" },
    { "currency": "USD", "amount": "15500.00" }
  ],
  "purchasesTotal": "84200.00",
  "purchasesCount": 42,
  "cogsTotal": "92100.00",
  "grossProfit": "53750.00",
  "marginPercent": "36.85",
  "cashBalance": "61650.00",
  "marginHealth": "HEALTHY"
}
```

#### Ejemplo de Respuesta SIN permiso `products.view_cost` (200 OK - campos sensibles ausentes)
```json
{
  "currency": "USD",
  "salesTotal": "145850.00",
  "salesCount": 384,
  "salesByCurrency": [
    { "currency": "CUP", "amount": "98200.00" },
    { "currency": "CUP_TRANSFER", "amount": "32150.00" },
    { "currency": "USD", "amount": "15500.00" }
  ]
}
```

#### Errores Posibles
- `400 Bad Request` (Rango inválido o parámetros incorrectos):
  ```json
  {
    "code": "INVALID_DATE_RANGE",
    "message": "La fecha final 'hasta' no puede ser anterior a la fecha inicial 'desde'.",
    "details": {
      "hasta": ["Debe ser igual o posterior a la fecha inicial."]
    }
  }
  ```
- `400 Bad Request` (Rango excede el límite máximo permitido de 366 días):
  ```json
  {
    "code": "DATE_RANGE_EXCEEDED",
    "message": "El intervalo de consulta no puede superar los 366 días."
  }
  ```
- `403 Forbidden`:
  ```json
  {
    "code": "FORBIDDEN",
    "message": "No posee permisos para visualizar reportes financieros."
  }
  ```
- `500 Internal Server Error`:
  ```json
  {
    "code": "SERVER_ERROR",
    "message": "Error interno al consolidar el balance financiero."
  }
  ```

---

### 9.3 GET /api/reports/finance-timeseries

Serie histórica cronológica de ventas y compras para visualización en gráficos temporales de línea o barras.

- **Permiso requerido:** `reports.view` (`purchasesTotal` y `grossProfit` ausentes sin `products.view_cost`).
- **Parámetros de consulta (Query Params):**
  - `granularity` _(string, opcional)_: Granularidad temporal del agrupamiento (`'day'` | `'week'` | `'month'`). Por defecto: `'day'`.
  - `desde` _(string, opcional)_: Fecha de inicio (`YYYY-MM-DD`).
  - `hasta` _(string, opcional)_: Fecha de fin (`YYYY-MM-DD`).
  - `warehouseCode` _(string, opcional)_: Filtro opcional por almacén.

#### Ejemplo de Petición HTTP
```http
GET /api/reports/finance-timeseries?granularity=month&desde=2026-06-01&hasta=2026-10-31 HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Ejemplo de Respuesta (200 OK)
```json
{
  "granularity": "month",
  "points": [
    {
      "date": "2026-06",
      "salesTotal": "115400.00",
      "purchasesTotal": "72300.00",
      "grossProfit": "42600.00"
    },
    {
      "date": "2026-07",
      "salesTotal": "132100.00",
      "purchasesTotal": "81500.00",
      "grossProfit": "48700.00"
    },
    {
      "date": "2026-08",
      "salesTotal": "124000.00",
      "purchasesTotal": "69000.00",
      "grossProfit": "45800.00"
    },
    {
      "date": "2026-09",
      "salesTotal": "141800.00",
      "purchasesTotal": "89400.00",
      "grossProfit": "52250.00"
    },
    {
      "date": "2026-10",
      "salesTotal": "145850.00",
      "purchasesTotal": "84200.00",
      "grossProfit": "53750.00"
    }
  ]
}
```
> **Nota de cálculo de ganancia:** El campo `grossProfit` se calcula contablemente como `salesTotal - cogsTotal` (margen sobre el costo de la mercancía efectivamente vendida), siguiendo la misma fórmula del resumen financiero (`getSummary`). No representa `salesTotal - purchasesTotal` (el cual corresponde al balance de caja `cashBalance`). En 2026-10, con un `cogsTotal` de 92,100.00 USD, `grossProfit` resulta en 53,750.00 USD, consistente con la sección 9.2.

#### Errores Posibles
- `400 Bad Request` (Granularidad inválida o fechas incoherentes):
  ```json
  {
    "code": "INVALID_PARAM",
    "message": "Parámetro 'granularity' no válido. Valores admitidos: 'day', 'week', 'month'."
  }
  ```
- `400 Bad Request` (Rango excede el límite máximo permitido de 366 días):
  ```json
  {
    "code": "DATE_RANGE_EXCEEDED",
    "message": "El intervalo de consulta no puede superar los 366 días."
  }
  ```
- `400 Bad Request` (`INVALID_DATE_RANGE`).
- `403 Forbidden` (`FORBIDDEN`).
- `500 Internal Server Error` (`SERVER_ERROR`).

---

### 9.4 GET /api/reports/sales-by-category

Agregado de recaudación y unidades comercializadas por categoría de catálogo.

- **Permiso requerido:** `reports.view`.
- **Parámetros de consulta (Query Params):**
  - `desde` _(string, opcional)_: Fecha de inicio (`YYYY-MM-DD`).
  - `hasta` _(string, opcional)_: Fecha de fin (`YYYY-MM-DD`).
  - `warehouseCode` _(string, opcional)_: Filtro opcional por almacén.

#### Ejemplo de Petición HTTP
```http
GET /api/reports/sales-by-category?desde=2026-10-01&hasta=2026-10-31 HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Ejemplo de Respuesta (200 OK)
```json
[
  {
    "categoryId": 1,
    "categoryName": "Bebidas",
    "salesTotal": "86450.00",
    "unitsSold": "480.00"
  },
  {
    "categoryId": 2,
    "categoryName": "Alimentos",
    "salesTotal": "41200.00",
    "unitsSold": "260.00"
  },
  {
    "categoryId": 3,
    "categoryName": "Aseo y Hogar",
    "salesTotal": "18200.00",
    "unitsSold": "95.00"
  }
]
```

#### Errores Posibles
- `400 Bad Request` (`INVALID_DATE_RANGE`).
- `403 Forbidden` (`FORBIDDEN`).
- `500 Internal Server Error` (`SERVER_ERROR`).

---

### 9.5 GET /api/reports/top-products

Ranking de productos con mayor rotación comercial en unidades o recaudación.

- **Permiso requerido:** `reports.view`.
- **Parámetros de consulta (Query Params):**
  - `limit` _(integer, opcional)_: Límite de registros a retornar (por defecto `5`, rango permitido `1` a `50`).
  - `desde` _(string, opcional)_: Fecha de inicio (`YYYY-MM-DD`).
  - `hasta` _(string, opcional)_: Fecha de fin (`YYYY-MM-DD`).
  - `categoryId` _(string|number, opcional) [OPCIONAL]_: Filtro por categoría.
  - `warehouseCode` _(string, opcional) [OPCIONAL]_: Filtro por almacén.

#### Ejemplo de Petición HTTP
```http
GET /api/reports/top-products?limit=5&desde=2026-10-01&hasta=2026-10-31 HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Ejemplo de Respuesta (200 OK)
```json
[
  {
    "productId": "PRD-001",
    "code": "PRD-001",
    "name": "Refresco Ciego Montero 330ml",
    "category": "Bebidas",
    "unitsSold": "145.00",
    "revenue": "12325.00",
    "rotationPercent": "100.00"
  },
  {
    "productId": "PRD-002",
    "code": "PRD-002",
    "name": "Cerveza Cristal 355ml",
    "category": "Bebidas",
    "unitsSold": "120.00",
    "revenue": "26400.00",
    "rotationPercent": "82.76"
  },
  {
    "productId": "PRD-005",
    "code": "PRD-005",
    "name": "Arroz Criollo Especial 1kg",
    "category": "Alimentos",
    "unitsSold": "85.00",
    "revenue": "17850.00",
    "rotationPercent": "58.62"
  },
  {
    "productId": "PRD-007",
    "code": "PRD-007",
    "name": "Aceite Vegetal Cocinero 1L",
    "category": "Alimentos",
    "unitsSold": "48.00",
    "revenue": "31200.00",
    "rotationPercent": "33.10"
  },
  {
    "productId": "PRD-014",
    "code": "PRD-014",
    "name": "Ron Havana Club 7 Años 700ml",
    "category": "Bebidas",
    "unitsSold": "32.00",
    "revenue": "46400.00",
    "rotationPercent": "22.07"
  }
]
```
> **Nota de cálculo de rotación (PROPUESTA - Decisión A):** Dado que el legado no definía fórmula para la rotación porcentual ante límites dinámicos, se propone calcularla en servidor como porcentaje de `unitsSold` respecto al producto con más unidades comercializadas del resultado obtenido (`(unitsSold / maxUnitsSold) * 100`).

#### Errores Posibles
- `400 Bad Request` (`INVALID_LIMIT`, `INVALID_DATE_RANGE`, `INVALID_DATE_FORMAT`).
- `403 Forbidden` (`FORBIDDEN`).
- `500 Internal Server Error` (`SERVER_ERROR`).

---

### 9.6 GET /api/reports/idle-products

Productos con existencias en inventario que no han registrado ventas en un período superior a un umbral de días.

- **Permiso requerido:** `reports.view` (`tiedUpCapital` y `totalTiedUpCapital` ausentes sin `products.view_cost`).
- **Parámetros de consulta (Query Params):**
  - `days` _(integer, opcional)_: Umbral mínimo de días de inactividad (por defecto `30`, rango permitido `1` a `365`).
  - `page` _(integer, opcional)_: Número de página (por defecto `1`).
  - `perPage` _(integer, opcional)_: Elementos por página (por defecto `10`).
  - `sort` _(string, opcional)_: Campo y dirección de ordenación en formato estándar `campo:orden` (por defecto `daysWithoutSale:desc`).
  - `warehouseCode` _(string, opcional) [OPCIONAL]_: Filtrar por almacén.
  - `categoryId` _(string|number, opcional) [OPCIONAL]_: Filtrar por categoría.

#### Ejemplo de Petición HTTP
```http
GET /api/reports/idle-products?days=30&page=1&perPage=10&sort=daysWithoutSale:desc HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Ejemplo de Respuesta CON `products.view_cost` (200 OK)
```json
{
  "items": [
    {
      "productId": "PRD-089",
      "code": "PRD-089",
      "name": "Vino Tinto Dulce Reserva 750ml",
      "category": "Bebidas",
      "stockQuantity": "35.00",
      "lastSaleDate": "2026-09-15T14:30:00Z",
      "daysWithoutSale": 48,
      "tiedUpCapital": "18200.00"
    },
    {
      "productId": "PRD-102",
      "code": "PRD-102",
      "name": "Galletas Integrales Dietéticas 250g",
      "category": "Alimentos",
      "stockQuantity": "60.00",
      "lastSaleDate": "2026-09-29T10:15:00Z",
      "daysWithoutSale": 34,
      "tiedUpCapital": "5400.00"
    },
    {
      "productId": "PRD-105",
      "code": "PRD-105",
      "name": "Harina de Maíz Fina 500g",
      "category": "Alimentos",
      "stockQuantity": "20.00",
      "lastSaleDate": null,
      "daysWithoutSale": null,
      "tiedUpCapital": "1200.00"
    }
  ],
  "total": 3,
  "page": 1,
  "perPage": 10,
  "totalTiedUpCapital": "24800.00"
}
```

#### Ejemplo de Respuesta SIN `products.view_cost` (200 OK)
```json
{
  "items": [
    {
      "productId": "PRD-089",
      "code": "PRD-089",
      "name": "Vino Tinto Dulce Reserva 750ml",
      "category": "Bebidas",
      "stockQuantity": "35.00",
      "lastSaleDate": "2026-09-15T14:30:00Z",
      "daysWithoutSale": 48
    },
    {
      "productId": "PRD-102",
      "code": "PRD-102",
      "name": "Galletas Integrales Dietéticas 250g",
      "category": "Alimentos",
      "stockQuantity": "60.00",
      "lastSaleDate": "2026-09-29T10:15:00Z",
      "daysWithoutSale": 34
    }
  ],
  "total": 2,
  "page": 1,
  "perPage": 10
}
```

#### Errores Posibles
- `400 Bad Request` (`INVALID_DAYS`, `INVALID_PAGE`, `PAGINATION_OUT_OF_BOUNDS`):
  ```json
  {
    "code": "INVALID_DAYS",
    "message": "El parámetro 'days' debe ser un número entero entre 1 y 365."
  }
  ```
- `403 Forbidden` (`FORBIDDEN`).
- `500 Internal Server Error` (`SERVER_ERROR`).

---

### 9.7 GET /api/reports/movements

Auditoría detallada de transacciones financieras individuales (ventas netas y compras de proveedores) con paginación de servidor.

- **Permiso requerido:** `reports.view` (las filas de tipo `PURCHASE` solo se retornan si el usuario posee `products.view_cost`).
- **Parámetros de consulta (Query Params):**
  - `page` _(integer, opcional)_: Número de página (por defecto `1`).
  - `perPage` _(integer, opcional)_: Elementos por página (por defecto `10`).
  - `sort` _(string, opcional)_: Ordenación (`date:desc`, `amount:asc`, etc.).
  - `search` _(string, opcional)_: Término de búsqueda textual por referencia o descripción.
  - `desde` _(string, opcional)_: Fecha inicial (`YYYY-MM-DD`).
  - `hasta` _(string, opcional)_: Fecha final (`YYYY-MM-DD`).
  - `type` _(string, opcional)_: Filtrar por tipo (`'ALL'` | `'SALE'` | `'PURCHASE'`).
  - `categoryId` _(string|number, opcional)_: Filtrar por categoría.
  - `warehouseCode` _(string, opcional)_: Filtrar por almacén.

#### Ejemplo de Petición HTTP
```http
GET /api/reports/movements?page=1&perPage=10&sort=date:desc&desde=2026-10-01&hasta=2026-10-31&type=ALL HTTP/1.1
Host: localhost:8000
Authorization: Bearer <accessToken>
Accept: application/json
```

#### Ejemplo de Respuesta (200 OK)
```json
{
  "items": [
    {
      "id": 1045,
      "date": "2026-10-31T18:42:10Z",
      "type": "SALE",
      "reference": "TICK-908123",
      "description": "Venta mostrador ticket #908123",
      "categoryName": "Bebidas",
      "warehouseName": "Punto de Venta Playa",
      "amount": "1450.00",
      "currency": "CUP",
      "amountBase": "4.03",
      "paymentMethod": "CASH"
    },
    {
      "id": 1044,
      "date": "2026-10-31T14:15:00Z",
      "type": "PURCHASE",
      "reference": "FAC-2026-089",
      "description": "Compra cerveza proveedor Ciego Montero",
      "categoryName": "Bebidas",
      "warehouseName": "Almacén Central",
      "amount": "28400.00",
      "currency": "CUP",
      "amountBase": "78.89",
      "paymentMethod": "TRANSFER"
    }
  ],
  "total": 384,
  "page": 1,
  "perPage": 10
}
```
> **Campos de movimiento:**
> - `paymentMethod` _(string)_: Código del método de pago (`'CASH'`, `'CARD'`, `'TRANSFER'`), el cual se traduce en la interfaz según el diccionario de presentación (`CASH` -> "Efectivo", `CARD` -> "Tarjeta", `TRANSFER` -> "Transferencia").
> - `amountBase` _(string)_: Importe equivalente expresado en la moneda contable base (`USD`) como `DecimalString`.

#### Errores Posibles
- `400 Bad Request` (`INVALID_DATE_RANGE`, `PAGINATION_OUT_OF_BOUNDS`).
- `400 Bad Request` (Rango excede el límite máximo permitido de 366 días):
  ```json
  {
    "code": "DATE_RANGE_EXCEEDED",
    "message": "El intervalo de consulta no puede superar los 366 días."
  }
  ```
- `403 Forbidden` (`FORBIDDEN`).
- `500 Internal Server Error` (`SERVER_ERROR`).



---

## 10. Módulo de Ventas y Caja [PROPUESTA]

Esta sección define el contrato de API para las operaciones del Punto de Venta (POS), control de turnos y arqueos de caja, canjes de divisas en mostrador, emisión de tickets y auditoría de ventas en QvaFlow.

> [!IMPORTANT] CONVENCIONES DE PRECISIÓN Y MULTIMONEDA EN VENTAS
> - **Precisión Monetaria y Decimales:** Todos los importes y cantidades se transmiten como **`DecimalString`** (string decimal exacto con 2 decimales, ej: `"1250.00"`, `"2.00"`), nunca como números flotantes.
> - **Monedas Soportadas:** `USD` (moneda de referencia económica), `CUP` (moneda contable nacional en efectivo), `CUP_TRANSFER` (transferencia nacional EnZona / Transfermóvil) y `MLC` (tarjeta magnética nacional).
> - **Regla de Redondeo en Efectivo:**
>   - **En CUP efectivo:** Redondeo estricto al entero más cercano (`precision: 0`, sin centavos).
>   - **En USD efectivo:** Redondeo forzado hacia arriba al entero superior (`Math.ceil`, solo billetes enteros sin centavos).
>   - **Vuelto al Cliente:** Ante cobros en divisa extranjera (USD), el vuelto o cambio restante se calcula y **se entrega siempre en pesos cubanos (`CUP`)**.
> - **Idempotencia (`clientRequestId`):** Para prevenir cobros duplicados por reintentos de red o doble clic en el terminal, la emisión de ventas exige un UUID v4 generado en el frontend (`clientRequestId`). Si el servidor recibe una solicitud con un `clientRequestId` ya registrado, retorna la venta existente con HTTP `200 OK` sin duplicar transacciones ni movimientos de stock.

---

### 10.1 GET /api/pos/products

Catálogo de productos disponibles para venta en el terminal POS con existencias físicas en tiempo real y precios vigentes.

- **Método:** `GET`
- **Ruta:** `/api/pos/products`
- **Autenticación requerida:** Sí (`sales.create`).
- **Parámetros de consulta (Query params):**
  - `search` _(opcional, string)_: Búsqueda por coincidencia parcial en nombre o código SKU.
  - `category` _(opcional, string)_: Filtrar por categoría comercial.
  - `warehouseId` _(opcional, string)_: Código del almacén asignado al terminal POS (ej: `"ALM-TIENDA-01"`).

#### Response 200 OK

```json
[
  {
    "id": 101,
    "code": "78910001",
    "name": "Café Serrano Clásico 250g",
    "category": "Alimentos",
    "priceCUP": "650.00",
    "priceUSD": "1.80",
    "stock": "24.00",
    "unit": "pqte"
  },
  {
    "id": 104,
    "code": "78910004",
    "name": "Cerveza Cristal Lata 355ml",
    "category": "Bebidas",
    "priceCUP": "320.00",
    "priceUSD": "0.89",
    "stock": "72.00",
    "unit": "lata"
  }
]
```

#### Errores Posibles
- `401 Unauthorized`: Token ausente o expirado (`AUTH_TOKEN_EXPIRED`).
- `403 Forbidden`: No posee el permiso `sales.create` (`FORBIDDEN`).

---

### 10.2 GET /api/pos/products/by-code/{code}

Búsqueda rápida optimizada para lectores y pistolas de código de barras USB.

- **Método:** `GET`
- **Ruta:** `/api/pos/products/by-code/{code}`
- **Autenticación requerida:** Sí (`sales.create`).
- **Parámetros de ruta:**
  - `code` _(string, requerido)_: Código de barras o SKU escaneado.
- **Parámetros de consulta (Query params):**
  - `warehouseId` _(opcional, string)_: Código del almacén de consulta.

#### Response 200 OK

```json
{
  "id": 101,
  "code": "78910001",
  "name": "Café Serrano Clásico 250g",
  "category": "Alimentos",
  "priceCUP": "650.00",
  "priceUSD": "1.80",
  "stock": "24.00",
  "unit": "pqte"
}
```

#### Errores Posibles
- `404 Not Found`:
  ```json
  {
    "code": "PRODUCT_NOT_FOUND",
    "message": "No existe ningún producto con el código de barras especificado."
  }
  ```

---

### 10.3 GET /api/cash/rates y PUT /api/cash/rates

Consulta y fijación de las tasas de cambio de referencia del día para las operaciones de cobro y canje en mostrador.

#### GET /api/cash/rates
- **Método:** `GET`
- **Ruta:** `/api/cash/rates`
- **Autenticación requerida:** Sí (`sales.create` o `cash.manage` o `cash.exchange`).

##### Response 200 OK

```json
{
  "CUP": "1.00",
  "USD": "360.00",
  "MLC": "275.00"
}
```

#### PUT /api/cash/rates
- **Método:** `PUT`
- **Ruta:** `/api/cash/rates`
- **Autenticación requerida:** Sí (`cash.exchange`).

##### Request Body

```json
{
  "USD": "365.00",
  "MLC": "275.00"
}
```

##### Response 200 OK

```json
{
  "CUP": "1.00",
  "USD": "365.00",
  "MLC": "275.00",
  "updatedAt": "2026-11-14T19:30:00Z"
}
```

##### Errores Posibles
- `400 Bad Request`: Tasas negativas o no válidas (`INVALID_EXCHANGE_RATE`).
- `403 Forbidden`: No posee el permiso `cash.exchange` (`FORBIDDEN`).

---

### 10.4 GET /api/cash/settings y PUT /api/cash/settings

Parámetros globales de configuración operativa de caja, incluyendo el margen de canje en mostrador.

#### GET /api/cash/settings
- **Método:** `GET`
- **Ruta:** `/api/cash/settings`
- **Autenticación requerida:** Sí (`cash.manage` o `system.config`).

##### Response 200 OK

```json
{
  "exchangeMargin": "10.00"
}
```

#### PUT /api/cash/settings
- **Método:** `PUT`
- **Ruta:** `/api/cash/settings`
- **Autenticación requerida:** Sí (`system.config`).

##### Request Body

```json
{
  "exchangeMargin": "12.00"
}
```

##### Response 200 OK

```json
{
  "exchangeMargin": "12.00",
  "updatedAt": "2026-11-14T19:30:00Z"
}
```

##### Errores Posibles
- `400 Bad Request`: Valor menor a 0.00 (`INVALID_SETTINGS_VALUE`).
- `403 Forbidden`: Exige permiso administrativo `system.config` (`FORBIDDEN`).

---

### 10.5 Control de Turnos de Caja (`/api/cash/shifts`)

Endpoints para gestión de apertura, consulta de estado activo y cierre con arqueo de gaveta.
Consumidos por la pantalla dedicada **"Turno y arqueo"** (`/cash/shift`) en el menú Caja y por el Punto de Venta (POS), bajo el permiso `cash.open_close`.

#### 10.5.1 GET /api/cash/shifts/current
Obtiene el turno de caja actualmente abierto para el usuario o la estación de trabajo.

- **Método:** `GET`
- **Ruta:** `/api/cash/shifts/current`
- **Autenticación requerida:** Sí (`sales.create` o `cash.open_close`).

##### Response 200 OK (Turno Abierto)

```json
{
  "id": "TURNO-2026-001",
  "cashierName": "Yadira Reyes",
  "openedAt": "2026-11-14T08:00:00Z",
  "status": "OPEN",
  "dailyRateUSD": "360.00",
  "initialFunds": {
    "CUP": "10000.00",
    "USD": "100.00"
  },
  "salesTotals": {
    "cupCash": "25980.00",
    "cupTransfer": "2520.00",
    "USD": "40.00"
  },
  "exchangeAdjustments": {
    "CUP": "-7200.00",
    "USD": "20.00"
  }
}
```

##### Response 200 OK (Sin Turno Abierto)

```json
null
```

---

#### 10.5.2 POST /api/cash/shifts/open
Apertura de un nuevo turno de caja fijando fondo inicial dual y tasa diaria.

- **Método:** `POST`
- **Ruta:** `/api/cash/shifts/open`
- **Autenticación requerida:** Sí (`cash.open_close`).

##### Request Body

```json
{
  "cashierName": "Yadira Reyes",
  "initialCUP": "5000.00",
  "initialUSD": "50.00",
  "dailyRateUSD": "360.00"
}
```

##### Response 201 Created

```json
{
  "id": "TURNO-2026-002",
  "cashierName": "Yadira Reyes",
  "openedAt": "2026-11-14T19:35:00Z",
  "status": "OPEN",
  "dailyRateUSD": "360.00",
  "initialFunds": {
    "CUP": "5000.00",
    "USD": "50.00"
  },
  "salesTotals": {
    "cupCash": "0.00",
    "cupTransfer": "0.00",
    "USD": "0.00"
  },
  "exchangeAdjustments": {
    "CUP": "0.00",
    "USD": "0.00"
  }
}
```

##### Errores Posibles
- `409 Conflict`: Ya existe un turno activo para la caja o usuario actual:
  ```json
  {
    "code": "SHIFT_ALREADY_OPEN",
    "message": "Ya existe un turno de caja abierto en este terminal. Debe cerrarlo antes de iniciar uno nuevo."
  }
  ```

---

#### 10.5.3 POST /api/cash/shifts/{id}/close
Cierre definitivo y arqueo físico del turno comparando lo esperado contra el efectivo contado.

- **Método:** `POST`
- **Ruta:** `/api/cash/shifts/{id}/close`
- **Autenticación requerida:** Sí (`cash.open_close`).
- **Parámetros de ruta:**
  - `id` _(string, requerido)_: Identificador del turno a cerrar.

##### Request Body

```json
{
  "countedCUP": "28780.00",
  "countedUSD": "160.00",
  "notes": "Arqueo exacto sin diferencias. Conteo físico cotejado con gaveta."
}
```

##### Response 200 OK

```json
{
  "id": "TURNO-2026-001",
  "cashierName": "Yadira Reyes",
  "openedAt": "2026-11-14T08:00:00Z",
  "closedAt": "2026-11-14T19:40:00Z",
  "status": "CLOSED",
  "dailyRateUSD": "360.00",
  "initialFunds": {
    "CUP": "10000.00",
    "USD": "100.00"
  },
  "salesTotals": {
    "cupCash": "25980.00",
    "cupTransfer": "2520.00",
    "USD": "40.00"
  },
  "exchangeAdjustments": {
    "CUP": "-7200.00",
    "USD": "20.00"
  },
  "expectedFunds": {
    "CUP": "28780.00",
    "USD": "160.00"
  },
  "countedFunds": {
    "CUP": "28780.00",
    "USD": "160.00"
  },
  "differences": {
    "CUP": "0.00",
    "USD": "0.00"
  },
  "discrepancyReason": "Arqueo exacto sin diferencias. Conteo físico cotejado con gaveta.",
  "notes": "Arqueo exacto sin diferencias. Conteo físico cotejado con gaveta."
}
```

##### Errores Posibles
- `404 Not Found`: El turno indicado no existe (`SHIFT_NOT_FOUND`).
- `409 Conflict`: El turno ya se encuentra cerrado:
  ```json
  {
    "code": "SHIFT_NOT_OPEN",
    "message": "El turno de caja especificado ya se encuentra cerrado."
  }
  ```
- `400 Bad Request` (Diferencia de dinero sin justificación válida):
  ```json
  {
    "code": "REASON_REQUIRED",
    "message": "Existe una diferencia en el arqueo físico de caja. Debe registrar obligatoriamente el motivo del descuadre con un mínimo de 10 caracteres.",
    "details": {
      "notes": ["La justificación de descuadre debe contener al menos 10 caracteres."]
    }
  }
  ```

---

### 10.6 POST /api/cash/exchanges

Registro de compra de divisas extranjeras entregadas por un cliente en mostrador con margen de canje.

- **Método:** `POST`
- **Ruta:** `/api/cash/exchanges`
- **Autenticación requerida:** Sí (`cash.exchange`).

#### Request Body

```json
{
  "shiftId": "TURNO-2026-001",
  "currencyFrom": "USD",
  "amountFrom": "20.00",
  "notes": "Billete de 20 USD en buen estado recibido para canje"
}
```

#### Response 201 Created

```json
{
  "id": "CNJ-9012",
  "shiftId": "TURNO-2026-001",
  "timestamp": "2026-11-14T19:42:00Z",
  "currencyFrom": "USD",
  "amountFrom": "20.00",
  "currencyTo": "CUP",
  "effectiveRate": "350.00",
  "amountTo": "7000.00",
  "notes": "Billete de 20 USD en buen estado recibido para canje"
}
```

> **Regla de cálculo del servidor:**
> `effectiveRate = max(1.00, dailyRateUSD - exchangeMargin)` (ej. `360.00 - 10.00 = 350.00`).
> `amountTo = Math.round(amountFrom * effectiveRate)` (en CUP entero sin centavos).

#### Errores Posibles
- `409 Conflict`: No hay turno abierto para imputar el canje (`SHIFT_NOT_OPEN`).
- `400 Bad Request`: Importe no positivo o moneda no soportada (`INVALID_EXCHANGE_DATA`).

---

### 10.7 POST /api/sales

Emisión autoritativa de una venta completada en el terminal POS con soporte de idempotencia estricta.

- **Método:** `POST`
- **Ruta:** `/api/sales`
- **Autenticación requerida:** Sí (`sales.create`).

#### Request Body

```json
{
  "clientRequestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "shiftId": "TURNO-2026-001",
  "warehouseId": "ALM-TIENDA-01",
  "items": [
    {
      "productCode": "78910001",
      "quantity": "2.00"
    },
    {
      "productCode": "78910004",
      "quantity": "1.00"
    }
  ],
  "paidCurrency": "USD",
  "paymentMethod": "CASH",
  "cashReceived": "10.00",
  "transferGateway": null,
  "transferReference": null
}
```

#### Response 201 Created (o 200 OK en caso de reintento idempotente)

```json
{
  "id": "TICK-908126",
  "clientRequestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "shiftId": "TURNO-2026-001",
  "warehouseId": "ALM-TIENDA-01",
  "items": [
    {
      "productCode": "78910001",
      "name": "Café Serrano Clásico 250g",
      "quantity": "2.00",
      "unitPriceCUP": "650.00",
      "subtotalCUP": "1300.00"
    },
    {
      "productCode": "78910004",
      "name": "Cerveza Cristal Lata 355ml",
      "quantity": "1.00",
      "unitPriceCUP": "320.00",
      "subtotalCUP": "320.00"
    }
  ],
  "totalCUP": "1620.00",
  "totalUSD": "5.00",
  "paidCurrency": "USD",
  "exchangeRateApplied": "350.00",
  "totalInCurrency": "5.00",
  "cashReceived": "10.00",
  "changeGivenCUP": "1880.00",
  "paymentMethod": "CASH",
  "transferGateway": null,
  "transferReference": null,
  "cashierName": "Yadira Reyes",
  "status": "COMPLETED",
  "createdAt": "2026-11-14T19:45:00Z"
}
```

> **Reglas aplicadas por el servidor:**
> 1. `totalCUP = 1300.00 + 320.00 = 1620.00 CUP`.
> 2. `effectiveRateUSD = 360.00 - 10.00 = 350.00 CUP`.
> 3. `totalInCurrency (USD) = ceil(1620.00 / 350.00) = 5.00 USD` (redondeo hacia arriba estricto al entero superior).
> 4. `changeGivenCUP = (10.00 * 350.00) - 1620.00 = 3500.00 - 1620.00 = 1880.00 CUP` (entregado en pesos cubanos).

#### Errores Posibles
- `400 Bad Request` (Efectivo insuficiente):
  ```json
  {
    "code": "CASH_INSUFFICIENT",
    "message": "El importe en efectivo entregado por el cliente es inferior al total adeudado de la venta."
  }
  ```
- `400 Bad Request` (Transferencia sin número de comprobante):
  ```json
  {
    "code": "TRANSFER_REFERENCE_REQUIRED",
    "message": "Debe proporcionar obligatoriamente el número de referencia o ID de transacción de la transferencia bancaria."
  }
  ```
- `409 Conflict` (Turno no abierto):
  ```json
  {
    "code": "SHIFT_NOT_OPEN",
    "message": "No es posible registrar ventas sin un turno de caja activo en el terminal."
  }
  ```
- `409 Conflict` (Rotura o déficit de existencias):
  ```json
  {
    "code": "STOCK_INSUFFICIENT",
    "message": "Existencias insuficientes para uno o más artículos solicitados.",
    "details": {
      "78910001": ["Stock disponible: 1.00 pqte, solicitado: 2.00 pqte"]
    }
  }
  ```

---

### 10.8 Endpoints de Consulta y Anulación de Ventas

#### 10.8.1 GET /api/sales
Listado paginado de ventas para auditoría comercial y consulta de comprobantes.

- **Método:** `GET`
- **Ruta:** `/api/sales`
- **Autenticación requerida:** Sí (`sales.view`).
- **Parámetros de consulta (Query params):**
  - `page` _(opcional, entero, defecto 1)_: Número de página.
  - `perPage` _(opcional, entero, defecto 10)_: Límite por página.
  - `sort` _(opcional, string, defecto `"createdAt:desc"`)_.
  - `shiftId` _(opcional, string)_: Filtrar por turno específico.
  - `desde` _(opcional, fecha YYYY-MM-DD)_: Fecha inicial de facturación.
  - `hasta` _(opcional, fecha YYYY-MM-DD)_: Fecha final de facturación.
  - `currency` _(opcional, string)_: Filtrar por moneda cobrada (`CUP`, `USD`, `CUP_TRANSFER`, `MLC`).
  - `cashierName` _(opcional, string)_: Filtrar por nombre de cajero específico. > **Nota (PROPUESTA):** Filtro por cajero pendiente a confirmar con backend.
  - `search` _(opcional, string)_: Búsqueda coincidente (insensible a mayúsculas y acentos) en folio de ticket, nombre del cajero, o nombre y código/SKU de cualquiera de los productos en las líneas de la venta. > **Nota (PROPUESTA):** Búsqueda ampliada a productos en líneas de venta pendiente a confirmar con backend.

##### Response 200 OK

```json
{
  "items": [
    {
      "id": "TICK-908126",
      "shiftId": "TURNO-2026-001",
      "createdAt": "2026-11-14T19:45:00Z",
      "cashierName": "Yadira Reyes",
      "itemsCount": 2,
      "totalCUP": "1620.00",
      "totalUSD": "5.00",
      "paidCurrency": "USD",
      "paymentMethod": "CASH",
      "status": "COMPLETED"
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 10
}
```

---

#### 10.8.2 GET /api/sales/{id}
Detalle exhaustivo de una venta individual y líneas de comprobante para impresión térmica.

- **Método:** `GET`
- **Ruta:** `/api/sales/{id}`
- **Autenticación requerida:** Sí (`sales.view`).
- **Parámetros de ruta:**
  - `id` _(string, requerido)_: Folio del ticket (ej: `"TICK-908126"`).

##### Response 200 OK

```json
{
  "id": "TICK-908126",
  "clientRequestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "shiftId": "TURNO-2026-001",
  "warehouseId": "ALM-TIENDA-01",
  "items": [
    {
      "productCode": "78910001",
      "name": "Café Serrano Clásico 250g",
      "quantity": "2.00",
      "unitPriceCUP": "650.00",
      "subtotalCUP": "1300.00"
    },
    {
      "productCode": "78910004",
      "name": "Cerveza Cristal Lata 355ml",
      "quantity": "1.00",
      "unitPriceCUP": "320.00",
      "subtotalCUP": "320.00"
    }
  ],
  "totalCUP": "1620.00",
  "totalUSD": "5.00",
  "paidCurrency": "USD",
  "exchangeRateApplied": "350.00",
  "totalInCurrency": "5.00",
  "cashReceived": "10.00",
  "changeGivenCUP": "1880.00",
  "paymentMethod": "CASH",
  "transferGateway": null,
  "transferReference": null,
  "cashierName": "Yadira Reyes",
  "status": "COMPLETED",
  "createdAt": "2026-11-14T19:45:00Z"
}
```

##### Errores Posibles
- `404 Not Found`: El ticket indicado no existe (`SALE_NOT_FOUND`).

---

#### 10.8.3 POST /api/sales/{id}/cancel
Anulación formal de una venta, reversión de existencias al almacén emisor y ajuste negativo en la recaudación del turno.

- **Método:** `POST`
- **Ruta:** `/api/sales/{id}/cancel`
- **Autenticación requerida:** Sí (`sales.cancel`).
- **Parámetros de ruta:**
  - `id` _(string, requerido)_: Folio del ticket a anular.

##### Request Body

```json
{
  "reason": "Cliente solicitó devolución de la mercancía por empaque defectuoso."
}
```

##### Response 200 OK

```json
{
  "id": "TICK-908126",
  "status": "CANCELLED",
  "cancelledAt": "2026-11-14T20:00:00Z",
  "cancellationReason": "Cliente solicitó devolución de la mercancía por empaque defectuoso.",
  "stockReverted": true
}
```

##### Errores Posibles
- `404 Not Found`: Ticket no encontrado (`SALE_NOT_FOUND`).
- `409 Conflict`: La venta ya se encuentra anulada previamente:
  ```json
  {
    "code": "SALE_ALREADY_CANCELLED",
    "message": "La venta indicada ya ha sido cancelada anteriormente."
  }
  ```

---

#### 10.8.4 GET /api/sales/cashiers [PROPUESTA]
Listado de nombres únicos de cajeros con turnos o ventas registradas para poblar selectores de auditoría en frontend.

- **Método:** `GET`
- **Ruta:** `/api/sales/cashiers`
- **Autenticación requerida:** Sí (`sales.view`).
- **Estado:** PROPUESTA (pendiente a confirmar con backend).

##### Response 200 OK

```json
[
  "Administrador General",
  "Carlos Gómez",
  "Yadira Reyes"
]
```

---

### 10.9 Endpoints de Historial de Cuadres de Caja

#### 10.9.1 GET /api/cash/shifts
Listado paginado de cierres de caja y arqueos históricos para control contable y supervisión administrativa.

- **Método:** `GET`
- **Ruta:** `/api/cash/shifts`
- **Autenticación requerida:** Sí (`cash.view_history`).
- **Parámetros de consulta (Query params):**
  - `page` _(opcional, entero, defecto 1)_.
  - `perPage` _(opcional, entero, defecto 10)_.
  - `sort` _(opcional, string, defecto `"openedAt:desc"`)_.
  - `cashierName` _(opcional, string)_: Filtrar turnos de un cajero específico. > **Nota (PROPUESTA):** Filtro por cajero en listado de turnos pendiente a confirmar con backend.
  - `status` _(opcional, string)_: `'OPEN'` o `'CLOSED'`.
  - `desde` _(opcional, fecha YYYY-MM-DD)_.
  - `hasta` _(opcional, fecha YYYY-MM-DD)_.

##### Response 200 OK

```json
{
  "items": [
    {
      "id": "TURNO-2026-001",
      "cashierName": "Yadira Reyes",
      "openedAt": "2026-11-14T08:00:00Z",
      "closedAt": "2026-11-14T19:40:00Z",
      "status": "CLOSED",
      "dailyRateUSD": "360.00",
      "initialFunds": {
        "CUP": "10000.00",
        "USD": "100.00"
      },
      "salesTotals": {
        "cupCash": "25980.00",
        "cupTransfer": "2520.00",
        "USD": "40.00"
      },
      "exchangeAdjustments": {
        "CUP": "-7200.00",
        "USD": "20.00"
      },
      "differences": {
        "CUP": "0.00",
        "USD": "0.00"
      },
      "discrepancyReason": "Arqueo exacto sin diferencias. Conteo físico cotejado con gaveta."
    }
  ],
  "total": 1,
  "page": 1,
  "perPage": 10
}
```

---

#### 10.9.2 GET /api/cash/shifts/{id}
Detalle exhaustivo de un arqueo histórico con desglose de transacciones y conciliación bancaria.

- **Método:** `GET`
- **Ruta:** `/api/cash/shifts/{id}`
- **Autenticación requerida:** Sí (`cash.view_history`).
- **Parámetros de ruta:**
  - `id` _(string, requerido)_: Identificador del turno.

##### Response 200 OK

```json
{
  "id": "TURNO-2026-001",
  "cashierName": "Yadira Reyes",
  "openedAt": "2026-11-14T08:00:00Z",
  "closedAt": "2026-11-14T19:40:00Z",
  "status": "CLOSED",
  "dailyRateUSD": "360.00",
  "initialFunds": {
    "CUP": "10000.00",
    "USD": "100.00"
  },
  "salesTotals": {
    "cupCash": "25980.00",
    "cupTransfer": "2520.00",
    "USD": "40.00"
  },
  "exchangeAdjustments": {
    "CUP": "-7200.00",
    "USD": "20.00"
  },
  "expectedFunds": {
    "CUP": "28780.00",
    "USD": "160.00"
  },
  "countedFunds": {
    "CUP": "28780.00",
    "USD": "160.00"
  },
  "differences": {
    "CUP": "0.00",
    "USD": "0.00"
  },
  "discrepancyReason": "Arqueo exacto sin diferencias. Conteo físico cotejado con gaveta.",
  "notes": "Arqueo exacto sin diferencias. Conteo físico cotejado con gaveta."
}
```

##### Errores Posibles
- `404 Not Found`: Turno no encontrado (`SHIFT_NOT_FOUND`).
