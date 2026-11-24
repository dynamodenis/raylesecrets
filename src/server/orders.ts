import { randomBytes, randomInt } from 'node:crypto'

import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb, hasDatabase, pgErrorCode } from '#/db/index'
import {
  orderItems,
  orders,
  pickupLocations,
  productImages,
  products,
  settings,
} from '#/db/schema'
import {
  cartLinesSchema,
  createOrderSchema,
  normaliseMpesaCode,
  normalisePhone,
  paymentMethods,
} from '#/lib/order'
import { site } from '#/lib/site'
import { allowRequest } from '#/server/rate-limit'

import type { PaymentMethod } from '#/lib/order'

const NO_DATABASE =
  'Online ordering is not switched on yet. Please order on WhatsApp.'

/** Payment numbers from the settings table, falling back to src/lib/site.ts. */
async function loadPaymentDetails() {
  const rows = hasDatabase()
    ? await getDb().select().from(settings).where(eq(settings.id, 1))
    : []
  const row = rows.at(0)
  const numbers: Record<PaymentMethod, string | null> = {
    paybill: row ? row.paybillNumber : site.payment.paybillNumber,
    till: row ? row.tillNumber : site.payment.tillNumber,
    pochi: row ? row.pochiNumber : site.payment.pochiNumber,
  }
  return {
    numbers,
    registeredName: row?.registeredName ?? site.payment.registeredName,
    whatsappNumber: row?.whatsappNumber ?? site.whatsappNumber,
  }
}

/** What the checkout page needs: pickup points and the ways to pay. */
export const getCheckoutInfo = createServerFn({ method: 'GET' }).handler(
  async () => {
    if (!hasDatabase()) {
      return { available: false as const, pickupLocations: [], methods: [] }
    }
    const [locations, payment] = await Promise.all([
      getDb()
        .select({
          id: pickupLocations.id,
          name: pickupLocations.name,
          address: pickupLocations.address,
          hours: pickupLocations.hours,
        })
        .from(pickupLocations)
        .where(eq(pickupLocations.isActive, true))
        .orderBy(asc(pickupLocations.id)),
      loadPaymentDetails(),
    ])
    return {
      available: true as const,
      pickupLocations: locations,
      methods: paymentMethods.filter((method) => payment.numbers[method]),
    }
  },
)

/** Current name, price and stock for the cart lines, read from the database. */
async function priceCart(
  db: Pick<ReturnType<typeof getDb>, 'select'>,
  lines: z.infer<typeof cartLinesSchema>,
) {
  const slugs = lines.map((line) => line.slug)
  const [rows, images] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        sizeLabel: products.sizeLabel,
        priceKes: products.priceKes,
        stock: products.stock,
        isActive: products.isActive,
      })
      .from(products)
      .where(inArray(products.slug, slugs)),
    db
      .select({
        productId: productImages.productId,
        src: productImages.src,
        widths: productImages.widths,
      })
      .from(productImages)
      .orderBy(asc(productImages.sortOrder)),
  ])

  const priced = lines.map((line) => {
    const row = rows.find((product) => product.slug === line.slug)
    const image = row && images.find((item) => item.productId === row.id)
    const available = row && row.isActive ? row.stock : 0
    return {
      slug: line.slug,
      productId: row?.id ?? null,
      name: row?.name ?? 'Product no longer available',
      sizeLabel: row?.sizeLabel ?? '',
      priceKes: row?.priceKes ?? 0,
      image: image ? `${image.src}-${image.widths[0]}.webp` : null,
      quantity: line.quantity,
      available,
      ok: available >= line.quantity,
    }
  })

  return {
    lines: priced,
    subtotalKes: priced.reduce(
      (sum, line) => sum + (line.ok ? line.priceKes * line.quantity : 0),
      0,
    ),
    allOk: priced.every((line) => line.ok),
  }
}

/** Re-check the cart against the database before the customer pays. */
export const validateCart = createServerFn({ method: 'POST' })
  .validator(z.object({ items: cartLinesSchema }))
  .handler(async ({ data }) => {
    if (!hasDatabase()) return null
    return priceCart(getDb(), data.items)
  })

type Result<T> = ({ ok: true } & T) | { ok: false; message: string }

async function newOrderNumber(tx: Pick<ReturnType<typeof getDb>, 'select'>) {
  for (let attempt = 0; attempt < 8; attempt++) {
    // No dash or symbols: easy to type as a Paybill account number.
    const candidate = `RL${randomInt(10000, 100000)}`
    const taken = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.orderNumber, candidate))
    if (taken.length === 0) return candidate
  }
  throw new Error('Could not create an order number')
}

