import { z } from 'zod'

// Rules shared by the checkout form (browser) and the order functions (server).

export const paymentMethods = ['paybill', 'till', 'pochi'] as const
export type PaymentMethod = (typeof paymentMethods)[number]

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  paybill: 'M-PESA Paybill',
  till: 'M-PESA Till (Buy Goods)',
  pochi: 'Pochi la Biashara',
}

export const orderStatuses = [
  'awaiting_payment',
  'payment_submitted',
  'paid',
  'ready',
  'completed',
  'cancelled',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  awaiting_payment: 'Waiting for payment',
  payment_submitted: 'Confirming your payment',
  paid: 'Payment confirmed',
  ready: 'Ready for pickup',
  completed: 'Collected',
  cancelled: 'Cancelled',
}

const KENYAN_PHONE = /^(?:\+?254|0)([17]\d{8})$/

/** "0712 345 678" or "+254712345678" -> "254712345678". Null if not valid. */
export function normalisePhone(input: string) {
  const match = KENYAN_PHONE.exec(input.replace(/[\s-]/g, ''))
  return match ? `254${match[1]}` : null
}

/** M-PESA confirmation codes are 10 letters and digits, e.g. SKJ4X7Q2LM */
const MPESA_CODE = /^[A-Z0-9]{10}$/

export function normaliseMpesaCode(input: string) {
  const code = input.replace(/\s/g, '').toUpperCase()
  return MPESA_CODE.test(code) ? code : null
}

export const cartLinesSchema = z
  .array(
    z.object({
      slug: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .min(1, 'Your cart is empty.')
  .max(20)
  .refine(
    (lines) => new Set(lines.map((line) => line.slug)).size === lines.length,
    'Each product can appear only once in the cart.',
  )

export const checkoutFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Please enter your name.')
    .max(80, 'That name is too long.'),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => normalisePhone(value) !== null,
      'Enter a Kenyan mobile number, for example 0712 345 678.',
    ),
  pickupLocationId: z.number().int().positive('Please choose a pickup point.'),
  paymentMethod: z.enum(paymentMethods),
  notes: z
    .string()
    .trim()
    .max(500, 'Please keep the note under 500 characters.'),
})

export type CheckoutForm = z.infer<typeof checkoutFormSchema>

export const createOrderSchema = checkoutFormSchema.extend({
  items: cartLinesSchema,
  /** The total the customer saw. The order is refused if it no longer matches. */
  expectedTotalKes: z.number().int().nonnegative(),
})

/** Admin actions: which statuses each may be applied from, and where it leads. */
export const orderTransitions = {
  confirm_payment: {
    label: 'Confirm payment',
    from: ['awaiting_payment', 'payment_submitted'],
    to: 'paid',
  },
  mark_ready: { label: 'Mark ready for pickup', from: ['paid'], to: 'ready' },
  mark_completed: {
    label: 'Mark collected',
    from: ['ready'],
    to: 'completed',
  },
  cancel: {
    label: 'Cancel order',
    from: ['awaiting_payment', 'payment_submitted', 'paid', 'ready'],
    to: 'cancelled',
  },
} as const satisfies Record<
  string,
  { label: string; from: ReadonlyArray<OrderStatus>; to: OrderStatus }
>

export type OrderAction = keyof typeof orderTransitions
export const orderActions = Object.keys(orderTransitions) as [
  OrderAction,
  ...Array<OrderAction>,
]

export function orderActionsFor(status: OrderStatus) {
  return orderActions.filter((action) =>
    (orderTransitions[action].from as ReadonlyArray<OrderStatus>).includes(
      status,
    ),
  )
}

/** "254712345678" -> "+254 712 345 678" */
export function formatPhone(phone: string) {
  const match = /^254(\d{3})(\d{3})(\d{3})$/.exec(phone)
  return match ? `+254 ${match[1]} ${match[2]} ${match[3]}` : phone
}

/** Date and time in Kenya, the same on the server and in the browser. */
export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
