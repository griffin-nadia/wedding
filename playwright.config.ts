import { defineConfig, devices } from "@playwright/test"
const port = Number(process.env.E2E_PORT ?? 4173)

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
  // Scrollbars hidden so the OS setting (always shown with a mouse plugged in) doesn't change the screenshots
  use: { baseURL: `http://localhost:${port}/wedding/`, reducedMotion: "reduce", launchOptions: { args: ["--hide-scrollbars"] } },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 } },
    { name: "laptop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: `npm run build:lab && npx vite preview --port ${port} --strictPort`, // the lab is local only: built here for its tests, never deployed
    port, reuseExistingServer: !process.env.CI },
})
