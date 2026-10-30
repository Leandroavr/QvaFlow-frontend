/**
 * Composable reutilizable para formateo estricto de fechas en formato cubano/latinoamericano:
 * DD/MM/YYYY o DD/MM/YYYY HH:mm
 */
export function useFormatoFecha() {
  /**
   * Formatea una fecha a DD/MM/YYYY
   * @param dateStr Fecha en formato ISO, string 'YYYY-MM-DD' o Date
   */
  const formatearFecha = (dateStr?: string | Date | null): string => {
    if (!dateStr) return '-'

    // Manejo de cadenas manuales directas como '2026-10-27' o '2026-10-27 08:30'
    if (typeof dateStr === 'string') {
      const cleaned = dateStr.trim()
      const match = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (match) {
        const [, year, month, day] = match
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
      }
    }

    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (!d || isNaN(d.getTime())) return String(dateStr)

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  /**
   * Formatea una fecha y hora a DD/MM/YYYY HH:mm
   * @param dateStr Fecha en formato ISO, string o Date
   */
  const formatearFechaHora = (dateStr?: string | Date | null): string => {
    if (!dateStr) return '-'

    if (typeof dateStr === 'string') {
      const cleaned = dateStr.trim()
      // Caso '2026-10-27 08:30' o '2026-10-27T08:30:00'
      const match = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T ](\d{1,2}):(\d{1,2})/)
      if (match) {
        const [, year, month, day, hour, min] = match
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
      }
      const matchDateOnly = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (matchDateOnly) {
        const [, year, month, day] = matchDateOnly
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
      }
    }

    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (!d || isNaN(d.getTime())) return String(dateStr)

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return {
    formatearFecha,
    formatearFechaHora,
  }
}

export default useFormatoFecha
