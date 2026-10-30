import { computed } from 'vue'
import { useAuthStore } from '../../features/auth/stores/authStore'
import type { AppPermission } from '../types/permissions'

/**
 * Composable para verificación reactiva de permisos RBAC en componentes y vistas.
 * 
 * ============================================================================
 * NOTA DE SEGURIDAD ARQUITECTURAL (IMPORTANTE):
 * Las funciones `can` y `canAny` son EXCLUSIVAMENTE para control visual de UI/UX
 * (mostrar u ocultar botones, pestañas o enlaces según las capacidades del usuario).
 * 
 * La seguridad, autorización y validación real de negocio la realiza el backend
 * Symfony en cada petición mediante JWT y voters de Symfony. El frontend NUNCA debe
 * asumir que una acción no visible es inaccesible a nivel de API.
 * ============================================================================
 */
export function usePermissions() {
  const authStore = useAuthStore()

  /**
   * Comprueba si el usuario autenticado posee un permiso específico (ej: 'sales.create').
   */
  const can = (permission: AppPermission | string): boolean => {
    return authStore.hasPermission(permission)
  }

  /**
   * Comprueba si el usuario autenticado posee al menos uno de los permisos provistos.
   */
  const canAny = (permissionList: (AppPermission | string)[]): boolean => {
    return authStore.hasAnyPermission(permissionList)
  }

  /**
   * Comprueba si el usuario autenticado posee todos los permisos provistos.
   */
  const canAll = (permissionList: (AppPermission | string)[]): boolean => {
    return authStore.hasAllPermissions(permissionList)
  }

  /**
   * Lista reactiva de todos los permisos asignados al usuario en su sesión actual.
   */
  const userPermissions = computed(() => authStore.permissions)

  return {
    can,
    canAny,
    canAll,
    userPermissions,
  }
}
