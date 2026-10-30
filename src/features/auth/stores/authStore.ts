import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials } from '../../../shared/types/auth'
import type { AppPermission } from '../../../shared/types/permissions'
import { authService } from '../../../services'
import { ApiError } from '../../../shared/types/api'

const TOKEN_KEY = 'qvaflow_token'
const USER_KEY = 'qvaflow_user'

export const useAuthStore = defineStore('auth', () => {
  // Estado reactivo
  const user = ref<User | null>(getStoredUser())
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  const permissions = computed<string[]>(() => {
    return user.value?.permissions || []
  })

  // Funciones de verificación de permisos (RBAC)
  function hasPermission(permission: AppPermission | string): boolean {
    if (!user.value) return false
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(permList: (AppPermission | string)[]): boolean {
    if (!user.value) return false
    return permList.some((p) => permissions.value.includes(p))
  }

  function hasAllPermissions(permList: (AppPermission | string)[]): boolean {
    if (!user.value) return false
    return permList.every((p) => permissions.value.includes(p))
  }

  // Acciones
  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      token.value = response.accessToken
      user.value = response.user

      localStorage.setItem(TOKEN_KEY, response.accessToken)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    } catch (err) {
      if (err instanceof ApiError) {
        error.value = err.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Ocurrió un error inesperado al iniciar sesión.'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      await authService.logout()
    } catch {
      // Ignorar errores al desloguear
    } finally {
      token.value = null
      user.value = null
      error.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      isLoading.value = false
    }
  }

  async function checkAuth(): Promise<boolean> {
    if (!token.value) {
      isInitialized.value = true
      return false
    }

    try {
      const currentUser = await authService.getMe()
      user.value = currentUser
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      return true
    } catch {
      // Token inválido o expirado
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return false
    } finally {
      isInitialized.value = true
    }
  }

  function clearError() {
    error.value = null
  }

  function getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isInitialized,
    isAuthenticated,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    login,
    logout,
    checkAuth,
    clearError,
  }
})

export default useAuthStore
