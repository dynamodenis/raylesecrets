// Used by the deploy workflow. Writes the settings the live site needs into a
// JSON file that `wrangler pages secret bulk` uploads to Cloudflare.
// Usage: node scripts/pages-secrets.mjs <output file>
import { writeFileSync } from 'node:fs'

// ADMIN_PASSWORD_HASH and SESSION_SECRET are not sent from here: they are set
// directly on the Cloudflare Pages project (see the README).
const required = ['DATABASE_URL']
const optional = ['SITE_URL']

const missing = required.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(
    `::error::Missing repository secrets: ${missing.join(', ')}. Add them in GitHub under Settings → Secrets and variables → Actions.`,
  )
  process.exit(1)
}

const values = {}
for (const name of [...required, ...optional]) {
  if (process.env[name]) values[name] = process.env[name]
}

const file = process.argv[2]
if (!file) {
  console.error('Give the output file as the first argument.')
  process.exit(1)
}
writeFileSync(file, JSON.stringify(values), { mode: 0o600 })
console.log(`Prepared ${Object.keys(values).join(', ')}`)
