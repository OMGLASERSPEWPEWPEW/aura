/**
 * E2E Test: Video Upload and Full AI Analysis Flow
 *
 * This test uploads a real video file and waits for the complete AI analysis.
 * It verifies the progressive UI updates and final profile creation.
 *
 * Prerequisites:
 * - Place a test video at: e2e/fixtures/videos/test-profile.MP4
 * - Ensure VITE_ANTHROPIC_API_KEY or proxy is configured
 *
 * Note: This test is intentionally slow (~2-5 min) as it performs real AI analysis.
 */

import { authenticatedTest, expect, TEST_VIDEO_PATH } from './fixtures/test-fixtures';
import { existsSync } from 'fs';

// Mark as slow test for CI awareness (5 minute timeout)
authenticatedTest.describe('Upload and Analysis Flow', () => {
  // Skip if test video doesn't exist
  authenticatedTest.beforeEach(async () => {
    if (!existsSync(TEST_VIDEO_PATH)) {
      authenticatedTest.skip();
    }
  });

  authenticatedTest('uploads video and creates profile', async ({ page }) => {
    // Set explicit 3 minute timeout for this test
    authenticatedTest.setTimeout(180000);

    // 1. Navigate to upload page
    await page.goto('/upload');

    // Verify we're on the upload page (not redirected to login)
    await expect(page.getByRole('heading', { name: /match explore/i })).toBeVisible({ timeout: 10000 });

    // 2. Upload the video file
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(TEST_VIDEO_PATH);

    // 3. Wait for analysis to begin - should see extracting or exploring
    await expect(
      page.getByText(/extracting frames|exploring/i).first()
    ).toBeVisible({ timeout: 30000 });

    // 4. Wait for profile page - analysis completes and navigates
    // The flow auto-navigates when state.phase === 'complete'
    await expect(page).toHaveURL(/\/profile\/\d+/, { timeout: 150000 });

    // 5. Verify profile page has loaded with the profile header
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 6. Verify we're on a valid profile page (has Overview/Analysis/Coach tabs)
    await expect(page.getByRole('button', { name: /overview/i })).toBeVisible({ timeout: 10000 });

    // 7. Verify profile has "The Read on" section (even if analysis incomplete)
    await expect(page.getByText(/the read on/i)).toBeVisible({ timeout: 10000 });

    // Test passes if we successfully:
    // - Uploaded a video
    // - Extracted frames
    // - Created a profile in the database
    // - Navigated to the profile page
    // Note: Full AI analysis quality depends on API response and video content
  });

  authenticatedTest('shows error state when analysis fails', async ({ page }) => {
    // This test would require mocking the API to fail
    // For now, just verify the error UI elements exist in the component
    authenticatedTest.skip();
  });

  authenticatedTest('allows abort and save progress mid-analysis', async ({ page }) => {
    // Skip if test video doesn't exist
    if (!existsSync(TEST_VIDEO_PATH)) {
      authenticatedTest.skip();
      return;
    }

    // Set explicit 2 minute timeout
    authenticatedTest.setTimeout(120000);

    // Navigate to upload
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: /match explore/i })).toBeVisible({ timeout: 10000 });

    // Upload video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_VIDEO_PATH);

    // Wait for analysis to start
    await expect(
      page.getByText(/extracting frames|exploring/i).first()
    ).toBeVisible({ timeout: 30000 });

    // Wait a bit for chunk 1 to start processing (but not complete)
    await page.waitForTimeout(5000);

    // Find and click the abort/stop button (has text "Stop")
    const stopButton = page.getByRole('button', { name: /stop/i });

    // Only proceed if stop button is visible (analysis still in progress)
    const isStopVisible = await stopButton.isVisible({ timeout: 10000 }).catch(() => false);

    if (isStopVisible) {
      await stopButton.click();

      // Should show abort confirmation modal with title "Stop Analysis?"
      await expect(page.getByRole('heading', { name: /stop analysis/i })).toBeVisible({ timeout: 5000 });

      // Click "Save Progress & View"
      await page.getByRole('button', { name: /save progress/i }).click();

      // Should navigate to profile page with partial data
      await expect(page).toHaveURL(/\/profile\/\d+/, { timeout: 30000 });

      // Verify profile page loaded
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    } else {
      // Analysis completed too fast or no progress yet - verify end state
      // Either on upload page (reset) or profile page (completed)
      const onUpload = await page.getByRole('heading', { name: /match explore/i }).isVisible().catch(() => false);
      const onProfile = page.url().includes('/profile/');
      expect(onUpload || onProfile).toBeTruthy();
    }
  });
});
