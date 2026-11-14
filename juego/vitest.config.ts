import { defineConfig } from 'vitest/config';

// Pruebas unitarias de la lógica pura (src/sim): sin navegador ni Phaser.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/sim/**/*.ts', 'src/data/missions.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 90, functions: 90, branches: 80 },
    },
  },
});
