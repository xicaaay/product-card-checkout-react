import type {
  PaymentFormErrors,
  PaymentFormField,
  PaymentFormValues,
} from '../../types'
import { detectBrand, validateCardNumber } from './card'
import { validateCvv } from './cvv'
import { validateEmail } from './email'
import { validateExpiry } from './expiry'
import { validateName } from './name'

// Validates one field. The UI calls this on blur, so only the field the user
// just left shows an error. It receives all values because the CVV rule
// depends on the card number (Amex uses 4 digits, the rest use 3).
export function validateField(
  field: PaymentFormField,
  values: PaymentFormValues,
  now: Date = new Date(),
): string | null {
  switch (field) {
    case 'name':
      return validateName(values.name)
    case 'cardNumber':
      return validateCardNumber(values.cardNumber)
    case 'expiry':
      return validateExpiry(values.expiry, now)
    case 'cvv':
      return validateCvv(values.cvv, detectBrand(values.cardNumber))
    case 'email':
      return validateEmail(values.email)
  }
}

// Validates every field. The UI calls this on submit to show all errors at
// once. Built on validateField so each rule lives in a single place.
export function validateForm(
  values: PaymentFormValues,
  now: Date = new Date(),
): PaymentFormErrors {
  return {
    name: validateField('name', values, now),
    cardNumber: validateField('cardNumber', values, now),
    expiry: validateField('expiry', values, now),
    cvv: validateField('cvv', values, now),
    email: validateField('email', values, now),
  }
}

// True when at least one field has an error: the form must not be submitted.
export function hasErrors(errors: PaymentFormErrors): boolean {
  return Object.values(errors).some((error) => error !== null)
}
