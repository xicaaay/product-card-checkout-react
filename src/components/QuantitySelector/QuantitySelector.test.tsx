import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuantitySelector } from './QuantitySelector'

describe('QuantitySelector', () => {
  it('shows the current value', () => {
    render(<QuantitySelector value={3} max={5} onChange={() => {}} />)

    expect(screen.getByRole('status')).toHaveTextContent('3')
  })

  it('calls onChange with the next and previous values', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuantitySelector value={3} max={5} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad' }))
    await user.click(screen.getByRole('button', { name: 'Disminuir cantidad' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 4)
    expect(onChange).toHaveBeenNthCalledWith(2, 2)
  })

  it('disables decrease at the minimum (1)', () => {
    render(<QuantitySelector value={1} max={5} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeEnabled()
  })

  it('disables increase at the maximum (stock)', () => {
    render(<QuantitySelector value={5} max={5} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeEnabled()
  })

  it('disables both buttons when disabled', () => {
    render(<QuantitySelector value={2} max={5} onChange={() => {}} disabled />)

    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Disminuir cantidad' })).toBeDisabled()
  })
})
