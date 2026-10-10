import { describe, expect, it } from 'vitest'
import type { PaymentFormValues } from '../../types'
import { hasErrors, validateField, validateForm } from './validateForm'

// Fixed date so tests never depend on the real clock: October 2026.
const NOW = new Date(2026, 9, 15)

const validValues: PaymentFormValues = {
  name: 'Ana Lopez',
  cardNumber: '4111 1111 1111 1111',
  expiry: '12/30',
  cvv: '123',
  email: 'ana@example.com',
}

describe('validateForm', () => {
  it('returns no errors for valid values', () => {
    const errors = validateForm(validValues, NOW)

    expect(errors).toEqual({
      name: null,
      cardNumber: null,
      expiry: null,
      cvv: null,
      email: null,
    })
    expect(hasErrors(errors)).toBe(false)
  })

  it('returns an error for every field when the form is empty', () => {
    const errors = validateForm(
      { name: '', cardNumber: '', expiry: '', cvv: '', email: '' },
      NOW,
    )

    expect(Object.values(errors).every((error) => typeof error === 'string')).toBe(true)
    expect(hasErrors(errors)).toBe(true)
  })

  it('reports only the fields that are invalid', () => {
    const errors = validateForm({ ...validValues, email: 'not-an-email', expiry: '01/20' }, NOW)

    expect(errors.email).not.toBeNull()
    expect(errors.expiry).not.toBeNull()
    expect(errors.name).toBeNull()
    expect(errors.cardNumber).toBeNull()
    expect(errors.cvv).toBeNull()
    expect(hasErrors(errors)).toBe(true)
  })

  it('uses the card brand to validate the CVV', () => {
    const amex = { ...validValues, cardNumber: '3782 8224 6310 005' }

    expect(validateForm({ ...amex, cvv: '123' }, NOW).cvv).toBe('El CVV debe tener 4 dígitos')
    expect(validateForm({ ...amex, cvv: '1234' }, NOW).cvv).toBeNull()
    expect(validateForm({ ...validValues, cvv: '1234' }, NOW).cvv).toBe(
      'El CVV debe tener 3 dígitos',
    )
  })

  it('accepts the always-declined test card, which is valid by Luhn', () => {
    const errors = validateForm({ ...validValues, cardNumber: '4000 0000 0000 0002' }, NOW)

    expect(hasErrors(errors)).toBe(false)
  })
})

describe('validateField', () => {
  it('validates only the requested field', () => {
    const values = { ...validValues, name: 'Jo', email: 'bad' }

    expect(validateField('name', values, NOW)).toBe('El nombre debe tener al menos 3 caracteres')
    expect(validateField('cardNumber', values, NOW)).toBeNull()
  })

  it('validates the CVV against the current card number', () => {
    const values = { ...validValues, cardNumber: '3782 8224 6310 005', cvv: '123' }

    expect(validateField('cvv', values, NOW)).toBe('El CVV debe tener 4 dígitos')
  })
})

describe('hasErrors', () => {
  it('is true when at least one error exists', () => {
    expect(
      hasErrors({ name: null, cardNumber: null, expiry: 'x', cvv: null, email: null }),
    ).toBe(true)
  })
})
