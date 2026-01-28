import { test, expect } from '@playwright/test';
import { prepareForScreenshot } from './fixtures/visual-helpers';
import { isOnLoginPage } from './fixtures/test-fixtures';

/**
 * Visual Regression Tests
 *
 * These tests capture baseline screenshots and compare against them
 * to catch unintended UI changes. Run with:
 *
 *   npm run test:e2e -- visual.spec.ts --project=chromium
 *
 * To update baselines after intentional changes:
 *
 *   npm run test:e2e -- visual.spec.ts --project=chromium --update-snapshots
 */
test.describe('Visual Regression @visual', () => {
  // Only run on Chromium to keep baseline count manageable
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual tests only run on Chromium');
  test.describe('Unauthenticated Pages', () => {
    // Force unauthenticated state for login/signup pages
    test.use({ storageState: { cookies: [], origins: [] } });

    test('login page', async ({ page }) => {
      await page.goto('/login');
      await prepareForScreenshot(page);
      await expect(page).toHaveScreenshot('login.png');
    });

    test('signup page', async ({ page }) => {
      await page.goto('/signup');
      await prepareForScreenshot(page);
      await expect(page).toHaveScreenshot('signup.png');
    });
  });

  test.describe('Authenticated Pages', () => {
    test('settings page - light mode', async ({ page }) => {
      await page.goto('/settings');

      // Skip if not authenticated (graceful fallback)
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Ensure light mode is active
      await page.getByRole('button', { name: /light/i }).click();
      await prepareForScreenshot(page);
      await expect(page).toHaveScreenshot('settings-light.png');
    });

    test('settings page - dark mode', async ({ page }) => {
      await page.goto('/settings');

      // Skip if not authenticated (graceful fallback)
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Switch to dark mode
      await page.getByRole('button', { name: /dark/i }).click();
      await prepareForScreenshot(page);
      await expect(page).toHaveScreenshot('settings-dark.png');
    });
  });
});
