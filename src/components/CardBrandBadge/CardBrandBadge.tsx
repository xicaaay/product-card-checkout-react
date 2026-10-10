import type { CardBrand } from '../../types'
import styles from './CardBrandBadge.module.css'

const BRAND_LABELS: Record<Exclude<CardBrand, 'unknown'>, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
}

// Shows the detected card brand. Renders nothing while the brand is unknown
// (empty input or a number that matches no rule).
export function CardBrandBadge({ brand }: { brand: CardBrand }) {
  if (brand === 'unknown') return null

  return <span className={styles.badge}>{BRAND_LABELS[brand]}</span>
}
