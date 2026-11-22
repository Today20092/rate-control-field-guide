import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://today20092.github.io',
  base: '/rate-control-field-guide',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
})
