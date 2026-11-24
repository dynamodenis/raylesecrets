import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { getDb, hasDatabase } from '#/db/index'
import { pickupLocations, settings } from '#/db/schema'
import { site } from '#/lib/site'
import { fallbackSiteInfo } from '#/lib/site-info'

import { siteOrigin } from '#/server/origin'

import type { SiteInfo } from '#/lib/site-info'

/**
 * Contact and pickup details shown on every page. They come from the admin
 * settings; src/lib/site.ts is used only while there is no database.
 */
export const getSiteInfo = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SiteInfo> => {
    const origin = siteOrigin()
    if (!hasDatabase()) return { ...fallbackSiteInfo, origin }
    const db = getDb()
    const [settingsRows, locations] = await Promise.all([
      db
        .select({ whatsappNumber: settings.whatsappNumber })
        .from(settings)
        .where(eq(settings.id, 1)),
      db
        .select({
          name: pickupLocations.name,
          address: pickupLocations.address,
          hours: pickupLocations.hours,
        })
        .from(pickupLocations)
        .where(eq(pickupLocations.isActive, true))
        .orderBy(asc(pickupLocations.id))
        .limit(1),
    ])
    return {
      origin,
      whatsappNumber: settingsRows.at(0)?.whatsappNumber || site.whatsappNumber,
      pickup: locations.at(0) ?? null,
    }
  },
)
