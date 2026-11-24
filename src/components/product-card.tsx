import { Link } from '@tanstack/react-router'

import { ProductPicture } from '#/components/product-picture'
import { formatKes } from '#/lib/site'

import { primaryImage } from '#/data/catalog'

import type { Product, ProductSize } from '#/data/catalog'

export function ProductCard({
  product,
  sizes,
}: {
  product: Product
  /** Every bottle size the product comes in, smallest first */
  sizes: Array<ProductSize>
}) {
  const image = primaryImage(product)
  const manySizes = sizes.length > 1
  const sizeText = sizes.map((size) => size.sizeLabel).join(' · ')
  const lowestPrice = Math.min(...sizes.map((size) => size.priceKes))
  const hasPhoto = product.images.length > 0
  return (
    <article className="group flex flex-col border border-lilac-line bg-white">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block bg-lilac px-8 pt-8"
        aria-label={`${product.name}, ${sizes.map((size) => size.sizeLabel).join(', ')}`}
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
        <p className="eyebrow">{sizeText}</p>
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
          {manySizes && (
            <span className="text-base font-normal text-ink-muted">From </span>
          )}
          {formatKes(lowestPrice)}
        </p>
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="btn btn-primary mt-5 w-full sm:w-auto"
        >
          {manySizes ? 'Choose a size' : 'View product'}
        </Link>
      </div>
    </article>
  )
}
