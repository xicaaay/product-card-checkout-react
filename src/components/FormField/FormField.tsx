import type { ComponentProps, ReactNode } from 'react'
import styles from './FormField.module.css'

type FormFieldProps = Omit<
  ComponentProps<'input'>,
  'id' | 'aria-invalid' | 'aria-describedby'
> & {
  id: string
  label: string
  // Message to show, or null. The parent decides WHEN to show it (e.g. only
  // after blur); this component just renders what it receives.
  error: string | null
  // Optional content next to the input, e.g. the detected card brand.
  adornment?: ReactNode
}

// Label + input + error message. It centralizes the basic accessibility wiring
// so it is written once instead of once per field: the label is associated
// with the input, and the error is announced and linked with aria-describedby.
// Every other prop (value, onChange, onBlur, ref...) goes to the input.
export function FormField({ id, label, error, adornment, ...inputProps }: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          {...inputProps}
          id={id}
          aria-invalid={error !== null}
          aria-describedby={error !== null ? errorId : undefined}
        />
        {adornment}
      </div>
      {/* The slot keeps its height when empty, so an error appearing on blur
          does not shift the layout and swallow the click on the next button. */}
      <div className={styles.errorSlot}>
        {error !== null && (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>

    </div>
  )
}
