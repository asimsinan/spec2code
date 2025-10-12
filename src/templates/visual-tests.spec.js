// tests/visual/ui-components.spec.js - Universal Visual Regression Tests
// This test file provides examples for testing UI components across different platforms

import { test, expect } from '@playwright/test';

test.describe('UI Components Visual Regression', () => {
  
  // Homepage visual tests
  test('Homepage visual test', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage.png');
    
    // Test specific sections
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toHaveScreenshot('homepage-hero.png');
  });

  // Navigation visual tests
  test('Navigation menu visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test closed navigation
    await expect(page.locator('[data-testid="navigation"]')).toHaveScreenshot('navigation-closed.png');
    
    // Test open navigation
    await page.click('[data-testid="menu-button"]');
    await expect(page.locator('[data-testid="navigation"]')).toHaveScreenshot('navigation-open.png');
  });

  // Form components visual tests
  test('Form components visual test', async ({ page }) => {
    await page.goto('/contact');
    
    // Test empty form
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('contact-form-empty.png');
    
    // Test form with validation errors
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('contact-form-errors.png');
    
    // Test form with valid data
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="name-input"]', 'John Doe');
    await expect(page.locator('[data-testid="contact-form"]')).toHaveScreenshot('contact-form-filled.png');
  });

  // Responsive design tests
  test('Responsive design visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('homepage-mobile.png');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('homepage-tablet.png');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('homepage-desktop.png');
  });

  // Loading states visual tests
  test('Loading states visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test loading spinner
    await page.click('[data-testid="load-data-button"]');
    await expect(page.locator('[data-testid="loading-spinner"]')).toHaveScreenshot('loading-spinner.png');
    
    // Test skeleton loading
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-list"]')).toHaveScreenshot('product-list-loading.png');
  });

  // Error states visual tests
  test('Error states visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test 404 error page
    await page.goto('/non-existent-page');
    await expect(page).toHaveScreenshot('error-404.png');
    
    // Test network error state
    await page.route('**/api/data', route => route.abort());
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="error-message"]')).toHaveScreenshot('network-error.png');
  });

  // Modal and overlay visual tests
  test('Modal and overlay visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test modal opening
    await page.click('[data-testid="open-modal-button"]');
    await expect(page.locator('[data-testid="modal"]')).toHaveScreenshot('modal-open.png');
    
    // Test modal with form
    await page.click('[data-testid="modal-form-tab"]');
    await expect(page.locator('[data-testid="modal"]')).toHaveScreenshot('modal-form.png');
  });

  // Dark mode visual tests
  test('Dark mode visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test light mode
    await expect(page).toHaveScreenshot('homepage-light-mode.png');
    
    // Test dark mode
    await page.click('[data-testid="theme-toggle"]');
    await expect(page).toHaveScreenshot('homepage-dark-mode.png');
  });

  // Cross-browser compatibility tests
  test('Cross-browser compatibility test', async ({ page }) => {
    await page.goto('/');
    
    // Test specific browser-specific elements
    const browserName = page.context().browser()?.name() || 'unknown';
    
    if (browserName === 'chromium') {
      await expect(page.locator('[data-testid="chrome-specific-element"]')).toHaveScreenshot('chrome-specific.png');
    } else if (browserName === 'firefox') {
      await expect(page.locator('[data-testid="firefox-specific-element"]')).toHaveScreenshot('firefox-specific.png');
    } else if (browserName === 'webkit') {
      await expect(page.locator('[data-testid="safari-specific-element"]')).toHaveScreenshot('safari-specific.png');
    }
  });

  // Performance visual tests
  test('Performance visual test', async ({ page }) => {
    await page.goto('/');
    
    // Test with slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.reload();
    await expect(page).toHaveScreenshot('homepage-slow-network.png');
  });

});
