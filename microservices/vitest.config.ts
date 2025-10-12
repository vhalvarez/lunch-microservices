import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '**/__tests__/**/*.{test,spec}.ts',
      '**/*.{test,spec}.ts'
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['apps/**/src/**', 'packages/**/src/**'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@lunch/shared-kernel': resolve(__dirname, './packages/shared-kernel/src'),
      '@lunch/messaging': resolve(__dirname, './packages/messaging/src'),
      '@lunch/config': resolve(__dirname, './packages/config/src'),
    },
  },
});