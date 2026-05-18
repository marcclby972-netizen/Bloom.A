import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // node env suffices for pure-fn tests (no React component testing yet)
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', '_archived/**', 'mobile/**'],
    globals: false,
    reporters: 'default',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
