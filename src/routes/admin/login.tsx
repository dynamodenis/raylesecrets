import { useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { Notice, adminInput } from '#/components/admin-ui'
import { site } from '#/lib/site'
import { adminLogin, getAdminStatus } from '#/server/admin'

export const Route = createFileRoute('/admin/login')({
  loader: async () => {
    const status = await getAdminStatus()
    if (status.signedIn) throw redirect({ to: '/admin' })
    return status
  },
  head: () => ({
    meta: [
      { title: `Admin sign in | ${site.name}` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: LoginPage,
})

function LoginPage() {
  const { configured } = Route.useLoaderData()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await adminLogin({ data: { password } })
      if (!result.ok) {
        setError(result.message)
        return
      }
      await navigate({ to: '/admin' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-lilac px-5">
      <div className="w-full max-w-sm border border-lilac-line bg-white p-7">
        <img
          src="/images/logo-160.webp"
          width={160}
          height={105}
          alt=""
          className="mx-auto h-14 w-auto"
        />
        <h1 className="mt-4 text-center text-3xl">{site.name} admin</h1>

        {configured ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                className={adminInput}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Notice kind="error">{error}</Notice>
            <button
              type="submit"
              className="btn btn-primary w-full disabled:opacity-60"
              disabled={busy || password.length === 0}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3 text-ink-muted">
            <p>The admin is not set up yet.</p>
            <p>
              In the project folder, run{' '}
              <code className="rounded bg-lilac px-1.5 py-0.5 text-ink">
                pnpm admin:password
              </code>{' '}
              to choose a password, make sure DATABASE_URL is set, then restart
              the server.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
