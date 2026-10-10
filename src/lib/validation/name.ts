const MIN_NAME_LENGTH = 3

// \p{L} matches letters of any alphabet (including accents and ñ) and \p{M}
// matches combining marks, so "José" and "Núñez" are accepted even when the
// accent is stored as a separate character. [a-zA-Z] would reject them.
// The "u" flag is required for Unicode property escapes.
const LETTERS_AND_SPACES = /^[\p{L}\p{M} ]+$/u

// Returns an error message, or null when the cardholder name is valid.
// Rules: required, letters and spaces only, at least 3 characters.
export function validateName(value: string): string | null {
  // Surrounding spaces are ignored, so "  ab " does not count as 4 characters.
  const name = value.trim()

  if (name === '') return 'Ingresa el nombre del titular'

  if (!LETTERS_AND_SPACES.test(name)) {
    return 'El nombre solo puede contener letras y espacios'
  }

  if (name.length < MIN_NAME_LENGTH) {
    return `El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`
  }

  return null
}
