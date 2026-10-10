import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PaymentResult } from '../../types'
import { PaymentForm } from './PaymentForm'

const APPROVED: PaymentResult = { status: 'approved', orderId: 'ORD-TEST0001', last4: '1111' }
const DECLINED: PaymentResult = { status: 'declined', reason: 'card_declined' }

type Pay = (cardNumber: string) => Promise<PaymentResult>

// A promise we resolve by hand, to observe the "processing" state.
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const field = (label: string | RegExp) => screen.getByLabelText(label)
const payButton = () => screen.getByRole('button', { name: /Pagar|Procesando/ })

async function fillValidForm(user: ReturnType<typeof userEvent.setup>, cardNumber = '4111111111111111') {
  await user.type(field('Nombre del titular'), 'Ana Lopez')
  await user.type(field('Número de tarjeta'), cardNumber)
  // 12/99 never expires, so the test does not depend on the current date.
  await user.type(field(/Vencimiento/), '1299')
  await user.type(field('CVV'), '123')
  await user.type(field('Correo electrónico'), 'ana@example.com')
}

describe('PaymentForm', () => {
  it('renders every field with its label and no errors', () => {
    render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

    expect(field('Nombre del titular')).toBeInTheDocument()
    expect(field('Número de tarjeta')).toBeInTheDocument()
    expect(field(/Vencimiento/)).toBeInTheDocument()
    expect(field('CVV')).toBeInTheDocument()
    expect(field('Correo electrónico')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  describe('errors', () => {
    it('shows a field error only after the user leaves the field', async () => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field('Nombre del titular'), 'Jo')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await user.tab()

      const message = 'El nombre debe tener al menos 3 caracteres'
      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(field('Nombre del titular')).toHaveAttribute('aria-invalid', 'true')
      expect(field('Nombre del titular')).toHaveAccessibleDescription(message)
    })

    it('clears the error as soon as the user fixes the value', async () => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field('Nombre del titular'), 'Jo')
      await user.tab()
      expect(field('Nombre del titular')).toHaveAttribute('aria-invalid', 'true')

      await user.type(field('Nombre del titular'), 'e')

      expect(field('Nombre del titular')).toHaveAttribute('aria-invalid', 'false')
    })

    it('shows every error on submit and focuses the first invalid field', async () => {
      const user = userEvent.setup()
      const pay = vi.fn<Pay>()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} pay={pay} />)

      await user.click(payButton())

      expect(screen.getAllByRole('alert')).toHaveLength(5)
      expect(field('Nombre del titular')).toHaveFocus()
      expect(pay).not.toHaveBeenCalled()
    })
  })

  describe('input formatting and card brand', () => {
    it('groups the card number in blocks of 4 while typing', async () => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field('Número de tarjeta'), '4111111111111111')

      expect(field('Número de tarjeta')).toHaveValue('4111 1111 1111 1111')
    })

    it('inserts the slash in the expiry date', async () => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field(/Vencimiento/), '1230')

      expect(field(/Vencimiento/)).toHaveValue('12/30')
    })

    it.each([
      ['4111111111111111', 'Visa'],
      ['5555555555554444', 'Mastercard'],
      ['378282246310005', 'Amex'],
    ])('detects the brand of %s as %s', async (number, brand) => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field('Número de tarjeta'), number)

      expect(screen.getByText(brand)).toBeInTheDocument()
    })

    it('requires a 4-digit CVV for Amex and limits its length', async () => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field('Número de tarjeta'), '378282246310005')
      await user.type(field('CVV'), '123')
      await user.tab()
      expect(field('CVV')).toHaveAccessibleDescription('El CVV debe tener 4 dígitos')

      await user.type(field('CVV'), '45678')
      expect(field('CVV')).toHaveValue('1234')
    })

    it('only accepts digits in the CVV', async () => {
      const user = userEvent.setup()
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} />)

      await user.type(field('CVV'), '1a2b3')

      expect(field('CVV')).toHaveValue('123')
    })
  })

  describe('payment', () => {
    it('pays with the card number and reports only the approved result', async () => {
      const user = userEvent.setup()
      const pay = vi.fn<Pay>().mockResolvedValue(APPROVED)
      const onSuccess = vi.fn()
      render(<PaymentForm onSuccess={onSuccess} onCancel={() => {}} pay={pay} />)

      await fillValidForm(user)
      await user.click(payButton())

      await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
      // The service receives the card number and nothing else (no CVV).
      expect(pay).toHaveBeenCalledOnce()
      expect(pay).toHaveBeenCalledWith('4111 1111 1111 1111')
      // The parent gets the result, which has no card number or CVV.
      expect(onSuccess).toHaveBeenCalledWith(APPROVED)
    })

    it('wipes the sensitive data from the form after an approval', async () => {
      const user = userEvent.setup()
      const pay = vi.fn<Pay>().mockResolvedValue(APPROVED)
      const onSuccess = vi.fn()
      render(<PaymentForm onSuccess={onSuccess} onCancel={() => {}} pay={pay} />)

      await fillValidForm(user)
      await user.click(payButton())
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())

      expect(field('Número de tarjeta')).toHaveValue('')
      expect(field('CVV')).toHaveValue('')
    })

    it('disables the pay button while processing and blocks a second submit', async () => {
      const user = userEvent.setup()
      const { promise, resolve } = deferred<PaymentResult>()
      const pay = vi.fn<Pay>().mockReturnValue(promise)
      const onSuccess = vi.fn()
      render(<PaymentForm onSuccess={onSuccess} onCancel={() => {}} pay={pay} />)

      await fillValidForm(user)
      await user.click(payButton())

      expect(payButton()).toBeDisabled()
      expect(payButton()).toHaveTextContent('Procesando')
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()

      // Pressing Enter in a field submits the form again: it must be ignored.
      await user.type(field('Correo electrónico'), '{Enter}')
      expect(pay).toHaveBeenCalledOnce()

      resolve(APPROVED)
      await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    })

    it('shows an error when declined, clears the CVV and allows a retry', async () => {
      const user = userEvent.setup()
      const pay = vi.fn<Pay>().mockResolvedValueOnce(DECLINED).mockResolvedValueOnce(APPROVED)
      const onSuccess = vi.fn()
      render(<PaymentForm onSuccess={onSuccess} onCancel={() => {}} pay={pay} />)

      await fillValidForm(user)
      await user.click(payButton())

      expect(await screen.findByText(/El pago fue rechazado/)).toBeInTheDocument()
      expect(onSuccess).not.toHaveBeenCalled()
      expect(field('CVV')).toHaveValue('')
      expect(field('Nombre del titular')).toHaveValue('Ana Lopez')
      expect(payButton()).toBeEnabled()

      await user.type(field('CVV'), '123')
      await user.click(payButton())

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(APPROVED))
      expect(pay).toHaveBeenCalledTimes(2)
    })

    it('shows a generic error and re-enables the form when the service fails', async () => {
      const user = userEvent.setup()
      const pay = vi.fn<Pay>().mockRejectedValue(new Error('network'))
      render(<PaymentForm onSuccess={() => {}} onCancel={() => {}} pay={pay} />)

      await fillValidForm(user)
      await user.click(payButton())

      expect(await screen.findByText(/No se pudo procesar el pago/)).toBeInTheDocument()
      expect(payButton()).toBeEnabled()
    })
  })

  it('calls onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<PaymentForm onSuccess={() => {}} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
