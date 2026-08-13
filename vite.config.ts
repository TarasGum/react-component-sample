import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // A port of its own, and `strictPort` so it is that port or nothing: the
    // sample runs beside the real apps, and a silent fallback to the next free
    // port is how a Playwright run ends up testing somebody else's page.
    port: 5190,
    strictPort: true
  },
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    // The components take the calendar's timezone as a prop rather than reading
    // the browser's, and these tests only prove that by disagreeing with the
    // browser — so the browser is pinned to UTC here.
    environmentOptions: { jsdom: { url: 'http://localhost' } },
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    css: false,
    exclude: [...configDefaults.exclude, '**/e2e/**']
  }
})
