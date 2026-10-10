import { useState } from 'react'
import { formatCents } from '../../lib/format'
import type { Product } from '../../types'
import { QuantitySelector } from '../QuantitySelector/QuantitySelector'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  product: Product
  // Reports the chosen quantity so the parent (which owns the stock) knows how
  // many units to discount if the payment is approved.
  onBuy: (quantity: number) => void
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  // Derived during render instead of synced with an effect: if the stock drops
  // below the chosen quantity, the displayed value clamps immediately.
  const quantity = Math.min(selectedQuantity, product.stock)
  const isSoldOut = product.stock === 0

  // The total is computed, not stored in state, so it can never get out of
  // sync with the quantity. Integer math, in cents.
  const totalCents = product.unitPriceCents * quantity

  const titleId = `product-${product.id}-title`

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <img className={styles.image} src={product.imageUrl} alt={product.title} />

      <div className={styles.details}>
        <h2 className={styles.title} id={titleId}>
          {product.title}
        </h2>
        <p className={styles.description}>{product.description}</p>
        <p className={styles.price}>Precio unitario: {formatCents(product.unitPriceCents)}</p>
        <p className={isSoldOut ? styles.soldOut : styles.stock}>
          {isSoldOut ? 'Agotado' : `Stock disponible: ${product.stock}`}
        </p>

        <QuantitySelector
          value={quantity}
          max={product.stock}
          onChange={setSelectedQuantity}
          disabled={isSoldOut}
        />

        <p className={styles.total} aria-live="polite">
          Total: <strong>{formatCents(totalCents)}</strong>
        </p>

        <button
          className={styles.buy}
          type="button"
          disabled={isSoldOut}
          onClick={() => onBuy(quantity)}
        >
          Comprar
        </button>
      </div>
    </article>
  )
}
