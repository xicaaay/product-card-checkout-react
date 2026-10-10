import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SuccessScreen } from './SuccessScreen'

const payment = { status: 'approved', orderId: 'ORD-ABC12345', last4: '1111' } as const

function renderScreen(onContinue = () => {}) {
  render(
    <SuccessScreen
      payment={payment}
      productTitle="Producto de prueba"
      quantity={3}
      totalCents={1425}
      onContinue={onContinue}
    />,
  )
}

describe('SuccessScreen', () => {
  it('shows the order number and the last 4 digits', () => {
    renderScreen()

    expect(screen.getByRole('heading', { name: '¡Pago aprobado!' })).toBeInTheDocument()
    expect(screen.getByText(/ORD-ABC12345/)).toBeInTheDocument()
    expect(screen.getByText(/Tarjeta terminada en 1111/)).toBeInTheDocument()
  })

  it('shows what was bought and the total paid', () => {
    renderScreen()

    expect(screen.getByText(/3 × Producto de prueba/)).toBeInTheDocument()
    expect(screen.getByText(/Total pagado/)).toHaveTextContent(/14\.25/)
  })

  it('moves focus to the heading', () => {
    renderScreen()

    expect(screen.getByRole('heading', { name: '¡Pago aprobado!' })).toHaveFocus()
  })

  it('calls onContinue', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    renderScreen(onContinue)

    await user.click(screen.getByRole('button', { name: 'Volver a la tienda' }))

    expect(onContinue).toHaveBeenCalledOnce()
  })
})
