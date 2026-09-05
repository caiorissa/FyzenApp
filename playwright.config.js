import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: false,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5175",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [["list"]],
  webServer: {
    command: "npx vite --config vite.test.config.js",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: !process.env.CI,
  },
});
