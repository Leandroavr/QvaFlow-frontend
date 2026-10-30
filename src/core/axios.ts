import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { message, notification } from 'ant-design-vue'

/**
 * Cliente HTTP Axios configurado para la API de QvaFlow (Symfony backend en red local).
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Variables para el control de refresco concurrente de tokens (JWT Refresh Queue)
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// 1. Interceptor de Solicitudes: Inyecta el Access Token Bearer
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem('qvaflow_access_token') || localStorage.getItem('qvaflow_token')

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 2. Interceptor de Respuestas: Manejo de errores y Refresco Automático de JWT
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!error.response) {
      // Servidor local caído o problema de conectividad en red LAN
      notification.warning({
        message: 'Sin conexión con el servidor local',
        description:
          'No se pudo comunicar con el backend de Symfony en la red local. Verifique la conexión.',
        duration: 4,
      })
      return Promise.reject(error)
    }

    const status = error.response.status
    const errorData = error.response.data as { message?: string } | undefined
    const errorMessage = errorData?.message || 'Ha ocurrido un error inesperado.'

    // Si recibimos 401 (No autorizado / Token Expirado)
    if (status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')

      if (isAuthEndpoint) {
        return Promise.reject(error)
      }

      // Si ya hay una petición renovando el token en curso, encolar las peticiones concurrentes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const currentRefreshToken = localStorage.getItem('qvaflow_refresh_token')

      if (!currentRefreshToken) {
        isRefreshing = false
        purgeAuthAndRedirect()
        return Promise.reject(error)
      }

      try {
        // Petición aislada con instancia pura de axios para evitar bucles de interceptor
        const response = await axios.post<{
          accessToken: string
          refreshToken: string
        }>(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )

        const newAccessToken = response.data.accessToken
        const newRefreshToken = response.data.refreshToken

        localStorage.setItem('qvaflow_access_token', newAccessToken)
        localStorage.setItem('qvaflow_token', newAccessToken)
        if (newRefreshToken) {
          localStorage.setItem('qvaflow_refresh_token', newRefreshToken)
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        processQueue(null, newAccessToken)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        purgeAuthAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Otros códigos de error HTTP centralizados
    switch (status) {
      case 403:
        message.warning('Acceso denegado: No posee los permisos requeridos.')
        break
      case 404:
        message.error('El recurso solicitado no fue encontrado.')
        break
      case 422:
        message.error(errorMessage || 'Datos inválidos.')
        break
      case 500:
        notification.error({
          message: 'Error interno del servidor (500)',
          description: errorMessage,
        })
        break
      default:
        message.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

/**
 * Limpia el estado de autenticación y redirige a la pantalla de Login.
 */
function purgeAuthAndRedirect() {
  localStorage.removeItem('qvaflow_access_token')
  localStorage.removeItem('qvaflow_token')
  localStorage.removeItem('qvaflow_refresh_token')
  localStorage.removeItem('qvaflow_user')
  message.error('Su sesión ha expirado. Por favor, ingrese nuevamente.')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default apiClient
