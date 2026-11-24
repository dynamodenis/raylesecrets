import { createFileRoute } from '@tanstack/react-router'

import { getProducts } from '#/server/catalog'
import { siteOrigin } from '#/server/origin'

// The list of public pages for search engines: the home page and every
// product currently shown in the shop.
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const origin = siteOrigin()
        const products = await getProducts()
        const paths = ['/', ...products.map((p) => `/products/${p.slug}`)]
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`),
          '</urlset>',
          '',
        ].join('\n')
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
