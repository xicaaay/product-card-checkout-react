type QuantitySelectorProps = {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

const MIN_QUANTITY = 1

// Presentational component: it holds no state, the parent owns the quantity.
// There is no free-text input on purpose: with buttons that disable at the
// limits, an invalid quantity (0, text, above stock) cannot be entered at all.
export function QuantitySelector({
  value,
  max,
  onChange,
  disabled = false,
}: QuantitySelectorProps) {
  return (
    <div role="group" aria-label="Cantidad">
      <button
        type="button"
        aria-label="Disminuir cantidad"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= MIN_QUANTITY}
      >
        −
      </button>
      {/* <output> is a live region, so screen readers announce changes. */}
      <output aria-label="Cantidad seleccionada">{value}</output>
      <button
        type="button"
        aria-label="Aumentar cantidad"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
      >
        +
      </button>
    </div>
  )
}
