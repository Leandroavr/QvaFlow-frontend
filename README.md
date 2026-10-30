# QvaFlow Frontend - SPA Offline-First para MIPYMES

Sistema web de Punto de Venta (POS) y Gestión Integral diseñado para funcionar **100% en Red de Área Local (LAN), sin conexión a Internet**.
La SPA es servida por un servidor local (Symfony/PHP montado en Docker, XAMPP o Apache) y se comunica mediante una API REST protegida por JWT y un sistema de control de acceso basado en permisos dinámicos (RBAC).

---

## 🛠️ Stack Tecnológico

* **Framework:** Vue 3 (Composition API con sintaxis `<script setup>`)
* **Tipado:** TypeScript en modo estricto
* **Empaquetador y Servidor Dev:** Vite
* **Gestión de Estado:** Pinia
* **Enrutamiento:** Vue Router 4 (soporte configurable de modo `hash` y `history`)
* **Diseño y Estilos:** Tailwind CSS con tokens mediante variables CSS (`:root` y `.dark`)
* **Iconografía:** `lucide-vue-next` (paquete local, cero peticiones a CDNs externos)
* **Tipografía:** Inter autoalojada mediante `@fontsource/inter` (100% offline)
* **Pruebas Unitarias:** Vitest con `@vue/test-utils` y `happy-dom`
* **Formateo y Calidad:** Prettier con `prettier-plugin-tailwindcss`

---

## 📁 Arquitectura del Proyecto

El código está estructurado en capas desacopladas para que la integración con Symfony consista únicamente en conectar los servicios, sin alterar componentes ni vistas:

```
qvaflow-frontend/
├── docs/
│   └── API_CONTRACT.md              # Contrato exhaustivo de endpoints, DTOs y errores
├── public/
│   ├── .htaccess                    # Reglas de reescritura para Apache/XAMPP en modo history
│   └── logo.png                     # Identidad gráfica QvaFlow
├── src/
│   ├── app/                         # Núcleo de la aplicación
│   │   ├── router/                  # Configuración de Vue Router y navigation guards
│   │   ├── directives/              # Directiva v-can para RBAC visual
│   │   └── views/                   # Vistas base (AppHomeView placeholder, ForbiddenView 403)
│   ├── features/                    # Módulos de funcionalidad de negocio
│   │   └── auth/                    # Autenticación y sesión
│   │       ├── views/LoginView.vue  # Pantalla de login rediseñada (WCAG AA, dark mode)
│   │       ├── components/          # MockQuickAccess (bloque colapsable solo para pruebas)
│   │       └── stores/authStore.ts  # Store Pinia de sesión y permisos
│   ├── services/                    # Capa de datos y comunicación (DESACOPLADA)
│   │   ├── api/httpClient.ts        # Cliente Axios con interceptor Bearer y control offline
│   │   ├── interfaces/              # Contratos TypeScript (AuthService, BaseCrudService)
│   │   ├── mock/mockAuthService.ts  # Implementación mock con datos de prueba en memoria
│   │   ├── http/httpAuthService.ts  # Implementación HTTP real para conectar con Symfony
│   │   └── index.ts                 # Factoría que conmuta según VITE_USE_MOCKS
│   ├── mocks/                       # Datos descriptivos mock
│   │   └── users.ts                 # Usuarios de prueba: superadmin, vendedor, almacenero
│   ├── shared/                      # Recursos compartidos y reutilizables
│   │   ├── composables/             # usePermissions, useTheme, useServerStatus
│   │   ├── stores/uiStore.ts        # Estado del servidor local y preferencias de UI
│   │   ├── styles/tokens.css        # Tokens de diseño CSS (colores, espaciado, radios)
│   │   ├── types/                   # auth.ts, permissions.ts, currency.ts, api.ts
│   │   ├── ui/                      # Mini-librería: BaseButton, BaseInput, BaseAlert, BaseSpinner, StatusDot, ThemeToggle, Can
│   │   └── utils/                   # formatMoney, formatDate (manejo seguro de moneda como string)
│   ├── App.vue                      # Componente raíz con inicializador de tema sin FOUC
│   ├── main.ts                      # Montaje de la aplicación
│   └── style.css                    # Directivas Tailwind y reglas globales
├── .env.example                     # Plantilla de variables de entorno
└── vite.config.ts                   # Proxy de desarrollo y configuración de Vitest
```

---

## ⚙️ Variables de Entorno

Copie el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

