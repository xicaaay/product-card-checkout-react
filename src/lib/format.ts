// Display settings. Change them here to switch currency or number format.
const LOCALE = 'es-GT'
const CURRENCY = 'GTQ'

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
})

// Money is stored as integer cents to avoid floating-point rounding errors
// (e.g. 0.1 + 0.2 !== 0.3). This is the only place cents become a decimal
// amount, and only for display. Example: 475 -> "Q 4.75".
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100)
}
