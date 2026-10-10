import { describe, expect, it } from 'vitest'
import { formatExpiry, validateExpiry } from './expiry'

// Fixed date so tests never depend on the real clock: October 2026.
// Months are 0-based in Date, so 9 = October.
const NOW = new Date(2026, 9, 15)

describe('formatExpiry', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['122', '12/2'],
    ['1228', '12/28'],
    ['12/28', '12/28'],
    ['12/2', '12/2'],
    ['12/', '12'],
    ['1a2b28', '12/28'],
    ['122899', '12/28'],
  ])('formats "%s" as "%s"', (input, expected) => {
    expect(formatExpiry(input)).toBe(expected)
  })
})

describe('validateExpiry', () => {
  it.each([
    ['the current month', '10/26'],
    ['a later month this year', '12/26'],
    ['next year', '01/27'],
    ['a far future date', '12/40'],
  ])('accepts %s', (_label, value) => {
    expect(validateExpiry(value, NOW)).toBeNull()
  })

  it.each([
    ['the previous month', '09/26'],
    ['last year', '12/25'],
  ])('rejects %s as expired', (_label, value) => {
    expect(validateExpiry(value, NOW)).toBe('La tarjeta está vencida')
  })

  it.each(['13/28', '00/28'])('rejects invalid month in %s', (value) => {
    expect(validateExpiry(value, NOW)).toBe('El mes debe estar entre 01 y 12')
  })

  it.each(['1/28', '10/2026', 'ab/cd', '1028', '10-28'])(
    'rejects wrong format in "%s"',
    (value) => {
      expect(validateExpiry(value, NOW)).toBe('Usa el formato MM/AA')
    },
  )

  it('requires a value', () => {
    expect(validateExpiry('', NOW)).toBe('Ingresa la fecha de vencimiento')
    expect(validateExpiry('   ', NOW)).toBe('Ingresa la fecha de vencimiento')
  })

  it('uses the real date when none is given', () => {
    expect(validateExpiry('01/20')).toBe('La tarjeta está vencida')
  })
})
