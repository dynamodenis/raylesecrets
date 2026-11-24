import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBag, X } from 'lucide-react'

import { cartCount, setDrawerOpen, useCartItems } from '#/lib/cart'
import { site } from '#/lib/site'

const links = [
  { label: 'Shop', hash: 'products' },
  { label: 'Results', hash: 'results' },
  { label: 'Our Story', hash: 'story' },
  { label: 'Contact', hash: 'contact' },
] as const

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const count = cartCount(useCartItems())

  return (
    <header className="sticky top-0 z-30 border-b border-lilac-line bg-white">
      <div className="wrap flex h-18 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 no-underline"
          onClick={() => setOpen(false)}
        >
          <img
            src="/images/logo-160.webp"
            width={160}
            height={105}
            alt=""
            className="h-11 w-auto"
          />
          <span className="font-serif text-2xl font-semibold tracking-wide text-plum">
            {site.name}
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="ml-auto hidden items-center gap-9 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.hash}
              to="/"
              hash={link.hash}
              className="text-sm tracking-[0.14em] text-ink uppercase no-underline transition-colors hover:text-plum-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="relative ml-auto flex size-11 items-center justify-center text-plum md:ml-6"
          aria-label={count > 0 ? `Open cart, ${count} items` : 'Open cart'}
          onClick={() => {
            setOpen(false)
            setDrawerOpen(true)
          }}
        >
          <ShoppingBag className="size-6" strokeWidth={1.5} />
          {count > 0 && (
            <span className="absolute top-1 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-plum px-1 text-xs leading-5 font-medium text-white">
              {count}
            </span>
          )}
        </button>

        <button
          type="button"
          className="-mr-2 flex size-11 items-center justify-center text-plum md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-t border-lilac-line bg-white md:hidden"
        >
          <ul className="wrap flex flex-col py-2">
            {links.map((link) => (
              <li key={link.hash}>
                <Link
                  to="/"
                  hash={link.hash}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-sm tracking-[0.14em] text-ink uppercase no-underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
