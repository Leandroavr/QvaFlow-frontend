import apiClient from '@/core/axios'
import type {
  LoginCredentials,
  AuthResponse,
  RefreshTokenResponse,
  Permission,
  User,
  UpdateUserRoleDto,
} from '../types/auth'

const ALL_PERMISSIONS: Permission[] = [
  'VIEW_COSTS',
  'VIEW_ALL_SALES',
  'MANAGE_CATALOG',
  'MANAGE_INVENTORY',
  'MANAGE_PURCHASES',
  'MANAGE_USERS',
  'POS_ACCESS',
  'VIEW_REPORTS',
]

// Lista de trabajadores del negocio simulados
const USUARIOS_NEGOCIO_MOCK: User[] = [
  {
    id: 1,
    username: 'superadmin',
    name: 'Superadministrador QvaFlow',
    role: 'SUPERADMIN',
    email: 'superadmin@qvaflow.cu',
    phone: '+53 5 280-9900',
    status: 'ACTIVO',
    permissions: ALL_PERMISSIONS,
    lastLogin: '2026-10-27 08:30',
  },
  {
    id: 2,
    username: 'admin',
    name: 'Carlos Valdés',
    role: 'ADMIN',
    email: 'carlos.valdes@qvaflow.cu',
    phone: '+53 5 341-2233',
    status: 'ACTIVO',
    permissions: [
      'VIEW_COSTS',
      'VIEW_ALL_SALES',
      'MANAGE_CATALOG',
      'MANAGE_INVENTORY',
      'MANAGE_PURCHASES',
      'MANAGE_USERS',
      'VIEW_REPORTS',
      'POS_ACCESS',
    ],
    lastLogin: '2026-10-27 07:45',
  },
  {
    id: 3,
    username: 'cajero',
    name: 'Yadira Reyes',
    role: 'CASHIER',
    email: 'yadira.caja@qvaflow.cu',
    phone: '+53 5 889-1144',
    status: 'ACTIVO',
    permissions: ['POS_ACCESS'],
    lastLogin: '2026-10-27 08:00',
  },
  {
    id: 4,
    username: 'almacenero',
    name: 'Marcos Peña',
    role: 'WAREHOUSE',
    email: 'marcos.almacen@qvaflow.cu',
    phone: '+53 5 776-5522',
    status: 'ACTIVO',
    permissions: ['MANAGE_INVENTORY', 'MANAGE_CATALOG'],
    lastLogin: '2026-10-26 18:20',
  },
  {
    id: 5,
    username: 'cajero2',
    name: 'Lisandra Domínguez',
    role: 'CASHIER',
    email: 'lisandra@qvaflow.cu',
    phone: '+53 5 990-4411',
    status: 'INACTIVO',
    permissions: ['POS_ACCESS'],
    lastLogin: '2026-10-20 14:10',
  },
]

let localUsers: User[] = [...USUARIOS_NEGOCIO_MOCK]

/**
 * Servicio de Autenticación con soporte de Tokens JWT, Refresh Tokens y Gestión de Personal.
 */
export const authService = {
  /**
   * Realiza el inicio de sesión del usuario.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
      return response.data
    } catch {
      const { username, password } = credentials

      // 1. Superadmin (Acceso Total Ilimitado)
      if (username === 'superadmin' && password === 'admin123') {
        const found = localUsers.find((u) => u.username === 'superadmin')!
        return Promise.resolve({
          tokens: {
            accessToken: `jwt_access_superadmin_${Date.now()}`,
            refreshToken: `jwt_refresh_superadmin_${Date.now()}`,
            expiresIn: 3600,
          },
          user: { ...found },
        })
      }

      // 2. Administrador de Negocio
      if (username === 'admin' && password === '123456') {
        const found = localUsers.find((u) => u.username === 'admin')!
        return Promise.resolve({
          tokens: {
            accessToken: `jwt_access_admin_${Date.now()}`,
            refreshToken: `jwt_refresh_admin_${Date.now()}`,
            expiresIn: 3600,
          },
          user: { ...found },
        })
      }

      // 3. Cajero / Dependiente
      if (username === 'cajero' && password === '123456') {
        const found = localUsers.find((u) => u.username === 'cajero')!
        return Promise.resolve({
          tokens: {
            accessToken: `jwt_access_cajero_${Date.now()}`,
            refreshToken: `jwt_refresh_cajero_${Date.now()}`,
            expiresIn: 3600,
          },
          user: { ...found },
        })
      }

      throw new Error('Credenciales incorrectas. Verifique el usuario y la contraseña.')
    }
  },

  /**
   * Refresca el Access Token utilizando el Refresh Token vigente.
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refreshToken,
      })
      return response.data
    } catch {
      if (refreshToken && refreshToken.includes('jwt_refresh')) {
        return Promise.resolve({
          accessToken: `jwt_access_renewed_${Date.now()}`,
          refreshToken: `jwt_refresh_renewed_${Date.now()}`,
          expiresIn: 3600,
        })
      }
      throw new Error('Refresh Token inválido o expirado')
    }
  },

  /**
   * Cierra la sesión en el servidor.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Silencioso en modo sin conexión
    }
  },

  /**
   * Obtiene la lista de trabajadores y usuarios del negocio (Solo Superadmin).
   */
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get<User[]>('/admin/users')
      return response.data
    } catch {
      return Promise.resolve([...localUsers])
    }
  },

  /**
   * Actualiza el rol y los permisos granulares de un trabajador.
   */
  async updateUserRole(dto: UpdateUserRoleDto): Promise<User> {
    try {
      const response = await apiClient.put<User>(`/admin/users/${dto.userId}/permissions`, dto)
      return response.data
    } catch {
      const index = localUsers.findIndex((u) => u.id === dto.userId)
      if (index !== -1) {
        localUsers[index] = {
          ...localUsers[index],
          role: dto.role,
          permissions: [...dto.permissions],
          status: dto.status || localUsers[index].status,
        }
        return Promise.resolve({ ...localUsers[index] })
      }
      throw new Error(`Trabajador con ID ${dto.userId} no encontrado`)
    }
  },

  /**
   * Registra un nuevo trabajador en el sistema.
   */
  async createUser(newUser: Omit<User, 'id'>): Promise<User> {
    try {
      const response = await apiClient.post<User>('/admin/users', newUser)
      return response.data
    } catch {
      const created: User = {
        ...newUser,
        id: Date.now(),
        lastLogin: 'Nunca',
      }
      localUsers.unshift(created)
      return Promise.resolve(created)
    }
  },
}

export default authService
