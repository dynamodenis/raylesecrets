import type { ReactNode } from 'react'
import type { OrderStatus } from '#/lib/order'

// Small building blocks shared by the admin screens.

export const adminInput =
  'mt-1.5 block w-full rounded-md border border-input bg-white px-3 py-2.5 text-base text-ink disabled:bg-lilac'

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="font-medium">
        {label}
      </label>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      {children}
    </div>
  )
}

export function Notice({
  kind,
  children,
}: {
  kind: 'error' | 'success'
  children: ReactNode
}) {
  if (!children) return null
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-md border p-3 ${
        kind === 'error'
          ? 'border-destructive/40 bg-destructive/5 text-destructive'
          : 'border-plum/30 bg-lilac text-plum'
      }`}
    >
      {children}
    </p>
  )
}

const statusStyles: Record<OrderStatus, string> = {
  awaiting_payment: 'bg-white text-ink-muted border-input',
  payment_submitted: 'bg-gold-light/40 text-ink border-gold',
  paid: 'bg-lilac text-plum border-plum/30',
  ready: 'bg-plum text-white border-plum',
  completed: 'bg-white text-ink border-input',
  cancelled: 'bg-white text-ink-muted border-input line-through',
}

export const adminStatusLabels: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_submitted: 'Check payment',
  paid: 'Paid',
  ready: 'Ready',
  completed: 'Collected',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap ${statusStyles[status]}`}
    >
      {adminStatusLabels[status]}
    </span>
  )
}
