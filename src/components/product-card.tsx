import { Link } from '@tanstack/react-router'

import { ProductPicture } from '#/components/product-picture'
import { formatKes } from '#/lib/site'

import { primaryImage } from '#/data/catalog'

import type { Product } from '#/data/catalog'

export function ProductCard({ product }: { product: Product }) {
  const image = primaryImage(product)
  const hasPhoto = product.images.length > 0
  return (
    <article className="group flex flex-col border border-lilac-line bg-white">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block bg-lilac px-8 pt-8"
        aria-label={`${product.name}, ${product.sizeLabel}`}
      >
        <div className="arch mx-auto aspect-[3/4] max-w-72 bg-white">
          <ProductPicture
            image={image}
            sizes="(min-width: 768px) 288px, 70vw"
            className={`size-full transition-transform duration-500 group-hover:scale-[1.03] ${hasPhoto ? 'object-cover object-top' : 'object-contain p-8'}`}
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col items-center px-6 py-7 text-center">
        <p className="eyebrow">{product.sizeLabel}</p>
        <h3 className="mt-2 text-3xl">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="text-plum no-underline"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 max-w-sm text-ink-muted">{product.description}</p>
        <p className="mt-4 text-lg font-medium text-ink">
          {formatKes(product.priceKes)}
        </p>
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="btn btn-primary mt-5 w-full sm:w-auto"
        >
          View product
        </Link>
      </div>
    </article>
  )
}
