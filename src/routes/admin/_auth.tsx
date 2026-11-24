import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'

import { site } from '#/lib/site'
import { adminLogout, getAdminStatus } from '#/server/admin'

// Everything under /admin except the sign-in page sits inside this layout.
export const Route = createFileRoute('/admin/_auth')({
  beforeLoad: async () => {
    const status = await getAdminStatus()
    if (!status.signedIn) throw redirect({ to: '/admin/login' })
  },
  head: () => ({
    meta: [
      { title: `Admin | ${site.name}` },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminLayout,
})

const navLink =
  'rounded-md px-3 py-2 text-sm font-medium text-ink no-underline hover:bg-lilac data-[status=active]:bg-plum data-[status=active]:text-white'

function AdminLayout() {
  const navigate = useNavigate()

  async function signOut() {
    await adminLogout()
    await navigate({ to: '/admin/login' })
  }

  return (
    <div className="min-h-screen bg-lilac/50">
      <header className="border-b border-lilac-line bg-white">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <p className="font-serif text-2xl font-semibold text-plum">
            {site.name} <span className="text-ink-muted">admin</span>
          </p>
          <nav aria-label="Admin" className="flex flex-wrap gap-1">
            <Link
              to="/admin"
              search={{ status: 'all', q: '' }}
              className={navLink}
              activeOptions={{ exact: true, includeSearch: false }}
            >
              Orders
            </Link>
            <Link to="/admin/products" className={navLink}>
              Products
            </Link>
            <Link to="/admin/settings" className={navLink}>
              Settings
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-plum underline underline-offset-4"
            >
              View shop
            </a>
            <button
              type="button"
              onClick={signOut}
              className="text-plum underline underline-offset-4"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="wrap py-8">
        <Outlet />
      </main>
    </div>
  )
}
