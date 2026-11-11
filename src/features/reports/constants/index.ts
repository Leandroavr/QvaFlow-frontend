/**
 * Constantes y mapeos para el módulo de Reportes.
 */

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
}

/**
 * Normaliza la forma de pago en español según el mapa oficial.
 * Un valor desconocido se muestra tal cual.
 */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return ''
  return PAYMENT_METHOD_LABELS[method] ?? method
}
