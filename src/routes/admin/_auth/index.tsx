import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import {
  StatusBadge,
  adminInput,
  adminStatusLabels,
} from '#/components/admin-ui'
import { formatDateTime, formatPhone, orderStatuses } from '#/lib/order'
import { formatKes } from '#/lib/site'
import { listOrders } from '#/server/admin'

const filters = ['all', ...orderStatuses] as const

export const Route = createFileRoute('/admin/_auth/')({
  validateSearch: z.object({
    status: z.enum(filters).catch('all').default('all'),
    q: z.string().catch('').default(''),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listOrders({ data: deps }),
  component: OrdersPage,
})

function OrdersPage() {
  const { orders, counts } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [query, setQuery] = useState(search.q)

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  const toCheck = counts.payment_submitted ?? 0

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Orders</h1>
          <p className="mt-1 text-ink-muted">
            {toCheck > 0
              ? `${toCheck} ${toCheck === 1 ? 'payment' : 'payments'} to check against your M-PESA messages.`
              : 'No payments waiting to be checked.'}
          </p>
        </div>
        <form
          role="search"
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={(event) => {
            event.preventDefault()
            void navigate({ search: (prev) => ({ ...prev, q: query.trim() }) })
          }}
        >
          <label htmlFor="order-search" className="sr-only">
            Search orders
          </label>
          <input
            id="order-search"
            type="search"
            placeholder="Order no., name, phone or M-PESA code"
            className={`${adminInput} mt-0 sm:w-80`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn-outline min-h-0 px-4 py-2">
            Search
          </button>
        </form>
      </div>

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {filters.map((status) => {
          const count = status === 'all' ? total : (counts[status] ?? 0)
          const active = search.status === status
          return (
            <Link
              key={status}
              from={Route.fullPath}
              search={(prev) => ({ ...prev, status })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium no-underline ${
                active
                  ? 'border-plum bg-plum text-white'
                  : 'border-input bg-white text-ink hover:bg-lilac'
              }`}
            >
              {status === 'all' ? 'All' : adminStatusLabels[status]} ({count})
            </Link>
          )
        })}
      </nav>

      {orders.length === 0 ? (
        <p className="mt-10 text-ink-muted">
          {search.q || search.status !== 'all'
            ? 'No orders match this filter.'
            : 'No orders yet. They will appear here as soon as a customer checks out.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-lilac-line border border-lilac-line bg-white">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to="/admin/orders/$id"
                params={{ id: String(order.id) }}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 text-ink no-underline hover:bg-lilac sm:grid-cols-[7rem_1fr_9rem_7rem_auto]"
              >
                <span className="font-medium text-plum">
                  {order.orderNumber}
                </span>
                <span className="justify-self-end sm:order-last">
                  <StatusBadge status={order.status} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{order.customerName}</span>
                  <span className="block text-sm text-ink-muted">
                    {formatPhone(order.phone)}
                    {order.mpesaCode ? ` · ${order.mpesaCode}` : ''}
                  </span>
                </span>
                <span className="justify-self-end text-sm text-ink-muted sm:justify-self-start">
                  {formatDateTime(order.createdAt)}
                </span>
                <span className="col-span-2 font-medium sm:col-span-1 sm:justify-self-end">
                  {formatKes(order.totalKes)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
