<template>
  <main
    class="min-h-screen w-full flex flex-col justify-between items-center p-4 relative overflow-hidden select-none"
    :class="[
      'bg-gradient-to-br from-[#0F2347] via-[#162E56] to-[#1E3A6B]',
      'dark:from-[#070D1E] dark:via-[#0B1530] dark:to-[#111E44]',
    ]"
  >
    <!-- Fondo con formas geométricas sutiles de baja opacidad (SVG vectorial, 0 KB de imágenes externas) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg
        class="absolute -top-32 -left-32 w-96 h-96 opacity-10 text-white"
        fill="currentColor"
        viewBox="0 0 200 200"
      >
        <polygon points="100,10 40,190 190,75 10,75 160,190" />
      </svg>
      <svg
        class="absolute -bottom-36 -right-36 w-[32rem] h-[32rem] opacity-5 text-white"
        fill="currentColor"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="80" />
      </svg>
      <!-- Cuadrícula sutil de fondo -->
      <div
        class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-40"
      />
    </div>

    <!-- Barra superior con selector de tema -->
    <header class="w-full max-w-5xl flex justify-end items-center z-10 pt-2 pb-4">
      <ThemeToggle />
    </header>

    <!-- Contenedor Central: Tarjeta de Acceso -->
    <div
      ref="cardRef"
      :class="[
        'w-full max-w-md bg-surface-card rounded-2xl shadow-card border border-border-default/60 overflow-hidden z-10 transition-transform duration-200',
        hasShakeError ? 'animate-card-shake' : '',
      ]"
    >
      <!-- Encabezado con Identidad Visual QvaFlow -->
      <div class="pt-8 pb-6 px-8 text-center bg-surface-subtle border-b border-border-subtle">
        <div class="flex items-center justify-center mb-3">
          <!-- Logo de QvaFlow con respaldo para alto contraste -->
          <img
            src="/logo.png"
            alt="QvaFlow"
            class="h-20 w-auto object-contain drop-shadow-xs"
            onerror="this.src='/logo-horizontal-white.png'"
          />
        </div>
        <h1 class="text-base font-bold text-content-primary tracking-tight mb-1">
          QvaFlow
        </h1>
        <p class="text-xs text-content-muted font-medium mb-0 leading-normal">
          Sistema de gestión y punto de venta para MIPYMES
        </p>
      </div>

      <!-- Formulario de Acceso -->
      <div class="p-6 sm:p-8">
        <form @submit.prevent="handleSubmit" novalidate class="space-y-4">
          <!-- Alerta de Error General Inline con aria-live -->
          <BaseAlert
            v-if="errorMessage"
            variant="error"
            :message="errorMessage"
            class="mb-2"
          />

          <!-- Campo Usuario -->
          <BaseInput
            id="login-username"
            name="username"
            label="Usuario"
            placeholder="Ingrese su nombre de usuario"
            autocomplete="username"
            :autofocus="true"
            :model-value="username"
            :error="usernameError"
            :disabled="authStore.isLoading"
            @update:model-value="onUsernameInput"
          >
            <template #prefix>
              <User class="w-5 h-5 text-content-muted" aria-hidden="true" />
            </template>
          </BaseInput>

          <!-- Campo Contraseña -->
          <BaseInput
            id="login-password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="Ingrese su contraseña"
            autocomplete="current-password"
            :model-value="password"
            :error="passwordError"
            :disabled="authStore.isLoading"
            @update:model-value="onPasswordInput"
          >
            <template #prefix>
              <Lock class="w-5 h-5 text-content-muted" aria-hidden="true" />
            </template>
          </BaseInput>

          <!-- Botón de Entrada (48px alto) -->
          <div class="pt-2">
            <BaseButton
              type="submit"
              variant="primary"
              size="md"
              block
              :loading="authStore.isLoading"
              loading-text="Ingresando..."
              class="shadow-md shadow-primary/30"
            >
              Iniciar sesión
            </BaseButton>
          </div>

          <!-- Mensaje discreto de ayuda para el usuario -->
          <div class="text-center pt-2">
            <span class="text-xs text-content-muted leading-relaxed">
              ¿Problemas para ingresar? Contacte al administrador.
            </span>
          </div>
        </form>
      </div>

      <!-- Pie de la Tarjeta: Versión y Estado del Servidor Local -->
      <footer class="py-3 px-6 bg-surface-subtle border-t border-border-subtle flex items-center justify-between text-xs text-content-muted">
        <span>Versión {{ appVersion }}</span>
        <StatusDot :status="uiStore.serverStatus" />
      </footer>
    </div>

    <!-- Bloque Condicional "Probar Roles" (Solo si VITE_USE_MOCKS=true) -->
    <!-- Tree-shaking: Cargado dinámicamente para ser excluido del bundle si los mocks están apagados -->
    <component
      :is="MockQuickAccessComponent"
      v-if="isMockEnabled && MockQuickAccessComponent"
      @select="handleMockSelect"
    />

    <!-- Espacio inferior responsivo -->
    <div class="h-6 w-full" aria-hidden="true" />
  </main>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../../../shared/stores/uiStore'
