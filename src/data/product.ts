import imageUrl from '../assets/product.webp'
import type { Product } from '../types'

// Mock product for the checkout flow. There is no backend, so the product
// lives here and the app keeps its stock in memory.
export const product: Product = {
  id: 1,
  title: 'Cono de helado de vainilla con chocolate',
  description:
    'Helado de vainilla con trozos de chocolate oscuro y salsa de chocolate, servido en cono de barquillo crujiente.',
  // 475 cents = 4.75. Format to currency only when displaying.
  unitPriceCents: 475,
  // Small on purpose, so the stock decreasing after a purchase is easy to see.
  stock: 5,
  imageUrl,
}
