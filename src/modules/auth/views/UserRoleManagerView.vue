<template>
  <div class="space-y-5">
    <!-- AVISO DE PRIVILEGIO SUPERADMINISTRADOR -->
    <a-alert
      type="warning"
      show-icon
      class="shadow-xs rounded-xl border-amber-200 bg-amber-50/80 p-4"
    >
      <template #message>
        <span class="text-sm font-bold text-amber-900">
          Zona Restringida: Control de Acceso Basado en Roles (RBAC)
        </span>
      </template>
      <template #description>
        <div class="mt-1 text-xs leading-relaxed text-amber-800">
          Solo el <strong>Superadministrador</strong> tiene autorización para alterar los roles del
          negocio, asignar credenciales o revocar el acceso a módulos confidenciales (como la
          visualización de costos de compra o reportes financieros).
        </div>
      </template>
    </a-alert>

    <!-- TARJETAS SUPERIORES: KPIS DEL EQUIPO -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Trabajadores
          </p>
          <h3 class="m-0 text-2xl font-black text-slate-800">{{ authStore.users.length }}</h3>
          <span class="text-[11px] text-slate-400">Plantilla del negocio</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-blue-600"
        >
          👥
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cajeros / Dependientes
          </p>
          <h3 class="m-0 text-2xl font-black text-slate-800">
            {{ authStore.users.filter((u) => u.role === 'CASHIER').length }}
          </h3>
          <span class="text-[11px] text-slate-400">Atención en mostrador</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-xl font-bold text-emerald-600"
        >
          🛒
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Administradores
          </p>
          <h3 class="m-0 text-2xl font-black text-slate-800">
            {{
              authStore.users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length
            }}
          </h3>
          <span class="text-[11px] text-slate-400">Gestión y auditoría</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-xl font-bold text-purple-600"
        >
          🛡️
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cuentas Activas
          </p>
          <h3 class="m-0 text-2xl font-black text-emerald-600">
            {{ authStore.users.filter((u) => u.status === 'ACTIVO').length }}
          </h3>
          <span class="text-[11px] font-medium text-emerald-600">Con acceso permitido</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-xl font-bold text-emerald-600"
        >
          ✓
        </div>
      </div>
    </div>

    <!-- CONTENEDOR PRINCIPAL: TABLA DE PERSONAL -->
    <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 class="m-0 text-base font-bold text-slate-800">Trabajadores y Matriz de Permisos</h3>
          <p class="m-0 text-xs text-slate-400">Administración de credenciales de la red local</p>
        </div>

        <div class="flex items-center gap-2">
          <a-button @click="authStore.fetchUsers">
            <template #icon><ReloadOutlined /></template>
            Actualizar
          </a-button>

          <a-button
            type="primary"
            class="flex items-center gap-1.5 border-none bg-emerald-600 font-semibold hover:bg-emerald-500"
            @click="openCreateUserModal"
          >
            <UserAddOutlined />
            <span>Nuevo Trabajador</span>
          </a-button>
        </div>
      </div>

      <!-- Tabla de Trabajadores -->
      <a-table
        :columns="columns"
        :data-source="authStore.users"
        :loading="authStore.loadingUsers"
        :pagination="{ pageSize: 6, showTotal: (total: number) => `Total ${total} trabajadores` }"
        row-key="id"
        class="overflow-x-auto"
      >
        <template #bodyCell="{ column, record }">
          <!-- Columna Trabajador -->
          <template v-if="column.key === 'userInfo'">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                :class="getRoleAvatarColor(record.role)"
              >
                {{ record.name.charAt(0) }}
              </div>
              <div>
                <div class="text-xs font-bold text-slate-800">{{ record.name }}</div>
                <div class="font-mono text-[11px] text-slate-400">
                  @{{ record.username }} • {{ record.phone || 'Sin tel' }}
                </div>
              </div>
            </div>
          </template>

          <!-- Columna Rol -->
          <template v-else-if="column.key === 'role'">
            <a-tag :color="getRoleTagColor(record.role)" class="px-2 py-0.5 text-xs font-bold">
              {{ getRoleLabel(record.role) }}
            </a-tag>
          </template>

          <!-- Columna Permisos Activos -->
          <template v-else-if="column.key === 'permissions'">
            <div class="flex max-w-xs flex-wrap gap-1">
              <span
                v-for="perm in record.permissions.slice(0, 3)"
                :key="perm"
                class="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700"
              >
                {{ perm }}
              </span>
              <span
                v-if="record.permissions.length > 3"
                class="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700"
              >
                +{{ record.permissions.length - 3 }} más
              </span>
            </div>
          </template>

          <!-- Columna Estado -->
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'ACTIVO' ? 'success' : 'default'" class="text-xs">
              {{ record.status === 'ACTIVO' ? '🟢 Activo' : '🔴 Inactivo' }}
            </a-tag>
          </template>

          <!-- Columna Último Acceso (DD/MM/YYYY) -->
          <template v-else-if="column.key === 'lastLogin'">
            <span class="font-mono text-xs text-slate-600">{{
              formatearFechaHora(record.lastLogin)
            }}</span>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="primary"
              class="flex items-center gap-1 border-none bg-blue-600 text-xs font-semibold hover:bg-blue-500"
              @click="openEditPermissionsModal(record)"
            >
              <EditOutlined />
              <span>Editar Permisos</span>
            </a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- MODAL DE ASIGNACIÓN DE ROL Y PERMISOS -->
    <UserRoleModal
      v-model:visible="isRoleModalVisible"
      :user-to-edit="currentUserToEdit"
      :loading="authStore.loadingUsers"
      @submit="handleSavePermissions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ReloadOutlined, UserAddOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import useAuthStore from '../store/authStore'
