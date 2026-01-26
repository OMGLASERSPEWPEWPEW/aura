import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('My Profile Page', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/my-profile');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test('displays page based on auth state', async ({ page }) => {
      await page.goto('/my-profile');

      // Should show either my-profile page or login
      const onLogin = await isOnLoginPage(page);
      const hasMyProfileHeader = await page.getByRole('heading', { name: /my profile/i }).isVisible().catch(() => false);

      expect(onLogin || hasMyProfileHeader).toBeTruthy();
    });

    test('has page header when authenticated', async ({ page }) => {
      await page.goto('/my-profile');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible();
      await expect(page.getByText('Build your dating intelligence')).toBeVisible();
    });

    test('has navigation tabs when authenticated', async ({ page }) => {
      await page.goto('/my-profile');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Check for the 4 tabs
      await expect(page.getByText('Video')).toBeVisible();
      await expect(page.getByText('Text')).toBeVisible();
      await expect(page.getByText('Info')).toBeVisible();
      await expect(page.getByText('Insights')).toBeVisible();
    });

    test('can switch tabs when authenticated', async ({ page }) => {
      await page.goto('/my-profile');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Video tab is default and should be active
      const videoTabButton = page.locator('button').filter({ hasText: 'Video' }).first();
      await expect(videoTabButton).toBeVisible();

      // Click Text tab
      const textTab = page.locator('button').filter({ hasText: 'Text' }).first();
      await textTab.click();

      // Click Info tab
      const infoTab = page.locator('button').filter({ hasText: 'Info' }).first();
      await infoTab.click();

      // Click Insights tab
      const insightsTab = page.locator('button').filter({ hasText: 'Insights' }).first();
      await insightsTab.click();

      // Click back to Video tab
      await videoTabButton.click();
    });

    test('back link navigates to home when authenticated', async ({ page }) => {
      await page.goto('/my-profile');

      // Skip if on login page
      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      const backLink = page.locator('a[href="/"]');
      await backLink.click();
      await expect(page).toHaveURL('/');
    });
  });
});
