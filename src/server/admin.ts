import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getDb, hasDatabase } from '#/db/index'
import {
  orderItems,
  orders,
  pickupLocations,
  products,
  settings,
} from '#/db/schema'
import {
  normalisePhone,
  orderActions,
  orderStatuses,
  orderTransitions,
} from '#/lib/order'
import {
  adminConfigured,
  assertAdmin,
  endAdminSession,
  isAdmin,
  passwordMatches,
  startAdminSession,
} from '#/server/auth'
import { allowRequest } from '#/server/rate-limit'

import type { OrderStatus } from '#/lib/order'

type Result<T = object> = ({ ok: true } & T) | { ok: false; message: string }

// ---------------------------------------------------------------- sign-in

export const getAdminStatus = createServerFn({ method: 'GET' }).handler(() => ({
  signedIn: isAdmin(),
  configured: adminConfigured() && hasDatabase(),
}))

export const adminLogin = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string().max(200) }))
  .handler(({ data }): Result => {
    if (!allowRequest('admin-login', 5, 15 * 60 * 1000)) {
      return {
        ok: false,
        message: 'Too many attempts. Please wait 15 minutes and try again.',
      }
    }
    if (!passwordMatches(data.password)) {
      return { ok: false, message: 'Wrong password.' }
    }
    startAdminSession()
    return { ok: true }
  })

export const adminLogout = createServerFn({ method: 'POST' }).handler(() => {
  endAdminSession()
  return { ok: true }
})

// ----------------------------------------------------------------- orders

const orderFilterSchema = z.object({
  status: z.enum([...orderStatuses, 'all']).default('all'),
  q: z.string().trim().max(60).default(''),
})

export const listOrders = createServerFn({ method: 'GET' })
  .validator(orderFilterSchema)
  .handler(async ({ data }) => {
    assertAdmin()
    const db = getDb()
    const search = data.q ? `%${data.q.replace(/[%_\\]/g, '\\$&')}%` : null

    const [rows, counts] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          phone: orders.phone,
          totalKes: orders.totalKes,
          status: orders.status,
          mpesaCode: orders.mpesaCode,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          and(
            data.status === 'all' ? undefined : eq(orders.status, data.status),
            search
              ? or(
                  ilike(orders.orderNumber, search),
                  ilike(orders.customerName, search),
                  ilike(orders.phone, search),
                  ilike(orders.mpesaCode, search),
                )
              : undefined,
          ),
        )
        .orderBy(desc(orders.createdAt))
        .limit(200),
      db
        .select({ status: orders.status, count: sql<number>`count(*)::int` })
        .from(orders)
        .groupBy(orders.status),
    ])

    const byStatus: Partial<Record<OrderStatus, number>> = {}
    for (const row of counts) byStatus[row.status] = row.count

    return {
      orders: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      counts: byStatus,
    }
  })

export const getAdminOrder = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    assertAdmin()
    const db = getDb()
    const order = (
      await db.select().from(orders).where(eq(orders.id, data.id))
    ).at(0)
    if (!order) return null

    const [items, pickup] = await Promise.all([
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
            .select({ name: pickupLocations.name })
            .from(pickupLocations)
            .where(eq(pickupLocations.id, order.pickupLocationId))
        : Promise.resolve([]),
    ])

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      customerName: order.customerName,
      phone: order.phone,
      status: order.status,
      paymentMethod: order.paymentMethod,
      mpesaCode: order.mpesaCode,
      totalKes: order.totalKes,
      notes: order.notes,
      pickupName: pickup.at(0)?.name ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items,
    }
  })

export const updateOrderStatus = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.number().int().positive(),
      action: z.enum(orderActions),
    }),
  )
  .handler(async ({ data }): Promise<Result> => {
    assertAdmin()
    const { from, to } = orderTransitions[data.action]

    const db = getDb()
    const stale: Result = {
      ok: false,
      message:
        'This order has already moved on. Refresh the page to see its current status.',
    }

    if (to === 'cancelled') {
      // One statement, so it is all-or-nothing: the order is cancelled only if
      // it is still in a status that allows it, and only then do its bottles
      // go back on the shelf. Two clicks can't restore the stock twice.
      const allowed = sql.join(
        from.map((status) => sql`${status}`),
        sql`, `,
      )
      const result = await db.execute<{ moved: number }>(sql`
        with moved as (
          update orders set status = 'cancelled', updated_at = now()
          where id = ${data.id} and status::text in (${allowed})
          returning id
        ),
        restored as (
          update products p set stock = p.stock + oi.quantity
          from order_items oi
          join moved m on oi.order_id = m.id
          where p.id = oi.product_id
          returning p.id
        )
        select
          (select count(*)::int from moved) as moved,
          (select count(*)::int from restored) as restored
      `)
      return result.rows.at(0)?.moved === 1 ? { ok: true } : stale
    }

    // Only moves the order if it is still in a status the action allows,
    // so two clicks (or two devices) can't apply the same step twice.
    const moved = await db
      .update(orders)
      .set({ status: to })
      .where(and(eq(orders.id, data.id), inArray(orders.status, [...from])))
      .returning({ id: orders.id })
    return moved.length > 0 ? { ok: true } : stale
  })

// --------------------------------------------------------------- products

const lines = z
  .array(z.string().trim().min(1).max(300))
  .max(20, 'Please keep each list to 20 lines or fewer.')

const productSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().trim().min(2, 'Please enter a name.').max(80),
  tagline: z.string().trim().max(120),
  description: z.string().trim().max(600),
  sizeLabel: z.string().trim().max(30),
  priceKes: z
    .number()
    .int('Use whole shillings.')
    .min(0, 'The price cannot be negative.')
    .max(1_000_000),
  stock: z
    .number()
    .int('Use a whole number.')
    .min(0, 'Stock cannot be negative.')
    .max(100_000),
  isActive: z.boolean(),
  benefits: lines,
  howToUse: lines,
  bestResults: lines,
  ingredients: z.string().trim().max(1000),
  caution: lines,
})

export type ProductInput = z.infer<typeof productSchema>

export const listAdminProducts = createServerFn({ method: 'GET' }).handler(
  async () => {
    assertAdmin()
    return getDb()
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
      .orderBy(asc(products.sortOrder), asc(products.id))
  },
)

export const getAdminProduct = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(
    async ({ data }): Promise<(ProductInput & { slug: string }) | null> => {
      assertAdmin()
      const row = (
        await getDb().select().from(products).where(eq(products.id, data.id))
      ).at(0)
      if (!row) return null
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        description: row.description,
        sizeLabel: row.sizeLabel,
        priceKes: row.priceKes,
        stock: row.stock,
        isActive: row.isActive,
        benefits: row.benefits,
        howToUse: row.howToUse,
        bestResults: row.bestResults,
        ingredients: row.ingredients,
        caution: row.caution,
      }
    },
  )

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'product'
  )
}

export const saveProduct = createServerFn({ method: 'POST' })
  .validator(productSchema)
  .handler(async ({ data }): Promise<Result<{ id: number }>> => {
    assertAdmin()
    const db = getDb()
    const { id, ...fields } = data

    if (id !== null) {
      // The web address (slug) of an existing product never changes, so old
      // links keep working.
      const updated = await db
        .update(products)
        .set(fields)
        .where(eq(products.id, id))
        .returning({ id: products.id })
      return updated.length > 0
        ? { ok: true, id }
        : { ok: false, message: 'That product no longer exists.' }
    }

    const base = slugify(fields.name)
    const taken = new Set(
      (
        await db
          .select({ slug: products.slug })
          .from(products)
          .where(ilike(products.slug, `${base}%`))
      ).map((row) => row.slug),
    )
    let slug = base
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`

    const [last] = await db
      .select({
        max: sql<number>`coalesce(max(${products.sortOrder}), -1)::int`,
      })
      .from(products)
    const [created] = await db
      .insert(products)
      .values({ ...fields, slug, sortOrder: last.max + 1 })
      .returning({ id: products.id })
    return { ok: true, id: created.id }
  })

// --------------------------------------------------------------- settings

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)

const settingsSchema = z.object({
  paybillNumber: optionalText(20),
  tillNumber: optionalText(20),
  pochiNumber: optionalText(20),
  registeredName: optionalText(80),
  whatsappNumber: z
    .string()
    .trim()
    .refine(
      (value) => normalisePhone(value) !== null,
      'Enter a Kenyan mobile number, for example 0712 345 678.',
    ),
})

const pickupSchema = z.object({
  id: z.number().int().positive().nullable(),
  name: z.string().trim().min(2, 'Please enter a name.').max(80),
  address: z.string().trim().min(2, 'Please enter an address.').max(200),
  hours: z.string().trim().max(120),
  isActive: z.boolean(),
})

export const getAdminSettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    assertAdmin()
    const db = getDb()
    const [row, locations] = await Promise.all([
      db.select().from(settings).where(eq(settings.id, 1)),
      db
        .select({
          id: pickupLocations.id,
          name: pickupLocations.name,
          address: pickupLocations.address,
          hours: pickupLocations.hours,
          isActive: pickupLocations.isActive,
        })
        .from(pickupLocations)
        .orderBy(asc(pickupLocations.id)),
    ])
    const current = row.at(0)
    return {
      payment: {
        paybillNumber: current?.paybillNumber ?? '',
        tillNumber: current?.tillNumber ?? '',
        pochiNumber: current?.pochiNumber ?? '',
        registeredName: current?.registeredName ?? '',
        whatsappNumber: current?.whatsappNumber ?? '',
      },
      pickupLocations: locations,
    }
  },
)

export const saveSettings = createServerFn({ method: 'POST' })
  .validator(settingsSchema)
  .handler(async ({ data }): Promise<Result> => {
    assertAdmin()
    if (!data.paybillNumber && !data.tillNumber && !data.pochiNumber) {
      return {
        ok: false,
        message:
          'Enter at least one of Paybill, Till or Pochi, or customers will have no way to pay.',
      }
    }
    const values = {
      ...data,
      whatsappNumber: normalisePhone(data.whatsappNumber),
    }
    await getDb()
      .insert(settings)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: settings.id, set: values })
    return { ok: true }
  })

export const savePickupLocation = createServerFn({ method: 'POST' })
  .validator(pickupSchema)
  .handler(async ({ data }): Promise<Result> => {
    assertAdmin()
    const db = getDb()
    const { id, ...fields } = data

    if (!fields.isActive) {
      const others = await db
        .select({ id: pickupLocations.id })
        .from(pickupLocations)
        .where(
          and(
            eq(pickupLocations.isActive, true),
            id === null ? undefined : ne(pickupLocations.id, id),
          ),
        )
      if (others.length === 0) {
        return {
          ok: false,
          message:
            'At least one pickup point must stay active, or customers cannot check out.',
        }
      }
    }

    if (id === null) await db.insert(pickupLocations).values(fields)
    else
      await db
        .update(pickupLocations)
        .set(fields)
        .where(eq(pickupLocations.id, id))
    return { ok: true }
  })
