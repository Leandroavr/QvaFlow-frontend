import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ApiError } from '../../shared/types/api'
import { useUiStore } from '../../shared/stores/uiStore'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor de Petición: Inyecta el token Bearer si existe en localStorage
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('qvaflow_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de Respuesta: Maneja expiración de sesión (401) y fallos de red local
httpClient.interceptors.response.use(
  (response) => {
    // Si la petición tuvo éxito, sabemos que el servidor local está respondiendo
    try {
      const uiStore = useUiStore()
      if (uiStore.serverStatus !== 'connected') {
        uiStore.setServerStatus('connected')
      }
    } catch {
      // Ignorar si se invoca fuera del ciclo de Pinia
    }
    return response
  },
  (error: AxiosError<{ code?: string; message?: string; details?: Record<string, string | string[]> }>) => {
    const uiStore = useUiStore()

    // 1. Error de conexión con el servidor local (offline, timeout, refused)
    if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      uiStore.setServerStatus('disconnected')
      return Promise.reject(
        new ApiError({
          code: 'SERVER_UNAVAILABLE',
          message: 'No se puede conectar con el servidor local Symfony. Verifique que Docker o Apache estén activos.',
        })
      )
    }

    const { status, data } = error.response

    // 2. Sesión expirada o no autorizada (401)
    if (status === 401) {
      localStorage.removeItem('qvaflow_token')
      localStorage.removeItem('qvaflow_user')
      if (typeof window !== 'undefined' && !window.location.hash.includes('/login') && !window.location.pathname.includes('/login')) {
        const currentPath = window.location.pathname + window.location.search
        window.location.href = `#/login?redirect=${encodeURIComponent(currentPath)}`
      }
    }

    // 3. Normalizar error de API a la clase tipada ApiError
    const apiError = new ApiError(
      {
        code: data?.code || `HTTP_${status}`,
        message: data?.message || error.message || 'Error en la petición al servidor',
        details: data?.details,
      },
      status
    )

    return Promise.reject(apiError)
  }
)
