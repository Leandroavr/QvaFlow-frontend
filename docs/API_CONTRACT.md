# Contrato de API REST - QvaFlow (Symfony Backend <-> Frontend SPA)

Este documento define el contrato de comunicación formal entre el frontend (SPA Vue 3) y el backend (Symfony / PHP). Ha sido diseñado para permitir una integración desacoplada y directa mediante reemplazo de la capa de servicios sin modificar la interfaz de usuario.

---

## 1. Convenciones Globales y Arquitectura

* **Protocolo y Formato:** REST sobre HTTP/1.1 o HTTP/2, con intercambio de datos estrictamente en formato `application/json; charset=UTF-8`.
* **Entorno de Red:** Red de Área Local (LAN) sin conexión a Internet pública. La SPA se sirve desde el mismo host local (Apache/XAMPP o Docker) bajo la ruta base de API configurada en `/api`.
* **Manejo de Fechas:** Fechas y horas en formato **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ssZ`). Ej: `2026-10-30T14:30:00Z`.
* **Precisión Monetaria y Decimales:** Todos los valores de moneda e importes se transmiten como **string decimal** (ej: `"1250.50"`), **NUNCA** como float de punto flotante para prevenir imprecisiones de redondeo en JavaScript.
* **Autenticación:** Cabecera estándar HTTP `Authorization: Bearer <accessToken>`.
* **Identificadores:** UUID v4 o cadenas alfanuméricas con prefijo de entidad (ej: `"usr_01HGB..."`).

---

## 2. Formato Estándar de Errores

Toda respuesta con código de estado HTTP 4xx o 5xx debe retornar un objeto JSON con la siguiente estructura uniforme:

```json
{
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Usuario o contraseña incorrectos.",
  "details": {
    "username": ["El campo es obligatorio."],
    "password": ["Debe tener al menos 6 caracteres."]
  }
}
```

* `code` *(string)*: Código de error legible por máquina en SNAKE_CASE para condicionales del frontend.
* `message` *(string)*: Mensaje descriptivo y amigable en español apto para mostrar al usuario.
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
  "sub": "usr_01HGB845XY...",
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
    "id": "usr_superadmin_01",
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
  "id": "usr_superadmin_01",
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
* `401 Unauthorized`: Token ausente, inválido o expirado (`code: "AUTH_EXPIRED_TOKEN"`). La SPA automáticamente cerrará la sesión y redirigirá a `/login`.

---

### 5.3 Cerrar Sesión (Logout)
* **Método:** `POST`
* **Ruta:** `/api/auth/logout`
* **Autenticación requerida:** Sí (`Authorization: Bearer <token>`).
* **Propósito:** Revocar el token o sesión activa en Symfony.

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

## 6. Pendiente por Definir con el Backend

1. **Estrategia de Refresh Token:**
   * ¿El backend expondrá `POST /api/auth/refresh` con rotación de tokens o el `accessToken` tendrá una expiración prolongada (ej: 12-24h) acorde al entorno de red local y jornada laboral?
   * *Recomendación Frontend:* En redes locales aisladas de MIPYMES, tokens de 12 horas o `POST /api/auth/refresh` con `refreshToken` recibido en cookie HttpOnly o cuerpo JSON.
2. **Cierre de Caja por Turno vs Logout:**
   * Al cerrar sesión, ¿se debe advertir si el cajero tiene un turno de caja abierto sin cuadre previo? (La interfaz ya cuenta con la verificación, se coordinará con el endpoint de cuadre).
3. **Manejo de CORS en Desarrollo:**
   * Durante desarrollo con Vite (`localhost:5173`) y Symfony (`localhost:8000`), el proxy reverso ya está configurado en `vite.config.ts`. En producción, al servirse desde el mismo Apache/Nginx, el origen es idéntico y no requiere cabeceras CORS.
