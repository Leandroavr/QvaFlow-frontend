import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import authService from '../services/authService'
import type { User, LoginCredentials, Permission, UpdateUserRoleDto } from '../types/auth'

/**
 * Store Pinia para Autenticación, Tokens JWT, Refresh Tokens y RBAC (Sintaxis Setup).
 */
export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const initialAccessToken =
    localStorage.getItem('qvaflow_access_token') || localStorage.getItem('qvaflow_token')
  const initialRefreshToken = localStorage.getItem('qvaflow_refresh_token')

  let initialUser: User | null = null
  try {
    const rawUser = localStorage.getItem('qvaflow_user')
    if (rawUser) {
      initialUser = JSON.parse(rawUser)
    }
  } catch {
    initialUser = null
  }

  // Estado Reactivo de Sesión
  const user = ref<User | null>(initialUser)
  const accessToken = ref<string | null>(initialAccessToken)
  const refreshToken = ref<string | null>(initialRefreshToken)
  const loading = ref<boolean>(false)

  // Estado Reactivo de Gestión de Personal / Roles
  const users = ref<User[]>([])
  const loadingUsers = ref<boolean>(false)

  // Getters Computados de Seguridad (RBAC)
  const isAuthenticated = computed(() => !!accessToken.value)
  const userName = computed(() => user.value?.name || 'Usuario')
  const userRole = computed(() => user.value?.role || 'CASHIER')
  const permissions = computed<Permission[]>(() => user.value?.permissions || [])

  // Banderas de Seguridad Requeridas
  const isSuperadmin = computed(() => user.value?.role === 'SUPERADMIN')

  const canViewCosts = computed(() => {
    if (isSuperadmin.value) return true
    return permissions.value.includes('VIEW_COSTS')
  })

  const canViewAllSales = computed(() => {
    if (isSuperadmin.value) return true
    return permissions.value.includes('VIEW_ALL_SALES')
  })

  const canManageUsers = computed(() => {
    if (isSuperadmin.value || user.value?.role === 'ADMIN') return true
    return permissions.value.includes('MANAGE_USERS')
  })

  // Permisos granulares de acceso por módulo (RBAC)
  const canAccessPos = computed(() => {
    if (isSuperadmin.value || userRole.value === 'ADMIN' || userRole.value === 'CASHIER') return true
    return permissions.value.includes('POS_ACCESS')
  })

  const canAccessSalesAndShifts = computed(() => {
    if (isSuperadmin.value || userRole.value === 'ADMIN') return true
    return permissions.value.includes('VIEW_ALL_SALES')
  })

  const canAccessCatalog = computed(() => {
    if (isSuperadmin.value || userRole.value === 'ADMIN' || userRole.value === 'WAREHOUSE') return true
    return permissions.value.includes('MANAGE_CATALOG')
  })

  const canAccessInventory = computed(() => {
    if (isSuperadmin.value || userRole.value === 'ADMIN' || userRole.value === 'WAREHOUSE') return true
    return permissions.value.includes('MANAGE_INVENTORY')
  })

  const canAccessPurchases = computed(() => {
    if (isSuperadmin.value || userRole.value === 'ADMIN') return true
    return permissions.value.includes('MANAGE_PURCHASES')
  })

  const canAccessReports = computed(() => {
    if (isSuperadmin.value || userRole.value === 'ADMIN') return true
    return permissions.value.includes('VIEW_REPORTS')
  })

  const canAccessBackups = computed(() => {
    return isSuperadmin.value || userRole.value === 'ADMIN'
  })

  /**
   * Comprueba si el usuario actual posee uno o varios permisos.
   * @param required Permiso o array de permisos requeridos (al menos uno debe coincidir).
   */
  const hasPermission = (required: Permission | Permission[]): boolean => {
    if (isSuperadmin.value) return true
    const reqList = Array.isArray(required) ? required : [required]
    return reqList.some((perm) => permissions.value.includes(perm))
  }

  // Acciones de Sesión

  /**
   * Inicia sesión, almacena el par de tokens y redirige al POS.
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    loading.value = true
    try {
      const response = await authService.login(credentials)

      accessToken.value = response.tokens.accessToken
      refreshToken.value = response.tokens.refreshToken
      user.value = response.user

      // Persistencia segura en almacenamiento local
      localStorage.setItem('qvaflow_access_token', response.tokens.accessToken)
      localStorage.setItem('qvaflow_token', response.tokens.accessToken) // Retrocompatibilidad
      localStorage.setItem('qvaflow_refresh_token', response.tokens.refreshToken)
      localStorage.setItem('qvaflow_user', JSON.stringify(response.user))

      message.success(`¡Bienvenido a QvaFlow, ${response.user.name}!`)
      await router.push('/ventas')
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al autenticar usuario'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Ejecuta el refresco del JWT usando el Refresh Token vigente.
   */
  const refreshTokens = async (): Promise<string> => {
    if (!refreshToken.value) {
      throw new Error('No existe Refresh Token para renovar la sesión.')
    }

    const response = await authService.refreshToken(refreshToken.value)

    accessToken.value = response.accessToken
    refreshToken.value = response.refreshToken

    localStorage.setItem('qvaflow_access_token', response.accessToken)
    localStorage.setItem('qvaflow_token', response.accessToken)
    localStorage.setItem('qvaflow_refresh_token', response.refreshToken)

    return response.accessToken
  }

  /**
   * Cierra la sesión activa y purga credenciales locales.
   */
  const logout = async () => {
    loading.value = true
    try {
      await authService.logout()
    } finally {
      accessToken.value = null
      refreshToken.value = null
      user.value = null

      localStorage.removeItem('qvaflow_access_token')
      localStorage.removeItem('qvaflow_token')
      localStorage.removeItem('qvaflow_refresh_token')
      localStorage.removeItem('qvaflow_user')

      loading.value = false
      message.info('Sesión cerrada correctamente.')
      router.push('/login')
    }
  }

  // Acciones de Gestión de Personal / Roles (Superadmin)

  /**
   * Carga la lista de trabajadores y sus permisos.
   */
  const fetchUsers = async () => {
    loadingUsers.value = true
    try {
      users.value = await authService.getUsers()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar personal'
      message.error(errorMsg)
    } finally {
      loadingUsers.value = false
    }
  }

  /**
   * Actualiza el rol y la matriz de permisos de un trabajador.
   */
  const updateUserRoleAndPermissions = async (dto: UpdateUserRoleDto): Promise<boolean> => {
    loadingUsers.value = true
    try {
      const updated = await authService.updateUserRole(dto)
      const index = users.value.findIndex((u) => u.id === dto.userId)
      if (index !== -1) {
        users.value[index] = updated
      }

      // Si el usuario editado es el usuario actualmente en sesión, actualizar reactivamente
      if (user.value && user.value.id === dto.userId) {
        user.value.role = updated.role
        user.value.permissions = [...updated.permissions]
        localStorage.setItem('qvaflow_user', JSON.stringify(user.value))
      }

      message.success(`Permisos de "${updated.name}" actualizados con éxito.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar permisos'
      message.error(errorMsg)
      return false
    } finally {
      loadingUsers.value = false
    }
  }

  /**
   * Crea un nuevo trabajador en el sistema.
   */
  const createUser = async (newUser: Omit<User, 'id'>): Promise<boolean> => {
    loadingUsers.value = true
    try {
      const created = await authService.createUser(newUser)
      users.value.unshift(created)
      message.success(`Trabajador "${created.name}" registrado con éxito.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar trabajador'
      message.error(errorMsg)
      return false
    } finally {
      loadingUsers.value = false
    }
  }

  return {
    // Estado
    user,
    accessToken,
    refreshToken,
    loading,
    users,
    loadingUsers,
    // Getters
    isAuthenticated,
    userName,
    userRole,
    permissions,
    isSuperadmin,
    canViewCosts,
    canViewAllSales,
    canManageUsers,
    canAccessPos,
    canAccessSalesAndShifts,
    canAccessCatalog,
    canAccessInventory,
    canAccessPurchases,
    canAccessReports,
    canAccessBackups,
    hasPermission,
    // Acciones de Sesión
    login,
    refreshTokens,
    logout,
    // Acciones de Personal
    fetchUsers,
    updateUserRoleAndPermissions,
    createUser,
  }
})

export default useAuthStore
