import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CardBrandBadge } from './CardBrandBadge'

describe('CardBrandBadge', () => {
  it.each([
    ['visa', 'Visa'],
    ['mastercard', 'Mastercard'],
    ['amex', 'Amex'],
  ] as const)('shows %s as "%s"', (brand, label) => {
    render(<CardBrandBadge brand={brand} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('renders nothing when the brand is unknown', () => {
    const { container } = render(<CardBrandBadge brand="unknown" />)

    expect(container).toBeEmptyDOMElement()
  })
})
