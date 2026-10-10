# Tarjeta de producto y compra simulada

Flujo mínimo de compra: el usuario ve un producto, elige la cantidad, ingresa los datos de su tarjeta y "paga". **No hay backend**: el pago se simula con una llamada asíncrona de ~1,5 s que aprueba o rechaza.

Stack: React 19 + TypeScript + Vite, pruebas con Vitest y Testing Library.

## Cómo levantar el proyecto

**Requisitos:** Node.js **22.12 o superior** (Vitest 5 lo exige; Vite 8 admite 20.19+) y npm.

```bash
npm install
npm run dev
```

La aplicación queda en <http://localhost:5173>.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprueba los tipos con `tsc` y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión generada por `build` |
| `npm test` | Ejecuta todas las pruebas una vez |
| `npm run lint` | Revisa el código con ESLint |

## Cómo usar la aplicación

1. En la tarjeta del producto elige la cantidad con los botones **−** y **+** (mínimo 1, máximo el stock). El total se recalcula al instante.
2. Pulsa **Comprar**. Se abre el formulario de pago con un resumen de la compra.
3. Completa los datos. Los errores aparecen por campo al salir de él (blur) o al intentar enviar.
4. Pulsa **Pagar**. El botón se deshabilita mientras se procesa (~1,5 s).
5. Si se **aprueba**, verás el número de orden y los últimos 4 dígitos de la tarjeta, y el stock baja. Si se **rechaza**, verás un mensaje y podrás reintentar.

### Tarjetas de prueba

Cualquier nombre, un correo con formato válido (`ana@example.com`), un vencimiento futuro (por ejemplo `12/30`) y un CVV de 3 dígitos (4 para Amex).

| Número | Marca | Resultado |
|---|---|---|
| `4111 1111 1111 1111` | Visa | Aprobada |
| `5555 5555 5555 4444` | Mastercard | Aprobada |
| `3782 8224 6310 005` | Amex (CVV de 4 dígitos) | Aprobada |
| **`4000 0000 0000 0002`** | Visa | **Siempre rechazada** |

## Estructura del proyecto

```
src/
├── App.tsx                  # Estados de las pantallas y dueño del stock
├── components/              # Componentes pequeños, cada uno con su CSS Module y su test
│   ├── ProductCard/
│   ├── QuantitySelector/
│   ├── PaymentForm/
│   ├── FormField/           # Etiqueta + input + error (accesibilidad centralizada)
│   ├── CardBrandBadge/
│   └── SuccessScreen/
├── lib/                     # Lógica pura, sin React
│   ├── format.ts            # Centavos -> texto de moneda
│   └── validation/          # luhn, card, expiry, cvv, name, email, validateForm
├── services/
│   └── payment.ts           # Simulación del pago
├── data/product.ts          # Producto de ejemplo
├── types/index.ts           # Tipos compartidos
└── test/                    # setup de pruebas y prueba de integración del flujo
```

Los tests unitarios viven junto al archivo que prueban (`luhn.ts` y `luhn.test.ts`). En `src/test/` solo está la configuración y la prueba de integración, que cruza varios componentes y no pertenece a ninguno.

## Decisiones técnicas

### Stack y herramientas

| Decisión | Justificación |
|---|---|
| **Vite + React + TypeScript** | Es el stack que propone el enunciado (React con TypeScript, Vite o similar) y el más ligero para un flujo de tres pantallas. Evita dependencias que no se necesitan: sin servidor no hacen falta rutas del lado del servidor, y con Vitest las pruebas comparten la configuración del proyecto. |
| **Vitest + Testing Library** | Vitest comparte configuración con Vite, así que no hace falta configurar Jest con ESM y TypeScript. Testing Library prueba lo que ve el usuario (roles, etiquetas, textos) y no la implementación. |
| **`jsdom`** como entorno de pruebas | Más fiel que `happy-dom` para formularios. |
| **`globals` desactivado** | `describe`, `it` y `expect` se importan desde `vitest`. Es más explícito y evita tocar el tsconfig. La limpieza del DOM entre pruebas se hace a mano en `src/test/setup.ts`. |
| **CSS Modules + variables CSS** | Viene incluido en Vite, el CSS queda junto a su componente y sin choques de nombres. Sin Tailwind ni librería de componentes: no aportan a tres pantallas. |
| **Sin rutas (React Router)** | Son tres pantallas lineales, sin enlaces directos ni varios productos. Una máquina de estados lo resuelve sin dependencias. |
| **Sin librerías de formularios** (react-hook-form, zod) | El enunciado pide validación en funciones puras y errores en blur o envío. Hacerlo a mano da control total, menos dependencias y código fácil de explicar. |

