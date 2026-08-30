import type {APIRoute} from 'astro'
import {accountsConfigured, getRequestSession} from '@/server/city-temperature/auth'
import {db} from '@/server/city-temperature/database'
import {getFeatureEntitlements} from '@/server/city-temperature/entitlements'
import {featureEntitlement} from '@/server/city-temperature/schema'
import {eq} from 'drizzle-orm'
import type {PaidFeature} from '@/core/city-temperature/domain'

export const prerender = false

const FEATURES = new Set<PaidFeature>(['heater', 'connections'])

export const POST: APIRoute = async ({request}) => {
  if (!accountsConfigured) {
    return Response.json(
      {error: 'Account entitlement syncing is not configured.'},
      {status: 503},
    )
  }

  const session = await getRequestSession(request)
  if (!session) {
    return Response.json({error: 'Sign in to sync this demo unlock.'}, {status: 401})
  }

  let feature: PaidFeature
  try {
    const body = await request.json()
    feature = body.feature
  } catch {
    return Response.json({error: 'Invalid purchase request.'}, {status: 400})
  }

  if (!FEATURES.has(feature)) {
    return Response.json({error: 'Unknown feature.'}, {status: 400})
  }

  await db
    .insert(featureEntitlement)
    .values({
      userId: session.user.id,
      feature,
      status: 'active',
      source: 'mock',
      amountPaid: 0,
      currency: 'usd',
      purchasedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [featureEntitlement.userId, featureEntitlement.feature],
      set: {
        status: 'active',
        source: 'mock',
        amountPaid: 0,
        currency: 'usd',
        purchasedAt: new Date(),
      },
    })

  return Response.json({
    mock: true,
    charged: false,
    entitlements: await getFeatureEntitlements(session.user.id),
  })
}

export const DELETE: APIRoute = async ({request}) => {
  if (!accountsConfigured) {
    return Response.json(
      {error: 'Account entitlement syncing is not configured.'},
      {status: 503},
    )
  }

  const session = await getRequestSession(request)
  if (!session) {
    return Response.json({error: 'Sign in to reset account unlocks.'}, {status: 401})
  }

  await db
    .update(featureEntitlement)
    .set({status: 'refunded', updatedAt: new Date()})
    .where(eq(featureEntitlement.userId, session.user.id))

  return Response.json({
    mock: true,
    refunded: true,
    charged: false,
    entitlements: {heater: false, connections: false},
  })
}
