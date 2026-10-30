import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'

import App from './App.vue'
import { router } from './app/router'
import { vCan } from './app/directives/vCan'
import { initThemeBeforeMount } from './shared/composables/useTheme'

// Inicializar el tema antes de renderizar para prevenir FOUC
initThemeBeforeMount()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Registro de directiva global de seguridad visual RBAC
app.directive('can', vCan)

app.mount('#app')
