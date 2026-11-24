import { Link } from '@tanstack/react-router'

import { formatPhone } from '#/lib/order'
import { site } from '#/lib/site'
import { useSiteInfo, useWhatsappLink } from '#/lib/site-info'

export function SiteFooter() {
  const { whatsappNumber, pickup } = useSiteInfo()
  const whatsappLink = useWhatsappLink()
  return (
    <footer id="contact" className="bg-plum text-white">
      <div className="wrap grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-serif text-3xl font-semibold text-gold-light">
            {site.name}
          </p>
          <p className="mt-3 max-w-xs text-white/80">
            Natural, herbal hair care. Handmade in Kenya for men and women.
          </p>
        </div>

        <div>
          <h2 className="font-sans text-xs font-medium tracking-[0.22em] text-gold-light uppercase">
            Contact
          </h2>
          <ul className="mt-4 space-y-2 text-white/90">
            <li>
              <a
                className="text-white underline-offset-4 hover:underline"
                href={whatsappLink(
                  `Hello ${site.name}, I would like to order.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {formatPhone(whatsappNumber)}
              </a>
            </li>
            <li>
              <a
                className="text-white underline-offset-4 hover:underline"
                href={`mailto:${site.email}`}
              >
                {site.email}
              </a>
            </li>
            <li className="flex gap-4 pt-2">
              {site.social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
              ))}
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-sans text-xs font-medium tracking-[0.22em] text-gold-light uppercase">
            Pick up your order
          </h2>
          {pickup ? (
            <address className="mt-4 space-y-1 text-white/90 not-italic">
              <p>{pickup.name}</p>
              <p>{pickup.address}</p>
              <p>{pickup.hours}</p>
            </address>
          ) : (
            <p className="mt-4 text-white/90">
              Message us on WhatsApp to arrange pickup.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="wrap flex flex-col gap-2 py-5 text-sm text-white/70 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <Link to="/" className="text-white/70 no-underline hover:text-white">
            Back to top
          </Link>
        </div>
      </div>
    </footer>
  )
}
