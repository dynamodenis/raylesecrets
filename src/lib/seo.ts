import { site } from '#/lib/site'

/**
 * Tags that control how a page looks when its link is shared (WhatsApp,
 * Facebook, X) and what Google shows. `origin` is the site address, for
 * example https://raylesecret.co.ke, because previews need full URLs.
 */
export function pageMeta({
  origin,
  path,
  title,
  description,
  image = '/images/og-default.jpg',
  type = 'website',
}: {
  origin: string
  path: string
  title: string
  description: string
  image?: string
  type?: 'website' | 'product'
}) {
  const url = `${origin}${path}`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:site_name', content: site.name },
      { property: 'og:type', content: type },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: `${origin}${image}` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: 'en_KE' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

/** The site address, read from the root route's data inside a route's head(). */
export function originFrom(
  matches: ReadonlyArray<{ routeId: string; loaderData?: unknown }>,
) {
  const root = matches.find((match) => match.routeId === '__root__')
  const data = root?.loaderData as { origin?: string } | undefined
  return data?.origin ?? ''
}
