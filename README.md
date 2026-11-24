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
The project name and Cloudflare settings are in `wrangler.jsonc`.

Every push to `main` deploys the site. The workflow in
`.github/workflows/deploy.yml` does this, in order:

1. applies any new database migrations to Neon,
2. checks types and builds the site,
3. creates the Pages project `raylesecret` if it does not exist yet,
4. sends the site's settings to Cloudflare,
5. deploys.

If a step fails, the steps after it do not run, so the live site never gets
code that the database is not ready for.

### One-time setup

Add these in GitHub: repository → Settings → Secrets and variables → Actions.

| Kind | Name | Where the value comes from |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token → Custom token, with the permission **Account → Cloudflare Pages → Edit** |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → Account ID (right-hand side) |
| Secret | `DATABASE_URL` | The Neon connection string, same as in `.env` |
| Secret | `ADMIN_PASSWORD_HASH` | From `.env`, written by `pnpm admin:password` |
| Secret | `SESSION_SECRET` | From `.env`, written by `pnpm admin:password` |
| Variable (optional) | `SITE_URL` | The public address, e.g. `https://raylesecret.co.ke`. Used in link previews and the sitemap. Without it the site uses whatever address it is visited on. |

With the GitHub CLI, from this folder (each command asks you to paste the value):

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set DATABASE_URL
gh secret set ADMIN_PASSWORD_HASH
gh secret set SESSION_SECRET
gh variable set SITE_URL          # optional
```

Nothing needs to be typed into the Cloudflare dashboard: the workflow copies
`DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` and `SITE_URL` to the
Pages project on every deploy. To change one (a new admin password, say),
update it in GitHub and run the Deploy workflow again.

After the first deploy the site is at `https://raylesecret.pages.dev`. To use
your own domain, add it in Cloudflare → Workers & Pages → raylesecret →
Custom domains, then set `SITE_URL` to it.

### Database changes

After changing `src/db/schema.ts`, run `pnpm db:generate` and commit the new
files in `drizzle/`. The next push to `main` applies them before deploying.

`.github/workflows/db-migrate.yml` covers the rest:

- On a pull request that touches the schema or migrations, it applies every
  migration to a throwaway database, so a broken one is caught before merging.
- Run by hand (GitHub → Actions → Database migrations → Run workflow), it
  migrates the live database, and can also run the seed. The seed adds
  products that are new in `src/data/catalog.ts` and refreshes product images
  and size families; it does not touch prices, stock or text changed in the
  admin.

### Deploying from your own machine

`pnpm deploy` still works after `pnpm exec wrangler login`, but it does not
run migrations or update the settings. To try the Cloudflare build locally,
copy `.env` to `.dev.vars` and run `pnpm preview` (http://localhost:8788).

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
pnpm deploy       # build and publish to Cloudflare Pages by hand (normally a push to main does it)
pnpm typecheck
pnpm lint
pnpm db:generate  # new migration after changing src/db/schema.ts
pnpm db:studio    # browse the database
```
