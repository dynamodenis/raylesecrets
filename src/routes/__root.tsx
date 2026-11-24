import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { CartDrawer } from '../components/cart-drawer'
import { SiteFooter } from '../components/site-footer'
import { SiteHeader } from '../components/site-header'
import { WhatsAppFab } from '../components/whatsapp'
import { pageMeta } from '../lib/seo'
import { site } from '../lib/site'
import { getSiteInfo } from '../server/site-info'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // Contact and pickup details for every page. Re-read at most every 5 minutes.
  loader: () => getSiteInfo(),
  staleTime: 5 * 60 * 1000,
  // Defaults for every page. Pages with their own title, description or
  // preview image replace these.
  head: ({ loaderData, matches }) => {
    const defaults = pageMeta({
      origin: loaderData?.origin ?? '',
      // The address of the page being shown (the last, most specific match).
      path: matches[matches.length - 1].pathname,
      title: `${site.name} | Natural herbal hair care`,
      description: site.description,
    })
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#3b1a6e' },
        ...defaults.meta,
      ],
      links: [
        ...defaults.links,
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    }
  },
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // The admin has its own layout: no shop header, footer, cart or WhatsApp button.
  const isAdmin = useLocation({
    select: (location) => location.pathname.startsWith('/admin'),
  })
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {isAdmin ? (
          children
        ) : (
          <>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
            <WhatsAppFab />
            <CartDrawer />
          </>
        )}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-left' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <section className="wrap py-28 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 text-5xl">We couldn't find that page</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-muted">
        The link may be old or mistyped. Our products are on the home page.
      </p>
      <Link to="/" hash="products" className="btn btn-primary mt-8">
        Shop the range
      </Link>
    </section>
  )
}
