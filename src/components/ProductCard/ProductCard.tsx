import { useState } from 'react'
import { formatCents } from '../../lib/format'
import type { Product } from '../../types'
import { QuantitySelector } from '../QuantitySelector/QuantitySelector'

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
    <article aria-labelledby={titleId}>
      <img src={product.imageUrl} alt={product.title} />
      <h2 id={titleId}>{product.title}</h2>
      <p>{product.description}</p>
      <p>Precio unitario: {formatCents(product.unitPriceCents)}</p>
      <p>{isSoldOut ? 'Agotado' : `Stock disponible: ${product.stock}`}</p>

      <QuantitySelector
        value={quantity}
        max={product.stock}
        onChange={setSelectedQuantity}
        disabled={isSoldOut}
      />

      <p aria-live="polite">
        Total: <strong>{formatCents(totalCents)}</strong>
      </p>

      <button type="button" disabled={isSoldOut} onClick={() => onBuy(quantity)}>
        Comprar
      </button>
    </article>
  )
}
