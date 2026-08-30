import {drizzle} from 'drizzle-orm/neon-http'
import {schema} from './schema'

const FALLBACK_DATABASE_URL =
  'postgresql://city_temperature:city_temperature@127.0.0.1:5432/city_temperature'
const runtimeEnv = {...import.meta.env, ...process.env}

export const databaseUrl = runtimeEnv.DATABASE_URL || FALLBACK_DATABASE_URL
export const databaseConfigured = Boolean(runtimeEnv.DATABASE_URL)

export const db = drizzle(databaseUrl, {schema})
