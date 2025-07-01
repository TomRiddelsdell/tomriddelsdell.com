import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './infrastructure/tests/setup.ts',
      './interfaces/api-gateway/tests/setup.ts'
    ],
    include: [
      'domains/**/tests/unit/*.{test,spec}.{js,ts,tsx}',
      'domains/**/tests/integration/*.{test,spec}.{js,ts,tsx}',
      'services/**/tests/unit/*.{test,spec}.{js,ts,tsx}',
      'services/**/tests/integration/*.{test,spec}.{js,ts,tsx}',
      'infrastructure/tests/unit/*.{test,spec}.{js,ts,tsx}',
      'infrastructure/tests/integration/*.{test,spec}.{js,ts,tsx}',
      'interfaces/**/tests/integration/*.{test,spec}.{js,ts,tsx}',
      'libs/**/src/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/tests/**',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './interfaces/web-frontend/src'),
      '@shared': resolve(__dirname, './domains/shared-kernel/src'),
      '@server': resolve(__dirname, './interfaces/api-gateway/src')
    }
  }
});