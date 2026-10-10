import type { CardBrand } from '../../types'
import { isValidLuhn } from './luhn'

// Length limits required by the spec (13-19 digits).
const MIN_CARD_LENGTH = 13
const MAX_CARD_LENGTH = 19

// Removes everything that is not a digit (spaces, dashes, letters).
// Single place where cleaning happens; the other functions build on it.
export function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, '')
}

// Detects the brand from the prefix while the user types.
// Returns 'unknown' when there is not enough input or no rule matches.
export function detectBrand(value: string): CardBrand {
  const digits = sanitizeCardNumber(value)

  // Visa: starts with 4.
  if (digits.startsWith('4')) return 'visa'

  // Amex: 34 or 37.
  if (/^3[47]/.test(digits)) return 'amex'

  // Mastercard (old range): 51 to 55.
  if (/^5[1-5]/.test(digits)) return 'mastercard'

  // Mastercard (new range): 2221 to 2720. Compared as a number instead of a
  // regex, which would be long and fragile. It needs the first 4 digits, so
  // shorter input stays 'unknown'.
  if (digits.length >= 4) {
    const prefix = Number(digits.slice(0, 4))
    if (prefix >= 2221 && prefix <= 2720) return 'mastercard'
  }

  return 'unknown'
}

// Formats digits in groups of 4 separated by spaces, as the user types.
// Caps at 19 digits and adds no trailing space, so backspace feels natural.
export function formatCardNumber(value: string): string {
  const digits = sanitizeCardNumber(value).slice(0, MAX_CARD_LENGTH)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Returns an error message, or null when the number is valid.
export function validateCardNumber(value: string): string | null {
  const digits = sanitizeCardNumber(value)

  if (digits.length === 0) return 'Ingresa el número de tarjeta'

  if (digits.length < MIN_CARD_LENGTH || digits.length > MAX_CARD_LENGTH) {
    return 'El número debe tener entre 13 y 19 dígitos'
  }

  if (!isValidLuhn(digits)) return 'El número de tarjeta no es válido'

  return null
}
