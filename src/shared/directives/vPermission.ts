import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/modules/auth/store/authStore'
import type { Permission } from '@/modules/auth/types/auth'

/**
 * Directiva personalizada v-permission para el control granular de elementos DOM según RBAC.
 *
 * Ejemplos de uso:
 * <button v-permission="'VIEW_COSTS'">Ver Costos</button>
 * <div v-permission="['MANAGE_CATALOG', 'MANAGE_INVENTORY']">Panel Avanzado</div>
 */
export const vPermission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<Permission | Permission[]>) {
    const { value } = binding
    const authStore = useAuthStore()

    if (value) {
      const hasPermission = authStore.hasPermission(value)

      if (!hasPermission) {
        // Elimina el elemento del árbol DOM de forma segura
        el.parentNode?.removeChild(el)
      }
    } else {
      throw new Error(
        `Se requiere especificar el permiso en v-permission. Ejemplo: v-permission="'VIEW_COSTS'"`
      )
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<Permission | Permission[]>) {
    const { value } = binding
    const authStore = useAuthStore()

    if (value) {
      const hasPermission = authStore.hasPermission(value)

      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  },
}

export default vPermission
