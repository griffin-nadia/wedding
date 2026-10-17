import { defineConfig, devices } from "@playwright/test"

// Quality gates (docs/quality.md): screenshots at 390 and 1440, axe, and a performance budget, against the built
// site served by vite preview. The sample household, no back end.
export default defineConfig({
  testDir: "e2e",
  // One set of baselines per platform: fonts anti-alias differently on macOS and on the Linux runner
  snapshotPathTemplate: "e2e/__screenshots__/{platform}/{arg}-{projectName}{ext}",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
  use: { baseURL: "http://localhost:4173/wedding/", reducedMotion: "reduce" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } },
    { name: "laptop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: "npx vite preview --port 4173 --strictPort", port: 4173, reuseExistingServer: !process.env.CI },
})
