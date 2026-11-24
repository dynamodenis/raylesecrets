/**
 * The product catalogue.
 *
 * This is the seed data for the database (`pnpm db:seed`), and it is also
 * what the site shows while no DATABASE_URL is set. The wording comes from
 * the bottle labels. Prices and stock are PLACEHOLDERS.
 */
export type ProductImage = {
  /** Path without the `-<width>.webp` ending, e.g. `/images/anagen-oil-front` */
  src: string
  /** Widths available on disk, smallest first */
  widths: Array<number>
  width: number
  height: number
  alt: string
}

export type Product = {
  slug: string
  name: string
  tagline: string
  description: string
  sizeLabel: string
  priceKes: number
  stock: number
  benefits: Array<string>
  howToUse: Array<string>
  bestResults: Array<string>
  ingredients: string
  caution: Array<string>
  images: Array<ProductImage>
}

/** Shown for a product that has no photo yet. */
export const placeholderImage: ProductImage = {
  src: '/images/logo',
  widths: [160, 320],
  width: 320,
  height: 209,
  alt: '',
}

export function primaryImage(product: Product) {
  return product.images.at(0) ?? placeholderImage
}

export const catalog: Array<Product> = [
  {
    slug: 'anagen-tonic',
    name: 'Anagen Tonic',
    tagline: 'Nourish · Strengthen · Revitalize',
    description:
      'A herbal scalp spray made with pure natural remedies. It supports healthy hair growth, helps repair damaged hairlines and keeps the scalp comfortable.',
    sizeLabel: '120 ml',
    priceKes: 1200, // placeholder
    stock: 20, // placeholder
    benefits: [
      'Stimulates healthy hair growth',
      'Helps repair damaged hairlines',
      'Promotes overall scalp health',
      'Helps fight dandruff and itchy scalp',
      'Reduces hair breakage',
      'Suitable for all hair types',
    ],
    howToUse: [
      'Shake well before use.',
      'Spray directly onto the scalp, focusing on thinning or affected areas.',
      'Gently massage with your fingertips for 2 to 3 minutes to improve blood circulation.',
      'Follow with a light, non-greasy oil to help lock in moisture.',
      'Use 3 times per week. Do not use every day unless directed by a hair care professional.',
    ],
    bestResults: [
      'Avoid tight hairstyles that pull on the hairline.',
      'Minimize the use of harsh chemicals and hair dyes.',
      'Maintain a healthy diet and proper hydration.',
    ],
    ingredients: 'Natural essential herbal extracts.',
    caution: [
      'For external use only.',
      'Avoid contact with eyes.',
      'Keep out of reach of children.',
      'Store in a cool, dry place away from direct sunlight.',
    ],
    images: [
      {
        src: '/images/anagen-tonic-photo',
        widths: [400, 800],
        width: 1244,
        height: 1658,
        alt: 'A bottle of Ray Le Secret Anagen Tonic scalp spray, 120 ml',
      },
      {
        src: '/images/anagen-tonic-front',
        widths: [400, 800],
        width: 811,
        height: 1600,
        alt: 'Ray Le Secret Anagen Tonic front label, 120 ml',
      },
      {
        src: '/images/anagen-tonic-back',
        widths: [400, 800],
        width: 800,
        height: 1600,
        alt: 'Ray Le Secret Anagen Tonic back label with benefits and directions',
      },
    ],
  },
  {
    slug: 'anagen-oil',
    name: 'Anagen Oil',
    tagline: 'Healthy scalp, beautiful hair',
    description:
      'An oil infused with multiple herbal products. It strengthens hair strands, moisturizes the scalp and leaves hair shiny.',
    sizeLabel: '100 ml',
    priceKes: 1000, // placeholder
    stock: 20, // placeholder
    benefits: [
      'Strengthens hair strands',
      'Moisturizes the scalp',
      'Promotes shiny hair',
      'For all hair types',
    ],
    howToUse: ['Apply on both the scalp and the hair strands.'],
    bestResults: [
      'Pairs well with Anagen Tonic: spray the tonic first, then seal in moisture with the oil.',
    ],
    ingredients: 'Oil infused with multiple herbal products.',
    caution: [
      'Not for children under the age of 4 years.',
      'For external use only.',
    ],
    images: [
      {
        src: '/images/anagen-oil-photo-white',
        widths: [400, 800],
        width: 1241,
        height: 1654,
        alt: 'A bottle of Ray Le Secret Anagen Oil with a white dropper',
      },
      {
        src: '/images/anagen-oil-photo-black',
        widths: [400, 800],
        width: 1253,
        height: 1670,
        alt: 'A bottle of Ray Le Secret Anagen Oil with a black dropper',
      },
      {
        src: '/images/anagen-oil-front',
        widths: [400, 676],
        width: 676,
        height: 1024,
        alt: 'Ray Le Secret Anagen Oil front label, 100 ml',
      },
      {
        src: '/images/anagen-oil-label',
        widths: [800, 1536],
        width: 1536,
        height: 1024,
        alt: 'Ray Le Secret Anagen Oil full label with benefits and how to use',
      },
    ],
  },
]
