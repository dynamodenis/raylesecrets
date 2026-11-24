# Ray Le Secret

Online shop for Ray Le Secret natural herbal hair care.
Built with TanStack Start (React), Tailwind CSS, Drizzle ORM and Postgres (Neon).
Hosted on Cloudflare Pages.

The build plan and design notes are in [TODO.md](./TODO.md).

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The site works without a database: it shows the catalogue in `src/data/catalog.ts`.

## Connect the database

1. Create a project at neon.com and copy the pooled connection string.
2. Put it in `.env.local` as `DATABASE_URL=...` (see `.env.example`).
3. Create the tables and load the products:

```bash
pnpm db:migrate
pnpm db:seed
```

## Admin

The owner's pages are at `/admin`: orders, products and settings.

```bash
pnpm admin:password   # choose the password (asks twice, hidden while typing)
```

This writes a hash of the password and a session secret to `.env`. Restart the
server afterwards. Run it again at any time to change the password. On the
live host, copy `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` into its
environment settings.

## Going live on Cloudflare Pages

The build targets Cloudflare Pages (`preset: 'cloudflare_pages'` in `vite.config.ts`).

One-time setup:

```bash
pnpm exec wrangler login                                   # opens the browser
pnpm exec wrangler pages project create raylesecret --production-branch main
```

Give Cloudflare the four settings (each command asks you to paste the value):

```bash
pnpm exec wrangler pages secret put DATABASE_URL --project-name raylesecret
pnpm exec wrangler pages secret put ADMIN_PASSWORD_HASH --project-name raylesecret
pnpm exec wrangler pages secret put SESSION_SECRET --project-name raylesecret
pnpm exec wrangler pages secret put SITE_URL --project-name raylesecret
```

| Name | What |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (same as in `.env`) |
| `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` | Copy from `.env` after running `pnpm admin:password` |
| `SITE_URL` | The public address, e.g. `https://raylesecret.co.ke`. Used in link previews and the sitemap. |

Then, every time you want to publish:

```bash
pnpm deploy
```

To try the Cloudflare build on your own machine first, copy `.env` to `.dev.vars`
and run `pnpm preview` (http://localhost:8788).

Notes:

- The database must be Neon: the site talks to it over HTTP, which a plain
  local Postgres does not offer.
- Cloudflare's free plan allows 10 ms of processing per request. Signing in to
  the admin needs more than that (the password check is slow on purpose). If
  sign-in or pages fail with "Error 1102", the fix is the Workers Paid plan.

## Where things are

| What | Where |
|---|---|
| M-PESA numbers, WhatsApp number, pickup points | Admin → Settings |
| Prices, stock and product text | Admin → Products |
| Email and social links (dummy values for now) | `src/lib/site.ts` |
| Starting catalogue, used only to fill an empty database | `src/data/catalog.ts` |
| Colours and fonts | `src/styles.css` |
| Pages | `src/routes/` |
| Database tables | `src/db/schema.ts` |
| Original artwork | `assets/brand/` |

## Replacing images

Put the new files in `assets/brand/`, adjust `scripts/prepare-images.mjs` if the
file names changed, then run `pnpm images`. It writes web-sized files to `public/images/`.

## Other commands

```bash
pnpm build        # production build (into dist/)
pnpm preview      # run that build locally in Cloudflare's runtime
pnpm deploy       # build and publish to Cloudflare Pages
pnpm typecheck
pnpm lint
pnpm db:generate  # new migration after changing src/db/schema.ts
pnpm db:studio    # browse the database
```
