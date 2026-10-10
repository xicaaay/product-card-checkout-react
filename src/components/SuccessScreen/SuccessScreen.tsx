import { useEffect, useRef } from 'react'
import { formatCents } from '../../lib/format'
import type { ApprovedPayment } from '../../types'

type SuccessScreenProps = {
  // Security: ApprovedPayment only has the order id and the last 4 digits, so
  // this screen has no way to show (or leak) the full card number.
  payment: ApprovedPayment
  productTitle: string
  quantity: number
  totalCents: number
  onContinue: () => void
}

export function SuccessScreen({
  payment,
  productTitle,
  quantity,
  totalCents,
  onContinue,
}: SuccessScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // The screen replaces the previous one, so move focus to its heading: screen
  // reader and keyboard users land on the new content instead of on nothing.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="success-title">
      <h2 id="success-title" ref={headingRef} tabIndex={-1}>
        ¡Pago aprobado!
      </h2>
      <p>Número de orden: {payment.orderId}</p>
      <p>Tarjeta terminada en {payment.last4}</p>
      <p>
        {quantity} × {productTitle}
      </p>
      <p>
        Total pagado: <strong>{formatCents(totalCents)}</strong>
      </p>
      <button type="button" onClick={onContinue}>
        Volver a la tienda
      </button>
    </section>
  )
}
