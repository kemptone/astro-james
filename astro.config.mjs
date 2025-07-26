import {defineConfig} from 'astro/config'
import mdx from '@astrojs/mdx'
import vercel from '@astrojs/vercel'
import preact from '@astrojs/preact'

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), preact()],
  output: 'static',
  adapter: vercel(),
})
