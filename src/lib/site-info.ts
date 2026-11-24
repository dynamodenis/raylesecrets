import { useMatch } from '@tanstack/react-router'

import { site, whatsappLink } from '#/lib/site'

/** Contact and pickup details that the owner can change in the admin. */
export type SiteInfo = {
  /** Public address of the site, e.g. https://raylesecret.co.ke */
  origin: string
  whatsappNumber: string
  pickup: { name: string; address: string; hours: string } | null
}

/** Used only while there is no database. */
export const fallbackSiteInfo: SiteInfo = {
  origin: '',
  whatsappNumber: site.whatsappNumber,
  pickup: site.pickup,
}

/** The details loaded once for every page by the root route. */
export function useSiteInfo(): SiteInfo {
  const match = useMatch({ from: '__root__', shouldThrow: false })
  return match?.loaderData ?? fallbackSiteInfo
}

/** Returns a function that builds a WhatsApp link to the shop. */
export function useWhatsappLink() {
  const { whatsappNumber } = useSiteInfo()
  return (message: string) => whatsappLink(whatsappNumber, message)
}
