<template>
  <div class="space-y-5">
    <!-- AVISO DE PRIVILEGIO SUPERADMINISTRADOR -->
    <a-alert
      type="warning"
      show-icon
      class="rounded-xl border-amber-200 bg-amber-50/80 shadow-xs p-4"
    >
      <template #message>
        <span class="font-bold text-amber-900 text-sm">
          Zona Restringida: Control de Acceso Basado en Roles (RBAC)
        </span>
      </template>
      <template #description>
        <div class="text-xs text-amber-800 leading-relaxed mt-1">
          Solo el <strong>Superadministrador</strong> tiene autorización para alterar los roles del negocio, asignar credenciales o revocar el acceso a módulos confidenciales (como la visualización de costos de compra o reportes financieros).
        </div>
      </template>
    </a-alert>

    <!-- TARJETAS SUPERIORES: KPIS DEL EQUIPO -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Trabajadores</p>
          <h3 class="text-2xl font-black text-slate-800 m-0">{{ authStore.users.length }}</h3>
          <span class="text-[11px] text-slate-400">Plantilla del negocio</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
          👥
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cajeros / Dependientes</p>
          <h3 class="text-2xl font-black text-slate-800 m-0">
            {{ authStore.users.filter((u) => u.role === 'CASHIER').length }}
          </h3>
          <span class="text-[11px] text-slate-400">Atención en mostrador</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
          🛒
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administradores</p>
          <h3 class="text-2xl font-black text-slate-800 m-0">
            {{ authStore.users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length }}
          </h3>
          <span class="text-[11px] text-slate-400">Gestión y auditoría</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
          🛡️
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuentas Activas</p>
          <h3 class="text-2xl font-black text-emerald-600 m-0">
            {{ authStore.users.filter((u) => u.status === 'ACTIVO').length }}
          </h3>
          <span class="text-[11px] text-emerald-600 font-medium">Con acceso permitido</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
          ✓
        </div>
      </div>
    </div>

    <!-- CONTENEDOR PRINCIPAL: TABLA DE PERSONAL -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-bold text-slate-800 text-base m-0">Trabajadores y Matriz de Permisos</h3>
          <p class="text-xs text-slate-400 m-0">Administración de credenciales de la red local</p>
        </div>

        <div class="flex items-center gap-2">
          <a-button @click="authStore.fetchUsers">
            <template #icon><ReloadOutlined /></template>
            Actualizar
          </a-button>

          <a-button
            type="primary"
            class="bg-emerald-600 hover:bg-emerald-500 border-none font-semibold flex items-center gap-1.5"
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
                class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                :class="getRoleAvatarColor(record.role)"
              >
                {{ record.name.charAt(0) }}
              </div>
              <div>
                <div class="font-bold text-slate-800 text-xs">{{ record.name }}</div>
                <div class="text-[11px] text-slate-400 font-mono">@{{ record.username }} • {{ record.phone || 'Sin tel' }}</div>
              </div>
            </div>
          </template>

          <!-- Columna Rol -->
          <template v-else-if="column.key === 'role'">
            <a-tag :color="getRoleTagColor(record.role)" class="text-xs font-bold px-2 py-0.5">
              {{ getRoleLabel(record.role) }}
            </a-tag>
          </template>

          <!-- Columna Permisos Activos -->
          <template v-else-if="column.key === 'permissions'">
            <div class="flex flex-wrap gap-1 max-w-xs">
              <span
                v-for="perm in record.permissions.slice(0, 3)"
                :key="perm"
                class="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono border border-slate-200"
              >
                {{ perm }}
              </span>
              <span
                v-if="record.permissions.length > 3"
                class="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded"
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
            <span class="text-xs text-slate-600 font-mono">{{ formatearFechaHora(record.lastLogin) }}</span>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="primary"
              class="bg-blue-600 hover:bg-blue-500 border-none text-xs font-semibold flex items-center gap-1"
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
import {
  ReloadOutlined,
  UserAddOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'
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
