import { defineConfig, devices } from '@playwright/test'

const PORT = 5190
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'off', screenshot: 'off', video: 'off' },
  // Two pointer types, because the touch sizing is keyed to `pointer: coarse`
  // rather than to a width — a narrow desktop window must keep the compact
  // controls, and only a real touch device gets the thumb-sized ones.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } }
  ],
  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI
  }
})
