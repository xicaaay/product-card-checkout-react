// Deliberately simple: something@something.something with no spaces and a
// single "@". A fully RFC-compliant regex is impractical, and the only real
// proof an address works is sending an email to it. This catches typos, which
// is all client-side validation can do.
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Returns an error message, or null when the email format is valid.
export function validateEmail(value: string): string | null {
  const email = value.trim()

  if (email === '') return 'Ingresa tu correo electrónico'

  if (!EMAIL_FORMAT.test(email)) return 'Ingresa un correo electrónico válido'

  return null
}
