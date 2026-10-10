import { useState, type SubmitEvent } from 'react'
import { detectBrand, formatCardNumber } from '../../lib/validation/card'
import { getCvvLength } from '../../lib/validation/cvv'
import { formatExpiry } from '../../lib/validation/expiry'
import { hasErrors, validateForm } from '../../lib/validation/validateForm'
import { processPayment } from '../../services/payment'
import type {
  ApprovedPayment,
  PaymentFormField,
  PaymentFormValues,
  PaymentResult,
} from '../../types'
import { CardBrandBadge } from '../CardBrandBadge/CardBrandBadge'
import { FormField } from '../FormField/FormField'
import styles from './PaymentForm.module.css'

type PaymentFormProps = {
  // Only the approved result goes up: it carries the order id and the last 4
  // digits, never the card number or the CVV.
  onSuccess: (payment: ApprovedPayment) => void
  onCancel: () => void
  // Injectable so tests can skip the 1.5 s wait. Defaults to the simulation.
  pay?: (cardNumber: string) => Promise<PaymentResult>
}

type Status = 'idle' | 'processing' | 'declined' | 'error'

// Same order as the fields appear in the form; used to focus the first
// invalid one.
const FIELD_ORDER: PaymentFormField[] = ['name', 'cardNumber', 'expiry', 'cvv', 'email']

const EMPTY_VALUES: PaymentFormValues = {
  name: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  email: '',
}

type Touched = Partial<Record<PaymentFormField, boolean>>

export function PaymentForm({ onSuccess, onCancel, pay = processPayment }: PaymentFormProps) {
  // Security: the full card number and the CVV live ONLY in this state. It is
  // never persisted or logged, and it is cleared before reporting a success.
  const [values, setValues] = useState<PaymentFormValues>(EMPTY_VALUES)
  const [touched, setTouched] = useState<Touched>({})
  const [status, setStatus] = useState<Status>('idle')

  // Errors are derived from the values on every render, never stored, so they
  // cannot go stale (e.g. the CVV rule changes when the brand changes).
  const errors = validateForm(values)
  const brand = detectBrand(values.cardNumber)
  const isProcessing = status === 'processing'

  // An error is only shown for fields the user has already left or tried to
  // submit.
  const visibleError = (field: PaymentFormField) => (touched[field] ? errors[field] : null)

  const handleChange = (field: PaymentFormField, rawValue: string) => {
    let value = rawValue
    if (field === 'cardNumber') value = formatCardNumber(rawValue)
    if (field === 'expiry') value = formatExpiry(rawValue)
    if (field === 'cvv') value = rawValue.replace(/\D/g, '').slice(0, getCvvLength(brand))

    setValues((previous) => ({ ...previous, [field]: value }))
  }

  const handleBlur = (field: PaymentFormField) => {
    setTouched((previous) => ({ ...previous, [field]: true }))
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Guards against a double submit (e.g. pressing Enter while processing).
    if (isProcessing) return

    if (hasErrors(errors)) {
      setTouched({ name: true, cardNumber: true, expiry: true, cvv: true, email: true })
      const firstInvalid = FIELD_ORDER.find((field) => errors[field] !== null)
      // Inputs are looked up by their `name`, so no refs are needed.
      if (firstInvalid) {
        const input = event.currentTarget.elements.namedItem(firstInvalid)
        if (input instanceof HTMLElement) input.focus()
      }
      return
    }

    setStatus('processing')

    try {
      // Only the card number is needed by the payment service.
      const result = await pay(values.cardNumber)

      if (result.status === 'approved') {
        // Wipe the sensitive data before reporting success, even if the parent
        // keeps this form mounted.
        setValues(EMPTY_VALUES)
        setTouched({})
        setStatus('idle')
        onSuccess(result)
        return
      }

      // Declined: keep the form so the user can retry, but drop the CVV.
      setValues((previous) => ({ ...previous, cvv: '' }))
      setTouched((previous) => ({ ...previous, cvv: false }))
      setStatus('declined')
    } catch {
      setStatus('error')
    }
  }

  // Props shared by every input. `name` also lets us find the field to focus
  // on a failed submit.
  const fieldProps = (field: PaymentFormField) => ({
    name: field,
    value: values[field],
    error: visibleError(field),
    onChange: (event: { target: { value: string } }) => handleChange(field, event.target.value),
    onBlur: () => handleBlur(field),
  })

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Datos de pago">
      <FormField
        id="payment-name"
        label="Nombre del titular"
        autoComplete="cc-name"
        autoFocus
        {...fieldProps('name')}
      />

      <FormField
        id="payment-card-number"
        label="Número de tarjeta"
        inputMode="numeric"
        autoComplete="cc-number"
        adornment={<CardBrandBadge brand={brand} />}
        {...fieldProps('cardNumber')}
      />

      <div className={styles.row}>
        <FormField
          id="payment-expiry"
          label="Vencimiento (MM/AA)"
          placeholder="MM/AA"
          inputMode="numeric"
          autoComplete="cc-exp"
          {...fieldProps('expiry')}
        />

        <FormField
          id="payment-cvv"
          label="CVV"
          inputMode="numeric"
          autoComplete="cc-csc"
          {...fieldProps('cvv')}
        />
      </div>

      <FormField
        id="payment-email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        {...fieldProps('email')}
      />

      {status === 'declined' && (
        <p className={styles.alert} role="alert">
          El pago fue rechazado. Revisa los datos o prueba con otra tarjeta.
        </p>
      )}
      {status === 'error' && (
        <p className={styles.alert} role="alert">
          No se pudo procesar el pago. Inténtalo de nuevo.
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Procesando…' : 'Pagar'}
        </button>
        <button
          className={styles.secondary}
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
