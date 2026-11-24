import { Minus, Plus, Trash2 } from 'lucide-react'

import { MAX_QUANTITY, removeFromCart, setQuantity } from '#/lib/cart'
import { formatKes } from '#/lib/site'

import type { CartItem } from '#/lib/cart'

export function QuantityStepper({
  value,
  onChange,
  label,
  max = MAX_QUANTITY,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  max?: number
}) {
  const button =
    'flex size-11 items-center justify-center text-plum disabled:text-ink-muted/40'
  return (
    <div
      role="group"
      aria-label={`Quantity of ${label}`}
      className="inline-flex items-center rounded-md border border-input"
    >
      <button
        type="button"
        className={button}
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" />
      </button>
      <span
        className="w-8 text-center font-medium tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={button}
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

/** The list of cart items with quantity controls. Used in the drawer and on /cart. */
export function CartLines({ items }: { items: Array<CartItem> }) {
  return (
    <ul className="divide-y divide-lilac-line">
      {items.map((item) => (
        <li key={item.slug} className="flex gap-4 py-4">
          <img
            src={item.image}
            alt=""
            width={72}
            height={96}
            loading="lazy"
            className="h-24 w-18 shrink-0 border border-lilac-line object-cover object-top"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-xl leading-tight font-semibold text-plum">
                  {item.name}
                </p>
                <p className="text-sm text-ink-muted">{item.sizeLabel}</p>
              </div>
              <p className="font-medium whitespace-nowrap text-ink">
                {formatKes(item.priceKes * item.quantity)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <QuantityStepper
                value={item.quantity}
                label={item.name}
                onChange={(quantity) => setQuantity(item.slug, quantity)}
              />
              <button
                type="button"
                onClick={() => removeFromCart(item.slug)}
                aria-label={`Remove ${item.name} from cart`}
                className="flex size-11 items-center justify-center text-ink-muted hover:text-plum"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
