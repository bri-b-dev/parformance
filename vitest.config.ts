import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Do not load Vite app plugins during unit tests
  plugins: [],
  test: {
    environment: 'node',
    globals: false,
  },
})
