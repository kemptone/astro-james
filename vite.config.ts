import {defineConfig, loadEnv} from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, './src'),
    },
  },
})
