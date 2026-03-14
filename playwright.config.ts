import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/playwright',
  timeout: 30_000,
  reporter: 'list',
});