import UserRoleModal from '../components/UserRoleModal.vue'
import { useFormatoFecha } from '@/shared/composables/useFormatoFecha'
import type { User, UserRole, UpdateUserRoleDto } from '../types/auth'

const authStore = useAuthStore()
const { formatearFechaHora } = useFormatoFecha()

const isRoleModalVisible = ref<boolean>(false)
const currentUserToEdit = ref<User | null>(null)

const columns = [
  {
    title: 'Trabajador',
    key: 'userInfo',
    dataIndex: 'name',
    sorter: (a: User, b: User) => a.name.localeCompare(b.name),
  },
  {
    title: 'Rol Asignado',
    key: 'role',
    dataIndex: 'role',
    width: 140,
  },
  {
    title: 'Módulos y Permisos',
    key: 'permissions',
    width: 250,
  },
  {
    title: 'Estado',
    key: 'status',
    dataIndex: 'status',
    width: 110,
  },
  {
    title: 'Último Acceso',
    key: 'lastLogin',
    dataIndex: 'lastLogin',
    width: 150,
  },
  {
    title: 'Acciones',
    key: 'actions',
    width: 140,
    align: 'center' as const,
  },
]

onMounted(() => {
  authStore.fetchUsers()
})

const getRoleAvatarColor = (role: UserRole) => {
  switch (role) {
    case 'SUPERADMIN':
      return 'bg-purple-600'
    case 'ADMIN':
      return 'bg-blue-600'
    case 'MANAGER':
      return 'bg-amber-600'
    case 'WAREHOUSE':
      return 'bg-indigo-600'
    case 'CASHIER':
    default:
      return 'bg-emerald-600'
  }
}

const getRoleTagColor = (role: UserRole) => {
  switch (role) {
    case 'SUPERADMIN':
      return 'purple'
    case 'ADMIN':
      return 'blue'
    case 'MANAGER':
      return 'orange'
    case 'WAREHOUSE':
      return 'cyan'
    case 'CASHIER':
    default:
      return 'green'
  }
}

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'SUPERADMIN':
      return 'Superadmin'
    case 'ADMIN':
      return 'Administrador'
    case 'MANAGER':
      return 'Gerente'
    case 'WAREHOUSE':
      return 'Almacenero'
    case 'CASHIER':
    default:
      return 'Cajero'
  }
}

const openEditPermissionsModal = (user: User) => {
  currentUserToEdit.value = { ...user }
  isRoleModalVisible.value = true
}

const openCreateUserModal = () => {
  message.info('Formulario de alta de nuevo empleado: se integrará en el siguiente paso.')
}

const handleSavePermissions = async (dto: UpdateUserRoleDto) => {
  const ok = await authStore.updateUserRoleAndPermissions(dto)
  if (ok) {
    isRoleModalVisible.value = false
  }
}
</script>
