import { useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import { Check, Copy } from 'lucide-react'

import { WhatsAppIcon } from '#/components/whatsapp'
import { orderStatusLabels, paymentMethodLabels } from '#/lib/order'
import { formatKes, site } from '#/lib/site'
import { getOrder, submitMpesaCode } from '#/server/orders'

import type { PaymentMethod } from '#/lib/order'

export const Route = createFileRoute('/orders/$token')({
  loader: async ({ params }) => {
    const order = await getOrder({ data: { token: params.token } }).catch(
      () => null,
    )
    if (!order) throw notFound()
    return order
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Order ${loaderData.orderNumber} | ${site.name}`
          : site.name,
      },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: OrderPage,
})

type Order = NonNullable<Awaited<ReturnType<typeof getOrder>>>

function OrderPage() {
  const order = Route.useLoaderData()
  const needsPayment =
    order.status === 'awaiting_payment' || order.status === 'payment_submitted'

  const whatsappMessage = [
    `Hello ${site.name}, I have placed order ${order.orderNumber} for ${formatKes(order.totalKes)}.`,
    order.mpesaCode ? `My M-PESA code is ${order.mpesaCode}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="wrap max-w-3xl py-10 md:py-16">
      <p className="eyebrow">Order {order.orderNumber}</p>
      <h1 className="mt-3 text-5xl">{heading(order)}</h1>
      <hr className="gold-rule mt-6" />
      <p className="mt-6 inline-block rounded-md bg-lilac px-3 py-1.5 font-medium text-plum">
        Status: {orderStatusLabels[order.status]}
      </p>
      <p className="mt-4 text-ink-muted">{statusText(order)}</p>
      <p className="mt-2 text-sm text-ink-muted">
        Save this page link. You can come back to it at any time to check your
        order.
      </p>

      {order.status === 'awaiting_payment' && <PaymentSteps order={order} />}
      {needsPayment && <MpesaCodeForm order={order} />}

      {order.status !== 'cancelled' && (
        <a
          href={`https://wa.me/${order.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline mt-8 w-full sm:w-auto"
        >
          <WhatsAppIcon className="size-5" />
          Send order on WhatsApp
        </a>
      )}

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-2xl">Your order</h2>
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-4">
                <span>
                  {item.name}
                  <span className="text-ink-muted"> × {item.quantity}</span>
                </span>
                <span className="whitespace-nowrap">
                  {formatKes(item.priceKes * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-lilac-line pt-3 font-medium">
            <span className="text-plum">Total</span>
            <span>{formatKes(order.totalKes)}</span>
          </p>
        </div>

        {order.pickup && (
          <div>
            <h2 className="text-2xl">Pickup</h2>
            <address className="mt-3 space-y-1 text-ink-muted not-italic">
              <p className="font-medium text-ink">{order.pickup.name}</p>
              <p>{order.pickup.address}</p>
              <p>{order.pickup.hours}</p>
            </address>
            <p className="mt-2 text-sm text-ink-muted">
              Please wait for our message that your order is ready before you
              come.
            </p>
          </div>
        )}
      </div>

      <Link
        to="/"
        className="mt-12 inline-block text-plum underline underline-offset-4"
      >
        Back to the shop
      </Link>
    </section>
  )
}

function heading(order: Order) {
  switch (order.status) {
    case 'awaiting_payment':
      return `Thank you, ${order.firstName}. One step left: pay with M-PESA`
    case 'payment_submitted':
      return `Thank you, ${order.firstName}. We're confirming your payment`
    case 'paid':
      return 'Payment confirmed'
    case 'ready':
      return 'Your order is ready for pickup'
    case 'completed':
      return 'Order collected. Thank you!'
    case 'cancelled':
      return 'This order was cancelled'
  }
}

function statusText(order: Order) {
  switch (order.status) {
    case 'awaiting_payment':
      return 'Your items are reserved. Follow the steps below, then enter the M-PESA code so we can match your payment.'
    case 'payment_submitted':
      return `We have your M-PESA code ${order.mpesaCode ?? ''} and will confirm it shortly, usually the same day. We'll message you when your order is ready.`
    case 'paid':
      return "We've received your payment and are preparing your order. We'll message you when it is ready."
    case 'ready':
      return 'Come and collect it at the pickup point below. Bring your order number.'
    case 'completed':
      return 'We hope you love it. Tell us how it works for you.'
    case 'cancelled':
      return 'If you think this is a mistake, message us on WhatsApp.'
  }
}

function paymentSteps(method: PaymentMethod) {
  switch (method) {
    case 'paybill':
      return ['Open M-PESA and choose Lipa na M-PESA', 'Choose Pay Bill']
    case 'till':
      return [
        'Open M-PESA and choose Lipa na M-PESA',
        'Choose Buy Goods and Services',
      ]
    case 'pochi':
      return [
        'Open M-PESA and choose Lipa na M-PESA',
        'Choose Pochi la Biashara',
      ]
  }
}

const numberLabel: Record<PaymentMethod, string> = {
  paybill: 'Business number',
  till: 'Till number',
  pochi: 'Phone number',
}

function PaymentSteps({ order }: { order: Order }) {
  const { method, number, registeredName } = order.payment
  return (
    <div className="mt-8 border border-lilac-line bg-lilac p-5 sm:p-6">
      <h2 className="text-3xl">Pay with {paymentMethodLabels[method]}</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5">
        {paymentSteps(method).map((step) => (
          <li key={step}>{step}</li>
        ))}
        <li>
          Enter the {numberLabel[method].toLowerCase()}
          <CopyValue label={numberLabel[method]} value={number} />
        </li>
        {method === 'paybill' && (
          <li>
            Enter the account number
            <CopyValue label="Account number" value={order.orderNumber} />
          </li>
        )}
        <li>
          Enter the amount
          <CopyValue
            label="Amount"
            value={String(order.totalKes)}
            display={formatKes(order.totalKes)}
          />
        </li>
        <li>
          Enter your M-PESA PIN and confirm. The name shown should be{' '}
          <strong className="font-medium">{registeredName}</strong>.
        </li>
      </ol>
    </div>
  )
}

/** A value with a button that copies it, so nobody has to retype numbers. */
function CopyValue({
  label,
  value,
  display,
}: {
  label: string
  value: string
  display?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available: the value is still on screen to type.
    }
  }

  return (
    <span className="mt-1.5 flex items-center justify-between gap-3 rounded-md border border-lilac-line bg-white py-1.5 pr-1.5 pl-4">
      <span>
        <span className="block text-xs tracking-wide text-ink-muted uppercase">
          {label}
        </span>
        <span className="text-xl font-medium tracking-wide text-ink">
          {display ?? value}
        </span>
      </span>
      <button
        type="button"
        onClick={copy}
        className="flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-plum hover:bg-lilac"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </span>
  )
}

function MpesaCodeForm({ order }: { order: Order }) {
  const router = useRouter()
  const token = Route.useParams({ select: (params) => params.token })
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submitted = order.status === 'payment_submitted'

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await submitMpesaCode({ data: { token, code } })
      if (!result.ok) {
        setError(result.message)
        return
      }
      setCode('')
      await router.invalidate()
    } catch {
      setError(
        'Something went wrong. Please check your connection and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8">
      <label
        htmlFor="mpesa-code"
        className="font-serif text-3xl font-semibold text-plum"
      >
        {submitted ? 'Entered the wrong code?' : 'Enter your M-PESA code'}
      </label>
      <p className="mt-1 text-sm text-ink-muted">
        {submitted
          ? 'You can replace it here until we confirm your payment.'
          : 'It is the 10 letters and numbers at the start of the M-PESA message, for example SKJ4X7Q2LM.'}
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="mpesa-code"
          name="mpesa-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="SKJ4X7Q2LM"
          aria-invalid={error !== null}
          aria-describedby="mpesa-code-error"
          className="block w-full rounded-md border border-input bg-white px-3.5 py-3 text-lg tracking-widest text-ink uppercase placeholder:text-ink-muted/50 sm:max-w-xs"
        />
        <button
          type="submit"
          className="btn btn-primary disabled:opacity-60"
          disabled={busy || code.trim().length === 0}
        >
          {busy ? 'Sending…' : submitted ? 'Update code' : 'Submit code'}
        </button>
      </div>
      <p
        id="mpesa-code-error"
        role="alert"
        className="mt-2 text-sm text-destructive empty:hidden"
      >
        {error}
      </p>
    </form>
  )
}
