import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('Dark Mode', () => {
  test.describe('Settings page theme toggle', () => {
    test('has appearance section with theme buttons', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Appearance section heading
      await expect(page.locator('h3').filter({ hasText: 'Appearance' })).toBeVisible();

      // Should have System, Light, and Dark buttons
      await expect(page.getByRole('button', { name: /system/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /light/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /dark/i })).toBeVisible();
    });

    test('can switch to dark mode', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Click dark mode button
      await page.getByRole('button', { name: /dark/i }).click();

      // HTML element should have dark class
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('can switch to light mode', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // First set to dark
      await page.getByRole('button', { name: /dark/i }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Then switch to light
      await page.getByRole('button', { name: /light/i }).click();

      // HTML element should not have dark class
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('can switch to system mode', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // First set to dark
      await page.getByRole('button', { name: /dark/i }).click();

      // Then switch to system
      await page.getByRole('button', { name: /system/i }).click();

      // The system button should be selected (have violet border)
      const systemButton = page.getByRole('button', { name: /system/i });
      await expect(systemButton).toHaveClass(/border-violet-500/);
    });
  });

  test.describe('Theme persistence', () => {
    test('dark mode preference persists across page reload', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Set to dark mode
      await page.getByRole('button', { name: /dark/i }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Reload the page
      await page.reload();

      // Should still be in dark mode
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('light mode preference persists across page reload', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // First set to dark to ensure we're changing something
      await page.getByRole('button', { name: /dark/i }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Set to light mode
      await page.getByRole('button', { name: /light/i }).click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);

      // Reload the page
      await page.reload();

      // Should still be in light mode
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('dark mode persists when navigating to other pages', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Set to dark mode
      await page.getByRole('button', { name: /dark/i }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Navigate to home
      await page.getByRole('link', { name: /back/i }).click();
      await expect(page).toHaveURL('/');

      // Should still be in dark mode
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  });

  test.describe('Flash prevention', () => {
    test('no flash of wrong theme on page load with dark preference', async ({ page, context }) => {
      // Set localStorage before navigating
      await context.addInitScript(() => {
        localStorage.setItem('aura-theme', JSON.stringify('dark'));
      });

      // Navigate to page
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should have dark class immediately (no flash)
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('no flash of wrong theme on page load with light preference', async ({ page, context }) => {
      // Set localStorage before navigating
      await context.addInitScript(() => {
        localStorage.setItem('aura-theme', JSON.stringify('light'));
      });

      // Navigate to page
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should not have dark class immediately (no flash)
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });
  });

  test.describe('PWA theme-color', () => {
    test('theme-color meta tag updates when switching to dark mode', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Get initial theme-color
      const initialThemeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(initialThemeColor).toBe('#7c3aed'); // Light mode purple

      // Switch to dark mode
      await page.getByRole('button', { name: /dark/i }).click();

      // Theme-color should be dark
      const darkThemeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(darkThemeColor).toBe('#0f172a'); // Dark mode slate-900
    });

    test('theme-color meta tag updates when switching to light mode', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // First set to dark
      await page.getByRole('button', { name: /dark/i }).click();

      // Then switch to light
      await page.getByRole('button', { name: /light/i }).click();

      // Theme-color should be light
      const lightThemeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
      expect(lightThemeColor).toBe('#7c3aed'); // Light mode purple
    });
  });

  test.describe('System preference', () => {
    test('respects system dark preference when theme is system', async ({ page }) => {
      // Emulate dark color scheme
      await page.emulateMedia({ colorScheme: 'dark' });

      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should be in dark mode due to system preference
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('respects system light preference when theme is system', async ({ page }) => {
      // Emulate light color scheme
      await page.emulateMedia({ colorScheme: 'light' });

      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should be in light mode due to system preference
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('manual preference overrides system preference', async ({ page }) => {
      // Emulate dark color scheme
      await page.emulateMedia({ colorScheme: 'dark' });

      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Should initially be dark due to system preference
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Manually set to light
      await page.getByRole('button', { name: /light/i }).click();

      // Should override system and be light
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });
  });

  test.describe('Visual consistency', () => {
    test('home page renders correctly in dark mode', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Set dark mode
      await page.getByRole('button', { name: /dark/i }).click();

      // Navigate to home
      await page.goto('/');

      // Page should have dark background class
      const mainDiv = page.locator('div.min-h-screen').first();
      await expect(mainDiv).toHaveClass(/dark:bg-slate-900/);
    });

    test('settings page has correct dark mode styling', async ({ page }) => {
      await page.goto('/settings');

      if (await isOnLoginPage(page)) {
        test.skip();
        return;
      }

      // Set dark mode
      await page.getByRole('button', { name: /dark/i }).click();

      // Cards should have dark background
      const cards = page.locator('.bg-white.dark\\:bg-slate-800');
      await expect(cards.first()).toBeVisible();
    });
  });
});
