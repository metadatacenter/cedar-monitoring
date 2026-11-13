import { defineConfig } from "@playwright/test";
const port = Number(process.env.PORT || 4795);
// Hermetic: the built application, signed in through a stubbed Keycloak, with the monitor API
// answered from fixtures.
// Functional browser contracts share the existing worker budget; pixel baselines keep their own projects.
const functionalSpecs = [
  "response-matrix.spec.mjs",
  "store-unavailable.spec.mjs",
  "no-access.spec.mjs",
];

export default defineConfig({
  testDir: "./tests",
  // Keep pixel baselines in their original project; measure accessibility in every engine.
  projects: [
    ...["firefox", "webkit"].map((browserName) => ({
      name: `${browserName}-functional`,
      testMatch: functionalSpecs,
      use: { browserName },
    })),
    { name: "", use: { browserName: "chromium" } },
    ...["firefox", "webkit"].map((browserName) => ({
      name: `${browserName}-accessibility`,
      testMatch: /(?:accessibility|layout-resilience)\.spec\.mjs/,
      use: { browserName },
    })),
  ],
  fullyParallel: true,
  workers: process.env.CEDAR_TEST_WORKERS
    ? Number(process.env.CEDAR_TEST_WORKERS)
    : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Stop a known-red CI/reactor run after a test exhausts its retry.
  maxFailures: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node serve.mjs",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
