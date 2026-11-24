import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'

import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

/**
 * Sign-in for the single shop owner.
 *
 * The password is never stored: .env holds only a scrypt hash of it
 * (ADMIN_PASSWORD_HASH, written by `pnpm admin:password`). After sign-in the
 * browser gets a cookie holding an expiry time signed with SESSION_SECRET.
 */
const COOKIE = 'rls_admin'
const SESSION_DAYS = 7

function secrets() {
  const hash = process.env.ADMIN_PASSWORD_HASH
  const secret = process.env.SESSION_SECRET
  return hash && secret && secret.length >= 32 ? { hash, secret } : null
}

/** False until `pnpm admin:password` has been run. */
export function adminConfigured() {
  return secrets() !== null
}

function sign(expires: string, secret: string) {
  return createHmac('sha256', secret).update(expires).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function passwordMatches(password: string) {
  const config = secrets()
  if (!config) return false
  // Stored as "scrypt:<salt hex>:<hash hex>"
  const [scheme, salt, expected] = config.hash.split(':')
  if (scheme !== 'scrypt' || !salt || !expected) return false
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString(
    'hex',
  )
  return safeEqual(actual, expected)
}

export function startAdminSession() {
  const config = secrets()
  if (!config) return
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  const expires = String(Date.now() + maxAge * 1000)
  setCookie(COOKIE, `${expires}.${sign(expires, config.secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export function endAdminSession() {
  deleteCookie(COOKIE, { path: '/' })
}

export function isAdmin() {
  const config = secrets()
  const cookie = getCookie(COOKIE)
  if (!config || !cookie) return false
  const [expires, signature] = cookie.split('.')
  if (!expires || !signature) return false
  if (!safeEqual(signature, sign(expires, config.secret))) return false
  return Number(expires) > Date.now()
}

/** Every admin server function calls this first. */
export function assertAdmin() {
  if (!isAdmin()) throw new Error('Not signed in')
}