| Variable | Valores posibles | Por defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `VITE_USE_MOCKS` | `true` \| `false` | `true` | Alterna entre datos locales simulados (`MockAuthService`) y llamadas reales a Symfony (`HttpAuthService`). |
| `VITE_API_BASE_URL` | String de ruta | `/api` | Prefijo de ruta base para la API REST del backend. |
| `VITE_ROUTER_MODE` | `hash` \| `history` | `hash` | En modo `hash` (`#/login`) funciona en cualquier servidor Apache sin configuración de reescritura. |
| `VITE_BACKEND_PROXY_URL` | URL HTTP | `http://127.0.0.1:8000` | URL del servidor Symfony local para el proxy de Vite en desarrollo (evita CORS). |

---

## 🚀 Puesta en Marcha (Desarrollo y Pruebas)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 3. Ejecutar pruebas unitarias
```bash
npm run test
```
Ejecuta la suite de Vitest validando el store de autenticación, el composable de permisos RBAC y el guard de navegación.

### 4. Compilar para producción
```bash
npm run build
```
Genera la carpeta optimizada `dist/` con la SPA lista para ser servida por Apache, Nginx o Symfony.

---

## 🌐 Despliegue en Servidores Locales (Apache / XAMPP / Nginx)

### A. Modo Hash (`VITE_ROUTER_MODE=hash`, Recomendado)
* **Ventaja:** Cero configuración. Funciona de inmediato en cualquier carpeta o subdirectorio de XAMPP (`htdocs/qvaflow`), WampServer o IIS sin módulos adicionales.
* Las URLs se forman como: `http://servidor-local/qvaflow/#/login`.

### B. Modo History (`VITE_ROUTER_MODE=history`)
Si desea URLs limpias (ej: `http://servidor-local/login`), requiere configurar reescritura para redirigir todas las peticiones a `index.html`:

#### En Apache / XAMPP (`.htaccess` incluido en `public/`):
Asegúrese de tener habilitado `mod_rewrite`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### En Nginx:
```nginx
server {
    listen 80;
    server_name qvaflow.local;
    root /var/www/qvaflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔌 Guía de Integración para el Desarrollador del Backend (Symfony)

La integración entre este frontend y su backend Symfony es **100% transparente**:

1. **Active la API Real:**
   En el archivo `.env` del frontend, cambie:
   ```env
   VITE_USE_MOCKS=false
   VITE_API_BASE_URL=/api
   ```
2. **Implemente los endpoints en Symfony:**
   Consulte la especificación completa en [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md).
   * `POST /api/auth/login`: Recibe `{ username, password }`. Retorna `{ accessToken, user }`.
   * `GET /api/auth/me`: Con cabecera `Authorization: Bearer <token>`, valida la sesión y devuelve los datos del usuario.
   * `POST /api/auth/logout`: Invalida el token si aplica.
   * `GET /api/health`: Retorna `{ status: "ok", version: "1.0.0" }` para el ping de estado de conexión.
3. **Control de Permisos RBAC Dinámico:**
   * El frontend **no valida nombres de rol** (`Admin`, `Cajero`).
   * El backend debe enviar la lista de permisos en el formato `"modulo.accion"` en el array `user.permissions` (ej: `["sales.create", "inventory.view", "products.view_cost"]`).
   * La interfaz automáticamente mostrará u ocultará secciones y botones según los permisos recibidos.
4. **Manejo de Errores:**
   En caso de error (401, 403, 422, etc.), Symfony debe responder con el formato estándar:
   ```json
   {
     "code": "AUTH_INVALID_CREDENTIALS",
     "message": "Usuario o contraseña incorrectos."
   }
   ```
   El cliente HTTP del frontend captura este formato y lo presenta de forma accesible al usuario en la tarjeta de login.

---

## 🎨 Tokens de Diseño y Accesibilidad

* **Modo Oscuro:** Activado mediante la clase `.dark` en `<html>`. Soporta selección manual (Claro / Oscuro) o automático según la preferencia del sistema operativo. La preferencia se persiste en `localStorage` y se sincroniza antes del montaje para prevenir FOUC.
* **Contraste WCAG AA:** Todos los pares de colores de texto y fondo cumplen con una relación de contraste mínima de 4.5:1.
* **Touch Targets:** Todos los botones y campos de entrada principales tienen una altura mínima de 48px (`h-12`), ideales para pantallas táctiles y teclado/ratón.
* **Accesibilidad de Movimiento:** La animación de sacudida (shake) de la tarjeta respeta la directiva del usuario `@media (prefers-reduced-motion: reduce)`.
