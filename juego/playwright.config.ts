import { defineConfig, devices } from '@playwright/test';

/**
 * E2E sobre el build de producción (`vite preview`), en Chromium headless.
 * Resolución base 1366×768: laptop antigua típica.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['Desktop Chrome'],
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
    // usa la GPU real del equipo (gráficos integrados) en vez de WebGL por software (SwiftShader)
    launchOptions: { args: ['--use-angle=gl-egl', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
