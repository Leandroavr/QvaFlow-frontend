/**
 * Tipos de moneda e importes en QvaFlow.
 * 
 * Regla arquitectural de precisión financiera:
 * Los importes monetarios se manejan como string decimal (ej: "1250.50", "0.00")
 * para evitar imprecisiones de coma flotante en JavaScript (0.1 + 0.2 !== 0.3).
 */

export type Currency = 'USD' | 'CUP' | 'CUP_TRANSFER' | 'MLC'

/**
 * Representación decimal exacta de una cantidad monetaria como string.
 */
export type DecimalString = string

export interface CurrencyConfig {
  code: Currency
  symbol: string
  label: string
  isCash: boolean
  isBaseCurrency?: boolean
}

export const SUPPORTED_CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'Dólares Estadounidenses (USD)',
    isCash: true,
    isBaseCurrency: true,
  },
  CUP: {
    code: 'CUP',
    symbol: '₱',
    label: 'Pesos Cubanos en Efectivo (CUP)',
    isCash: true,
  },
  CUP_TRANSFER: {
    code: 'CUP_TRANSFER',
    symbol: '₱ (Transf.)',
    label: 'Transferencia Nacional (EnZona / Transfermóvil)',
    isCash: false,
  },
  MLC: {
    code: 'MLC',
    symbol: 'MLC',
    label: 'Moneda Libremente Convertible (Tarjeta)',
    isCash: false,
  },
}
