import { describe, expect, it } from 'vitest'
import {
  detectBrand,
  formatCardNumber,
  sanitizeCardNumber,
  validateCardNumber,
} from './card'

describe('sanitizeCardNumber', () => {
  it('removes spaces, dashes and letters', () => {
    expect(sanitizeCardNumber('4111 1111-1111 abc')).toBe('411111111111')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeCardNumber('')).toBe('')
  })
})

describe('detectBrand', () => {
  it.each([
    ['4111111111111111', 'visa'],
    ['4', 'visa'],
    ['5100000000000000', 'mastercard'],
    ['5500000000000000', 'mastercard'],
    ['2221000000000000', 'mastercard'],
    ['2720000000000000', 'mastercard'],
    ['340000000000000', 'amex'],
    ['370000000000000', 'amex'],
  ])('detects %s as %s', (number, brand) => {
    expect(detectBrand(number)).toBe(brand)
  })

  // Boundaries of the Mastercard 2221-2720 range and nearby prefixes.
  it.each(['2220000000000000', '2721000000000000', '5000000000000000', '5600000000000000', '350000000000000'])(
    'returns unknown for %s',
    (number) => {
      expect(detectBrand(number)).toBe('unknown')
    },
  )

  it('returns unknown for empty input and for incomplete 2xxx prefixes', () => {
    expect(detectBrand('')).toBe('unknown')
    expect(detectBrand('222')).toBe('unknown')
  })

  it('ignores spaces in the input', () => {
    expect(detectBrand('4111 1111')).toBe('visa')
  })
})

describe('formatCardNumber', () => {
  it('does not add a trailing space after a full group', () => {
    expect(formatCardNumber('1234')).toBe('1234')
  })

  it('groups digits in blocks of 4', () => {
    expect(formatCardNumber('12345')).toBe('1234 5')
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111')
  })

  it('reformats input that already has spaces and ignores letters', () => {
    expect(formatCardNumber('4111 11a11 1111')).toBe('4111 1111 1111')
  })

  it('caps the result at 19 digits', () => {
    expect(formatCardNumber('12345678901234567890123')).toBe('1234 5678 9012 3456 789')
  })

  it('returns an empty string for empty input', () => {
    expect(formatCardNumber('')).toBe('')
  })
})

describe('validateCardNumber', () => {
  it.each([
    ['16 digits', '4111 1111 1111 1111'],
    ['15 digits (Amex)', '378282246310005'],
    ['13 digits', '4222222222222'],
    ['the always-declined test card', '4000 0000 0000 0002'],
  ])('accepts %s', (_label, number) => {
    expect(validateCardNumber(number)).toBeNull()
  })

  it('requires a value', () => {
    expect(validateCardNumber('')).toBe('Ingresa el número de tarjeta')
  })

  it('rejects numbers that are too short or too long', () => {
    expect(validateCardNumber('411111111111')).toBe('El número debe tener entre 13 y 19 dígitos')
    expect(validateCardNumber('41111111111111111111')).toBe(
      'El número debe tener entre 13 y 19 dígitos',
    )
  })

  it('rejects numbers that fail the Luhn check', () => {
    expect(validateCardNumber('4111 1111 1111 1112')).toBe('El número de tarjeta no es válido')
  })
})