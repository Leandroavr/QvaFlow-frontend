import { describe, it, expect } from 'vitest'
import {
  parseToHundredths,
  formatFromHundredths,
  addDecimals,
  subtractDecimals,
  compareDecimals,
  normalizeDecimal,
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
})
