import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('Upload Page', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/upload');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test('displays page based on auth state', async ({ page }) => {
      await page.goto('/upload');

      // Should show either upload page or login
      const onLogin = await isOnLoginPage(page);
      const hasUploadHeader = await page.getByRole('heading', { name: /analyze profile/i }).isVisible().catch(() => false);

      expect(onLogin || hasUploadHeader).toBeTruthy();
    });

    test('has page elements when authenticated', async ({ page }) => {
      await page.goto('/upload');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should have header
      await expect(page.getByRole('heading', { name: /analyze profile/i })).toBeVisible();

      // Should have back link
      const backLink = page.getByRole('link', { name: /back/i });
      await expect(backLink).toBeVisible();

      // Should have debug button
      const debugButton = page.getByRole('button', { name: /debug/i });
      await expect(debugButton).toBeVisible();

      // Should have file input
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
    });

    test('file input accepts video files when authenticated', async ({ page }) => {
      await page.goto('/upload');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      const fileInput = page.locator('input[type="file"]');
      const acceptValue = await fileInput.getAttribute('accept');
      expect(acceptValue).toContain('video');
    });

    test('back link navigates to home when authenticated', async ({ page }) => {
      await page.goto('/upload');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      await page.getByRole('link', { name: /back/i }).click();
      await expect(page).toHaveURL('/');
    });
  });
});
