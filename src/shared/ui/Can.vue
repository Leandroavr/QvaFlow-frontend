<template>
  <slot v-if="hasAccess" />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '../composables/usePermissions'
import type { AppPermission } from '../types/permissions'

/**
 * Componente declarativo <Can> para renderizado condicional según permisos RBAC.
 *
 * Uso:
 * <Can permission="inventory.view">
 *   <InventoryTable />
 * </Can>
 *
 * <Can :permission="['sales.create', 'sales.cancel']" any>
 *   <PosActions />
 * </Can>
 *
 * Recordatorio: Control visual de interfaz. La seguridad real se aplica en Symfony.
 */
interface Props {
  permission: AppPermission | string | (AppPermission | string)[]
  any?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  any: false,
})

const { can, canAny, canAll } = usePermissions()

const hasAccess = computed(() => {
  if (Array.isArray(props.permission)) {
    return props.any ? canAny(props.permission) : canAll(props.permission)
  }
  return can(props.permission)
})
</script>
