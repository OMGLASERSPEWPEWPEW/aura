import { Page } from '@playwright/test';

/**
 * Prepares a page for deterministic screenshots by disabling animations
 * and waiting for network to settle.
 */
export async function prepareForScreenshot(page: Page): Promise<void> {
  // Disable all CSS animations and transitions for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });

  // Wait for network to settle
  await page.waitForLoadState('networkidle');
}
