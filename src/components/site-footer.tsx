import { Link } from '@tanstack/react-router'
import { Facebook, Instagram } from 'lucide-react'

import { formatPhone } from '#/lib/order'
import { site } from '#/lib/site'
import { useSiteInfo, useWhatsappLink } from '#/lib/site-info'

/** TikTok has no icon in lucide, so this one is drawn in the same line style. */
function TikTok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
    </svg>
  )
}

const socialIcons: Partial<
  Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>
> = {
  Instagram,
  TikTok,
  Facebook,
}

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
                className="text-white no-underline transition-colors hover:text-gold-light"
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
                className="text-white no-underline transition-colors hover:text-gold-light"
                href={`tel:+${whatsappNumber}`}
              >
                Call {formatPhone(whatsappNumber)}
              </a>
            </li>
            <li>
              <a
                className="text-white no-underline transition-colors hover:text-gold-light"
                href={`mailto:${site.email}`}
              >
                {site.email}
              </a>
            </li>
            <li className="-ml-2 flex pt-2">
              {site.social.map((item) => {
                const Icon = socialIcons[item.label]
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.name} on ${item.label}`}
                    title={item.label}
                    className="flex size-9 items-center justify-center text-white transition-colors hover:text-gold-light"
                  >
                    {Icon ? (
                      <Icon
                        className="size-5"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    ) : (
                      item.label
                    )}
                  </a>
                )
              })}
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
