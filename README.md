# Product card and simulated checkout

A minimal purchase flow: the user sees a product, picks a quantity, enters their card details and "pays". **There is no backend**: the payment is simulated with an asynchronous call of ~1.5 s that approves or declines.

Stack: React 19 + TypeScript + Vite, tested with Vitest and Testing Library.

> The user interface is in Spanish. Button labels and messages are quoted as they appear on screen, with an English gloss where needed.

## How to run the project

**Requirements:** Node.js **22.12 or higher** (Vitest 5 requires it; Vite 8 supports 20.19+) and npm.

```bash
npm install
npm run dev
```

The app runs at <http://localhost:5173>.

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-checks with `tsc` and builds the production version into `dist/` |
| `npm run preview` | Serves the output of `build` locally |
| `npm test` | Runs all tests once |
| `npm run lint` | Lints the code with ESLint |

## How to use the app

1. On the product card, choose the quantity with the **−** and **+** buttons (minimum 1, maximum the available stock). The total is recalculated instantly.
2. Click **Comprar** (Buy). The payment form opens with a summary of the purchase.
3. Fill in the details. Errors appear per field when leaving it (blur) or when trying to submit.
4. Click **Pagar** (Pay). The button is disabled while the payment is processing (~1.5 s).
5. If the payment is **approved**, you will see the order number and the last 4 digits of the card, and the stock goes down. If it is **declined**, you will see a message and can try again.

### Test cards

Any name, an email with a valid format (`ana@example.com`), a future expiry date (for example `12/30`) and a 3-digit CVV (4 for Amex).

| Number | Brand | Result |
|---|---|---|
| `4111 1111 1111 1111` | Visa | Approved |
| `5555 5555 5555 4444` | Mastercard | Approved |
| `3782 8224 6310 005` | Amex (4-digit CVV) | Approved |
| **`4000 0000 0000 0002`** | Visa | **Always declined** |

## Project structure

```
src/
├── App.tsx                  # Screen states and owner of the stock
├── components/              # Small components, each with its CSS Module and its test
│   ├── ProductCard/
│   ├── QuantitySelector/
│   ├── PaymentForm/
│   ├── FormField/           # Label + input + error (accessibility in one place)
│   ├── CardBrandBadge/
│   └── SuccessScreen/
├── lib/                     # Pure logic, no React
│   ├── format.ts            # Cents -> currency text
│   └── validation/          # luhn, card, expiry, cvv, name, email, validateForm
├── services/
│   └── payment.ts           # Payment simulation
├── data/product.ts          # Sample product
├── types/index.ts           # Shared types
└── test/                    # Test setup and the flow's integration test
```

Unit tests live next to the file they test (`luhn.ts` and `luhn.test.ts`). `src/test/` only holds the setup and the integration test, which spans several components and belongs to none of them.

## Technical decisions

### Stack and tooling

| Decision | Rationale |
|---|---|
| **Vite + React + TypeScript** | It is the stack the brief proposes (React with TypeScript, Vite or similar) and the lightest option for a three-screen flow. It avoids dependencies that are not needed: without a server there is no need for server-side routing, and with Vitest the tests share the project's configuration. |
| **Vitest + Testing Library** | Vitest shares its configuration with Vite, so there is no need to set up Jest with ESM and TypeScript. Testing Library tests what the user sees (roles, labels, texts) rather than the implementation. |
| **`jsdom`** as the test environment | More faithful than `happy-dom` for forms. |
| **`globals` disabled** | `describe`, `it` and `expect` are imported from `vitest`. It is more explicit and avoids touching the tsconfig. DOM cleanup between tests is done manually in `src/test/setup.ts`. |
| **CSS Modules + CSS variables** | Built into Vite, the CSS sits next to its component and class names never clash. No Tailwind or component library: they add nothing for three screens. |
| **No routes (React Router)** | There are three linear screens, with no direct links and no multiple products. A state machine solves it without dependencies. |
| **No form libraries** (react-hook-form, zod) | The brief asks for validation in pure functions and errors on blur or submit. Writing it by hand gives full control, fewer dependencies and code that is easy to explain. |

### State and flow

- **State machine in `App`** (`browsing` → `paying` → `success`). Each screen is a state and each state carries only what it needs, so impossible combinations (paying and showing success at the same time) cannot exist.
- **Local state with `useState`**, no Redux or Context. There is one product, three screens and a single shared piece of data (the stock), which lives in `App`.
- **The stock only decreases when an approved payment arrives**, by the chosen quantity. A decline or a cancellation does not touch it. It is kept in memory and resets when the page is reloaded (the brief does not ask for persistence).
- **The effective quantity is computed during render**: `min(chosen quantity, current stock)`. If the stock drops below the chosen amount, the quantity adjusts instantly, without `useEffect`.
- **The total is not stored in state**: it is computed (`price × quantity`), so it can never get out of sync.

### Money

