import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina nombres de clases condicionales con clsx y resuelve conflictos de Tailwind con twMerge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
