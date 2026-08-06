import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    coverage: {
      lines: 70,
      functions: 70,
      branches: 55,
      statements: 70,
    },
  },
});
