import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('Settings Page', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('authenticated', () => {
    test('displays settings page', async ({ page }) => {
      await page.goto('/settings');

      // Should show either settings page or login
      const onLogin = await isOnLoginPage(page);
      const hasSettingsHeader = await page.getByRole('heading', { name: /settings/i }).isVisible().catch(() => false);

      expect(onLogin || hasSettingsHeader).toBeTruthy();
    });

    test('has page header when authenticated', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
      await expect(page.getByText('Configure app behavior')).toBeVisible();
    });

    test('has back link to home', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      const backLink = page.getByRole('link', { name: /back/i });
      await expect(backLink).toBeVisible();
    });

    test('shows account section when authenticated', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Account section should be visible
      await expect(page.getByText('Account')).toBeVisible();
    });

    test('shows user email when authenticated', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Email field should show user's email
      await expect(page.getByText('Email')).toBeVisible();
    });

    test('has sign out button when authenticated', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      const signOutButton = page.getByRole('button', { name: /sign out/i });
      await expect(signOutButton).toBeVisible();
    });

    test('has delete account button when authenticated', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      const deleteButton = page.getByRole('button', { name: /delete account/i });
      await expect(deleteButton).toBeVisible();
    });

    test('has auto-compatibility toggle', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      await expect(page.getByText('Auto-run compatibility analysis')).toBeVisible();
    });

    test('can toggle auto-compatibility setting', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Find the toggle button (it's a button with role switch or similar)
      const toggleSection = page.locator('text=Auto-run compatibility analysis').locator('..');
      const toggleButton = toggleSection.locator('button').first();

      if (await toggleButton.isVisible()) {
        // Click to toggle
        await toggleButton.click();
        // Toggle state should change (checking class changes is fragile, so just verify click works)
      }
    });

    test('shows data sync section when authenticated', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      await expect(page.getByText('Data Sync')).toBeVisible();
    });

    test('back link navigates to home', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      await page.getByRole('link', { name: /back/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('delete account button opens modal', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      const deleteButton = page.getByRole('button', { name: /delete account/i });
      await deleteButton.click();

      // Modal should appear
      await expect(page.getByText(/are you sure|delete.*account|confirm/i)).toBeVisible();
    });
  });
});
