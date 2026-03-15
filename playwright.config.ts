import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: join(configDir, 'src/test/playwright'),
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npm run qa:dev',
    cwd: configDir,
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
