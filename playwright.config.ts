import { defineConfig, devices } from "@playwright/test";

const runBackend = process.env.E2E_WITH_BACKEND === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    ...(runBackend
      ? [
          {
            command: "npm run dev --prefix backend",
            url: "http://127.0.0.1:5000/api/health",
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
          },
        ]
      : []),
    {
      command: "npm run dev --prefix client -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
