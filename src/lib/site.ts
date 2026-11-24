/**
 * Business details shown across the site.
 *
 * PLACEHOLDERS: everything marked "dummy" below is made up and must be
 * replaced with the real details before launch.
 */
export const site = {
  name: 'Ray Le Secret',
  tagline: 'Healthy scalp. Beautiful hair.',
  description:
    'Natural, herbal hair care handmade in Kenya. Anagen Tonic and Anagen Oil for stronger hair and a healthier scalp, for men and women.',

  // dummy. Once the database is set up this is changed in the admin settings.
  whatsappNumber: '254700000000',
  email: 'hello@raylesecret.example',

  // dummy
  social: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'TikTok', href: 'https://tiktok.com/' },
    { label: 'Facebook', href: 'https://facebook.com/' },
  ],

  // dummy. Once the database is set up these are changed in the admin settings.
  payment: {
    paybillNumber: '000000',
    tillNumber: '000000',
    pochiNumber: '0700 000 000',
    registeredName: 'RAY LE SECRET',
  },

  // dummy. Once the database is set up this is changed in the admin settings.
  pickup: {
    name: 'Ray Le Secret Pickup Point',
    address: 'Sample Building, Ground Floor, Nairobi CBD',
    hours: 'Monday to Saturday, 9:00 am to 6:00 pm',
    mapUrl: 'https://maps.google.com/',
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
