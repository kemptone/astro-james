import {defineConfig} from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/city-temperature/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://city_temperature:city_temperature@127.0.0.1:5432/city_temperature',
  },
})
