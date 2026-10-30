<template>
  <a-modal
    :open="visible"
    :title="`Gestión de Rol y Permisos: ${userToEdit?.name || 'Trabajador'}`"
    :confirm-loading="loading"
    ok-text="Guardar Permisos"
    cancel-text="Cancelar"
    width="680px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div v-if="userToEdit" class="py-2 space-y-4">
      <!-- Tarjeta informativa del trabajador -->
      <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <span class="font-bold text-slate-800 text-sm block">{{ userToEdit.name }}</span>
          <span class="text-xs text-slate-400 font-mono">Usuario: @{{ userToEdit.username }} | {{ userToEdit.email || 'Sin correo' }}</span>
        </div>
        <a-tag :color="userToEdit.status === 'ACTIVO' ? 'success' : 'default'">
          {{ userToEdit.status }}
        </a-tag>
      </div>

      <!-- Selector de Rol General -->
      <div>
        <label class="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
          Rol General Asignado:
        </label>
        <a-select
          v-model:value="selectedRole"
          class="w-full"
          :dropdown-match-select-width="false"
          :popup-match-select-width="false"
          size="large"
          @change="handleRolePresetChange"
        >
          <a-select-option value="ADMIN">
            🛡️ Administrador (Acceso operativo completo y costos)
          </a-select-option>
          <a-select-option value="CASHIER">
            🛒 Cajero / Dependiente (Ventas en mostrador y canjes)
          </a-select-option>
          <a-select-option value="WAREHOUSE">
            📦 Almacenero (Control de stock, entradas y albaranes)
          </a-select-option>
          <a-select-option value="MANAGER">
            📊 Gerente Comercial (Reportes, analíticas y compras)
          </a-select-option>
          <a-select-option v-if="userToEdit.role === 'SUPERADMIN'" value="SUPERADMIN">
            ⭐ Superadministrador (Acceso total al sistema)
          </a-select-option>
        </a-select>
        <span class="text-[11px] text-slate-400 mt-1 block">
          Al cambiar el rol general se preseleccionan los permisos sugeridos, los cuales puede personalizar a continuación.
        </span>
      </div>

      <!-- Matriz Granular de Permisos por Módulo (a-checkbox-group) -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wide block m-0">
            Permisos Granulares por Módulo (RBAC):
          </label>
          <span class="text-xs text-emerald-600 font-semibold">
            {{ selectedPermissions.length }} de {{ permissionOptions.length }} permisos activos
          </span>
        </div>

        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <a-checkbox-group v-model:value="selectedPermissions" class="w-full">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="opt in permissionOptions"
                :key="opt.value"
                class="p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all"
              >
                <a-checkbox :value="opt.value" class="items-start">
                  <div class="ml-1">
                    <span class="text-xs font-bold text-slate-800 block">{{ opt.label }}</span>
                    <span class="text-[11px] text-slate-400 block leading-tight">{{ opt.description }}</span>
                  </div>
                </a-checkbox>
              </div>
            </div>
          </a-checkbox-group>
        </div>
      </div>

      <!-- Estado de la Cuenta -->
      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <span class="text-xs font-bold text-slate-700 block">Estado del Usuario</span>
          <span class="text-[11px] text-slate-400">Permitir o revocar el acceso a la red local</span>
        </div>
        <a-select
          v-model:value="accountStatus"
          size="small"
          class="w-32"
          :dropdown-match-select-width="false"
          :popup-match-select-width="false"
        >
          <a-select-option value="ACTIVO">🟢 Activo</a-select-option>
          <a-select-option value="INACTIVO">🔴 Inactivo</a-select-option>
        </a-select>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User, UserRole, Permission, UpdateUserRoleDto } from '../types/auth'

interface Props {
  visible: boolean
  userToEdit: User | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userToEdit: null,
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', payload: UpdateUserRoleDto): void
}>()

const selectedRole = ref<UserRole>('CASHIER')
const selectedPermissions = ref<Permission[]>([])
const accountStatus = ref<'ACTIVO' | 'INACTIVO'>('ACTIVO')

// Opciones de permisos granulares
const permissionOptions: Array<{ value: Permission; label: string; description: string }> = [
  {
    value: 'POS_ACCESS',
    label: '🛒 Ventas y Terminal POS',
    description: 'Facturación en mostrador y cobro a clientes',
  },
  {
    value: 'VIEW_COSTS',
    label: '💲 Precios de Costo y Márgenes',
    description: 'Visualizar y editar costes y márgenes en inventario y catálogo',
  },
  {
    value: 'MANAGE_CATALOG',
    label: '📦 Catálogo de Productos',
    description: 'Crear, editar productos, códigos de barra e imágenes',
  },
  {
    value: 'MANAGE_INVENTORY',
    label: '🏬 Inventario y Almacén',
    description: 'Ajustes físicos, mermas y traslados entre almacenes',
  },
  {
    value: 'MANAGE_PURCHASES',
    label: '🛍️ Compras y Proveedores',
    description: 'Registrar facturas de compra y liquidar cuentas por pagar',
  },
  {
    value: 'VIEW_REPORTS',
    label: '📊 Reportes y Analíticas',
    description: 'Acceso a KPIs del mes y productos con nula rotación',
  },
  {
    value: 'VIEW_ALL_SALES',
    label: '📋 Auditoría de Todas las Ventas',
    description: 'Consultar ventas de todos los cajeros y turnos pasados',
  },
  {
    value: 'MANAGE_USERS',
    label: '👥 Gestión de Personal y Roles',
    description: 'Administrar permisos y acceso de los trabajadores (Superadmin)',
  },
]

// Plantillas sugeridas de permisos por rol
const ROLE_PRESETS: Record<UserRole, Permission[]> = {
  SUPERADMIN: [
    'POS_ACCESS',
    'VIEW_COSTS',
    'MANAGE_CATALOG',
    'MANAGE_INVENTORY',
    'MANAGE_PURCHASES',
    'VIEW_REPORTS',
    'VIEW_ALL_SALES',
    'MANAGE_USERS',
  ],
  ADMIN: [
    'POS_ACCESS',
    'VIEW_COSTS',
    'MANAGE_CATALOG',
    'MANAGE_INVENTORY',
    'MANAGE_PURCHASES',
    'VIEW_REPORTS',
    'VIEW_ALL_SALES',
  ],
  MANAGER: [
    'POS_ACCESS',
    'VIEW_COSTS',
    'MANAGE_PURCHASES',
    'VIEW_REPORTS',
    'VIEW_ALL_SALES',
  ],
  WAREHOUSE: [
    'MANAGE_INVENTORY',
    'MANAGE_CATALOG',
    'MANAGE_PURCHASES',
  ],
  CASHIER: [
    'POS_ACCESS',
  ],
}

watch(
  () => props.userToEdit,
  (user) => {
    if (user) {
      selectedRole.value = user.role
      selectedPermissions.value = [...user.permissions]
      accountStatus.value = user.status
    }
  },
  { immediate: true }
)

const handleRolePresetChange = (role: UserRole) => {
  const suggested = ROLE_PRESETS[role]
  if (suggested) {
    selectedPermissions.value = [...suggested]
  }
}

const handleSubmit = () => {
  if (!props.userToEdit) return

  emit('submit', {
    userId: props.userToEdit.id,
    role: selectedRole.value,
    permissions: selectedPermissions.value,
    status: accountStatus.value,
  })
}

const handleCancel = () => {
  emit('update:visible', false)
}
</script>
