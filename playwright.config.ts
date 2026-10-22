import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
const { requireTestDatabaseUrl, requireOwnedSchema } = require('./scripts/lib/test-database.cjs');
const url = requireTestDatabaseUrl(process.env.CAR_TEST_DATABASE_URL);
if (url.searchParams.get('schema') !== requireOwnedSchema(process.env.CAR_TEST_DATABASE_SCHEMA) || !/^[a-f0-9-]{36}$/.test(process.env.CAR_E2E_RUN_ID || '')) throw new Error('Use the owned E2E harness');
for (const key of ['CAR_E2E_WEB_URL','CAR_E2E_API_URL']) {
  const endpoint = new URL(process.env[key]!);
  if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1') throw new Error('E2E endpoints must use loopback');
}
const artifacts = process.env.CAR_E2E_ARTIFACT_DIR!;
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  timeout: 60000, globalTimeout: 25 * 60 * 1000, expect: { timeout: 15000 },
  outputDir: path.join(artifacts,'results'),
  reporter: [['list'],['html',{outputFolder:path.join(artifacts,'report'),open:'never'}],['json',{outputFile:path.join(artifacts,'summary.json')}]],
  use: { baseURL:process.env.CAR_E2E_WEB_URL, trace:'retain-on-failure', screenshot:'only-on-failure', video:'off', serviceWorkers:'block' },
  projects: [
    { name:'api', testMatch:/\.api\.spec\.ts$/, use:{trace:'off'} },
    { name:'desktop-chromium', testMatch:/\.browser\.spec\.ts$/, use:{...devices['Desktop Chrome']} },
    { name:'mobile-chromium', testMatch:/\.browser\.spec\.ts$/, use:{...devices['Pixel 7'],defaultBrowserType:'chromium'} },
  ],
});