- **Prices are integers in cents** (`4999` = 49.99). In floating point `0.1 + 0.2 !== 0.3`, and in a fintech a rounding error in a total is serious. All calculations use integers; the amount is only formatted as currency for display, with `Intl.NumberFormat` (`lib/format.ts`).
- Currency: quetzales (`GTQ`, locale `es-GT`). It can be changed in the two constants at the top of `lib/format.ts`.

### Validation

- **Pure functions, separated from the UI** (`lib/validation/`). They do not import React, they are tested without rendering anything, and each one does a single thing. All of them return `string | null`: the error message, or `null` if the value is valid.
- **`validateForm` builds on `validateField`**, which is what the UI uses on blur. Each rule lives in a single place.
- **Errors are computed on every render from the values; they are not stored in state.** This way they never go stale. For example, the CVV depends on the brand (Amex uses 4 digits), and when the number changes its error is recalculated on its own.
- **The UI only shows a field's error if the field has been "touched"** (the user left it or tried to submit). When submitting with errors, all of them are shown and focus moves to the first invalid field.
- **The current date is injected** into `validateExpiry` (a parameter with a default value), so tests can use a fixed date and do not depend on the clock.
- **One line is reserved for each error message.** Without it, the error that appears when leaving a field used to push the "Pagar" button down before the click was released, and the click was lost.

### Quantity

It is chosen with **−** and **+** buttons, with no text field. The buttons are disabled at the minimum and at the maximum, so an invalid quantity (0, text, above the stock) **cannot be entered**, instead of having to validate it. With a stock of 0 it shows "Agotado" (sold out) and everything is disabled.

### Simulated payment (`services/payment.ts`)

- **It is deterministic**: only `4000 0000 0000 0002` is declined (it is the suggested test card); any other card is approved. A random outcome would make the tests flaky.
- **It receives only the card number**, which is all it needs. The CVV, the name and the email never reach the service.
- **The delay is a parameter** (1500 ms by default). Tests pass `0`, and a test with fake timers checks that the default value really takes 1.5 s.
- **The order number** is `ORD-` followed by 8 characters of a UUID.
- The form receives the payment function as an optional prop (`pay`, defaulting to `processPayment`). It is simple dependency injection that allows testing without waiting.

### Testing

- **Unit tests** for each validator, the formatting, the payment service and each component.
- **Integration** (`src/test/checkout.integration.test.tsx`): uses the whole `App`, with real components, validation and the real approve/decline rule. Only the simulated delay is reduced to 0. It covers an approved purchase that decreases the stock, a decline with retry, an invalid form, cancellation and buying all the stock.
- Tests query by role and accessible name, not by classes or ids.

## Security

This is an explicit requirement.

- **The full card number and the CVV live only in the state of `PaymentForm`.** They are not stored in `localStorage`, `sessionStorage`, the URL or the logs, and there is no `console.log` of data.
- **Only the payment result goes up**: `ApprovedPayment` contains only the order number and the **last 4 digits**. The type has no field for the full number or the CVV, so neither the success screen nor `App` could display or store them by accident.
- **The form is cleared before reporting success**, and the payment screen is unmounted, so the state disappears.
- **If the payment is declined**, the CVV is cleared and the rest is kept to allow a retry.
- The inputs use the card `autoComplete` values (`cc-number`, `cc-exp`, `cc-csc`, `cc-name`) and `inputMode="numeric"`, and not `type="number"`, which breaks leading zeros and spaces.
- The "Pagar" button is disabled while processing and a second submit (for example with Enter) is ignored, to avoid charging twice.
- The integration test **verifies** that, after paying, the full number is not on the page, no inputs remain, storage is empty and nothing was logged with `console.log`.

## Accessibility

- Every input has its associated `<label>`.
- Errors are announced (`role="alert"`) and linked with `aria-invalid` and `aria-describedby`. The error does not rely on color alone: it has a text message and a thicker border.
- The selected quantity is a live region (`<output>`), and the total is announced with `aria-live`.
- Visible focus on every control, 44 px touch targets and 16 px fields (prevents automatic zoom on iOS).
- When the payment screen opens, focus goes to the first field, and on approval it moves to the title of the success screen.
- The product image has `alt` text, and the page language is `es`.

## Technical decisions

| Topic | Decision |
|---|---|
| Card number length | 13 to 19 digits and Luhn, as the brief requires. The exact length per brand is not validated. |
| Card number format | Groups of 4 while typing, as the brief requires, also for Amex (in reality Amex is grouped 4-6-5). |
| Mastercard `2221–2720` | The 4-digit prefix is compared as a number, not with a regular expression. With fewer than 4 digits the brand stays "unknown". |
| Expiry date | A card is valid until the **end** of the indicated month, so the current month counts as valid. `AA` (two-digit year) is read as `20AA`. There is no maximum year. |
| CVV | 4 digits for Amex and 3 for the rest, including a brand that has not been detected yet. |
| Name | Letters and spaces only, at least 3 characters, as the brief requires: hyphens and apostrophes are not accepted. Accents and the letter ñ are accepted (`\p{L}`). |
| Email | A deliberately simple regular expression (something, one `@`, something, a dot, something, no spaces). It catches typos; it does not guarantee that the address exists. |
