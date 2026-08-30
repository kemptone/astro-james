import {and, eq} from 'drizzle-orm'
import type {
  FeatureEntitlements,
  PaidFeature,
} from '@/core/city-temperature/domain'
import {db} from './database'
import {featureEntitlement} from './schema'

export async function getFeatureEntitlements(
  userId: string,
): Promise<FeatureEntitlements> {
  const rows = await db
    .select({feature: featureEntitlement.feature})
    .from(featureEntitlement)
    .where(
      and(
        eq(featureEntitlement.userId, userId),
        eq(featureEntitlement.status, 'active'),
      ),
    )

  return {
    heater: rows.some(row => row.feature === 'heater'),
    connections: rows.some(row => row.feature === 'connections'),
  }
}

export async function hasFeatureEntitlement(
  userId: string,
  feature: PaidFeature,
): Promise<boolean> {
  const [row] = await db
    .select({feature: featureEntitlement.feature})
    .from(featureEntitlement)
    .where(
      and(
        eq(featureEntitlement.userId, userId),
        eq(featureEntitlement.feature, feature),
        eq(featureEntitlement.status, 'active'),
      ),
    )
    .limit(1)
  return Boolean(row)
}
