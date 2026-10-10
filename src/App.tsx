import { useState } from 'react'
import './App.css'
import { PaymentForm } from './components/PaymentForm/PaymentForm'
import { ProductCard } from './components/ProductCard/ProductCard'
import { SuccessScreen } from './components/SuccessScreen/SuccessScreen'
import { product as initialProduct } from './data/product'
import { formatCents } from './lib/format'
import type { ApprovedPayment } from './types'

// Each screen is one state, so impossible combinations (paying and showing the
// success screen at once) cannot exist. Each state carries only what it needs;
// note that no state holds card data, only the approved result.
type Screen =
  | { name: 'browsing' }
  | { name: 'paying'; quantity: number }
  | { name: 'success'; payment: ApprovedPayment; quantity: number }

function App() {
  // The stock lives here because it must survive between screens: it drops
  // when a payment is approved and the product card reads it afterwards.
  const [stock, setStock] = useState(initialProduct.stock)
  const [screen, setScreen] = useState<Screen>({ name: 'browsing' })

  const product = { ...initialProduct, stock }

  const handleApproved = (payment: ApprovedPayment, quantity: number) => {
    setStock((current) => Math.max(0, current - quantity))
    setScreen({ name: 'success', payment, quantity })
  }

  return (
    <main>
      <h1>Checkout</h1>

      {screen.name === 'browsing' && (
        <ProductCard
          product={product}
          onBuy={(quantity) => setScreen({ name: 'paying', quantity })}
        />
      )}

      {screen.name === 'paying' && (
        <section aria-labelledby="payment-title">
          <h2 id="payment-title">Pago</h2>
          <p>
            {screen.quantity} × {product.title}
          </p>
          <p>
            Total a pagar:{' '}
            <strong>{formatCents(product.unitPriceCents * screen.quantity)}</strong>
          </p>
          <PaymentForm
            onSuccess={(payment) => handleApproved(payment, screen.quantity)}
            onCancel={() => setScreen({ name: 'browsing' })}
          />
        </section>
      )}

      {screen.name === 'success' && (
        <SuccessScreen
          payment={screen.payment}
          productTitle={product.title}
          quantity={screen.quantity}
          totalCents={product.unitPriceCents * screen.quantity}
          onContinue={() => setScreen({ name: 'browsing' })}
        />
      )}
    </main>
  )
}

export default App
