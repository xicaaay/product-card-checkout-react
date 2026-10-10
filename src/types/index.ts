export type Product = {
  id: number;
  title: string;
  description: string;
  // Orice in integar cents (example: 1250 = 12.50), to avoid floating-point
  // rounding errors. Format to currency only when displaying.
  unitPriceCents: number;
  stock: number; // Units available. Caps the quantity selector and decreases on approbal.
  imageUrl: string;
};

// Card brand detected while the user types.
// 'unknown' covers empty input or numbers that match no rule.
export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

// Raw values typed in the payment form. Security: this is the only place the
// full card number and CVV exist, and it must be discarded after the payment.
export type PaymentFormValues = {
  name: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  email: string;
};

export type PaymentFormField = keyof PaymentFormValues;

// One entry per field: an error message, or null when the field is valid.
export type PaymentFormErrors = Record<PaymentFormField, string | null>;

// Why a payment was declined. A closed set is easier to test than free text.
export type DeclineReason = "card_declined";

// Discriminated union: `status` tells TypeScript which fields exist, so
// `orderId` can only be read after checking status === 'approved'.
export type PaymentResult =
  | { status: "approved"; orderId: string; last4: string }
  | { status: "declined"; reason: DeclineReason };

// The approved variant on its own, for code that only handles a success.
export type ApprovedPayment = Extract<PaymentResult, { status: "approved" }>;