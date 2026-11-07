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
