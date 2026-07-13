import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.e2e if present (local overrides), then fall back to process.env
dotenv.config({ path: path.resolve(__dirname, '../../.env.e2e'), override: false });

const FRONTEND_URL =
  process.env.E2E_FRONTEND_URL ?? 'https://contextualsdoh.org';

const BACKEND_URL =
  process.env.E2E_BACKEND_URL ?? 'https://datacatchnetwk.onrender.com';

export { FRONTEND_URL, BACKEND_URL };

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  timeout: 90_000,          // 90 s per test — Render cold-starts can be slow
  expect: { timeout: 15_000 },
  fullyParallel: false,     // registration tests must not race on the same email
  retries: 1,               // one automatic retry on flake
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }],
  ],

  use: {
    baseURL: FRONTEND_URL,
    headless: true,
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Capture all browser console messages
    ignoreHTTPSErrors: false,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  projects: [
    {
      name: 'chromium-cloud',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
