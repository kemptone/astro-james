import type {APIRoute} from 'astro'
import {accountsConfigured, auth} from '@/server/city-temperature/auth'

export const prerender = false

export const ALL: APIRoute = async context => {
  if (!accountsConfigured) {
    return Response.json(
      {error: 'Account services are not configured.'},
      {status: 503},
    )
  }
  return auth.handler(context.request)
}
