import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authFile = join(__dirname, '.auth/user.json');

/**
 * Global setup that authenticates once and saves the storage state.
 *
 * Requires environment variables:
 * - TEST_USER_EMAIL: Test account email
 * - TEST_USER_PASSWORD: Test account password
 *
 * To set up:
 * 1. Create a test user in your Supabase project
 * 2. Set the env vars in your .env file or CI environment
 * 3. Run: npm run test:e2e
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log('⚠️  TEST_USER_EMAIL and TEST_USER_PASSWORD not set. Skipping auth setup.');
    console.log('   To run authenticated tests, set these environment variables.');
    console.log('   Unauthenticated tests will still run.');

    // Create empty auth state so tests can still run (they'll just be redirected to login)
    await page.goto('/login');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Go to login page
  await page.goto('/login');

  // Fill in credentials
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for successful authentication - should redirect to home
  await expect(page).toHaveURL('/', { timeout: 10000 });

  // Verify we're logged in by checking for auth-protected content
  await expect(page.getByText('Aura')).toBeVisible();

  // Save the authentication state
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication successful, state saved to', authFile);
});
