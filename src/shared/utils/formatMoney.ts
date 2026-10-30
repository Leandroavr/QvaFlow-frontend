import type { Currency, DecimalString } from '../types/currency'
import { SUPPORTED_CURRENCIES } from '../types/currency'

/**
 * Formatea importes monetarios preservando la precisión exacta de los decimales.
 *
 * @param amount Cantidad como string decimal ("1200.50") o número
 * @param currency Código de moneda admitida ('USD' | 'CUP' | 'CUP_TRANSFER' | 'MLC')
 * @returns Cadena con formato visual (ej: "$ 1,200.50", "₱ 450.00")
 */
export function formatMoney(
  amount: DecimalString | number | null | undefined,
  currency: Currency = 'USD'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—'
  }

  // Normalizar a string decimal
  let strVal = typeof amount === 'number' ? amount.toFixed(2) : String(amount).trim()

  // Separar signo, parte entera y decimal
  const isNegative = strVal.startsWith('-')
  if (isNegative) {
    strVal = strVal.substring(1)
  }

  const [rawInt = '0', rawDec = '00'] = strVal.split('.')
  // Rellenar o recortar a 2 decimales para divisas estándar
  const formattedDec = (rawDec + '00').substring(0, 2)

  // Separador de miles con coma
  const formattedInt = rawInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const currencyConfig = SUPPORTED_CURRENCIES[currency] || { symbol: currency }
  const sign = isNegative ? '-' : ''

  return `${sign}${currencyConfig.symbol} ${formattedInt}.${formattedDec}`
}

/**
 * Parsea un input monetario ingresado por el usuario y lo convierte en string decimal limpio.
 */
export function parseMoneyInput(input: string): DecimalString {
  const cleaned = input.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`
  }
  return cleaned
}
