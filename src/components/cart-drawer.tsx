import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'

import { CartLines } from '#/components/cart-lines'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  cartSubtotal,
  loadCart,
  setDrawerOpen,
  useCartItems,
  useDrawerOpen,
} from '#/lib/cart'
import { formatKes } from '#/lib/site'

/** Slide-over cart. Mounted once in the root layout. */
export function CartDrawer() {
  const items = useCartItems()
  const open = useDrawerOpen()

  // Read the saved cart once the page is running in the browser.
  useEffect(() => loadCart(), [])

  return (
    <Sheet open={open} onOpenChange={setDrawerOpen}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-lilac-line">
          <SheetTitle className="font-serif text-3xl font-semibold text-plum">
            Your cart
          </SheetTitle>
          <SheetDescription className="sr-only">
            Items you have added, with the subtotal and a link to checkout.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-ink-muted">Your cart is empty.</p>
            <Link
              to="/"
              hash="products"
              className="btn btn-outline"
              onClick={() => setDrawerOpen(false)}
            >
              Shop the range
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <CartLines items={items} />
            </div>
            <div className="border-t border-lilac-line px-5 py-5">
              <div className="flex items-baseline justify-between">
                <p className="text-ink-muted">Subtotal</p>
                <p className="text-xl font-medium text-ink">
                  {formatKes(cartSubtotal(items))}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Pay with M-PESA. Pick up at our pickup point.
              </p>
              <Link
                to="/checkout"
                className="btn btn-primary mt-4 w-full"
                onClick={() => setDrawerOpen(false)}
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                className="mt-3 block text-center text-sm text-plum underline underline-offset-4"
                onClick={() => setDrawerOpen(false)}
              >
                View cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
