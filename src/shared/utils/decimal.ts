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

/**
 * Multiplica dos cantidades decimales exactas: a * b
 * Redondeo matemático a 2 decimales (half-up).
 */
export function multiplyDecimals(
  a: DecimalString | number | string,
  b: DecimalString | number | string
): DecimalString {
  const hA = parseToHundredths(a)
  const hB = parseToHundredths(b)
  const isNegative = hA < 0n !== hB < 0n
  const absA = hA < 0n ? -hA : hA
  const absB = hB < 0n ? -hB : hB

  // (absA * absB) está en 10^4 (diezmilésimas). Para volver a 10^2 (centésimas),
  // dividimos entre 100n aplicando redondeo half-up (+50n).
  const product = absA * absB
  const hundredths = (product + 50n) / 100n
  return formatFromHundredths(isNegative ? -hundredths : hundredths)
}

/**
 * Divide dos cantidades decimales exactas: a / b
 * Redondeo matemático a 2 decimales (half-up).
 * Retorna '0.00' si el divisor b es 0.
 */
export function divideDecimals(
  a: DecimalString | number | string,
  b: DecimalString | number | string
): DecimalString {
  const hA = parseToHundredths(a)
  const hB = parseToHundredths(b)
  if (hB === 0n) return '0.00'

  const isNegative = hA < 0n !== hB < 0n
  const absA = hA < 0n ? -hA : hA
  const absB = hB < 0n ? -hB : hB

  // absA y absB están en centésimas. Multiplicamos por 100n para obtener centésimas
  // tras la división entera, aplicando redondeo half-up (+ absB / 2n).
  const hundredths = (absA * 100n + absB / 2n) / absB
  return formatFromHundredths(isNegative ? -hundredths : hundredths)
}

/**
 * Calcula el porcentaje relativo: (part / total) * 100
 * Redondeo matemático a 2 decimales (half-up).
 * Retorna '0.00' si total <= 0 o part es 0.
 */
export function calculatePercentage(
  part: DecimalString | number | string,
  total: DecimalString | number | string
): DecimalString {
  const hPart = parseToHundredths(part)
  const hTotal = parseToHundredths(total)
  if (hTotal <= 0n || hPart === 0n) return '0.00'

  const isNegative = hPart < 0n
  const absPart = isNegative ? -hPart : hPart

  // (absPart * 10000n + hTotal / 2n) / hTotal calcula el porcentaje en centésimas
  const hundredths = (absPart * 10000n + hTotal / 2n) / hTotal
  return formatFromHundredths(isNegative ? -hundredths : hundredths)
}

/**
 * Determina si una cantidad decimal es estrictamente positiva (> 0.00).
 * Maneja valores nulos, indefinidos o vacíos retornando false.
 * Utiliza comparación entera exacta (BigInt en centésimas) sin aritmética float.
 */
export function isPositiveDecimal(
  val: DecimalString | number | string | null | undefined
): boolean {
  if (val === null || val === undefined) return false
  const str = String(val).trim()
  if (!str) return false
  return parseToHundredths(str) > 0n
}

/**
 * Redondea un importe o cantidad decimal al entero más cercano (half-up simétrico).
 * Retorna siempre un DecimalString con 2 decimales estándar ("0.50" -> "1.00", "4.12" -> "4.00").
 */
export function roundToInteger(val: DecimalString | number | string): DecimalString {
  const h = parseToHundredths(val)
  const isNegative = h < 0n
  const absH = isNegative ? -h : h
  const rounded = (absH + 50n) / 100n
  const resultH = (isNegative ? -rounded : rounded) * 100n
  return formatFromHundredths(resultH)
}

/**
 * Redondea forzadamente hacia arriba (ceil) al entero superior.
 * Retorna siempre un DecimalString con 2 decimales estándar ("4.12" -> "5.00", "4.00" -> "4.00").
 */
export function ceilToInteger(val: DecimalString | number | string): DecimalString {
  const h = parseToHundredths(val)
  if (h >= 0n) {
    const remainder = h % 100n
    const whole = remainder > 0n ? h / 100n + 1n : h / 100n
    return formatFromHundredths(whole * 100n)
  } else {
    const whole = h / 100n
    return formatFromHundredths(whole * 100n)
  }
}

/**
 * Retorna el valor máximo entre dos o más cantidades decimales exactas.
 */
export function maxDecimal(
  first: DecimalString | number | string,
  ...rest: (DecimalString | number | string)[]
): DecimalString {
  let maxH = parseToHundredths(first)
  for (const v of rest) {
    const h = parseToHundredths(v)
    if (h > maxH) {
      maxH = h
    }
  }
  return formatFromHundredths(maxH)
}
