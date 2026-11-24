import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({
      // Build for Cloudflare Pages. To run on a plain Node server instead,
      // remove `preset` and `cloudflare` (the output then goes to .output/).
      preset: 'cloudflare_pages',
      compatibilityDate: '2026-06-01',
      cloudflare: {
        nodeCompat: true,
        deployConfig: true,
        wrangler: {
          name: 'raylesecret',
          compatibility_flags: ['nodejs_compat'],
        },
      },
      rollupConfig: { external: [/^@sentry\//] },
      // No pre-compressed copies: Cloudflare compresses files itself.
      routeRules: {
        // Product images keep their names when replaced, so cache for a week,
        // not forever.
        '/images/**': {
          headers: { 'cache-control': 'public, max-age=604800' },
        },
        '/favicon.png': {
          headers: { 'cache-control': 'public, max-age=604800' },
        },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
