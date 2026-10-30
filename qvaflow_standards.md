QvaFlow Frontend - Estándares de Desarrollo y Arquitectura

1. Contexto del Proyecto

Nombre: QvaFlow

Descripción: Sistema POS (Punto de Venta) y gestión de inventario offline-first para MIPYMES en Cuba.

Arquitectura: Single Page Application (SPA) servida en una red local.

Backend: PHP (Symfony) proporcionando una API REST. Base de datos PostgreSQL.

2. Stack Tecnológico Principal

Framework: Vue 3

Estilo de Código: Composition API EXCLUSIVAMENTE (uso obligatorio de <script setup>). Queda estrictamente prohibido el uso de Options API.

UI Library: Ant Design Vue (ant-design-vue).

Enrutamiento: Vue Router 4.

Gestor de Estado: Pinia.

Peticiones HTTP: Axios.

Empaquetador: Vite.

3. Estructura de Carpetas (Feature-Based)

El código debe organizarse de forma modular. Nunca agrupar por tipo de archivo globalmente, sino por dominio funcional.

src/core/: Configuraciones globales (Router, Axios interceptors, inicialización de Pinia).

src/shared/: Componentes UI reutilizables genéricos, composables globales (useFormatoMoneda), y utilidades.

src/modules/: Contiene los módulos funcionales del negocio (auth, pos, inventory, purchases, catalog).

Cada módulo debe contener sus propias subcarpetas: components/, views/, services/, y store/ (si requiere estado global específico).

4. Convenciones de Vue 3 y Código

Nomenclatura de Componentes: PascalCase (ej. PosTerminal.vue, ProductModal.vue).

Nomenclatura de Vistas: Debe terminar en "View" (ej. PosTerminalView.vue, LoginView.vue).

Estado Local: Usar ref() para primitivos y reactive() para objetos complejos.

Eventos y Props: Definir explícitamente usando defineProps() y defineEmits().

Lógica Compleja: Extraer la lógica compleja de los componentes hacia Composables (archivos que empiezan con use..., ej. useCart.js).

5. Uso de Ant Design Vue (UI/UX)

Preferencia de Componentes: SIEMPRE priorizar el uso de componentes nativos de ant-design-vue (Tables, Forms, Modals, Buttons, Typography) antes de crear HTML/CSS personalizado.

Estilos: Evitar CSS global. Usar estilos scoped en los componentes (<style scoped>) solo cuando sea estrictamente necesario modificar el diseño de Ant Design.

Responsive: Aunque es para escritorio/red local, mantener un diseño fluido usando el sistema de Grid de Ant Design (<a-row>, <a-col>).

6. Consumo de API y Servicios (Axios)

Servicios Modulares: Las llamadas a la API NUNCA deben hacerse directamente dentro del componente Vue.

Capa de Servicios: Cada módulo debe tener un archivo [nombre]Service.js (ej. src/modules/pos/services/posService.js).

Interceptors: Centralizar el manejo de errores (ej. tokens expirados, errores 500 del servidor local) en src/core/axios.js.

Try/Catch: Toda petición asíncrona debe estar envuelta en un bloque try/catch y proveer feedback visual al usuario usando message o notification de Ant Design en caso de error.

7. Gestión del Estado (Pinia)

Usar Pinia para estado global compartido (ej. Sesión del usuario actual, configuración de la tasa de cambio activa, carrito de compras del POS).

Los stores deben escribirse usando la sintaxis de Setup (funciones) en lugar de objetos, para mantener la consistencia con los componentes de Vue.

8. Directiva General de Calidad para el Asistente IA

Genera código limpio, escalable, modular y robusto. Si hay varias formas de resolver un problema, prioriza la mantenibilidad y la legibilidad. Documenta con comentarios las funciones complejas o la lógica de negocio específica (como cálculos de divisas).
