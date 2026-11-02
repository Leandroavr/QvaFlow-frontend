import { toast } from 'vue-sonner'

export interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
}

/**
 * Composable para emitir notificaciones toast accesibles sobre vue-sonner
 * configurado con la paleta de tokens semánticos de QvaFlow.
 */
export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) => toast.success(message, options),
    error: (message: string, options?: ToastOptions) => toast.error(message, options),
    warning: (message: string, options?: ToastOptions) => toast.warning(message, options),
    info: (message: string, options?: ToastOptions) => toast.info(message, options),
    message: (message: string, options?: ToastOptions) => toast(message, options),
    dismiss: (id?: string | number) => toast.dismiss(id),
  }
}
