import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// All money is stored as whole Kenyan shillings.

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const products = pgTable(
  'products',
  {
    id: serial().primaryKey(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    tagline: text().notNull().default(''),
    description: text().notNull().default(''),
    sizeLabel: text('size_label').notNull().default(''),
    // Products that are the same thing in different bottle sizes share a
    // family, e.g. "anagen-oil". The shop shows them as one product with a
    // size picker. Null for a product sold in one size.
    family: text(),
    priceKes: integer('price_kes').notNull(),
    stock: integer().notNull().default(0),
    benefits: jsonb().$type<Array<string>>().notNull().default([]),
    howToUse: jsonb('how_to_use').$type<Array<string>>().notNull().default([]),
    bestResults: jsonb('best_results')
      .$type<Array<string>>()
      .notNull()
      .default([]),
    ingredients: text().notNull().default(''),
    caution: jsonb().$type<Array<string>>().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  // The database itself refuses to sell more than there is. An order that
  // would take stock below zero fails as a whole.
  (t) => [check('products_stock_not_negative', sql`${t.stock} >= 0`)],
)

export const productImages = pgTable('product_images', {
  id: serial().primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  src: text().notNull(),
  widths: jsonb().$type<Array<number>>().notNull().default([]),
  width: integer().notNull(),
  height: integer().notNull(),
  alt: text().notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
})

// Ready for when the range grows beyond hair care.
export const categories = pgTable('categories', {
  id: serial().primaryKey(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const productCategories = pgTable(
  'product_categories',
  {
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
)

export const pickupLocations = pgTable('pickup_locations', {
  id: serial().primaryKey(),
  name: text().notNull(),
  address: text().notNull(),
  hours: text().notNull().default(''),
  mapUrl: text('map_url'),
  isActive: boolean('is_active').notNull().default(true),
})

export const fulfilment = pgEnum('fulfilment', ['pickup', 'delivery'])
export const paymentMethod = pgEnum('payment_method', [
  'paybill',
  'till',
  'pochi',
])
export const orderStatus = pgEnum('order_status', [
  'awaiting_payment',
  'payment_submitted',
  'paid',
  'ready',
  'completed',
  'cancelled',
])

export const orders = pgTable(
  'orders',
  {
    id: serial().primaryKey(),
    // Short and readable, e.g. RL-4827. Used as the Paybill account number.
    orderNumber: text('order_number').notNull().unique(),
    // Long random value used in the order page link, so orders can't be guessed.
    accessToken: text('access_token').notNull().unique(),
    customerName: text('customer_name').notNull(),
    phone: text().notNull(),
    email: text(),
    fulfilment: fulfilment().notNull(),
    pickupLocationId: integer('pickup_location_id').references(
      () => pickupLocations.id,
    ),
    deliveryAddress: text('delivery_address'),
    deliveryFeeKes: integer('delivery_fee_kes').notNull().default(0),
    subtotalKes: integer('subtotal_kes').notNull(),
    totalKes: integer('total_kes').notNull(),
    paymentMethod: paymentMethod('payment_method').notNull(),
    // M-PESA confirmation code typed in by the customer. One code, one order.
    mpesaCode: text('mpesa_code'),
    status: orderStatus().notNull().default('awaiting_payment'),
    notes: text(),
    ...timestamps,
  },
  (t) => [uniqueIndex('orders_mpesa_code_unique').on(t.mpesaCode)],
)

export const orderItems = pgTable('order_items', {
  id: serial().primaryKey(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  // Copied at the time of the order so later price changes don't rewrite history.
  nameSnapshot: text('name_snapshot').notNull(),
  priceKesSnapshot: integer('price_kes_snapshot').notNull(),
  quantity: integer().notNull(),
})

export const reviews = pgTable('reviews', {
  id: serial().primaryKey(),
  productId: integer('product_id').references(() => products.id, {
    onDelete: 'cascade',
  }),
  authorName: text('author_name').notNull(),
  rating: integer().notNull(),
  body: text().notNull(),
  photoUrl: text('photo_url'),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// A single row (id = 1) of business settings.
export const settings = pgTable('settings', {
  id: integer().primaryKey().default(1),
  paybillNumber: text('paybill_number'),
  tillNumber: text('till_number'),
  pochiNumber: text('pochi_number'),
  registeredName: text('registered_name'),
  whatsappNumber: text('whatsapp_number'),
  deliveryFeeKes: integer('delivery_fee_kes').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})
