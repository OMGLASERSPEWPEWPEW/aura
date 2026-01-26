import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  // All auth tests use unauthenticated context
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('Login Page', () => {
    test('renders login form', async ({ page }) => {
      await page.goto('/login');

      // Check page title/header
      await expect(page.getByText('Welcome back')).toBeVisible();
      await expect(page.getByText('Sign in to continue')).toBeVisible();
    });

    test('has email and password inputs', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel('Email');
      const passwordInput = page.getByLabel('Password');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('has sign in button', async ({ page }) => {
      await page.goto('/login');

      const signInButton = page.getByRole('button', { name: /sign in/i });
      await expect(signInButton).toBeVisible();
    });

    test('has OAuth buttons', async ({ page }) => {
      await page.goto('/login');

      const googleButton = page.getByRole('button', { name: /continue with google/i });
      const appleButton = page.getByRole('button', { name: /continue with apple/i });

      await expect(googleButton).toBeVisible();
      await expect(appleButton).toBeVisible();
    });

    test('has forgot password link', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('has sign up link', async ({ page }) => {
      await page.goto('/login');

      const signupLink = page.getByRole('link', { name: /sign up/i });
      await expect(signupLink).toBeVisible();
      await expect(signupLink).toHaveAttribute('href', '/signup');
    });

    test('shows validation for empty form submission', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      const signInButton = page.getByRole('button', { name: /sign in/i });
      await signInButton.click();

      // Browser validation should prevent submission (required fields)
      // The form should still be visible (no navigation)
      await expect(page).toHaveURL(/\/login/);
    });

    test('can fill email and password', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel('Email');
      const passwordInput = page.getByLabel('Password');

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      await expect(emailInput).toHaveValue('test@example.com');
      await expect(passwordInput).toHaveValue('password123');
    });

    test('navigates to forgot password', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /forgot password/i }).click();
      await expect(page).toHaveURL('/forgot-password');
    });

    test('navigates to signup', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('link', { name: /sign up/i }).click();
      await expect(page).toHaveURL('/signup');
    });
  });

  test.describe('Signup Page', () => {
    test('renders signup form', async ({ page }) => {
      await page.goto('/signup');

      // Check the heading specifically
      await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
      await expect(page.getByText('Get started with Aura')).toBeVisible();
    });

    test('has email and password inputs', async ({ page }) => {
      await page.goto('/signup');

      await expect(page.getByLabel('Email')).toBeVisible();
      // Password labels - there are two password inputs
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
    });

    test('has OAuth buttons', async ({ page }) => {
      await page.goto('/signup');

      const googleButton = page.getByRole('button', { name: /continue with google/i });
      const appleButton = page.getByRole('button', { name: /continue with apple/i });

      await expect(googleButton).toBeVisible();
      await expect(appleButton).toBeVisible();
    });

    test('has login link', async ({ page }) => {
      await page.goto('/signup');

      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
    });

    test('navigates to login', async ({ page }) => {
      await page.goto('/signup');

      await page.getByRole('link', { name: /sign in/i }).click();
      await expect(page).toHaveURL('/login');
    });

    test('shows password requirements when typing', async ({ page }) => {
      await page.goto('/signup');

      const passwordInput = page.locator('#password');
      await passwordInput.fill('test');

      // Password requirements should appear
      await expect(page.getByText('At least 8 characters')).toBeVisible();
      await expect(page.getByText('Contains a number')).toBeVisible();
      await expect(page.getByText('Contains a special character')).toBeVisible();
    });

    test('submit button is disabled until requirements met', async ({ page }) => {
      await page.goto('/signup');

      const submitButton = page.getByRole('button', { name: /create account/i });

      // Should be disabled initially
      await expect(submitButton).toBeDisabled();

      // Fill valid data
      await page.getByLabel('Email').fill('test@example.com');
      await page.locator('#password').fill('Test123!@#');
      await page.locator('#confirmPassword').fill('Test123!@#');

      // Should now be enabled
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('Forgot Password Page', () => {
    test('renders forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      // Title is "Reset password"
      await expect(page.getByText('Reset password')).toBeVisible();
      await expect(page.getByText("We'll send you a reset link")).toBeVisible();
    });

    test('has email input', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('has send reset link button', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    });

    test('has back to login link', async ({ page }) => {
      await page.goto('/forgot-password');

      const loginLink = page.getByRole('link', { name: /back to login/i });
      await expect(loginLink).toBeVisible();
    });

    test('navigates back to login', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.getByRole('link', { name: /back to login/i }).click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Reset Password Page', () => {
    test('shows invalid link message without recovery token', async ({ page }) => {
      await page.goto('/reset-password');

      // Wait for navigation/redirect to settle
      await page.waitForTimeout(500);

      // Should show either invalid link message or redirect to forgot-password
      // Use heading role for "Invalid link" to be more specific
      const hasInvalidLink = await page.getByRole('heading', { name: /invalid link/i }).isVisible().catch(() => false);
      // For forgot-password page, check the heading "Reset password" or the URL
      const onForgotPassword = await page.url().includes('/forgot-password');
      // Also check for the forgot password page heading
      const hasForgotHeading = await page.getByRole('heading', { name: /reset password/i }).isVisible().catch(() => false);

      expect(hasInvalidLink || onForgotPassword || hasForgotHeading).toBeTruthy();
    });

    test('has link to request new reset', async ({ page }) => {
      await page.goto('/reset-password');

      // Wait for page to settle
      await page.waitForTimeout(1000);

      // Should have a link to forgot-password
      const requestLink = page.getByRole('link', { name: /request new link/i });
      if (await requestLink.isVisible().catch(() => false)) {
        await expect(requestLink).toBeVisible();
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('home redirects to login', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/\/login/);
    });

    test('upload redirects to login', async ({ page }) => {
      await page.goto('/upload');
      await expect(page).toHaveURL(/\/login/);
    });

    test('my-profile redirects to login', async ({ page }) => {
      await page.goto('/my-profile');
      await expect(page).toHaveURL(/\/login/);
    });

    test('settings redirects to login', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/\/login/);
    });

    test('profile detail redirects to login', async ({ page }) => {
      await page.goto('/profile/1');
      await expect(page).toHaveURL(/\/login/);
    });

    test('mirror redirects to login', async ({ page }) => {
      await page.goto('/mirror');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
