# Contrato de API REST - QvaFlow (Symfony Backend <-> Frontend SPA)

Este documento define el contrato de comunicación formal entre el frontend (SPA Vue 3) y el backend (Symfony / PHP). Ha sido diseñado para permitir una integración desacoplada y directa mediante reemplazo de la capa de servicios sin modificar la interfaz de usuario ni las vistas.

---

## 1. Convenciones Globales y Arquitectura

* **Protocolo y Formato:** REST sobre HTTP/1.1 o HTTP/2, con intercambio de datos estrictamente en formato `application/json; charset=UTF-8`.
* **Entorno de Red:** Red de Área Local (LAN) sin conexión a Internet pública. La SPA se sirve desde el mismo host local (Apache/XAMPP o Docker) bajo la ruta base de API configurada en `/api`.
* **Manejo de Fechas:** Fechas y horas en formato **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ssZ`). Ej: `2026-10-30T14:30:00Z`.
* **Precisión Monetaria y Decimales:** Todos los valores de moneda e importes se transmiten como **string decimal** (ej: `"1250.50"`), **NUNCA** como float de punto flotante para prevenir imprecisiones de redondeo en JavaScript. En la base de datos Symfony, estos campos deben ser de tipo `DECIMAL(12, 2)`.
* **Autenticación:** Cabecera estándar HTTP `Authorization: Bearer <accessToken>`.
* **Identificadores (IDs):** El frontend trata los IDs como valores opacos (`type Id = string | number`). Cada entidad usa el tipo de su clave en la base de datos (códigos string donde la clave natural es un código, como `noDocument` o `codigo` de producto; enteros autoincrementales en catálogos simples como monedas o categorías).

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

* `code` *(string)*: Código de error legible por máquina en **UPPER_SNAKE_CASE** para condicionales del frontend (ej: `AUTH_INVALID_CREDENTIALS`, `SERVER_UNAVAILABLE`).
* `message` *(string)*: Mensaje descriptivo y amigable en español apto para mostrar directamente al usuario.
* `details` *(object, opcional)*: Diccionario con errores específicos campo por campo (validaciones 422).

---

## 3. Formato Estándar de Paginación

Para futuros endpoints que retornen listas de elementos (productos, ventas, movimientos):

* **Parámetros de consulta (Query Params):**
  * `page`: Número de página actual (base 1, por defecto `1`).
  * `perPage`: Cantidad de elementos por página (por defecto `20`, máx `100`).
  * `sort`: Campo y dirección de ordenación (ej: `createdAt:desc`, `name:asc`).
  * `search`: Texto de búsqueda general.

* **Cuerpo de Respuesta:**
```json
{
  "items": [],
  "total": 145,
  "page": 1,
  "perPage": 20
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
  "permissions": [
    "sales.create",
    "sales.cancel",
    "sales.view",
    "cash.manage",
    "products.view"
  ],
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
* **Método:** `POST`
* **Ruta:** `/api/auth/login`
* **Autenticación requerida:** No (pública).
* **Duración de sesión:** La sesión dura hasta el cierre explícito por el usuario. Los campos `refreshToken` y `expiresIn` son **OPCIONALES**.

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
* `400 Bad Request`: JSON malformado o campos requeridos ausentes (`code: "VALIDATION_FAILED"`).
* `401 Unauthorized`: Credenciales no válidas (`code: "AUTH_INVALID_CREDENTIALS"`).
* `403 Forbidden`: Cuenta de usuario desactivada o bloqueada (`code: "USER_INACTIVE"`).
* `422 Unprocessable Entity`: Formato de usuario o contraseña inválido.
* `500 Internal Server Error`: Fallo interno en la base de datos o servidor.

---

### 5.2 Obtener Usuario Actual (Validar Sesión)
* **Método:** `GET`
* **Ruta:** `/api/auth/me`
* **Autenticación requerida:** Sí (`Authorization: Bearer <token>`).
* **Propósito:** Se ejecuta al recargar o abrir la SPA para revalidar el token persistido en `localStorage`.

#### Response 200 OK
```json
{
  "id": 1,
  "username": "superadmin",
  "fullName": "Administrador General",
  "role": "Superadministrador",
  "permissions": [
    "sales.create",
    "sales.cancel",
    "inventory.view",
    "products.view_cost"
  ],
  "lastLoginAt": "2026-10-30T14:00:00Z"
}
```

#### Errores Posibles
* `401 Unauthorized`: Token ausente, inválido o expirado (`code: "AUTH_EXPIRED_TOKEN"`). La SPA automáticamente cerrará la sesión local, limpiará el almacenamiento y mostrará el mensaje *"Su sesión ha expirado"*, redirigiendo a `/login`.

---

### 5.3 Cerrar Sesión (Logout)
* **Método:** `POST`
* **Ruta:** `/api/auth/logout`
* **Autenticación requerida:** Sí (`Authorization: Bearer <token>`).
* **Propósito:** Notificar el cierre de sesión al servidor.
* **Nota Arquitectural:** Revocar activamente un token JWT sin estado requiere mantener una lista negra (blacklist) en el backend (ej: en Redis o base de datos). Si el backend Symfony no implementa lista negra, el logout puede resolverse de forma puramente cliente eliminando el token de `localStorage`. La decisión queda a criterio de la arquitectura backend.

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
* **Método:** `GET`
* **Ruta:** `/api/health`
* **Autenticación requerida:** No.
* **Propósito:** Ping ligero ejecutado periódicamente por el frontend para mostrar el estado de conexión ("Servidor conectado" vs "Servidor no disponible").

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
* **Método:** `GET`
* **Ruta:** `/api/permissions`
* **Autenticación requerida:** Sí (`users.manage` o `roles.manage`).

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
* `GET /api/roles`: Listado de roles con cantidad de usuarios asignados.
* `POST /api/roles`: Crear nuevo rol.
* `GET /api/roles/{id}`: Detalle de un rol y sus permisos.
* `PUT /api/roles/{id}`: Modificar nombre, descripción o permisos de un rol.
* `DELETE /api/roles/{id}`: Eliminar rol (si no tiene usuarios vinculados).

#### Estructura de Rol
```json
{
  "id": 2,
  "name": "Cajero Principal",
  "description": "Atención al cliente en mostrador con cobro multimoneda",
  "permissions": [
    "sales.create",
    "sales.view",
    "cash.manage",
    "products.view"
  ]
}
```

---

## 7. Pendiente por Definir con el Backend

1. **El Contrato es una PROPUESTA Adaptable:**
   * Esta especificación es una propuesta de arquitectura limpia. Si el backend Symfony ya implementa otra estructura (por ejemplo el bundle estándar `LexikJWTAuthenticationBundle` respondiendo `{ "token": "..." }` en `POST /api/login_check`), **la adaptación se realiza en `HttpAuthService`**, sin necesidad de modificar ningún componente visual, store ni vista del frontend.
2. **Estrategia de Sesión y Expiración en Red Local (LAN):**
   * Al operar en una red local privada y aislada de MIPYMES, existen dos alternativas para el backend:
     * **Opción (A) [Recomendada]:** Token JWT de larga duración (ej: 12 a 24 horas, coincidente con la jornada de operación), sin necesidad de refresh token ni rotación compleja.
     * **Opción (B):** Token de corta duración (ej: 60 minutos) con endpoint `POST /api/auth/refresh` y `refreshToken`.
   * En cualquiera de los dos casos, si el backend responde con código HTTP `401 Unauthorized`, el frontend cierra la sesión de inmediato, limpia `localStorage` y notifica al usuario: *"Su sesión ha expirado"*.
3. **Almacenamiento de Token en Cliente:**
   * El token se almacena en `localStorage` del navegador bajo la clave `qvaflow_token`. En el contexto de una red local interna de negocio (sin riesgos de XSS de scripts externos), esta estrategia es estándar, simple y permite persistencia fluida entre recargas.
4. **Precisión Numérica en Base de Datos:**
   * Los importes de ventas, precios de coste y totales deben ser de tipo `DECIMAL` en la base de datos (PostgreSQL/MySQL) y viajar por la API estrictamente como `string` decimal (`"1250.50"`), evitando el uso de tipos float o double.
5. **Catálogo de Monedas y Tasas de Cambio:**
   * El sistema contempla cuatro monedas operativas: `USD` (moneda base de referencia), `CUP` (efectivo cubano), `CUP_TRANSFER` (transferencia electrónica EnZona / Transfermóvil) y `MLC` (tarjeta magnética).
   * Los endpoints para registrar y consultar la tasa de cambio diaria de caja (`GET /api/exchange-rates/today`, `POST /api/exchange-rates`) se detallarán en la especificación del módulo de Ventas y Caja (POS).
