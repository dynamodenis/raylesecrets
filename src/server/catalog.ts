import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { catalog, sizesOf } from '#/data/catalog'
import { getDb, hasDatabase } from '#/db/index'
import { productImages, products } from '#/db/schema'

import type { Product } from '#/data/catalog'

async function loadProducts(): Promise<Array<Product>> {
  // No database configured yet: show the built-in catalogue.
  if (!hasDatabase()) return catalog

  const db = getDb()
  const [rows, images] = await Promise.all([
    db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.sortOrder), asc(products.id)),
    db.select().from(productImages).orderBy(asc(productImages.sortOrder)),
  ])

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    sizeLabel: row.sizeLabel,
    family: row.family,
    priceKes: row.priceKes,
    stock: row.stock,
    benefits: row.benefits,
    howToUse: row.howToUse,
    bestResults: row.bestResults,
    ingredients: row.ingredients,
    caution: row.caution,
    images: images
      .filter((image) => image.productId === row.id)
      .map(({ src, widths, width, height, alt }) => ({
        src,
        widths,
        width,
        height,
        alt,
      })),
  }))
}

export const getProducts = createServerFn({ method: 'GET' }).handler(() =>
  loadProducts(),
)

export const getProduct = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    const all = await loadProducts()
    const product = all.find((item) => item.slug === data.slug)
    // The other bottle sizes come along for the size picker.
    return product ? { product, sizes: sizesOf(product, all) } : null
  })
