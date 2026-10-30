/**
 * Formateo estándar de fechas y horas para QvaFlow (dd/mm/aaaa).
 */

export interface FormatDateOptions {
  includeTime?: boolean
  seconds?: boolean
}

/**
 * Convierte una fecha ISO 8601 o timestamp a formato legible estándar: dd/mm/aaaa [hh:mm[:ss]]
 */
export function formatDate(
  dateInput: string | Date | number | null | undefined,
  options: FormatDateOptions = {}
): string {
  if (!dateInput) return '—'

  const date =
    typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  const dateStr = `${day}/${month}/${year}`

  if (!options.includeTime) {
    return dateStr
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (options.seconds) {
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${dateStr} ${hours}:${minutes}:${seconds}`
  }

  return `${dateStr} ${hours}:${minutes}`
}

/**
 * Retorna la hora actual en formato estándar militar (hh:mm:ss)
 */
export function formatTimeOnly(dateInput: Date = new Date()): string {
  const hours = String(dateInput.getHours()).padStart(2, '0')
  const minutes = String(dateInput.getMinutes()).padStart(2, '0')
  const seconds = String(dateInput.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}
