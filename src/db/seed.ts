// Fills the database with the catalogue, the pickup point and the settings.
// Safe to run more than once: it only adds what is missing. The exceptions are
// product images and size families, which cannot be changed in the admin and
// always follow src/data/catalog.ts. Run with: pnpm db:seed
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { catalog } from '../data/catalog.ts'
import { site } from '../lib/site.ts'

config({ path: ['.env.local', '.env'] })

const { getDb } = await import('./index.ts')
const { pickupLocations, productImages, products, settings } =
  await import('./schema.ts')

const db = getDb()
let added = 0

{
  const tx = db
  for (const [index, { images, ...product }] of catalog.entries()) {
    const values = { ...product, sortOrder: index }
    // Products already in the database are left alone, so prices and text
    // changed in the admin are never overwritten.
    const inserted = await tx
      .insert(products)
      .values(values)
      .onConflictDoNothing({ target: products.slug })
      .returning({ id: products.id })
    if (inserted.length > 0) added++

    // Images and the size family cannot be changed in the admin, so the
    // catalogue file is the source of truth: replace whatever the database
    // holds for this product.
    const [row] = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, product.slug))
    await tx.batch([
      tx
        .update(products)
        .set({ family: product.family })
        .where(eq(products.id, row.id)),
      tx.delete(productImages).where(eq(productImages.productId, row.id)),
      tx.insert(productImages).values(
        images.map((image, sortOrder) => ({
          ...image,
          productId: row.id,
          sortOrder,
        })),
      ),
    ])
  }

  const existingPickup = await tx
    .select({ id: pickupLocations.id })
    .from(pickupLocations)
    .limit(1)
  if (existingPickup.length === 0) {
    await tx.insert(pickupLocations).values({ ...site.pickup })
  }

  const businessSettings = {
    ...site.payment,
    whatsappNumber: site.whatsappNumber,
  }
  await tx
    .insert(settings)
    .values({ id: 1, ...businessSettings })
    // Settings changed in the admin are kept.
    .onConflictDoNothing({ target: settings.id })
}

console.log(
  `Added ${added} new products (existing ones kept their details) and refreshed the product images and size families.`,
)
process.exit(0)
