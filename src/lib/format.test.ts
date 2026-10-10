import { describe, expect, it } from 'vitest'
import { formatCents } from './format'

// Intl may use a non-breaking space between the symbol and the amount, which
// differs between environments. Normalizing whitespace keeps tests stable.
const normalize = (text: string) => text.replace(/\s/g, ' ')

describe('formatCents', () => {
  it.each([
    [475, 'Q 4.75'],
    [0, 'Q 0.00'],
    [5, 'Q 0.05'],
    [100, 'Q 1.00'],
    [123450, 'Q 1,234.50'],
  ])('formats %i cents as "%s"', (cents, expected) => {
    expect(normalize(formatCents(cents))).toBe(expected)
  })

  it('formats a total computed with integer math without rounding errors', () => {
    // 3 units at 475 cents each.
    expect(normalize(formatCents(3 * 475))).toBe('Q 14.25')
  })
})
