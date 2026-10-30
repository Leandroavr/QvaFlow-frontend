/**
 * Composable global para el formateo de importes y monedas en QvaFlow.
 */
export function useFormatoMoneda() {
  /**
   * Formatea un valor numérico a moneda con separador de miles y decimales.
   * @param valor Monto numérico
   * @param moneda Símbolo o código de moneda (ej. 'CUP', 'USD', 'MLC')
   */
  const formatearMoneda = (valor: number | null | undefined, moneda: string = 'CUP'): string => {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return `0.00 ${moneda}`
    }

    const formateado = new Intl.NumberFormat('es-CU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor)

    return `${formateado} ${moneda}`
  }

  return {
    formatearMoneda,
  }
}

export default useFormatoMoneda
