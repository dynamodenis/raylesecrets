import { useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from '@tanstack/react-router'

import { Notice, StatusBadge } from '#/components/admin-ui'
import { WhatsAppIcon } from '#/components/whatsapp'
import {
  formatDateTime,
  formatPhone,
  orderActionsFor,
  orderTransitions,
  paymentMethodLabels,
} from '#/lib/order'
import { formatKes, site } from '#/lib/site'
import { getAdminOrder, updateOrderStatus } from '#/server/admin'

import type { OrderAction } from '#/lib/order'

export const Route = createFileRoute('/admin/_auth/orders/$id')({
  loader: async ({ params }) => {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) throw notFound()
    const order = await getAdminOrder({ data: { id } })
    if (!order) throw notFound()
    return order
  },
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const order = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState<OrderAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const actions = orderActionsFor(order.status)

  async function run(action: OrderAction) {
    if (
      action === 'cancel' &&
      !window.confirm(
        `Cancel order ${order.orderNumber}? The items go back into stock. This cannot be undone.`,
      )
    ) {
      return
    }
    setError(null)
    setBusy(action)
    try {
      const result = await updateOrderStatus({ data: { id: order.id, action } })
      if (!result.ok) setError(result.message)
      await router.invalidate()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const message =
    order.status === 'ready'
      ? `Hello ${order.customerName.split(' ')[0]}, your ${site.name} order ${order.orderNumber} is ready for pickup.`
      : `Hello ${order.customerName.split(' ')[0]}, this is ${site.name} about your order ${order.orderNumber}.`

  return (
    <>
      <Link
        to="/admin"
        search={{ status: 'all', q: '' }}
        className="text-sm text-plum underline underline-offset-4"
      >
        ← All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl">Order {order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Placed {formatDateTime(order.createdAt)} · last changed{' '}
        {formatDateTime(order.updatedAt)}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="border border-lilac-line bg-white p-5">
            <h2 className="text-2xl">Payment</h2>
            <dl className="mt-3 grid grid-cols-[9rem_1fr] gap-y-2">
              <dt className="text-ink-muted">Amount due</dt>
              <dd className="font-medium">{formatKes(order.totalKes)}</dd>
              <dt className="text-ink-muted">Method</dt>
              <dd>{paymentMethodLabels[order.paymentMethod]}</dd>
              <dt className="text-ink-muted">M-PESA code</dt>
              <dd>
                {order.mpesaCode ? (
                  <span className="text-xl font-medium tracking-widest">
                    {order.mpesaCode}
                  </span>
                ) : (
                  <span className="text-ink-muted">Not entered yet</span>
                )}
              </dd>
            </dl>
            {order.status === 'payment_submitted' && (
              <p className="mt-4 text-sm text-ink-muted">
                Find this code in your M-PESA messages and check the amount
                matches before you confirm.
              </p>
            )}
            {order.status === 'awaiting_payment' && (
              <p className="mt-4 text-sm text-ink-muted">
                The customer has not entered a code. Confirm only if you can see
                their payment in your M-PESA messages.
              </p>
            )}
          </section>

          <section className="border border-lilac-line bg-white p-5">
            <h2 className="text-2xl">Items</h2>
            <ul className="mt-3 space-y-2">
              {order.items.map((item) => (
                <li key={item.name} className="flex justify-between gap-4">
                  <span>
                    {item.name}
                    <span className="text-ink-muted"> × {item.quantity}</span>
                  </span>
                  <span>{formatKes(item.priceKes * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-lilac-line pt-3 font-medium">
              <span>Total</span>
              <span>{formatKes(order.totalKes)}</span>
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-lilac-line bg-white p-5">
            <h2 className="text-2xl">Next step</h2>
            {actions.length === 0 ? (
              <p className="mt-3 text-ink-muted">
                This order is finished. Nothing more to do.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    disabled={busy !== null}
                    onClick={() => run(action)}
                    className={`btn disabled:opacity-60 ${
                      action === 'cancel'
                        ? 'border-destructive/50 text-destructive hover:bg-destructive/5'
                        : 'btn-primary'
                    }`}
                  >
                    {busy === action
                      ? 'Working…'
                      : orderTransitions[action].label}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Notice kind="error">{error}</Notice>
            </div>
          </section>

          <section className="border border-lilac-line bg-white p-5">
            <h2 className="text-2xl">Customer</h2>
            <p className="mt-3 font-medium">{order.customerName}</p>
            <p>
              <a
                href={`tel:+${order.phone}`}
                className="text-plum underline underline-offset-4"
              >
                {formatPhone(order.phone)}
              </a>
            </p>
            {order.pickupName && (
              <p className="mt-2 text-ink-muted">Pickup: {order.pickupName}</p>
            )}
            {order.notes && (
              <p className="mt-3 border-l-2 border-gold pl-3 text-ink-muted">
                {order.notes}
              </p>
            )}
            <a
              href={`https://wa.me/${order.phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline mt-4 w-full"
            >
              <WhatsAppIcon className="size-5" />
              Message customer
            </a>
            <a
              href={`/orders/${order.accessToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-sm text-plum underline underline-offset-4"
            >
              See the customer's order page
            </a>
          </section>
        </div>
      </div>
    </>
  )
}
