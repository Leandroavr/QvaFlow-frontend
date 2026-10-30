<template>
  <div
    class="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-qvaflow-navy-dark via-qvaflow-navy to-slate-900 p-4"
  >
    <!-- Contenedor de Tarjeta Central -->
    <div
      class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
    >
      <!-- Encabezado con Identidad Visual de QvaFlow -->
      <div class="border-b border-slate-100 bg-slate-50 px-8 pb-6 pt-8 text-center">
        <img
          src="/logo.png"
          alt="QvaFlow"
          class="drop-shadow-xs mx-auto mb-2 h-24 object-contain"
        />
        <p class="mb-0 mt-1 text-xs font-medium text-slate-500">
          Sistema POS & Gestión Offline-first para MIPYMES
        </p>
      </div>

      <!-- Formulario de Acceso -->
      <div class="p-8">
        <a-form
          ref="formRef"
          :model="credentials"
          :rules="rules"
          layout="vertical"
          @finish="handleLogin"
        >
          <!-- Usuario -->
          <a-form-item label="Usuario" name="username">
            <a-input
              v-model:value="credentials.username"
              size="large"
              placeholder="Ingrese su usuario"
              allow-clear
            >
              <template #prefix>
                <UserOutlined class="mr-1 text-slate-400" />
              </template>
            </a-input>
          </a-form-item>

          <!-- Contraseña -->
          <a-form-item label="Contraseña" name="password">
            <a-input-password
              v-model:value="credentials.password"
              size="large"
              placeholder="Ingrese su contraseña"
            >
              <template #prefix>
                <LockOutlined class="mr-1 text-slate-400" />
              </template>
            </a-input-password>
          </a-form-item>

          <!-- Botón de Entrada -->
          <a-form-item class="mb-2 mt-6">
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              block
              :loading="authStore.loading"
              class="h-12 cursor-pointer border-none bg-qvaflow-navy text-base font-bold shadow-md shadow-qvaflow-navy/30 hover:bg-qvaflow-navy-dark"
            >
              Iniciar Sesión
            </a-button>
          </a-form-item>
        </a-form>

        <!-- Selector de Roles de Prueba (Demo RBAC) -->
        <div
          class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="flex items-center gap-1 font-bold text-slate-700">
              🔑 Probar Roles RBAC:
            </span>
          </div>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              class="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] font-medium transition-colors hover:bg-blue-50 hover:text-qvaflow-navy"
              @click="setRoleDemo('admin', '123456')"
            >
              Admin (Costos)
            </button>
            <button
              type="button"
              class="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] font-medium transition-colors hover:bg-amber-50 hover:text-amber-700"
              @click="setRoleDemo('cajero', '123456')"
            >
              Cajero (Sin Costos)
            </button>
            <button
              type="button"
              class="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1.5 text-center text-[11px] font-medium transition-colors hover:bg-purple-50 hover:text-purple-700"
              @click="setRoleDemo('superadmin', 'admin123')"
            >
              Superadmin
            </button>
          </div>
        </div>
      </div>

      <!-- Pie de página informativo -->
      <div
        class="border-t border-slate-100 bg-slate-50 px-8 py-3 text-center text-[11px] text-slate-400"
      >
        Servidor Local Symfony • Autenticación JWT con Refresh Token y RBAC
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import useAuthStore from '../store/authStore'
import type { LoginCredentials } from '../types/auth'

const authStore = useAuthStore()
const formRef = ref<FormInstance>()

// Formulario reactivo
const credentials = reactive<LoginCredentials>({
  username: '',
  password: '',
})

// Reglas de validación estricta
const rules: Record<string, Rule[]> = {
  username: [
    { required: true, message: 'Por favor, ingrese su nombre de usuario', trigger: 'blur' },
  ],
  password: [{ required: true, message: 'Por favor, ingrese su contraseña', trigger: 'blur' }],
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
    await authStore.login(credentials)
  } catch {
    // Validación de campos incompleta
  }
}

const setRoleDemo = (user: string, pass: string) => {
  credentials.username = user
  credentials.password = pass
}
</script>
