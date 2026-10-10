import { describe, expect, it } from 'vitest'
import { validateName } from './name'

describe('validateName', () => {
  it.each([
    ['a simple name', 'Ana Lopez'],
    ['accents and ñ', 'José Núñez'],
    ['the 3-character minimum', 'Ana'],
    ['surrounding spaces', '  Ana  '],
    ['an accent stored as a combining mark', 'José'],
  ])('accepts %s', (_label, value) => {
    expect(validateName(value)).toBeNull()
  })

  it.each(['', '   '])('requires a value (%j)', (value) => {
    expect(validateName(value)).toBe('Ingresa el nombre del titular')
  })

  it.each(['Ana123', 'J0hn', 'Ana-Maria', "O'Brien", 'Ana_', 'Ana.'])(
    'rejects characters other than letters and spaces in "%s"',
    (value) => {
      expect(validateName(value)).toBe('El nombre solo puede contener letras y espacios')
    },
  )

  it.each(['Jo', 'A', ' Jo '])('rejects names shorter than 3 characters: "%s"', (value) => {
    expect(validateName(value)).toBe('El nombre debe tener al menos 3 caracteres')
  })
})
