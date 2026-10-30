import { useAuthStore as useNewAuthStore } from '../../features/auth/stores/authStore'
import { computed } from 'vue'

/**
 * Adaptador temporal de autenticación para pantallas legadas.
 * Sincroniza la sesión del store nuevo (Pinia 'auth') hacia el formato
 * esperado por los componentes y servicios legados de src/modules/.
 */
export function syncLegacyAuthSession(): void {
  const newAuthStore = useNewAuthStore()
  const user = newAuthStore.user

  let legacyRole = 'CASHIER'
  let legacyPermissions: string[] = []

  if (user) {
    if (user.username === 'superadmin' || user.role === 'Superadministrador') {
      legacyRole = 'SUPERADMIN'
      legacyPermissions = [
        'VIEW_COSTS',
        'VIEW_ALL_SALES',
        'MANAGE_CATALOG',
        'MANAGE_INVENTORY',
        'MANAGE_PURCHASES',
        'MANAGE_USERS',
        'POS_ACCESS',
        'VIEW_REPORTS',
      ]
    } else if (user.username === 'almacenero' || user.role === 'Almacenero') {
      legacyRole = 'WAREHOUSE'
      legacyPermissions = ['MANAGE_INVENTORY', 'MANAGE_CATALOG', 'MANAGE_PURCHASES', 'VIEW_COSTS']
    } else {
      // Vendedor / Cajero
      legacyRole = 'CASHIER'
      legacyPermissions = ['POS_ACCESS', 'VIEW_ALL_SALES']
    }
  }

  // Sincronizar localStorage para cualquier módulo que lea de allí directamente
  const legacyUserPayload = {
    id: 1,
    username: user?.username || 'admin',
    name: user?.fullName || 'Usuario',
    role: legacyRole,
    permissions: legacyPermissions,
    status: 'ACTIVO',
  }

  try {
    localStorage.setItem('qvaflow_user', JSON.stringify(legacyUserPayload))
    if (newAuthStore.token) {
      localStorage.setItem('qvaflow_access_token', newAuthStore.token)
      localStorage.setItem('qvaflow_token', newAuthStore.token)
    }
  } catch {
    // Silenciar error en entornos restringidos
  }

  // Extender reactivamente la instancia del store Pinia 'auth'
  // con los getters computados requeridos por MainLayout y vistas legadas
  const store = newAuthStore as unknown as Record<string, unknown>
  store.userName = computed(() => user?.fullName || user?.username || 'Usuario')
  store.userRole = computed(() => legacyRole)
  store.isSuperadmin = computed(() => legacyRole === 'SUPERADMIN')
  store.canViewCosts = computed(
    () => legacyPermissions.includes('VIEW_COSTS') || Boolean(store.isSuperadmin)
  )
  store.canViewAllSales = computed(
    () => legacyPermissions.includes('VIEW_ALL_SALES') || Boolean(store.isSuperadmin)
  )
  store.canManageUsers = computed(
    () => legacyPermissions.includes('MANAGE_USERS') || Boolean(store.isSuperadmin)
  )
  store.canAccessPos = computed(
    () => legacyPermissions.includes('POS_ACCESS') || Boolean(store.isSuperadmin)
  )
  store.canAccessSalesAndShifts = computed(
    () => legacyPermissions.includes('VIEW_ALL_SALES') || Boolean(store.isSuperadmin)
  )
  store.canAccessCatalog = computed(
    () => legacyPermissions.includes('MANAGE_CATALOG') || Boolean(store.isSuperadmin)
  )
  store.canAccessInventory = computed(
    () => legacyPermissions.includes('MANAGE_INVENTORY') || Boolean(store.isSuperadmin)
  )
  store.canAccessPurchases = computed(
    () => legacyPermissions.includes('MANAGE_PURCHASES') || Boolean(store.isSuperadmin)
  )
  store.canAccessReports = computed(
    () => legacyPermissions.includes('VIEW_REPORTS') || Boolean(store.isSuperadmin)
  )
  store.canAccessBackups = computed(() => Boolean(store.isSuperadmin) || legacyRole === 'ADMIN')
}
