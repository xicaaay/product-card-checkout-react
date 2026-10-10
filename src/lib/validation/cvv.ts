import type { CardBrand } from '../../types'

// Amex uses a 4-digit CVV; every other brand (and 'unknown') uses 3.
// Exported so the UI can reuse it, e.g. for the input's maxLength.
export function getCvvLength(brand: CardBrand): number {
  return brand === 'amex' ? 4 : 3
}

// Returns an error message, or null when the CVV is valid.
// Depends on the card brand, so changing the card number must re-run it.
export function validateCvv(value: string, brand: CardBrand): string | null {
  if (value === '') return 'Ingresa el CVV'

  if (!/^\d+$/.test(value)) return 'El CVV solo debe contener números'

  const length = getCvvLength(brand)
  if (value.length !== length) return `El CVV debe tener ${length} dígitos`

  return null
}
