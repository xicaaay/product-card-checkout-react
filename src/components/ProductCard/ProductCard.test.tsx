import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../types'
import { ProductCard } from './ProductCard'

// Fixture instead of the real data, so tests do not break if the mock changes.
const product: Product = {
  id: 1,
  title: 'Producto de prueba',
  description: 'Descripción de prueba',
  unitPriceCents: 475,
  stock: 5,
  imageUrl: '/product.png',
}

const increase = () => screen.getByRole('button', { name: 'Aumentar cantidad' })
const decrease = () => screen.getByRole('button', { name: 'Disminuir cantidad' })

describe('ProductCard', () => {
  it('shows image, name, description, unit price and stock', () => {
    render(<ProductCard product={product} onBuy={() => {}} />)

    expect(screen.getByRole('img', { name: 'Producto de prueba' })).toHaveAttribute(
      'src',
      '/product.png',
    )
    expect(screen.getByRole('heading', { name: 'Producto de prueba' })).toBeInTheDocument()
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument()
    expect(screen.getByText(/Precio unitario/)).toHaveTextContent(/4\.75/)
    expect(screen.getByText(/Stock disponible: 5/)).toBeInTheDocument()
  })

  it('starts with quantity 1 and the total of one unit', () => {
    render(<ProductCard product={product} onBuy={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent('1')
    expect(screen.getByText(/Total/)).toHaveTextContent(/4\.75/)
  })

  it('updates the total in real time when the quantity changes', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={product} onBuy={() => {}} />)

    await user.click(increase())
    await user.click(increase())

    expect(screen.getByRole('status')).toHaveTextContent('3')
    // 3 x 475 cents = 14.25
    expect(screen.getByText(/Total/)).toHaveTextContent(/14\.25/)
  })

  it('does not allow a quantity above the stock', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={{ ...product, stock: 2 }} onBuy={() => {}} />)

    await user.click(increase())
    expect(screen.getByRole('status')).toHaveTextContent('2')
    expect(increase()).toBeDisabled()
  })

  it('does not allow a quantity below 1', () => {
    render(<ProductCard product={product} onBuy={() => {}} />)

    expect(decrease()).toBeDisabled()
  })

  it('calls onBuy with the selected quantity', async () => {
    const user = userEvent.setup()
    const onBuy = vi.fn()
    render(<ProductCard product={product} onBuy={onBuy} />)

    await user.click(increase())
    await user.click(screen.getByRole('button', { name: 'Comprar' }))

    expect(onBuy).toHaveBeenCalledOnce()
    expect(onBuy).toHaveBeenCalledWith(2)
  })

  it('clamps the quantity when the stock drops below it', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ProductCard product={product} onBuy={() => {}} />)

    await user.click(increase())
    await user.click(increase())
    await user.click(increase())
    expect(screen.getByRole('status')).toHaveTextContent('4')

    rerender(<ProductCard product={{ ...product, stock: 2 }} onBuy={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent('2')
    expect(screen.getByText(/Total/)).toHaveTextContent(/9\.50/)
  })

  it('shows sold out and disables buying when there is no stock', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} onBuy={() => {}} />)

    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comprar' })).toBeDisabled()
    expect(increase()).toBeDisabled()
    expect(decrease()).toBeDisabled()
  })
})
