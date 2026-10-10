import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

// Integration tests: the real App, real components, real validation and the
// real approve/decline rule. The only change is the simulated latency, which is
// set to 0 so tests do not wait 1.5 s each. The 1.5 s itself is covered by the
// unit test of the payment service.
vi.mock('../services/payment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/payment')>()
  return {
    ...actual,
    processPayment: (cardNumber: string) => actual.processPayment(cardNumber, 0),
  }
})

type User = ReturnType<typeof userEvent.setup>

const VALID_CARD = '4111111111111111'
const DECLINED_CARD = '4000000000000002'

const increase = () => screen.getByRole('button', { name: 'Aumentar cantidad' })
const buy = () => screen.getByRole('button', { name: 'Comprar' })
const pay = () => screen.getByRole('button', { name: 'Pagar' })

async function fillPaymentForm(user: User, cardNumber: string) {
  await user.type(screen.getByLabelText('Nombre del titular'), 'Ana Lopez')
  await user.type(screen.getByLabelText('Número de tarjeta'), cardNumber)
  // 12/99 never expires, so the test does not depend on the current date.
  await user.type(screen.getByLabelText(/Vencimiento/), '1299')
  await user.type(screen.getByLabelText('CVV'), '123')
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('checkout flow', () => {
  it('buys 2 units with an approved card and decreases the stock', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText(/Stock disponible: 5/)).toBeInTheDocument()

    await user.click(increase())
    await user.click(buy())

    // Payment screen with the order summary.
    expect(screen.getByRole('heading', { name: 'Pago' })).toBeInTheDocument()
    expect(screen.getByText(/Total a pagar/)).toHaveTextContent(/9\.50/)

    await fillPaymentForm(user, VALID_CARD)
    await user.click(pay())

    // Success screen: order number and last 4 digits.
    expect(await screen.findByRole('heading', { name: '¡Pago aprobado!' })).toBeInTheDocument()
    expect(screen.getByText(/Número de orden: ORD-[0-9A-F]{8}/)).toBeInTheDocument()
    expect(screen.getByText(/Tarjeta terminada en 1111/)).toBeInTheDocument()

    // Back to the shop: the stock went from 5 to 3.
    await user.click(screen.getByRole('button', { name: 'Volver a la tienda' }))
    expect(screen.getByText(/Stock disponible: 3/)).toBeInTheDocument()
  })

  it('shows an error when the card is declined, keeps the stock, and allows a retry', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(buy())
    await fillPaymentForm(user, DECLINED_CARD)
    await user.click(pay())

    expect(await screen.findByText(/El pago fue rechazado/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '¡Pago aprobado!' })).not.toBeInTheDocument()
    expect(pay()).toBeEnabled()

    // Retry with a different card (the CVV was cleared after the decline).
    await user.clear(screen.getByLabelText('Número de tarjeta'))
    await user.type(screen.getByLabelText('Número de tarjeta'), VALID_CARD)
    await user.type(screen.getByLabelText('CVV'), '123')
    await user.click(pay())

    expect(await screen.findByRole('heading', { name: '¡Pago aprobado!' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Volver a la tienda' }))
    // Only the approved payment (1 unit) discounted the stock.
    expect(screen.getByText(/Stock disponible: 4/)).toBeInTheDocument()
  })

  it('does not submit an invalid form and shows the errors', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(buy())
    await user.click(pay())

    expect(screen.getAllByRole('alert')).toHaveLength(5)
    expect(screen.getByRole('heading', { name: 'Pago' })).toBeInTheDocument()
  })

  it('cancels the payment and returns to the product without changing the stock', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(buy())
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('heading', { name: /Cono de helado/ })).toBeInTheDocument()
    expect(screen.getByText(/Stock disponible: 5/)).toBeInTheDocument()
  })

  it('shows the product as sold out after buying the whole stock', async () => {
    const user = userEvent.setup()
    render(<App />)

    for (let i = 0; i < 4; i++) await user.click(increase())
    await user.click(buy())
    await fillPaymentForm(user, VALID_CARD)
    await user.click(pay())
    await user.click(await screen.findByRole('button', { name: 'Volver a la tienda' }))

    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(buy()).toBeDisabled()
  })
})

describe('checkout security', () => {
  it('leaves no card number or CVV on the page, in storage or in the logs after paying', async () => {
    const consoleLog = vi.spyOn(console, 'log')
    const user = userEvent.setup()
    render(<App />)

    await user.click(buy())
    await fillPaymentForm(user, VALID_CARD)
    await user.click(pay())
    await screen.findByRole('heading', { name: '¡Pago aprobado!' })

    // Not rendered anywhere: only the last 4 digits appear.
    expect(document.body.textContent).not.toContain(VALID_CARD)
    expect(document.body.textContent).not.toContain('4111 1111 1111 1111')
    expect(document.body.textContent).toContain('1111')
    // The form (and its state) is gone, so no input still holds the values.
    expect(document.querySelectorAll('input')).toHaveLength(0)
    // Not persisted.
    expect(localStorage).toHaveLength(0)
    expect(sessionStorage).toHaveLength(0)
    // Not logged.
    expect(consoleLog).not.toHaveBeenCalled()
  })
})
