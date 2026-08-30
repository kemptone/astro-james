import type {APIRoute} from 'astro'
import {and, eq} from 'drizzle-orm'
import {
  validateMapState,
  type FeatureEntitlements,
  type MapState,
} from '@/core/city-temperature/domain'
import {
  accountsConfigured,
  getRequestSession,
} from '@/server/city-temperature/auth'
import {db} from '@/server/city-temperature/database'
import {getFeatureEntitlements} from '@/server/city-temperature/entitlements'
import {cityTemperatureMap} from '@/server/city-temperature/schema'

export const prerender = false

function unavailable() {
  return Response.json(
    {error: 'Account saving is not configured.'},
    {status: 503},
  )
}

function unauthorized() {
  return Response.json({error: 'Sign in to use account saving.'}, {status: 401})
}

function sanitizeForEntitlements(
  map: MapState,
  entitlements: FeatureEntitlements,
): MapState {
  return {
    ...map,
    activeMode:
      map.activeMode === 'heater' && !entitlements.heater
        ? 'normal'
        : map.activeMode,
    connections: entitlements.connections ? map.connections : [],
  }
}

async function loadCurrent(userId: string, entitlements: FeatureEntitlements) {
  const [saved] = await db
    .select({state: cityTemperatureMap.state, version: cityTemperatureMap.version})
    .from(cityTemperatureMap)
    .where(eq(cityTemperatureMap.userId, userId))
    .limit(1)

  return {
    map: saved ? sanitizeForEntitlements(saved.state, entitlements) : null,
    version: saved?.version ?? 0,
    entitlements,
  }
}

export const GET: APIRoute = async ({request}) => {
  if (!accountsConfigured) return unavailable()
  const session = await getRequestSession(request)
  if (!session) return unauthorized()

  const entitlements = await getFeatureEntitlements(session.user.id)
  return Response.json(await loadCurrent(session.user.id, entitlements))
}

export const PUT: APIRoute = async ({request}) => {
  if (!accountsConfigured) return unavailable()
  const session = await getRequestSession(request)
  if (!session) return unauthorized()

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > 262_144) {
    return Response.json({error: 'Map data is too large.'}, {status: 413})
  }

  let body: {map?: unknown; version?: unknown}
  try {
    body = await request.json()
  } catch {
    return Response.json({error: 'Map data must be valid JSON.'}, {status: 400})
  }

  if (!Number.isInteger(body.version) || Number(body.version) < 0) {
    return Response.json({error: 'The map version is invalid.'}, {status: 400})
  }

  const entitlements = await getFeatureEntitlements(session.user.id)
  const validation = validateMapState(body.map, entitlements)
  if (!validation.ok || !validation.state) {
    return Response.json(
      {error: validation.errors[0], errors: validation.errors},
      {status: 400},
    )
  }

  const requestedVersion = Number(body.version)
  const [current] = await db
    .select({state: cityTemperatureMap.state, version: cityTemperatureMap.version})
    .from(cityTemperatureMap)
    .where(eq(cityTemperatureMap.userId, session.user.id))
    .limit(1)

  if (!current) {
    if (requestedVersion !== 0) {
      return Response.json(
        {map: null, version: 0, entitlements},
        {status: 409},
      )
    }
    const inserted = await db
      .insert(cityTemperatureMap)
      .values({userId: session.user.id, state: validation.state, version: 1})
      .onConflictDoNothing({target: cityTemperatureMap.userId})
      .returning({version: cityTemperatureMap.version})

    if (inserted.length === 0) {
      return Response.json(
        await loadCurrent(session.user.id, entitlements),
        {status: 409},
      )
    }
    return Response.json({version: inserted[0].version, entitlements})
  }

  if (current.version !== requestedVersion) {
    return Response.json(
      {
        map: sanitizeForEntitlements(current.state, entitlements),
        version: current.version,
        entitlements,
      },
      {status: 409},
    )
  }

  const [updated] = await db
    .update(cityTemperatureMap)
    .set({state: validation.state, version: current.version + 1})
    .where(
      and(
        eq(cityTemperatureMap.userId, session.user.id),
        eq(cityTemperatureMap.version, current.version),
      ),
    )
    .returning({version: cityTemperatureMap.version})

  if (!updated) {
    return Response.json(
      await loadCurrent(session.user.id, entitlements),
      {status: 409},
    )
  }

  return Response.json({version: updated.version, entitlements})
}
