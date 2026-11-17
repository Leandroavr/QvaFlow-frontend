import { describe, it, expect } from 'vitest'
import {
  parseToHundredths,
  formatFromHundredths,
  addDecimals,
  subtractDecimals,
  compareDecimals,
  normalizeDecimal,
  multiplyDecimals,
  divideDecimals,
  calculatePercentage,
  isPositiveDecimal,
  roundToInteger,
  ceilToInteger,
  maxDecimal,
} from '../decimal'

describe('Utilidades de aritmética decimal exacta (decimal.ts)', () => {
  it('parseToHundredths y formatFromHundredths manejan positivos, negativos y ceros', () => {
    expect(parseToHundredths('25.50')).toBe(2550n)
    expect(parseToHundredths('0.00')).toBe(0n)
    expect(parseToHundredths('-2.00')).toBe(-200n)
    expect(parseToHundredths('10')).toBe(1000n)
    expect(parseToHundredths('10.5')).toBe(1050n)

    expect(formatFromHundredths(2550n)).toBe('25.50')
    expect(formatFromHundredths(0n)).toBe('0.00')
    expect(formatFromHundredths(-200n)).toBe('-2.00')
  })

  it('suma correctamente sin imprecisiones binarias de punto flotante', () => {
    // En JS estándar: 0.1 + 0.2 = 0.30000000000000004
    expect(addDecimals('0.10', '0.20')).toBe('0.30')
    expect(addDecimals('15.75', '4.25')).toBe('20.00')
    expect(addDecimals('100.00', '0.00')).toBe('100.00')
  })

  it('resta correctamente produciendo diferencias positivas, negativas y cero', () => {
    expect(subtractDecimals('24.00', '22.00')).toBe('2.00')
    expect(subtractDecimals('22.00', '24.00')).toBe('-2.00')
    expect(subtractDecimals('0.00', '8.00')).toBe('-8.00')
    expect(subtractDecimals('10.00', '10.00')).toBe('0.00')
  })

  it('compara adecuadamente cantidades decimales', () => {
    expect(compareDecimals('15.00', '8.00')).toBe(1)
    expect(compareDecimals('8.00', '15.00')).toBe(-1)
    expect(compareDecimals('10.00', '10.00')).toBe(0)
    expect(compareDecimals('0.00', '0')).toBe(0)
    expect(compareDecimals('-2.00', '0.00')).toBe(-1)
  })

  it('normaliza cualquier representación decimal a formato estándar de 2 decimales', () => {
    expect(normalizeDecimal('5')).toBe('5.00')
    expect(normalizeDecimal('5.4')).toBe('5.40')
    expect(normalizeDecimal('5.40')).toBe('5.40')
    expect(normalizeDecimal(0)).toBe('0.00')
  })

  it('multiplica correctamente con redondeo half-up a 2 decimales', () => {
    expect(multiplyDecimals('10.00', '2.50')).toBe('25.00')
    expect(multiplyDecimals('24.00', '450.00')).toBe('10800.00')
    expect(multiplyDecimals('3.33', '3.00')).toBe('9.99')
    expect(multiplyDecimals('1.25', '1.25')).toBe('1.56')
    expect(multiplyDecimals('2.50', '1.50')).toBe('3.75')
    expect(multiplyDecimals('-5.00', '2.00')).toBe('-10.00')
    expect(multiplyDecimals('0.00', '150.00')).toBe('0.00')
  })

  it('divide correctamente con redondeo half-up a 2 decimales y evita división por cero', () => {
    expect(divideDecimals('10.00', '2.00')).toBe('5.00')
    expect(divideDecimals('1.00', '3.00')).toBe('0.33')
    expect(divideDecimals('2.00', '3.00')).toBe('0.67')
    expect(divideDecimals('100.00', '0.00')).toBe('0.00')
    expect(divideDecimals('0.00', '50.00')).toBe('0.00')
    expect(divideDecimals('-10.00', '2.00')).toBe('-5.00')
  })

  it('calcula porcentaje exacto relativo sin divisiones por cero ni errores de coma flotante', () => {
    expect(calculatePercentage('25.00', '100.00')).toBe('25.00')
    expect(calculatePercentage('1.00', '3.00')).toBe('33.33')
    expect(calculatePercentage('2.00', '3.00')).toBe('66.67')
    expect(calculatePercentage('0.00', '100.00')).toBe('0.00')
    expect(calculatePercentage('50.00', '0.00')).toBe('0.00')
    expect(calculatePercentage('-15.00', '100.00')).toBe('-15.00')
  })

  it('isPositiveDecimal identifica estrictamente positivos sin floats ni falsos positivos', () => {
    expect(isPositiveDecimal('0')).toBe(false)
    expect(isPositiveDecimal('0.00')).toBe(false)
    expect(isPositiveDecimal('-5.00')).toBe(false)
    expect(isPositiveDecimal('-0.01')).toBe(false)
    expect(isPositiveDecimal(null)).toBe(false)
    expect(isPositiveDecimal(undefined)).toBe(false)
    expect(isPositiveDecimal('')).toBe(false)
    expect(isPositiveDecimal('   ')).toBe(false)

    expect(isPositiveDecimal('0.01')).toBe(true)
    expect(isPositiveDecimal('10.50')).toBe(true)
    expect(isPositiveDecimal('100')).toBe(true)
    expect(isPositiveDecimal('50000.00')).toBe(true)
  })

  it('ceilToInteger redondea forzadamente hacia arriba al entero superior', () => {
    expect(ceilToInteger('4.12')).toBe('5.00')
    expect(ceilToInteger('4.00')).toBe('4.00')
    expect(ceilToInteger('0.00')).toBe('0.00')
    expect(ceilToInteger('0.01')).toBe('1.00')
    expect(ceilToInteger('-4.12')).toBe('-4.00')
    expect(ceilToInteger('-4.00')).toBe('-4.00')
  })

  it('roundToInteger redondea al entero más cercano con regla half-up simétrica', () => {
    expect(roundToInteger('0.50')).toBe('1.00')
    expect(roundToInteger('0.49')).toBe('0.00')
    expect(roundToInteger('4.12')).toBe('4.00')
    expect(roundToInteger('4.50')).toBe('5.00')
    expect(roundToInteger('4.00')).toBe('4.00')
    expect(roundToInteger('-0.50')).toBe('-1.00')
    expect(roundToInteger('-4.12')).toBe('-4.00')
    expect(roundToInteger('-4.60')).toBe('-5.00')
  })

  it('maxDecimal determina el mayor de múltiples cantidades decimales exactas', () => {
    expect(maxDecimal('350.00', '1.00')).toBe('350.00')
    expect(maxDecimal('1.00', '350.00')).toBe('350.00')
    expect(maxDecimal('-10.00', '-5.00', '0.00')).toBe('0.00')
    expect(maxDecimal('10.00')).toBe('10.00')
  })
})
