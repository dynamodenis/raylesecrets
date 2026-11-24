import { useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Check, ChevronDown } from 'lucide-react'

import { AddToCart } from '#/components/add-to-cart'
import { ProductPicture } from '#/components/product-picture'
import { WhatsAppIcon } from '#/components/whatsapp'
import { addToCart } from '#/lib/cart'
import { originFrom, pageMeta } from '#/lib/seo'
import { formatKes, site } from '#/lib/site'
import { useWhatsappLink } from '#/lib/site-info'
import { getProduct } from '#/server/catalog'

import { placeholderImage } from '#/data/catalog'

import type { Product } from '#/data/catalog'

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params }) => {
    const product = await getProduct({ data: { slug: params.slug } })
    if (!product) throw notFound()
    return product
  },
  head: ({ loaderData, matches }) => {
    if (!loaderData) return {}
    const product = loaderData
    const origin = originFrom(matches)
    const path = `/products/${product.slug}`
    const photo = product.images.at(0)
    const tags = pageMeta({
      origin,
      path,
      title: `${product.name} ${product.sizeLabel} | ${site.name}`,
      description: product.description,
      image: photo ? `${photo.src}-og.jpg` : undefined,
      type: 'product',
    })
    return {
      // The canonical link comes from the root route.
      meta: tags.meta,
      // Product details in the form Google reads for price and stock.
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `${product.name} ${product.sizeLabel}`.trim(),
            description: product.description,
            brand: { '@type': 'Brand', name: site.name },
            image: photo
              ? product.images.map(
                  (image) =>
                    `${origin}${image.src}-${image.widths[image.widths.length - 1]}.webp`,
                )
              : undefined,
            offers: {
              '@type': 'Offer',
              url: `${origin}${path}`,
              priceCurrency: 'KES',
              price: product.priceKes,
              availability:
                product.stock > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
          }).replace(/</g, '\\u003c'),
        },
      ],
    }
  },
  component: ProductPage,
})

const trustLine = [
  '100% natural',
  'Handmade in Kenya',
  'Pay with M-PESA',
  'Pickup available',
]

function ProductPage() {
  const product = Route.useLoaderData()
  const inStock = product.stock > 0
  const whatsappLink = useWhatsappLink()
  const orderLink = whatsappLink(
    `Hello ${site.name}, I would like to order ${product.name} (${product.sizeLabel}) at ${formatKes(product.priceKes)}.`,
  )

  return (
    <>
      <div className="wrap py-8 md:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
          <Link
            to="/"
            className="text-ink-muted underline-offset-4 hover:underline"
          >
            Home
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-16">
          <Gallery product={product} />

          <div>
            <p className="eyebrow">{product.tagline}</p>
            <h1 className="mt-3 text-5xl sm:text-6xl">{product.name}</h1>
            <p className="mt-2 text-ink-muted">{product.sizeLabel}</p>
            <hr className="gold-rule mt-6" />
            <p className="mt-6 text-2xl font-medium text-ink">
              {formatKes(product.priceKes)}
            </p>
            <p className="mt-4 max-w-lg text-ink-muted">
              {product.description}
            </p>

            {inStock ? (
              <div className="mt-8">
                <AddToCart product={product} />
                <a
                  href={orderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-plum underline underline-offset-4"
                >
                  <WhatsAppIcon className="size-5" />
                  Or order on WhatsApp
                </a>
              </div>
            ) : (
              <p className="mt-8 font-medium text-ink">
                Out of stock. Message us to reserve one.
              </p>
            )}

            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
              {trustLine.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-gold-deep" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 border-t border-lilac-line">
              <Details title="Benefits" items={product.benefits} open />
              <Details title="How to use" items={product.howToUse} ordered />
              {product.bestResults.length > 0 && (
                <Details title="For best results" items={product.bestResults} />
              )}
              <Details title="Ingredients" items={[product.ingredients]} />
              <Details title="Caution" items={product.caution} />
            </div>
          </div>
        </div>
      </div>

      {/* Order bar that stays in view on phones */}
      {inStock && (
        <div className="sticky bottom-0 z-20 border-t border-lilac-line bg-white md:hidden">
          <div className="wrap flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-serif text-xl leading-tight font-semibold text-plum">
                {product.name}
              </p>
              <p className="text-sm text-ink-muted">
                {formatKes(product.priceKes)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary mr-16 px-5"
              onClick={() => addToCart(product)}
            >
              Add to cart
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function Gallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0)
  const images = product.images.length > 0 ? product.images : [placeholderImage]
  const image = images[active]

  return (
    <div>
      <div className="flex aspect-[4/5] items-center justify-center border border-lilac-line bg-white p-4 sm:p-8">
        <ProductPicture
          key={image.src}
          image={image}
          sizes="(min-width: 768px) 520px, 90vw"
          priority
          className="max-h-full w-auto max-w-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3">
          {images.map((thumb, index) => (
            <li key={thumb.src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={`block size-20 overflow-hidden border bg-lilac ${
                  index === active ? 'border-plum' : 'border-lilac-line'
                }`}
              >
                <img
                  src={`${thumb.src}-${thumb.widths[0]}.webp`}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover object-top"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Details({
  title,
  items,
  ordered = false,
  open = false,
}: {
  title: string
  items: Array<string>
  ordered?: boolean
  open?: boolean
}) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <details className="group border-b border-lilac-line" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium text-plum [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="size-5 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      {items.length === 1 ? (
        <p className="pb-5 text-ink-muted">{items[0]}</p>
      ) : (
        <List
          className={`space-y-1.5 pb-5 pl-5 text-ink-muted ${ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      )}
    </details>
  )
}
