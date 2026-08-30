import type {APIRoute} from 'astro'
import {
  accountsConfigured,
  googleEnabled,
} from '@/server/city-temperature/auth'

export const prerender = false

export const GET: APIRoute = async () =>
  Response.json({
    accountsConfigured,
    googleEnabled,
    purchaseMode: 'mock',
  })
