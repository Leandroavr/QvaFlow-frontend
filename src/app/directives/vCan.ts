import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '../../features/auth/stores/authStore'
import type { AppPermission } from '../../shared/types/permissions'

/**
 * Directiva personalizada v-can para ocultar elementos del DOM según permisos RBAC.
 *
 * Uso:
 * <button v-can="'sales.create'">Nueva Venta</button>
 * <div v-can="['inventory.adjust', 'inventory.transfer']">Acciones de Stock</div>
 *
 * NOTA: Control visual de interfaz. La validación definitiva se ejecuta en el servidor.
 */
export const vCan: Directive<HTMLElement, AppPermission | string | (AppPermission | string)[]> = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding)
  },
}

function checkPermission(
  el: HTMLElement,
  binding: DirectiveBinding<AppPermission | string | (AppPermission | string)[]>
) {
  const value = binding.value
  if (!value) return

  const authStore = useAuthStore()
  let hasAccess = false

  if (Array.isArray(value)) {
    hasAccess = authStore.hasAnyPermission(value)
  } else {
    hasAccess = authStore.hasPermission(value)
  }

  if (!hasAccess) {
    // Se elimina el nodo del DOM o se oculta manteniendo compatibilidad
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    } else {
      el.style.display = 'none'
    }
  }
}
