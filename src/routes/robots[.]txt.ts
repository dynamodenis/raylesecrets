import { createFileRoute } from '@tanstack/react-router'

import { siteOrigin } from '#/server/origin'

// Tells search engines what to index. Private pages are kept out.
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /cart',
            'Disallow: /checkout',
            'Disallow: /orders/',
            '',
            `Sitemap: ${siteOrigin()}/sitemap.xml`,
            '',
          ].join('\n'),
          {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          },
        ),
    },
  },
})
