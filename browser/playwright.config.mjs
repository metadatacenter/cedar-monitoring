import { defineConfig } from "@playwright/test";
const port = Number(process.env.PORT || 4795);
// Hermetic: the built application, signed in through a stubbed Keycloak, with the monitor API
// answered from fixtures.

export default defineConfig({
  testDir: "./tests",
  // Every functional/accessibility spec runs in all engines by default.
  projects: [
    { name: "", use: { browserName: "chromium" } },
    ...["firefox", "webkit"].map((browserName) => ({
      name: browserName,
      use: { browserName },
    })),
  ],
  fullyParallel: true,
  workers: process.env.CEDAR_TEST_WORKERS
    ? Number(process.env.CEDAR_TEST_WORKERS)
    : undefined,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Fail on the first failure in CI; a retry must not hide an unreliable case.
  maxFailures: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    trace: process.env.CEDAR_TEST_TRACE === "on" ? "retain-on-failure" : "off",
    screenshot: process.env.CI ? "only-on-failure" : "off",
  },
  webServer: {
    command: "node serve.mjs",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
