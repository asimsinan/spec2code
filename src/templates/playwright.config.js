// playwright.config.js - Universal Visual Regression Testing Configuration
// This configuration works for web, mobile, desktop, and backend applications

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/visual',
  timeout: 30000,
  
  // Visual testing configuration
  expect: {
    toHaveScreenshot: { 
      threshold: 0.2,  // Allow 20% pixel difference
      mode: 'rgb'     // Compare RGB values
    },
  },
  
  // Test execution configuration
  use: {
    screenshot: 'only-on-change',  // Only take screenshots when tests change
    video: 'retain-on-failure',   // Keep videos of failed tests
    trace: 'retain-on-failure',   // Keep traces of failed tests
  },
  
  // Retry configuration
  retries: process.env.CI ? 2 : 0,
  
  // Parallel execution
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Project configurations for different platforms
  projects: [
    // Web Browsers
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile Devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Mobile Chrome Landscape',
      use: { ...devices['Pixel 5 landscape'] },
    },
    
    // Tablet Devices
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'iPad Landscape',
      use: { ...devices['iPad Pro landscape'] },
    },
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
  
  // Output directory for test artifacts
  outputDir: 'test-results/',
  
  // Web server configuration (if needed)
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
