import { Link, createFileRoute } from '@tanstack/react-router'

import { CartLines } from '#/components/cart-lines'
import { cartSubtotal, useCartItems, useCartReady } from '#/lib/cart'
import { formatKes, site } from '#/lib/site'

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [
      { title: `Your cart | ${site.name}` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: CartPage,
})

function CartPage() {
  const items = useCartItems()
  const ready = useCartReady()

  return (
    <section className="wrap max-w-3xl py-10 md:py-16">
      <h1 className="text-5xl">Your cart</h1>
      <hr className="gold-rule mt-6" />

      {!ready ? (
        <p className="mt-8 text-ink-muted">Loading your cart…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <p className="text-ink-muted">Your cart is empty.</p>
          <Link to="/" hash="products" className="btn btn-primary mt-6">
            Shop the range
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <CartLines items={items} />
          </div>
          <div className="mt-2 border-t border-lilac-line pt-6 sm:ml-auto sm:max-w-sm">
            <div className="flex items-baseline justify-between">
              <p className="text-ink-muted">Subtotal</p>
              <p className="text-2xl font-medium text-ink">
                {formatKes(cartSubtotal(items))}
              </p>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Pay with M-PESA. Pick up at our pickup point.
            </p>
            <Link to="/checkout" className="btn btn-primary mt-5 w-full">
              Checkout
            </Link>
            <Link
              to="/"
              hash="products"
              className="mt-3 block text-center text-sm text-plum underline underline-offset-4"
            >
              Continue shopping
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
