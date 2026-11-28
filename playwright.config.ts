
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,

  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5000/api/v1/',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

  timeout: 30000,

  retries: 0,
});
