import { afterEach, describe, expect, it, vi } from 'vitest'
import { PAYMENT_DELAY_MS, processPayment } from './payment'

afterEach(() => {
  vi.useRealTimers()
})

describe('processPayment', () => {
  it('approves a regular card with an order id and the last 4 digits', async () => {
    const result = await processPayment('4111 1111 1111 1111', 0)

    expect(result.status).toBe('approved')
    if (result.status === 'approved') {
      expect(result.orderId).toMatch(/^ORD-[0-9A-F]{8}$/)
      expect(result.last4).toBe('1111')
    }
  })

  it('declines the always-declined test card', async () => {
    expect(await processPayment('4000000000000002', 0)).toEqual({
      status: 'declined',
      reason: 'card_declined',
    })
  })

  it('declines the test card even when it is formatted with spaces', async () => {
    const result = await processPayment('4000 0000 0000 0002', 0)

    expect(result.status).toBe('declined')
  })

  it('generates a different order id on each approval', async () => {
    const first = await processPayment('4111111111111111', 0)
    const second = await processPayment('4111111111111111', 0)

    expect(first).not.toEqual(second)
  })

  it('never exposes the full card number in the result', async () => {
    const result = await processPayment('4111 1111 1111 1111', 0)

    expect(JSON.stringify(result)).not.toContain('4111111111111111')
    expect(JSON.stringify(result)).not.toContain('4111 1111 1111 1111')
  })

  it('takes about 1.5 s by default', async () => {
    vi.useFakeTimers()
    let settled = false
    const promise = processPayment('4111111111111111').then((result) => {
      settled = true
      return result
    })

    await vi.advanceTimersByTimeAsync(PAYMENT_DELAY_MS - 1)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toBe(true)
    expect((await promise).status).toBe('approved')
  })
})
