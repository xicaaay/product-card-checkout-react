import { sanitizeCardNumber } from '../lib/validation/card'
import type { PaymentResult } from '../types'

// Simulated network latency required by the spec (~1.5 s).
export const PAYMENT_DELAY_MS = 1500

// Test card that is always declined. It passes the Luhn check, so it gets past
// form validation and is rejected here, like a real issuer would.
export const DECLINED_TEST_CARD = '4000000000000002'

function generateOrderId(): string {
  return `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

// Simulates an asynchronous payment. There is no backend: the outcome is
// deterministic (only DECLINED_TEST_CARD is rejected) so tests never flake.
//
// Security: it receives ONLY the card number, because that is all the
// simulation needs. The CVV, name and email never reach this function, and the
// result exposes just the last 4 digits, never the full number.
//
// `delayMs` is a parameter so tests can pass 0 instead of waiting 1.5 s.
export async function processPayment(
  cardNumber: string,
  delayMs: number = PAYMENT_DELAY_MS,
): Promise<PaymentResult> {
  const digits = sanitizeCardNumber(cardNumber)

  await new Promise((resolve) => setTimeout(resolve, delayMs))

  if (digits === DECLINED_TEST_CARD) {
    return { status: 'declined', reason: 'card_declined' }
  }

  return { status: 'approved', orderId: generateOrderId(), last4: digits.slice(-4) }
}
