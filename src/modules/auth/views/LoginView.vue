<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-qvaflow-navy-dark via-qvaflow-navy to-slate-900">
    <!-- Contenedor de Tarjeta Central -->
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <!-- Encabezado con Identidad Visual de QvaFlow -->
      <div class="pt-8 pb-6 px-8 text-center bg-slate-50 border-b border-slate-100">
        <img
          src="/logo.png"
          alt="QvaFlow"
          class="h-24 mx-auto object-contain mb-2 drop-shadow-xs"
        />
        <p class="text-xs text-slate-500 mt-1 mb-0 font-medium">
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
                <UserOutlined class="text-slate-400 mr-1" />
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
                <LockOutlined class="text-slate-400 mr-1" />
              </template>
            </a-input-password>
          </a-form-item>

          <!-- Botón de Entrada -->
          <a-form-item class="mt-6 mb-2">
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              block
              :loading="authStore.loading"
              class="h-12 bg-qvaflow-navy hover:bg-qvaflow-navy-dark border-none font-bold text-base shadow-md shadow-qvaflow-navy/30 cursor-pointer"
            >
              Iniciar Sesión
            </a-button>
          </a-form-item>
        </a-form>

        <!-- Selector de Roles de Prueba (Demo RBAC) -->
        <div class="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <div class="flex items-center justify-between mb-2">
            <span class="font-bold text-slate-700 flex items-center gap-1">
              🔑 Probar Roles RBAC:
            </span>
          </div>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              class="px-2 py-1.5 bg-white hover:bg-blue-50 hover:text-qvaflow-navy border border-slate-200 rounded text-center transition-colors font-medium text-[11px] cursor-pointer"
              @click="setRoleDemo('admin', '123456')"
            >
              Admin (Costos)
            </button>
            <button
              type="button"
              class="px-2 py-1.5 bg-white hover:bg-amber-50 hover:text-amber-700 border border-slate-200 rounded text-center transition-colors font-medium text-[11px] cursor-pointer"
              @click="setRoleDemo('cajero', '123456')"
            >
              Cajero (Sin Costos)
            </button>
            <button
              type="button"
              class="px-2 py-1.5 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded text-center transition-colors font-medium text-[11px] cursor-pointer"
              @click="setRoleDemo('superadmin', 'admin123')"
            >
              Superadmin
            </button>
          </div>
        </div>
      </div>

      <!-- Pie de página informativo -->
      <div class="py-3 px-8 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
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
  username: [{ required: true, message: 'Por favor, ingrese su nombre de usuario', trigger: 'blur' }],
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
