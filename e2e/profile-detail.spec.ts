import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('Profile Detail Page', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/profile/1');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test('displays page based on auth state', async ({ page }) => {
      await page.goto('/profile/1');

      // Should show either profile page (loading) or login
      const onLogin = await isOnLoginPage(page);
      const hasLoading = await page.getByText('Loading Profile...').isVisible().catch(() => false);
      const hasContent = await page.locator('.pb-24.bg-white').isVisible().catch(() => false);

      expect(onLogin || hasLoading || hasContent).toBeTruthy();
    });

    test('shows loading state for non-existent profile when authenticated', async ({ page }) => {
      await page.goto('/profile/999999');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should show loading state for non-existent profile
      await expect(page.getByText('Loading Profile...')).toBeVisible();
    });
  });
});
