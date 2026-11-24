import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema.ts'

/**
 * The database connection.
 *
 * It uses Neon's HTTP driver: every query is one web request, so there are no
 * long-lived connections to manage. That is what makes it work on Cloudflare
 * as well as on a normal Node server. The trade-off: there are no interactive
 * transactions. Writes that must succeed or fail together use `db.batch([...])`
 * or a single SQL statement.
 */

/** False until DATABASE_URL is set; the site then shows the built-in catalogue. */
export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

function create(url: string) {
  return drizzle({ client: neon(url), schema })
}

let instance: ReturnType<typeof create> | undefined

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  instance ??= create(url)
  return instance
}

/** The Postgres error code (e.g. 23505 = duplicate) from a failed query, if any. */
export function pgErrorCode(error: unknown) {
  const direct = (error as { code?: unknown } | null)?.code
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause?.code
  const code = typeof direct === 'string' ? direct : cause
  return typeof code === 'string' ? code : null
}
