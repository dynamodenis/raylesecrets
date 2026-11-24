import { Link, createFileRoute } from '@tanstack/react-router'
import { HandHeart, Leaf, ShieldCheck, Users } from 'lucide-react'

import { ProductCard } from '#/components/product-card'
import { ProductPicture } from '#/components/product-picture'
import { originFrom } from '#/lib/seo'
import { site } from '#/lib/site'
import { useSiteInfo } from '#/lib/site-info'
import { getProducts } from '#/server/catalog'

import { shopFront } from '#/data/catalog'

export const Route = createFileRoute('/')({
  loader: () => getProducts(),
  // The shop itself, in the form Google reads.
  head: ({ matches }) => {
    const origin = originFrom(matches)
    return {
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: site.name,
            url: origin,
            logo: `${origin}/images/logo.png`,
            description: site.description,
          }),
        },
      ],
    }
  },
  component: Home,
})

const promises = [
  { icon: Leaf, title: '100% natural', text: 'Herbal ingredients only' },
  {
    icon: ShieldCheck,
    title: 'No harsh chemicals',
    text: 'Gentle on scalp and hair',
  },
  {
    icon: HandHeart,
    title: 'Handmade',
    text: 'Made in small batches in Kenya',
  },
  { icon: Users, title: 'For everyone', text: 'Men and women, all hair types' },
]

const firstSteps = [
  {
    title: 'Choose',
    text: 'Pick the products that suit your hair. Message us if you need help choosing.',
  },
  {
    title: 'Pay with M-PESA',
    text: 'Pay with M-PESA to our Pochi la Biashara number. We confirm your payment the same day.',
  },
]

function Home() {
  // One card per product: bottle sizes of the same product share a card.
  const entries = shopFront(Route.useLoaderData())
  const { pickup } = useSiteInfo()
  const heroImages = entries
    .filter(({ product }) => product.images.length > 0)
    .slice(0, 2)
    .map(({ product }) => product.images[0])
  const steps = [
    ...firstSteps,
    {
      title: 'Collect',
      text: `Pick up your order at ${pickup?.name ?? 'our pickup point'}, or ask us about delivery.`,
    },
  ]

  return (
    <>
      {/* Hero */}
      <section className="bg-lilac">
        <div className="wrap grid items-center gap-12 py-14 md:grid-cols-2 md:py-24">
          <div className="text-center md:text-left">
            <p className="eyebrow">Natural herbal hair care</p>
            <h1 className="mt-4 text-5xl sm:text-6xl lg:text-7xl">
              Healthy scalp.
              <br />
              Beautiful hair.
            </h1>
            <hr className="gold-rule mx-auto mt-7 md:mx-0" />
            <p className="mx-auto mt-7 max-w-md text-lg text-ink-muted md:mx-0">
              Handmade from natural herbs, with no harsh chemicals. Made to
              strengthen your hair and care for your scalp.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link to="/" hash="products" className="btn btn-primary">
                Shop now
              </Link>
              <Link to="/" hash="story" className="btn btn-outline">
                Our story
              </Link>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-md grid-cols-2 items-end gap-4 sm:gap-6">
            {heroImages.map((image, index) => (
              <div
                key={image.src}
                style={{ aspectRatio: `${image.width} / ${image.height}` }}
                className={`arch border border-gold bg-white ${index === 1 ? 'mb-10' : ''}`}
              >
                <ProductPicture
                  image={image}
                  sizes="(min-width: 768px) 220px, 45vw"
                  priority
                  className="size-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we promise */}
      <section
        aria-label="What we promise"
        className="border-b border-lilac-line"
      >
        <ul className="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center text-center">
              <Icon
                className="size-7 text-gold"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p className="mt-3 font-medium text-plum">{title}</p>
              <p className="text-sm text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Products */}
      <section id="products" className="wrap py-20">
        <div className="text-center">
          <p className="eyebrow">The range</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Our products</h2>
          <hr className="gold-rule mx-auto mt-6" />
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
          {entries.map(({ product, sizes }) => (
            <ProductCard key={product.slug} product={product} sizes={sizes} />
          ))}
        </div>
      </section>

      {/* Results */}
      <section id="results" className="bg-lilac">
        <div className="wrap grid items-center gap-10 py-20 md:grid-cols-2">
          <div className="border border-lilac-line bg-white p-3">
            <img
              src="/images/anagen-tonic-results-452.webp"
              width={452}
              height={276}
              alt="A hairline before and after using Anagen Tonic"
              loading="lazy"
              decoding="async"
              className="w-full"
            />
          </div>
          <div>
            <p className="eyebrow">Real results</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">
              A fuller hairline, naturally
            </h2>
            <hr className="gold-rule mt-6" />
            <p className="mt-6 max-w-md text-ink-muted">
              Anagen Tonic is made to stimulate healthy growth where hair is
              thinning, and to help repair damaged hairlines. Used three times a
              week, it works with your scalp, not against it.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              Results vary from person to person.
            </p>
            <Link
              to="/products/$slug"
              params={{ slug: 'anagen-tonic' }}
              className="btn btn-outline mt-7"
            >
              See Anagen Tonic
            </Link>
          </div>
        </div>
      </section>

      {/* Story. PLACEHOLDER copy: replace with the founder's own words and photo. */}
      <section id="story" className="wrap py-20 text-center">
        <p className="eyebrow">Our story</p>
        <h2 className="mt-3 text-4xl sm:text-5xl">
          Made by hand, shared by word of mouth
        </h2>
        <hr className="gold-rule mx-auto mt-6" />
        <div className="mx-auto mt-7 max-w-2xl space-y-4 text-lg text-ink-muted">
          <p>
            {site.name} began at home, with herbs, patience and a belief that
            hair care should be simple and natural. Every bottle is still made
            by hand in small batches.
          </p>
          <p>
            Our customers found us through friends and family who saw the
            difference for themselves. That trust is what we protect with every
            batch.
          </p>
        </div>
      </section>

      {/* How ordering works */}
      <section
        aria-labelledby="how-heading"
        className="border-t border-lilac-line"
      >
        <div className="wrap py-20">
          <div className="text-center">
            <p className="eyebrow">Simple and safe</p>
            <h2 id="how-heading" className="mt-3 text-4xl sm:text-5xl">
              How ordering works
            </h2>
            <hr className="gold-rule mx-auto mt-6" />
          </div>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-gold font-serif text-2xl text-plum">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-2xl">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-ink-muted">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
