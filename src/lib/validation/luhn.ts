// Luhn checksum: detects typing mistakes in card numbers.
// Receives digits only; cleaning (removing spaces) is the caller's job.
export function isValidLuhn(digits: string): boolean {
  // Rejects empty strings and non-digit characters. Without this, an empty
  // string sums to 0 (a multiple of 10) and would wrongly be "valid".
  if (!/^\d+$/.test(digits)) return false

  let sum = 0
  // Walk right to left, doubling every second digit.
  let shouldDouble = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i])

    if (shouldDouble) {
      digit *= 2
      // Same as adding the two digits of the result (e.g. 14 -> 1 + 4 = 5).
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}