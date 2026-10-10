import { describe, expect, it } from 'vitest'
import { validateEmail } from './email'

describe('validateEmail', () => {
  it.each([
    'ana@example.com',
    'ana.lopez+shop@mail.example.co',
    'a@b.co',
    '  ana@example.com  ',
  ])('accepts "%s"', (value) => {
    expect(validateEmail(value)).toBeNull()
  })

  it.each(['', '   '])('requires a value (%j)', (value) => {
    expect(validateEmail(value)).toBe('Ingresa tu correo electrónico')
  })

  it.each([
    'ana',
    'ana@',
    '@example.com',
    'ana@example',
    'ana@@example.com',
    'ana lopez@example.com',
    'ana@exam ple.com',
  ])('rejects "%s"', (value) => {
    expect(validateEmail(value)).toBe('Ingresa un correo electrónico válido')
  })
})
