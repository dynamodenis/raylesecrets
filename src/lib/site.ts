/**
 * Business details shown across the site.
 *
 * PLACEHOLDERS: everything marked "dummy" below is made up and must be
 * replaced with the real details before launch.
 *
 * Once the database is set up, the phone number, payment details and pickup
 * point are changed in the admin settings, and the values here are only the
 * starting point.
 */
export const site = {
  name: 'Ray Le Secret',
  tagline: 'Healthy scalp. Beautiful hair.',
  description:
    'Natural, herbal hair care handmade in Kenya. Anagen Tonic and Anagen Oil for stronger hair and a healthier scalp, for men and women.',

  /** The one number for both WhatsApp and phone calls: 0798 175 265 */
  whatsappNumber: '254798175265',
  // dummy
  email: 'hello@raylesecret.example',

  // dummy
  social: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'TikTok', href: 'https://tiktok.com/' },
    { label: 'Facebook', href: 'https://facebook.com/' },
  ],

  // Customers pay to the Pochi la Biashara number. There is no Paybill or
  // Till yet; a method left empty is not offered at checkout.
  payment: {
    paybillNumber: null as string | null,
    tillNumber: null as string | null,
    pochiNumber: '0798 175 265' as string | null,
    // dummy: the name customers see on their phone when they pay
    registeredName: 'RAY LE SECRET',
  },

  // Chokaa for now. The exact meeting spot is agreed on WhatsApp.
  pickup: {
    name: 'Chokaa',
    address: 'We share the exact meeting spot on WhatsApp',
    hours: 'Open 8:00 am to 7:00 pm',
    mapUrl: null as string | null,
  },
} as const

/** Link that opens WhatsApp with a message already typed in. */
export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** 1200 -> "KES 1,200" */
export function formatKes(amount: number) {
  return `KES ${amount.toLocaleString('en-KE')}`
}
