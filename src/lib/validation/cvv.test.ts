import { describe, expect, it } from 'vitest'
import { getCvvLength, validateCvv } from './cvv'

describe('getCvvLength', () => {
  it.each([
    ['visa', 3],
    ['mastercard', 3],
    ['amex', 4],
    ['unknown', 3],
  ] as const)('returns the length for %s', (brand, length) => {
    expect(getCvvLength(brand)).toBe(length)
  })
})

describe('validateCvv', () => {
  it.each([
    ['visa', '123'],
    ['mastercard', '000'],
    ['unknown', '123'],
    ['amex', '1234'],
  ] as const)('accepts a valid %s CVV', (brand, cvv) => {
    expect(validateCvv(cvv, brand)).toBeNull()
  })

  it('requires a value', () => {
    expect(validateCvv('', 'visa')).toBe('Ingresa el CVV')
  })

  it('rejects non-digit characters', () => {
    expect(validateCvv('12a', 'visa')).toBe('El CVV solo debe contener números')
    expect(validateCvv('1 2', 'visa')).toBe('El CVV solo debe contener números')
  })

  it('rejects the wrong length for non-Amex brands', () => {
    expect(validateCvv('12', 'visa')).toBe('El CVV debe tener 3 dígitos')
    expect(validateCvv('1234', 'visa')).toBe('El CVV debe tener 3 dígitos')
  })

  it('requires exactly 4 digits for Amex', () => {
    expect(validateCvv('123', 'amex')).toBe('El CVV debe tener 4 dígitos')
    expect(validateCvv('12345', 'amex')).toBe('El CVV debe tener 4 dígitos')
  })
})
