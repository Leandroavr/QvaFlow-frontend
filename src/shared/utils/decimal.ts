import type { DecimalString } from '@/shared/types/currency'

/**
 * Utilidades para aritmética decimal exacta con 2 decimales para inventario y moneda.
 * Evita problemas de precisión de punto flotante de JavaScript mediante aritmética entera (BigInt en centésimas).
 */

/**
 * Convierte un string decimal a centésimas (BigInt).
 * Admite formatos: "12", "12.5", "12.50", "-2.00", "0", etc.
 */
export function parseToHundredths(val: DecimalString | number | string): bigint {
  const str = String(val ?? '0').trim()
  if (!str) return 0n

  const isNegative = str.startsWith('-')
  const abs = isNegative ? str.slice(1) : str
  const parts = abs.split('.')
  const wholeStr = parts[0] || '0'
  const fractionStr = (parts[1] || '').padEnd(2, '0').slice(0, 2)

  const whole = BigInt(wholeStr)
  const fraction = BigInt(fractionStr)
  const hundredths = whole * 100n + fraction

  return isNegative ? -hundredths : hundredths
}

/**
 * Convierte centésimas (BigInt) a string decimal formateado con 2 decimales ("0.00", "12.50", "-2.00").
 */
export function formatFromHundredths(hundredths: bigint): DecimalString {
  const isNegative = hundredths < 0n
  const abs = isNegative ? -hundredths : hundredths
  const whole = abs / 100n
  const fraction = abs % 100n
  const fractionStr = fraction.toString().padStart(2, '0')

  return `${isNegative ? '-' : ''}${whole.toString()}.${fractionStr}`
}

/**
 * Suma dos cantidades decimales exactas: a + b
 */
export function addDecimals(a: DecimalString | string, b: DecimalString | string): DecimalString {
  return formatFromHundredths(parseToHundredths(a) + parseToHundredths(b))
}

/**
 * Resta dos cantidades decimales exactas: a - b
 */
export function subtractDecimals(
  a: DecimalString | string,
  b: DecimalString | string
): DecimalString {
  return formatFromHundredths(parseToHundredths(a) - parseToHundredths(b))
}

/**
 * Compara dos cantidades decimales exactas:
 * Retorna 1 si a > b, -1 si a < b, 0 si a === b
 */
export function compareDecimals(a: DecimalString | string, b: DecimalString | string): number {
  const diff = parseToHundredths(a) - parseToHundredths(b)
  if (diff > 0n) return 1
  if (diff < 0n) return -1
  return 0
}

/**
 * Normaliza cualquier string numérico a string decimal con 2 decimales estándar ("10" -> "10.00").
 */
export function normalizeDecimal(val: DecimalString | number | string): DecimalString {
  return formatFromHundredths(parseToHundredths(val))
}