import { useServerStatus } from '../../../shared/composables/useServerStatus'
import BaseInput from '../../../shared/ui/BaseInput.vue'
import BaseButton from '../../../shared/ui/BaseButton.vue'
import BaseAlert from '../../../shared/ui/BaseAlert.vue'
import StatusDot from '../../../shared/ui/StatusDot.vue'
import ThemeToggle from '../../../shared/ui/ThemeToggle.vue'
import { ApiError } from '../../../shared/types/api'

// Monitorización de conexión con servidor local (ping cada 15s)
useServerStatus(15000)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()

const appVersion = '0.1.0'
const isMockEnabled = import.meta.env.VITE_USE_MOCKS !== 'false'

// Componente de prueba cargado mediante async component para optimizar tree-shaking
const MockQuickAccessComponent = isMockEnabled
  ? defineAsyncComponent(() => import('../components/MockQuickAccess.vue'))
  : null

// Estado del formulario
const username = ref('')
const password = ref('')
const usernameError = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Animación de shake en la tarjeta
const cardRef = ref<HTMLElement | null>(null)
const hasShakeError = ref(false)

const triggerShake = () => {
  hasShakeError.value = false
  // Forzar reflow para reiniciar la animación CSS
  void cardRef.value?.offsetWidth
  hasShakeError.value = true
  setTimeout(() => {
    hasShakeError.value = false
  }, 450)
}

const onUsernameInput = (val: string) => {
  username.value = val
  if (usernameError.value) usernameError.value = null
  if (errorMessage.value) errorMessage.value = null
}

const onPasswordInput = (val: string) => {
  password.value = val
  if (passwordError.value) passwordError.value = null
  if (errorMessage.value) errorMessage.value = null
}

const validateForm = (): boolean => {
  let isValid = true
  usernameError.value = null
  passwordError.value = null
  errorMessage.value = null

  if (!username.value.trim()) {
    usernameError.value = 'El nombre de usuario es obligatorio.'
    isValid = false
  }

  if (!password.value) {
    passwordError.value = 'La contraseña es obligatoria.'
    isValid = false
  }

  if (!isValid) {
    errorMessage.value = 'Por favor, complete todos los campos requeridos.'
    triggerShake()
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    await authStore.login({
      username: username.value.trim(),
      password: password.value,
    })

    // Redirección a la ruta previa o a la raíz /
    const redirectPath = (route.query.redirect as string) || '/'
    router.replace(redirectPath)
  } catch (err: unknown) {
    triggerShake()

    if (err instanceof ApiError) {
      if (err.code === 'SERVER_UNAVAILABLE') {
        errorMessage.value = 'No se puede conectar con el servidor local Symfony. Verifique la conexión.'
      } else if (err.code === 'AUTH_INVALID_CREDENTIALS' || err.statusCode === 401) {
        errorMessage.value = 'Usuario o contraseña incorrectos. Verifique sus credenciales.'
      } else {
        errorMessage.value = err.message || 'Error en la autenticación.'
      }
    } else {
      errorMessage.value = 'Error al conectar con el servidor local. Intente nuevamente.'
    }
  }
}

const handleMockSelect = async ({
  username: mockUser,
  password: mockPass,
  autoSubmit,
}: {
  username: string
  password: string
  autoSubmit: boolean
}) => {
  username.value = mockUser
  password.value = mockPass
  usernameError.value = null
  passwordError.value = null
  errorMessage.value = null

  if (autoSubmit) {
    await handleSubmit()
  }
}

onMounted(() => {
  authStore.clearError()
})
</script>
