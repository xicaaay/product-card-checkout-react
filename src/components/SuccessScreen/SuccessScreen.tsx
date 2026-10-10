import { useEffect, useRef } from 'react'
import { formatCents } from '../../lib/format'
import type { ApprovedPayment } from '../../types'
import styles from './SuccessScreen.module.css'

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
    <section className={styles.panel} aria-labelledby="success-title">
      <h2 className={styles.title} id="success-title" ref={headingRef} tabIndex={-1}>
        ¡Pago aprobado!
      </h2>
      <p className={styles.detail}>Número de orden: {payment.orderId}</p>
      <p className={styles.detail}>Tarjeta terminada en {payment.last4}</p>
      <p className={styles.detail}>
        {quantity} × {productTitle}
      </p>
      <p className={styles.total}>
        Total pagado: <strong>{formatCents(totalCents)}</strong>
      </p>
      <button className={styles.button} type="button" onClick={onContinue}>
        Volver a la tienda
      </button>
    </section>
  )
}
