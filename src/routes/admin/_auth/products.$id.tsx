import { useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'

import { Field, Notice, adminInput } from '#/components/admin-ui'
import { getAdminProduct, saveProduct } from '#/server/admin'

export const Route = createFileRoute('/admin/_auth/products/$id')({
  loader: async ({ params }) => {
    if (params.id === 'new') return null
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) throw notFound()
    const product = await getAdminProduct({ data: { id } })
    if (!product) throw notFound()
    return product
  },
  component: ProductEditPage,
})

/** One item per line in a text box <-> a list of strings. */
const toLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

function ProductEditPage() {
  const product = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: product?.name ?? '',
    tagline: product?.tagline ?? '',
    description: product?.description ?? '',
    sizeLabel: product?.sizeLabel ?? '',
    priceKes: String(product?.priceKes ?? ''),
    stock: String(product?.stock ?? '0'),
    isActive: product?.isActive ?? true,
    benefits: (product?.benefits ?? []).join('\n'),
    howToUse: (product?.howToUse ?? []).join('\n'),
    bestResults: (product?.bestResults ?? []).join('\n'),
    ingredients: product?.ingredients ?? '',
    caution: (product?.caution ?? []).join('\n'),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = <TKey extends keyof typeof form>(
    key: TKey,
    value: (typeof form)[TKey],
  ) => {
    setSaved(false)
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    const priceKes = Number(form.priceKes)
    const stock = Number(form.stock)
    if (form.name.trim().length < 2) return setError('Please enter a name.')
    if (
      form.priceKes.trim() === '' ||
      !Number.isInteger(priceKes) ||
      priceKes < 0
    )
      return setError('Enter the price in whole shillings, for example 1200.')
    if (!Number.isInteger(stock) || stock < 0)
      return setError('Enter the stock as a whole number, for example 20.')
    if (priceKes > 1_000_000)
      return setError('The price cannot be more than KES 1,000,000.')
    const lists = [form.benefits, form.howToUse, form.bestResults, form.caution]
    if (lists.some((list) => toLines(list).length > 20))
      return setError('Please keep each list to 20 lines or fewer.')

    setBusy(true)
    try {
      const result = await saveProduct({
        data: {
          id: product?.id ?? null,
          name: form.name,
          tagline: form.tagline,
          description: form.description,
          sizeLabel: form.sizeLabel,
          priceKes,
          stock,
          isActive: form.isActive,
          benefits: toLines(form.benefits),
          howToUse: toLines(form.howToUse),
          bestResults: toLines(form.bestResults),
          ingredients: form.ingredients,
          caution: toLines(form.caution),
        },
      })
      if (!result.ok) return setError(result.message)
      if (product) {
        await router.invalidate()
        setSaved(true)
      } else {
        await navigate({
          to: '/admin/products/$id',
          params: { id: String(result.id) },
        })
      }
    } catch {
      setError('Could not save. Please check the fields and try again.')
    } finally {
      setBusy(false)
    }
  }

  const textArea = (
    key: 'benefits' | 'howToUse' | 'bestResults' | 'caution',
    label: string,
  ) => (
    <Field label={label} hint="One per line." htmlFor={key}>
      <textarea
        id={key}
        rows={5}
        className={adminInput}
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
      />
    </Field>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl">
      <Link
        to="/admin/products"
        className="text-sm text-plum underline underline-offset-4"
      >
        ← All products
      </Link>
      <h1 className="mt-3 text-4xl">
        {product ? product.name : 'New product'}
      </h1>
      {product ? (
        <p className="mt-1 text-sm text-ink-muted">
          Shop page:{' '}
          <a
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-plum underline underline-offset-4"
          >
            /products/{product.slug}
          </a>
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-muted">
          New products show the logo in place of a photo until product photos
          are added to the site.
        </p>
      )}

      <div className="mt-6 space-y-5 border border-lilac-line bg-white p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <input
              id="name"
              className={adminInput}
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
            />
          </Field>
          <Field label="Size" hint="For example 120 ml." htmlFor="sizeLabel">
            <input
              id="sizeLabel"
              className={adminInput}
              value={form.sizeLabel}
              onChange={(event) => set('sizeLabel', event.target.value)}
            />
          </Field>
          <Field label="Price (KES)" htmlFor="priceKes">
            <input
              id="priceKes"
              inputMode="numeric"
              className={adminInput}
              value={form.priceKes}
              onChange={(event) => set('priceKes', event.target.value)}
            />
          </Field>
          <Field label="In stock" htmlFor="stock">
            <input
              id="stock"
              inputMode="numeric"
              className={adminInput}
              value={form.stock}
              onChange={(event) => set('stock', event.target.value)}
            />
          </Field>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="size-5 accent-plum"
            checked={form.isActive}
            onChange={(event) => set('isActive', event.target.checked)}
          />
          <span>
            <span className="font-medium">Show in the shop</span>
            <span className="block text-sm text-ink-muted">
              Untick to hide the product without deleting it.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 space-y-5 border border-lilac-line bg-white p-5">
        <Field
          label="Tagline"
          hint="The small line above the name."
          htmlFor="tagline"
        >
          <input
            id="tagline"
            className={adminInput}
            value={form.tagline}
            onChange={(event) => set('tagline', event.target.value)}
          />
        </Field>
        <Field label="Short description" htmlFor="description">
          <textarea
            id="description"
            rows={3}
            className={adminInput}
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </Field>
        {textArea('benefits', 'Benefits')}
        {textArea('howToUse', 'How to use')}
        {textArea('bestResults', 'For best results')}
        <Field label="Ingredients" htmlFor="ingredients">
          <textarea
            id="ingredients"
            rows={2}
            className={adminInput}
            value={form.ingredients}
            onChange={(event) => set('ingredients', event.target.value)}
          />
        </Field>
        {textArea('caution', 'Caution')}
      </div>

      <div className="mt-6 space-y-4">
        <Notice kind="error">{error}</Notice>
        <Notice kind="success">{saved ? 'Saved.' : null}</Notice>
        <button
          type="submit"
          className="btn btn-primary disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  )
}
