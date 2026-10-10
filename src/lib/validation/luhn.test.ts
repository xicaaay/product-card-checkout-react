import { describe, expect, it } from 'vitest'
import { isValidLuhn } from './luhn'

describe('isValidLuhn', () => {
  // Well-known test numbers that satisfy the checksum.
  it.each([
    ['Visa', '4111111111111111'],
    ['Mastercard', '5555555555554444'],
    ['Amex (15 digits)', '378282246310005'],
    // The "always declined" card must pass Luhn so it reaches the payment
    // simulation instead of failing form validation.
    ['always-declined test card', '4000000000000002'],
  ])('accepts a valid %s number', (_label, number) => {
    expect(isValidLuhn(number)).toBe(true)
  })

  it('rejects a number with a single digit changed', () => {
    expect(isValidLuhn('4111111111111112')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isValidLuhn('')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(isValidLuhn('4111 abcd')).toBe(false)
  })
})