import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { clearCart, useCartItems, useCartReady } from '#/lib/cart'
import { checkoutFormSchema, paymentMethodLabels } from '#/lib/order'
import { formatKes, site } from '#/lib/site'
import { useWhatsappLink } from '#/lib/site-info'
import { createOrder, getCheckoutInfo, validateCart } from '#/server/orders'

import type { ReactNode } from 'react'
import type { CheckoutForm } from '#/lib/order'

export const Route = createFileRoute('/checkout')({
  loader: () => getCheckoutInfo(),
  head: () => ({
    meta: [
      { title: `Checkout | ${site.name}` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: CheckoutPage,
})

const inputClass =
  'mt-1.5 block w-full rounded-md border border-input bg-white px-3.5 py-3 text-base text-ink placeholder:text-ink-muted/60'

function CheckoutPage() {
  const info = Route.useLoaderData()
  const items = useCartItems()
  const ready = useCartReady()
  const navigate = useNavigate()
  const whatsappLink = useWhatsappLink()
  const [serverError, setServerError] = useState<string | null>(null)

  const lines = items.map(({ slug, quantity }) => ({ slug, quantity }))

  // Ask the server for the real prices and stock of what is in the cart.
  const cart = useQuery({
    queryKey: ['validate-cart', lines],
    queryFn: () => validateCart({ data: { items: lines } }),
    enabled: ready && lines.length > 0 && info.available,
  })

  const defaultValues: CheckoutForm = {
    customerName: '',
    phone: '',
    pickupLocationId: info.pickupLocations.at(0)?.id ?? 0,
    paymentMethod: info.methods.at(0) ?? 'paybill',
    notes: '',
  }

  const form = useForm({
    defaultValues,
    validators: { onSubmit: checkoutFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(null)
      if (!cart.data) return
      try {
        const result = await createOrder({
          data: {
            ...value,
            items: lines,
            expectedTotalKes: cart.data.subtotalKes,
          },
        })
        if (!result.ok) {
          setServerError(result.message)
          void cart.refetch()
          return
        }
        await navigate({
          to: '/orders/$token',
          params: { token: result.token },
        })
        clearCart()
      } catch {
        setServerError(
          'Something went wrong while placing your order. Please check your connection and try again.',
        )
      }
    },
  })

  if (!info.available) {
    return (
      <Shell>
        <p className="mt-8 text-ink-muted">
          Online ordering is not switched on yet. You can order on WhatsApp.
        </p>
        <a
          href={whatsappLink(`Hello ${site.name}, I would like to order.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-6"
        >
          Order on WhatsApp
        </a>
      </Shell>
    )
  }

  if (!ready) {
    return (
      <Shell>
        <p className="mt-8 text-ink-muted">Loading your cart…</p>
      </Shell>
    )
  }

  if (items.length === 0) {
    return (
      <Shell>
        <p className="mt-8 text-ink-muted">Your cart is empty.</p>
        <Link to="/" hash="products" className="btn btn-primary mt-6">
          Shop the range
        </Link>
      </Shell>
    )
  }

  const canOrder = cart.data?.allOk === true

  return (
    <Shell>
      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_22rem] md:gap-14">
        {/* Order summary: first on phones, on the right on larger screens */}
        <aside className="md:order-2" aria-labelledby="summary-heading">
          <div className="border border-lilac-line bg-lilac p-5">
            <h2 id="summary-heading" className="text-2xl">
              Your order
            </h2>
            {cart.isPending ? (
              <p className="mt-4 text-ink-muted">Checking prices…</p>
            ) : cart.isError || !cart.data ? (
              <p className="mt-4 text-destructive" role="alert">
                We could not load your order. Please refresh the page.
              </p>
            ) : (
              <>
                <ul className="mt-4 space-y-3">
                  {cart.data.lines.map((line) => (
                    <li key={line.slug}>
                      <div className="flex justify-between gap-4">
                        <p className="text-ink">
                          {line.name}
                          <span className="text-ink-muted">
                            {' '}
                            × {line.quantity}
                          </span>
                        </p>
                        <p className="whitespace-nowrap text-ink">
                          {formatKes(line.priceKes * line.quantity)}
                        </p>
                      </div>
                      {!line.ok && (
                        <p className="text-sm text-destructive" role="alert">
                          {line.available > 0
                            ? `Only ${line.available} left. Please reduce the quantity in your cart.`
                            : 'Out of stock. Please remove it from your cart.'}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-baseline justify-between border-t border-lilac-line pt-4">
                  <p className="font-medium text-plum">Total</p>
                  <p className="text-2xl font-medium text-ink">
                    {formatKes(cart.data.subtotalKes)}
                  </p>
                </div>
              </>
            )}
            <Link
              to="/cart"
              className="mt-3 inline-block text-sm text-plum underline underline-offset-4"
            >
              Edit cart
            </Link>
          </div>
        </aside>

        <form
          noValidate
          className="space-y-10 md:order-1"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <fieldset>
            <legend className="font-serif text-3xl font-semibold text-plum">
              1. Your details
            </legend>
            <div className="mt-4 space-y-5">
              <form.Field name="customerName">
                {(field) => (
                  <div>
                    <label htmlFor="customerName" className="font-medium">
                      Full name
                    </label>
                    <input
                      id="customerName"
                      name="customerName"
                      autoComplete="name"
                      className={inputClass}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby="customerName-error"
                    />
                    <FieldError
                      id="customerName-error"
                      errors={field.state.meta.errors}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="phone">
                {(field) => (
                  <div>
                    <label htmlFor="phone" className="font-medium">
                      Phone number
                    </label>
                    <p className="text-sm text-ink-muted">
                      We use it only to confirm your order.
                    </p>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0712 345 678"
                      className={inputClass}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby="phone-error"
                    />
                    <FieldError
                      id="phone-error"
                      errors={field.state.meta.errors}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </fieldset>

          <form.Field name="pickupLocationId">
            {(field) => (
              <fieldset>
                <legend className="font-serif text-3xl font-semibold text-plum">
                  2. Pickup
                </legend>
                <div className="mt-4 space-y-3">
                  {info.pickupLocations.map((location) => (
                    <RadioCard
                      key={location.id}
                      name="pickupLocationId"
                      checked={field.state.value === location.id}
                      onChange={() => field.handleChange(location.id)}
                    >
                      <span className="font-medium text-ink">
                        {location.name}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        {location.address}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        {location.hours}
                      </span>
                    </RadioCard>
                  ))}
                </div>
                <FieldError
                  id="pickup-error"
                  errors={field.state.meta.errors}
                />
                <p className="mt-3 text-sm text-ink-muted">
                  Need delivery instead?{' '}
                  <a
                    href={whatsappLink(
                      `Hello ${site.name}, I would like my order delivered.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-plum underline underline-offset-4"
                  >
                    Message us on WhatsApp
                  </a>
                  .
                </p>
              </fieldset>
            )}
          </form.Field>

          <form.Field name="paymentMethod">
            {(field) => (
              <fieldset>
                <legend className="font-serif text-3xl font-semibold text-plum">
                  3. How you'll pay
                </legend>
                <p className="mt-1 text-sm text-ink-muted">
                  You'll get the payment steps on the next page.
                </p>
                <div className="mt-4 space-y-3">
                  {info.methods.map((method) => (
                    <RadioCard
                      key={method}
                      name="paymentMethod"
                      checked={field.state.value === method}
                      onChange={() => field.handleChange(method)}
                    >
                      <span className="font-medium text-ink">
                        {paymentMethodLabels[method]}
                      </span>
                    </RadioCard>
                  ))}
                </div>
              </fieldset>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <div>
                <label htmlFor="notes" className="font-medium">
                  Note for us{' '}
                  <span className="font-normal text-ink-muted">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className={inputClass}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-describedby="notes-error"
                />
                <FieldError id="notes-error" errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <div>
            {serverError && (
              <p
                role="alert"
                className="mb-4 border border-destructive/40 bg-destructive/5 p-3 text-destructive"
              >
                {serverError}
              </p>
            )}
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <button
                  type="submit"
                  className="btn btn-primary w-full disabled:opacity-60 sm:w-auto"
                  disabled={isSubmitting || !canOrder}
                >
                  {isSubmitting ? 'Placing your order…' : 'Place order'}
                </button>
              )}
            </form.Subscribe>
            <p className="mt-3 text-sm text-ink-muted">
              No payment is taken on this page. You pay with M-PESA on the next
              step.
            </p>
          </div>
        </form>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <section className="wrap max-w-5xl py-10 md:py-16">
      <h1 className="text-5xl">Checkout</h1>
      <hr className="gold-rule mt-6" />
      {children}
    </section>
  )
}

function FieldError({
  id,
  errors,
}: {
  id: string
  errors: Array<{ message?: string } | undefined>
}) {
  const message = errors.find((error) => error?.message)?.message
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 text-sm text-destructive empty:hidden"
    >
      {message}
    </p>
  )
}

function RadioCard({
  name,
  checked,
  onChange,
  children,
}: {
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 ${
        checked ? 'border-plum bg-lilac' : 'border-input bg-white'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-plum"
      />
      <span>{children}</span>
    </label>
  )
}
