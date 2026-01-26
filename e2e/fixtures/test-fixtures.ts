import { test as base, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to saved auth state
const authFile = join(__dirname, '../.auth/user.json');

// Path to test video file (gitignored - each developer needs their own)
export const TEST_VIDEO_PATH = join(__dirname, 'videos/test-profile.MP4');

/**
 * Extended test fixtures for Aura E2E tests
 */
export const test = base.extend<{
  /**
   * Whether the current test has valid authentication.
   * Use this to conditionally skip tests that require auth.
   */
  isAuthenticated: boolean;
}>({
  isAuthenticated: async ({ page }, use) => {
    // Check if we have a valid session by looking at localStorage
    const localStorage = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return keys.some(key => key.includes('supabase') && key.includes('auth'));
    });
    await use(localStorage);
  },
});

/**
 * Authenticated test - uses saved auth state
 * Tests using this will have a logged-in user
 */
export const authenticatedTest = base.extend({
  storageState: authFile,
});

export { expect };

/**
 * Helper to check if test credentials are configured
 */
export function hasTestCredentials(): boolean {
  return !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);
}

/**
 * Helper to check if the current page shows the login page
 * This waits for the page to stabilize before checking
 */
export async function isOnLoginPage(page: import('@playwright/test').Page): Promise<boolean> {
  // Wait for either login page or home page content to appear
  try {
    await Promise.race([
      page.waitForSelector('text=Welcome back', { timeout: 3000 }),
      page.waitForSelector('text=Aura', { timeout: 3000 }),
      page.waitForSelector('text=Analyze Profile', { timeout: 3000 }),
      page.waitForSelector('text=My Profile', { timeout: 3000 }),
      page.waitForSelector('text=Loading Profile', { timeout: 3000 }),
    ]);
  } catch {
    // Timeout is fine, we'll check what's visible
  }

  // Now check if we're on the login page
  return await page.getByText('Welcome back').isVisible().catch(() => false);
}

/**
 * Helper to create a test profile in IndexedDB
 * Useful for tests that need profile data to exist
 */
export async function seedTestProfile(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('AuraDB');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['profiles'], 'readwrite');
        const store = tx.objectStore('profiles');

        const testProfile = {
          id: 999,
          name: 'Test Profile',
          age: 28,
          timestamp: Date.now(),
          appName: 'Tinder',
          thumbnail: null,
          analysis: {
            basics: {
              name: 'Test Profile',
              age: 28,
              location: 'Test City',
              occupation: 'Tester',
            },
            photos: [],
            prompts: [],
            psychological_profile: {
              agendas: [],
              signals: [],
              archetype_summary: 'Test archetype',
            },
            overall: {
              summary: 'This is a test profile for E2E testing.',
              red_flags: [],
              green_flags: [],
            },
            openers: ['Hey there!', 'What\'s your favorite test framework?'],
          },
        };

        store.put(testProfile);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
}

/**
 * Helper to clear all test data from IndexedDB
 */
export async function clearTestData(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase('AuraDB');
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve(); // Resolve anyway
      deleteRequest.onblocked = () => resolve();
    });
  });
}
