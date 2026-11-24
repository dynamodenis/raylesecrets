import { Link } from '@tanstack/react-router'

import { formatKes } from '#/lib/site'

import { millilitres } from '#/data/catalog'

import type { ProductSize } from '#/data/catalog'

/** A dropper bottle, drawn taller for bigger sizes. */
function Bottle({ scale }: { scale: number }) {
  return (
    <svg
      viewBox="0 0 24 48"
      style={{ height: `${Math.round(64 * scale)}px` }}
      className="w-auto"
      fill="none"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* dropper */}
      <path d="M10 9V4.5a2 2 0 0 1 4 0V9" className="stroke-plum" />
      {/* gold collar */}
      <rect
        x="8"
        y="9"
        width="8"
        height="5"
        rx="1"
        className="fill-gold stroke-gold"
      />
      {/* bottle */}
      <path
        d="M9.5 14v2.5c0 1.5-5 2.5-5 6V43a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5V22.5c0-3.5-5-4.5-5-6V14"
        className="fill-white stroke-plum"
      />
      {/* label */}
      <rect x="4.5" y="26" width="15" height="12" className="fill-lilac-line" />
    </svg>
  )
}

/**
 * The bottle sizes a product comes in. Each size is a product page of its
 * own, so choosing one swaps the page in place without scrolling.
 */
export function SizePicker({
  sizes,
  current,
}: {
  sizes: Array<ProductSize>
  current: string
}) {
  const volumes = sizes.map((size) => millilitres(size.sizeLabel))
  const largest = Math.max(...volumes.map((ml) => ml ?? 0))
  const perMl = sizes.map((size, index) => {
    const ml = volumes[index]
    return ml ? size.priceKes / ml : null
  })
  const known = perMl.filter((value) => value !== null)
  const lowest = Math.min(...known)
  // Only call a size the best value when it really is cheaper per ml.
  const hasBestValue =
    known.length === sizes.length && known.some((value) => value > lowest)
  const selected = sizes.find((size) => size.slug === current)

  return (
    <div>
      <p id="size-picker-label" className="text-sm text-ink-muted">
        Size:{' '}
        <span className="font-medium text-ink">{selected?.sizeLabel}</span>
      </p>
      <ul
        aria-labelledby="size-picker-label"
        className="mt-3 grid max-w-md gap-3 pt-2.5"
        style={{
          gridTemplateColumns: `repeat(${Math.min(sizes.length, 3)}, minmax(0, 1fr))`,
        }}
      >
        {sizes.map((size, index) => {
          const ml = volumes[index]
          const rate = perMl[index]
          const isCurrent = size.slug === current
          const soldOut = size.stock <= 0
          return (
            <li key={size.slug} className="relative">
              {hasBestValue && rate === lowest && (
                <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-plum px-2.5 py-0.5 text-[0.6875rem] font-medium tracking-wider whitespace-nowrap text-gold-light uppercase">
                  Best value
                </span>
              )}
              <Link
                to="/products/$slug"
                params={{ slug: size.slug }}
                replace
                resetScroll={false}
                aria-current={isCurrent ? 'true' : undefined}
                className={`flex h-full flex-col items-center border px-2 pt-5 pb-3 text-center no-underline transition-colors ${
                  isCurrent
                    ? 'border-plum bg-lilac shadow-[inset_0_0_0_1px_var(--plum)]'
                    : 'border-lilac-line bg-white hover:border-plum'
                } ${soldOut ? 'opacity-60' : ''}`}
              >
                <span className="flex h-16 items-end">
                  <Bottle scale={ml && largest ? Math.cbrt(ml / largest) : 1} />
                </span>
                <span className="mt-2 font-serif text-2xl leading-tight font-semibold text-plum">
                  {size.sizeLabel}
                </span>
                <span className="font-medium text-ink">
                  {formatKes(size.priceKes)}
                </span>
                <span className="mt-0.5 text-xs text-ink-muted">
                  {soldOut
                    ? 'Sold out'
                    : rate !== null &&
                      `${formatKes(Math.round(rate * 10) / 10)} per ml`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
