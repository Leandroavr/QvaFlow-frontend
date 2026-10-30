<template>
  <main
    class="relative flex min-h-dvh w-full select-none flex-col items-center justify-between overflow-y-auto px-4 py-3 sm:overflow-hidden"
    :class="[
      'bg-gradient-to-br from-[#0F2347] via-[#162E56] to-[#1E3A6B]',
      'dark:from-[#070D1E] dark:via-[#0B1530] dark:to-[#111E44]',
    ]"
  >
    <!-- Fondo con formas geométricas sutiles de baja opacidad (sin formas recortadas incómodas, opacidad <= 6%) -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        class="absolute -left-16 -top-16 h-80 w-80 text-white opacity-[0.04]"
        fill="currentColor"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="90" />
      </svg>
      <svg
        class="absolute -bottom-20 -right-20 h-96 w-96 text-white opacity-[0.05]"
        fill="currentColor"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="90" />
      </svg>
      <!-- Patrón sutil de cuadrícula de puntos -->
      <div
        class="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] opacity-40 [background-size:24px_24px]"
      />
    </div>

    <!-- Barra superior con alternador de tema optimizado para fondo oscuro -->
    <header class="z-10 flex w-full max-w-5xl items-center justify-end pb-2 pt-1">
      <ThemeToggle on-dark />
    </header>

    <!-- Contenedor Central: Tarjeta de Acceso -->
    <div
      ref="cardRef"
      :class="[
        'border-border-default z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-surface-card shadow-card transition-transform duration-200',
        hasShakeError ? 'animate-card-shake' : '',
      ]"
    >
      <!-- Encabezado con Identidad Visual QvaFlow -->
      <div class="border-b border-border-subtle bg-surface-subtle px-6 pb-4 pt-5 text-center">
        <div class="mb-2 flex items-center justify-center">
          <!-- Logo de la marca con contraste adaptativo por tema -->
          <div class="inline-flex items-center justify-center">
            <!-- Modo claro: logo horizontal en color corporativo -->
            <img :src="logoLight" alt="QvaFlow" class="h-12 w-auto object-contain dark:hidden" />
            <!-- Modo oscuro: logo horizontal blanco, texto de alta legibilidad sin placa -->
            <img
              :src="logoDark"
              alt="QvaFlow"
              class="hidden h-12 w-auto object-contain dark:block"
            />
          </div>
        </div>
        <!-- Título accesible oculto visualmente para evitar duplicidad con el logo -->
        <h1 class="sr-only">QvaFlow</h1>
        <p class="mb-0 text-xs font-medium leading-normal text-content-muted">
          Sistema de gestión y punto de venta para MIPYMES
        </p>
      </div>

      <!-- Formulario de Acceso -->
      <div class="p-5 sm:p-6">
        <form @submit.prevent="handleSubmit" novalidate class="flex flex-col">
          <!-- Campo Usuario (Autofocus con ring visible y Autocomplete correcto) -->
          <BaseInput
            id="login-username"
            ref="usernameInputRef"
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
              <User class="h-5 w-5 text-content-muted" aria-hidden="true" />
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
            class="mt-3.5"
            @update:model-value="onPasswordInput"
          >
            <template #prefix>
              <Lock class="h-5 w-5 text-content-muted" aria-hidden="true" />
            </template>
          </BaseInput>

          <!-- Alerta de Error con expansión animada (grid 0fr -> 1fr) sin hueco reservado en reposo -->
          <div
            class="duration-250 grid transition-[grid-template-rows,margin] ease-out motion-reduce:transition-none"
            :class="errorMessage ? 'mt-3 grid-rows-[1fr]' : 'mt-0 grid-rows-[0fr]'"
            aria-live="assertive"
          >
            <div class="overflow-hidden">
              <BaseAlert
                v-if="errorMessage"
                variant="error"
                :message="errorMessage"
                class="w-full text-xs"
              />
            </div>
          </div>

          <!-- Botón de Entrada (48px alto) -->
          <div class="mt-4">
            <BaseButton
              type="submit"
              variant="primary"
              size="md"
              block
              :loading="authStore.isLoading"
              loading-text="Ingresando..."
              class="shadow-primary/30 shadow-md"
            >
              Iniciar sesión
            </BaseButton>
          </div>

          <!-- Mensaje discreto de ayuda para el usuario -->
          <div class="pt-3 text-center">
            <span class="text-xs leading-relaxed text-content-muted">
              ¿Problemas para ingresar? Contacte al administrador.
            </span>
          </div>
        </form>
      </div>

      <!-- Pie de la Tarjeta: Versión y Estado del Servidor Local -->
      <footer
        class="flex items-center justify-between border-t border-border-subtle bg-surface-subtle px-6 py-2.5 text-xs text-content-muted"
      >
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
    <div class="h-2 w-full" aria-hidden="true" />
  </main>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, onMounted, nextTick } from 'vue'
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
import logoLight from '@/assets/logo-horizontal.png'
import logoDark from '@/assets/logo-horizontal-white.png'

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

// Referencia al campo de usuario para enfoque inicial
const usernameInputRef = ref<{ focus: () => void } | null>(null)

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
        errorMessage.value =
          'No se puede conectar con el servidor local. Verifique que esté encendido.'
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
  nextTick(() => {
    usernameInputRef.value?.focus()
  })
})
</script>