### Estado y flujo

- **Máquina de estados en `App`** (`browsing` → `paying` → `success`). Cada pantalla es un estado y cada estado lleva solo lo que necesita, así que no pueden existir combinaciones imposibles (pagando y en éxito a la vez).
- **Estado local con `useState`**, sin Redux ni Context. Hay un producto, tres pantallas y un solo dato compartido (el stock), que vive en `App`.
- **El stock baja solo cuando llega un pago aprobado**, con la cantidad elegida. Un rechazo o una cancelación no lo tocan. Se mantiene en memoria y se reinicia al recargar la página (el enunciado no pide persistirlo).
- **La cantidad efectiva se calcula al renderizar**: `min(cantidad elegida, stock actual)`. Si el stock baja por debajo de lo elegido, la cantidad se ajusta al instante, sin `useEffect`.
- **El total no se guarda en el estado**: se calcula (`precio × cantidad`). Así no puede desincronizarse.

### Dinero

- **Los precios son enteros en centavos** (`4999` = 49,99). En coma flotante `0.1 + 0.2 !== 0.3`, y en una fintech un error de redondeo en un total es grave. Todo el cálculo es con enteros; solo se formatea a moneda al mostrarlo, con `Intl.NumberFormat` (`lib/format.ts`).
- Moneda: quetzales (`GTQ`, locale `es-GT`). Se cambia en las dos constantes del inicio de `lib/format.ts`.

### Validación

- **Funciones puras, separadas de la UI** (`lib/validation/`). No importan React, se prueban sin renderizar nada, y cada una hace una sola cosa. Todas devuelven `string | null`: el mensaje de error, o `null` si el valor es válido.
- **`validateForm` se apoya en `validateField`**, que es la que usa la UI en el blur. Cada regla vive en un solo lugar.
- **Los errores se calculan en cada render a partir de los valores; no se guardan en estado.** Así nunca quedan desactualizados. Por ejemplo, el CVV depende de la marca (Amex usa 4 dígitos), y al cambiar el número su error se recalcula solo.
- **La UI muestra el error de un campo solo si ya fue "tocado"** (salió de él o se intentó enviar). Al enviar con errores se muestran todos y el foco va al primer campo inválido.
- **La fecha actual se inyecta** en `validateExpiry` (parámetro con valor por defecto), para que los tests usen una fecha fija y no dependan del reloj.
- **Se reserva una línea para cada mensaje de error.** Sin eso, el error que aparece al salir de un campo desplazaba el botón "Pagar" antes de soltar el clic y el clic se perdía.

### Cantidad

Se elige con botones **−** y **+**, sin campo de texto. Los botones se deshabilitan en el mínimo y en el máximo, de modo que una cantidad inválida (0, texto, mayor que el stock) **no se puede introducir**, en lugar de tener que validarla. Con stock 0 se muestra "Agotado" y todo queda deshabilitado.

### Pago simulado (`services/payment.ts`)

- **Es determinista**: solo `4000 0000 0000 0002` se rechaza (es la tarjeta de prueba que se sugiere); cualquier otra se aprueba. Un resultado aleatorio haría las pruebas intermitentes.
- **Recibe únicamente el número de tarjeta**, que es lo único que necesita. El CVV, el nombre y el correo nunca llegan al servicio.
- **El retardo es un parámetro** (1500 ms por defecto). Las pruebas pasan `0`, y un test con timers falsos comprueba que el valor por defecto realmente tarda 1,5 s.
- **El número de orden** es `ORD-` seguido de 8 caracteres de un UUID.
- El formulario recibe la función de pago como propiedad opcional (`pay`, con `processPayment` por defecto). Es una inyección de dependencias sencilla que permite probarlo sin esperas.

