// Inserts the "/" while the user types: "1228" -> "12/28".
// Keeps only digits, caps at 4 and adds no slash until a third digit exists,
// so deleting the slash with backspace does not get stuck.
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

// Returns an error message, or null when the expiry date is valid.
// `now` is a parameter (defaulting to the real date) so tests can use a fixed
// date instead of depending on the system clock.
export function validateExpiry(value: string, now: Date = new Date()): string | null {
  if (value.trim() === '') return 'Ingresa la fecha de vencimiento'

  if (!/^\d{2}\/\d{2}$/.test(value)) return 'Usa el formato MM/AA'

  const month = Number(value.slice(0, 2))
  // Two-digit year is read as 20YY.
  const year = 2000 + Number(value.slice(3, 5))

  if (month < 1 || month > 12) return 'El mes debe estar entre 01 y 12'

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // A card is valid through the END of its expiry month, so the current month
  // still counts as valid.
  const isExpired = year < currentYear || (year === currentYear && month < currentMonth)
  if (isExpired) return 'La tarjeta está vencida'

  return null
}
