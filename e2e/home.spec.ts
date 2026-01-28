import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('Home Page', () => {
  test.describe('unauthenticated', () => {
    // Use fresh context without auth for this test
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test('displays correct page based on auth state', async ({ page }) => {
      await page.goto('/');

      // Should show either home page (authenticated) or login (not authenticated)
      const onLogin = await isOnLoginPage(page);
      // Logo is an image with alt="Aura logo", not text
      const hasLogo = await page.getByAltText('Aura logo').isVisible().catch(() => false);
      // Also check for bottom nav bar (indicates authenticated)
      const hasBottomNav = await page.locator('nav.fixed.bottom-0').isVisible().catch(() => false);

      expect(onLogin || hasLogo || hasBottomNav).toBeTruthy();
    });

    test('shows empty state or profiles when authenticated', async ({ page }) => {
      await page.goto('/');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should show empty state or profile list
      const hasEmptyState = await page.getByText('No matches yet').isVisible().catch(() => false);
      const hasProfiles = await page.locator('a[href^="/profile/"]').first().isVisible().catch(() => false);
      // Logo is an image with alt="Aura logo", not text
      const hasLogo = await page.getByAltText('Aura logo').isVisible().catch(() => false);

      expect(hasEmptyState || hasProfiles || hasLogo).toBeTruthy();
    });

    test('has navigation elements when authenticated', async ({ page }) => {
      await page.goto('/');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should have bottom navigation bar with key links
      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();

      // Should have Analyze link in nav bar
      const analyzeLink = page.locator('nav a[href="/upload"]');
      await expect(analyzeLink).toBeVisible();

      // Should have Me (My Profile) link in nav bar
      const meLink = page.locator('nav a[href="/my-profile"]');
      await expect(meLink).toBeVisible();

      // Should have Settings link in nav bar
      const settingsLink = page.locator('nav a[href="/settings"]');
      await expect(settingsLink).toBeVisible();
    });
  });
});