### Pruebas

- **Unitarias** para cada validador, el formateo, el servicio de pago y cada componente.
- **Integración** (`src/test/checkout.integration.test.tsx`): usa la `App` completa, con componentes, validación y regla de aprobación/rechazo reales. Solo se reduce a 0 el retardo simulado. Cubre compra aprobada con descuento de stock, rechazo con reintento, formulario inválido, cancelación y agotar el stock.
- Los tests consultan por rol y nombre accesible, no por clases ni ids.

## Seguridad

Es un requisito explícito por ser una fintech.

- **El número completo y el CVV viven solo en el estado de `PaymentForm`.** No se guardan en `localStorage`, `sessionStorage`, la URL ni los logs, y no hay ningún `console.log` de datos.
- **Hacia arriba solo sube el resultado del pago**: `ApprovedPayment` contiene únicamente el número de orden y los **últimos 4 dígitos**. El tipo no tiene ningún campo para el número completo ni el CVV, así que ni la pantalla de éxito ni `App` podrían mostrarlos o guardarlos por accidente.
- **Antes de avisar el éxito se vacía el formulario**, y la pantalla de pago se desmonta, así que el estado desaparece.
- **Si el pago se rechaza**, el CVV se vacía y el resto se conserva para permitir el reintento.
- Los campos usan `autoComplete` de tarjeta (`cc-number`, `cc-exp`, `cc-csc`, `cc-name`) e `inputMode="numeric"`, y no `type="number"`, que rompe los ceros iniciales y los espacios.
- El botón "Pagar" se deshabilita mientras se procesa y se ignora un segundo envío (por ejemplo con Enter), para no cobrar dos veces.
- La prueba de integración **verifica** que, tras pagar, el número completo no está en la página, no quedan inputs, el almacenamiento está vacío y no hubo `console.log`.

## Accesibilidad

- Cada input tiene su `<label>` asociado.
- Los errores se anuncian (`role="alert"`) y se enlazan con `aria-invalid` y `aria-describedby`. El error no depende solo del color: tiene mensaje de texto y borde más grueso.
- La cantidad seleccionada es una región en vivo (`<output>`), y el total se anuncia con `aria-live`.
- Foco visible en todos los controles, botones táctiles de 44 px y campos de 16 px (evita el zoom automático en iOS).
- Al abrir el pago el foco va al primer campo, y al aprobar se mueve al título de la pantalla de éxito.
- La imagen del producto tiene `alt`, y el idioma de la página es `es`.

## Decisiones técnicas

| Tema | Decisión |
|---|---|
| Longitud del número | 13 a 19 dígitos y Luhn, como pide el enunciado. No se valida la longitud exacta por marca. |
| Formato del número | Grupos de 4 mientras se escribe, como pide el enunciado, también para Amex (en la realidad se agrupa 4-6-5). |
| Mastercard `2221–2720` | Se compara el prefijo de 4 dígitos como número, no con una expresión regular. Con menos de 4 dígitos la marca queda "desconocida". |
| Vencimiento | La tarjeta es válida hasta el **final** del mes indicado, así que el mes actual cuenta como vigente. `AA` se interpreta como `20AA`. No hay tope máximo de año. |
| CVV | 4 dígitos para Amex y 3 para el resto, incluida la marca todavía no detectada. |
| Nombre | Solo letras y espacios, mínimo 3 caracteres, como pide el enunciado: no se aceptan guiones ni apóstrofes. Acepta tildes y la ñ (`\p{L}`). |
| Correo | Expresión regular deliberadamente simple (algo, una `@`, algo, un punto, algo, sin espacios). Detecta errores de tipeo; no garantiza que la dirección exista. |