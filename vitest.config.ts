import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Do not load Vite app plugins during unit tests
  plugins: [],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      include: [
        'src/utils/**',
        'src/stores/sessions.ts',
        'src/stores/settings.ts',
        'src/stores/favorites.ts',
        'src/stores/drillCatalog.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 65,
        statements: 70,
        branches: 70,
      },
    },
  },
})
