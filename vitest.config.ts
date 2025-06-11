import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
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
    exclude: ['tests/e2e/**/*', '**/node_modules/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        'vite.config.ts',
        'vitest.config.ts',
        'playwright.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
      '@server': resolve(__dirname, './server')
    }
  }
});