export const createOrder = createServerFn({ method: 'POST' })
  .validator(createOrderSchema)
  .handler(async ({ data }): Promise<Result<{ token: string }>> => {
    if (!hasDatabase()) return { ok: false, message: NO_DATABASE }
    if (!allowRequest('create-order', 5, 10 * 60 * 1000)) {
      return {
        ok: false,
        message:
          'Too many orders from this connection. Please wait a few minutes and try again.',
      }
    }

    const phone = normalisePhone(data.phone)
    if (!phone) return { ok: false, message: 'Please check your phone number.' }

    const payment = await loadPaymentDetails()
    if (!payment.numbers[data.paymentMethod]) {
      return { ok: false, message: 'That payment method is not available.' }
    }

    const db = getDb()
    const pickup = (
      await db
        .select({ id: pickupLocations.id })
        .from(pickupLocations)
        .where(
          and(
            eq(pickupLocations.id, data.pickupLocationId),
            eq(pickupLocations.isActive, true),
          ),
        )
    ).at(0)
    if (!pickup) return { ok: false, message: 'Please choose a pickup point.' }

    const unavailable =
      'Some items in your cart are no longer available in that quantity. Please review your cart.'
    const cart = await priceCart(db, data.items)
    if (!cart.allOk) return { ok: false, message: unavailable }
    if (cart.subtotalKes !== data.expectedTotalKes) {
      return {
        ok: false,
        message:
          'A price changed while you were checking out. Please review the new total and try again.',
      }
    }

    const token = randomBytes(18).toString('base64url')
    const orderNumber = await newOrderNumber(db)

    // Everything below is sent as one batch that succeeds or fails as a whole.
    // If another customer took the last bottle a moment ago, the stock update
    // breaks the "stock >= 0" rule in the database and nothing is saved.
    const takeStock = cart.lines.map((line) =>
      db
        .update(products)
        .set({ stock: sql`${products.stock} - ${line.quantity}` })
        .where(eq(products.id, line.productId!)),
    )
    const saveOrder = db.insert(orders).values({
      orderNumber,
      accessToken: token,
      customerName: data.customerName,
      phone,
      fulfilment: 'pickup',
      pickupLocationId: pickup.id,
      subtotalKes: cart.subtotalKes,
      totalKes: cart.subtotalKes,
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
    })
    const saveItems = db.insert(orderItems).values(
      cart.lines.map((line) => ({
        orderId: sql<number>`(select id from orders where access_token = ${token})`,
        productId: line.productId,
        nameSnapshot: line.sizeLabel
          ? `${line.name} (${line.sizeLabel})`
          : line.name,
        priceKesSnapshot: line.priceKes,
        quantity: line.quantity,
      })),
    )

    try {
      await db.batch([saveOrder, saveItems, ...takeStock])
    } catch (error) {
      // 23514 = a check rule failed, here the stock rule.
      if (pgErrorCode(error) === '23514') {
        return { ok: false, message: unavailable }
      }
      throw error
    }
    return { ok: true, token }
  })

const tokenSchema = z.string().min(16).max(64)

/** The order page: what was ordered, how to pay, and where it has got to. */
export const getOrder = createServerFn({ method: 'GET' })
  .validator(z.object({ token: tokenSchema }))
  .handler(async ({ data }) => {
    if (!hasDatabase()) return null
    const db = getDb()
    const order = (
      await db.select().from(orders).where(eq(orders.accessToken, data.token))
    ).at(0)
    if (!order) return null

    const [items, pickup, payment] = await Promise.all([
      db
        .select({
          name: orderItems.nameSnapshot,
          priceKes: orderItems.priceKesSnapshot,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .orderBy(asc(orderItems.id)),
      order.pickupLocationId
        ? db
            .select({
              name: pickupLocations.name,
              address: pickupLocations.address,
              hours: pickupLocations.hours,
              mapUrl: pickupLocations.mapUrl,
            })
            .from(pickupLocations)
            .where(eq(pickupLocations.id, order.pickupLocationId))
        : Promise.resolve([]),
      loadPaymentDetails(),
    ])

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      firstName: order.customerName.split(' ')[0],
      totalKes: order.totalKes,
      items,
      pickup: pickup.at(0) ?? null,
      mpesaCode: order.mpesaCode,
      payment: {
        method: order.paymentMethod,
        number: payment.numbers[order.paymentMethod] ?? '',
        registeredName: payment.registeredName,
      },
      whatsappNumber: payment.whatsappNumber,
    }
  })

export const submitMpesaCode = createServerFn({ method: 'POST' })
  .validator(z.object({ token: tokenSchema, code: z.string().max(40) }))
  .handler(async ({ data }): Promise<Result<object>> => {
    if (!hasDatabase()) return { ok: false, message: NO_DATABASE }
    if (!allowRequest('mpesa-code', 10, 10 * 60 * 1000)) {
      return {
        ok: false,
        message: 'Too many attempts. Please wait a few minutes and try again.',
      }
    }

    const code = normaliseMpesaCode(data.code)
    if (!code) {
      return {
        ok: false,
        message:
          'That does not look like an M-PESA code. It is the 10 letters and numbers at the start of the M-PESA message.',
      }
    }

    const db = getDb()
    const order = (
      await db
        .select({ id: orders.id, status: orders.status })
        .from(orders)
        .where(eq(orders.accessToken, data.token))
    ).at(0)
    if (!order) return { ok: false, message: 'We could not find that order.' }
    if (
      order.status !== 'awaiting_payment' &&
      order.status !== 'payment_submitted'
    ) {
      return {
        ok: false,
        message: 'This order no longer needs a payment code.',
      }
    }

    const usedMessage =
      'This M-PESA code is already attached to another order. Please check the code or message us on WhatsApp.'
    const used = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.mpesaCode, code), ne(orders.id, order.id)))
    if (used.length > 0) return { ok: false, message: usedMessage }

    try {
      await db
        .update(orders)
        .set({ mpesaCode: code, status: 'payment_submitted' })
        .where(eq(orders.id, order.id))
    } catch (error) {
      // 23505 = the unique index caught a code submitted twice at the same moment.
      if (pgErrorCode(error) === '23505')
        return { ok: false, message: usedMessage }
      throw error
    }
    return { ok: true }
  })
