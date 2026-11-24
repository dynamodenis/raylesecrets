// Turns the source artwork in assets/brand into web-ready files in public/images.
// Run with: pnpm images
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = path.resolve('assets/brand')
const OUT = path.resolve('public/images')
const PUBLIC = path.resolve('public')

await mkdir(OUT, { recursive: true })

/** Resize to each width and write WebP files named `${name}-${width}.webp`. */
async function variants(input, name, widths) {
  for (const width of widths) {
    await input
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 70, effort: 6 })
      .toFile(path.join(OUT, `${name}-${width}.webp`))
  }
}

/**
 * The logo file has a flat light-grey background. Make that background
 * transparent: every large region of pixels close to the corner colour is
 * cleared (the outside, and the enclosed spaces inside the oval and letters).
 */
async function logoWithTransparency() {
  const { data, info } = await sharp(path.join(SRC, 'logo-rl.jpeg'))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const bg = [data[0], data[1], data[2]]
  const TOLERANCE = 12
  const MIN_REGION = 1500

  const isBg = (i) =>
    Math.abs(data[i * 4] - bg[0]) <= TOLERANCE &&
    Math.abs(data[i * 4 + 1] - bg[1]) <= TOLERANCE &&
    Math.abs(data[i * 4 + 2] - bg[2]) <= TOLERANCE

  const seen = new Uint8Array(width * height)
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || !isBg(start)) continue
    const region = [start]
    seen[start] = 1
    for (let n = 0; n < region.length; n++) {
      const p = region[n]
      const x = p % width
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        p - width,
        p + width,
      ]
      for (const q of neighbours) {
        if (q < 0 || q >= width * height || seen[q] || !isBg(q)) continue
        seen[q] = 1
        region.push(q)
      }
    }
    if (region.length >= MIN_REGION) {
      for (const p of region) data[p * 4 + 3] = 0
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } }).trim()
}

// Logo
const logo = sharp(await (await logoWithTransparency()).png().toBuffer())
await logo
  .clone()
  .resize({ width: 480 })
  .png()
  .toFile(path.join(OUT, 'logo.png'))
await variants(logo, 'logo', [160, 320])

// Favicons: logo centred on a white square
async function icon(size, file) {
  const inner = await logo
    .clone()
    .resize({
      width: Math.round(size * 0.86),
      height: Math.round(size * 0.86),
      fit: 'inside',
    })
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: '#ffffff' },
  })
    .composite([{ input: inner, gravity: 'centre' }])
    .png()
    .toFile(path.join(PUBLIC, file))
}
await icon(96, 'favicon.png')
await icon(180, 'apple-touch-icon.png')

/**
 * A real bottle photo on a white background. The empty space around the
 * bottle is cut away and the bottle is centred on a white 3:4 canvas, so
 * every product photo fills its card the same way.
 */
async function bottlePhoto(file) {
  const { data, info } = await sharp(path.join(SRC, file))
    .trim({ background: '#ffffff', threshold: 12 })
    .toBuffer({ resolveWithObject: true })
  const height = Math.round(info.height * 1.1)
  const width = Math.max(Math.round(height * 0.75), info.width)
  const top = Math.round((height - info.height) / 2)
  const left = Math.round((width - info.width) / 2)
  const padded = await sharp(data)
    .extend({
      top,
      bottom: height - info.height - top,
      left,
      right: width - info.width - left,
      background: '#ffffff',
    })
    .png()
    .toBuffer()
  return { photo: sharp(padded), cutOut: sharp(data) }
}

// Real product photos: the main picture of each product
const tonicPhoto = await bottlePhoto('anagen_tonic_real_photo.webp')
const oilPhotoWhite = await bottlePhoto('anagen_oil_real_white.webp')
const oilPhotoBlack = await bottlePhoto('anagen_oil_real_black.webp')
await variants(tonicPhoto.photo, 'anagen-tonic-photo', [400, 800])
await variants(oilPhotoWhite.photo, 'anagen-oil-photo-white', [400, 800])
await variants(oilPhotoBlack.photo, 'anagen-oil-photo-black', [400, 800])

// Anagen Tonic: front and back labels
await variants(
  sharp(path.join(SRC, 'anagen-tonic-front.jpeg')),
  'anagen-tonic-front',
  [400, 800],
)
await variants(
  sharp(path.join(SRC, 'anagen-tonic-back.jpeg')),
  'anagen-tonic-back',
  [400, 800],
)

// Before / after panel cropped from the tonic front label
await variants(
  sharp(path.join(SRC, 'anagen-tonic-front.jpeg')).extract({
    left: 24,
    top: 1086,
    width: 452,
    height: 276,
  }),
  'anagen-tonic-results',
  [452],
)

// Anagen Oil: full wrap label, plus the centre panel as the "front" image
await variants(
  sharp(path.join(SRC, 'anagen-oil-label.jpeg')),
  'anagen-oil-label',
  [800, 1536],
)
await variants(
  sharp(path.join(SRC, 'anagen-oil-label.jpeg')).extract({
    left: 434,
    top: 0,
    width: 676,
    height: 1024,
  }),
  'anagen-oil-front',
  [400, 676],
)

// Link preview images (1200 x 630) for WhatsApp, Facebook and others:
// the logo on the left and the product photos on the right, on the brand lilac.
// The photos have a white background; "multiply" lets the lilac show through it.
async function preview(file, artwork) {
  const logoLayer = await logo.clone().resize({ width: 360 }).toBuffer()
  const layers = [{ input: logoLayer, left: 90, top: 197 }]
  let left = 1200 - 70
  for (const { input, height } of [...artwork].reverse()) {
    const { data, info } = await input
      .clone()
      .resize({ height })
      .toBuffer({ resolveWithObject: true })
    left -= info.width
    layers.push({
      input: data,
      left,
      top: Math.round((630 - height) / 2),
      blend: 'multiply',
    })
    left -= 36
  }
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: '#f4effa' },
  })
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(OUT, file))
}

await preview('og-default.jpg', [
  { input: tonicPhoto.cutOut, height: 590 },
  { input: oilPhotoWhite.cutOut, height: 520 },
])
await preview('anagen-tonic-photo-og.jpg', [
  { input: tonicPhoto.cutOut, height: 600 },
])
await preview('anagen-oil-photo-white-og.jpg', [
  { input: oilPhotoWhite.cutOut, height: 600 },
])

console.log('Images written to public/images')
