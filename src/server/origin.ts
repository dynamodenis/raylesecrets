import { getRequestUrl } from '@tanstack/react-start/server'

/**
 * The public address of the site, without a trailing slash.
 * Set SITE_URL on the live host (for example https://raylesecret.co.ke).
 * Without it the address of the current request is used, which is fine for
 * local development.
 */
export function siteOrigin() {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, '')
  if (configured) return configured
  return getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin
}
