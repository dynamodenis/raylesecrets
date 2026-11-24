import { Link, createFileRoute } from '@tanstack/react-router'

import { formatKes } from '#/lib/site'
import { listAdminProducts } from '#/server/admin'

export const Route = createFileRoute('/admin/_auth/products/')({
  loader: () => listAdminProducts(),
  component: ProductsPage,
})

function ProductsPage() {
  const products = Route.useLoaderData()

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Products</h1>
        <Link
          to="/admin/products/$id"
          params={{ id: 'new' }}
          className="btn btn-primary"
        >
          Add product
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-lilac-line border border-lilac-line bg-white">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              to="/admin/products/$id"
              params={{ id: String(product.id) }}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3.5 text-ink no-underline hover:bg-lilac"
            >
              <span>
                <span className="font-medium text-plum">{product.name}</span>
                <span className="text-ink-muted"> {product.sizeLabel}</span>
                {!product.isActive && (
                  <span className="ml-2 rounded-full border border-input px-2 py-0.5 text-sm text-ink-muted">
                    Hidden
                  </span>
                )}
              </span>
              <span className="flex gap-6">
                <span>{formatKes(product.priceKes)}</span>
                <span
                  className={
                    product.stock === 0
                      ? 'font-medium text-destructive'
                      : 'text-ink-muted'
                  }
                >
                  {product.stock === 0
                    ? 'Out of stock'
                    : `${product.stock} in stock`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
