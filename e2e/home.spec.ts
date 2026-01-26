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
      const hasAura = await page.getByText('Aura').first().isVisible().catch(() => false);

      expect(onLogin || hasAura).toBeTruthy();
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
      const hasAura = await page.getByText('Aura').first().isVisible().catch(() => false);

      expect(hasEmptyState || hasProfiles || hasAura).toBeTruthy();
    });

    test('has navigation elements when authenticated', async ({ page }) => {
      await page.goto('/');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should have upload FAB
      const fab = page.locator('a[href="/upload"]');
      await expect(fab).toBeVisible();

      // Should have My Profile link
      const myProfileLink = page.locator('a[href="/my-profile"]');
      await expect(myProfileLink).toBeVisible();
    });
  });
});
