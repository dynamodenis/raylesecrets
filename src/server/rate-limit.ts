import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server'

/**
 * A small in-memory limit per visitor IP address, to slow down abuse of the
 * order functions. It resets when the server restarts and is per server
 * instance, so on serverless hosting it is only a first line of defence.
 */
const hits = new Map<string, Array<number>>()

export function allowRequest(action: string, limit: number, windowMs: number) {
  // Cloudflare puts the visitor's real address in its own header.
  const ip =
    getRequestHeader('cf-connecting-ip') ??
    getRequestIP({ xForwardedFor: true }) ??
    'unknown'
  const key = `${action}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)

  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }

  recent.push(now)
  hits.set(key, recent)

  // Keep the map from growing without end.
  if (hits.size > 5000) {
    for (const [storedKey, times] of hits) {
      if (times.every((time) => now - time >= windowMs)) hits.delete(storedKey)
    }
  }
  return true
}
