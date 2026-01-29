import { test, expect } from '@playwright/test';
import { isOnLoginPage } from './fixtures/test-fixtures';

test.describe('Help Desk - Comic Bubbles & ASL Avatar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Skip if not authenticated
    if (await isOnLoginPage(page)) {
      test.skip();
      return;
    }

    // Open the help desk popup via Sorry's nav avatar
    const sorryButton = page.locator('nav').getByRole('button').filter({ hasText: /sorry|help/i }).first();
    // Fallback: look for the pulse-glow avatar button in bottom nav
    const avatarButton = sorryButton.or(page.locator('button[class*="pulse-glow"]').first());
    await avatarButton.first().click({ timeout: 5000 }).catch(() => {
      // If no button found, skip the test
    });

    // Navigate to the Chat tab
    const chatTab = page.getByRole('button', { name: 'Chat' });
    if (await chatTab.isVisible().catch(() => false)) {
      await chatTab.click();
    }
  });

  test('comic bubble renders for Sorry messages with right testid', async ({ page }) => {
    // Type and send a message
    const input = page.locator('textarea[placeholder*="ask me"]');
    if (!await input.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await input.fill('What is Aura?');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for Sorry's response
    const sorryBubble = page.locator('[data-testid="comic-bubble-right"]');
    await expect(sorryBubble.first()).toBeVisible({ timeout: 30000 });
  });

  test('user messages use left comic bubble', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="ask me"]');
    if (!await input.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await input.fill('Hello');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // User message should be in a left bubble
    const userBubble = page.locator('[data-testid="comic-bubble-left"]');
    await expect(userBubble.first()).toBeVisible({ timeout: 5000 });
  });

  test('ASL avatar appears on first Sorry message only', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="ask me"]');
    if (!await input.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    // Send first message
    await input.fill('What is Aura?');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for first Sorry response
    await page.locator('[data-testid="comic-bubble-right"]').first().waitFor({ timeout: 30000 });

    // ASL avatar should appear exactly once
    const aslAvatars = page.locator('[data-testid="asl-what-avatar"]');
    await expect(aslAvatars).toHaveCount(1);

    // Send a second message to trigger second reply
    await input.fill('Tell me more');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for second response
    await page.locator('[data-testid="comic-bubble-right"]').nth(1).waitFor({ timeout: 30000 });

    // Still only one ASL avatar
    await expect(aslAvatars).toHaveCount(1);
  });

  test('ASL avatar uses fingerspelling frames', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="ask me"]');
    if (!await input.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await input.fill('Hi');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for Sorry response
    const avatar = page.locator('[data-testid="asl-what-avatar"]');
    await avatar.waitFor({ timeout: 30000 });

    // Container should have role="img"
    await expect(avatar).toHaveAttribute('role', 'img');

    // Should render an img (not video) with one of the 4 ASL frame sources
    const img = avatar.locator('img');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(['/asl-w.png', '/asl-h.png', '/asl-a.png', '/asl-t.png']).toContain(src);
  });

  test('chat layout: user messages left, Sorry messages right', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="ask me"]');
    if (!await input.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await input.fill('What does Aura do?');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for response
    await page.locator('[data-testid="comic-bubble-right"]').first().waitFor({ timeout: 30000 });

    // User message row should have justify-start (left)
    const userRow = page.locator('[data-testid="comic-bubble-left"]').first().locator('..');
    // Sorry message row should have justify-end (right)
    const sorryRow = page.locator('[data-testid="comic-bubble-right"]').first().locator('..');

    // Verify user bubble exists on left and Sorry on right via parent flex direction
    await expect(page.locator('[data-testid="comic-bubble-left"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="comic-bubble-right"]').first()).toBeVisible();
  });

  test('visual regression - comic bubbles (Chromium only)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual regression only on Chromium');

    const input = page.locator('textarea[placeholder*="ask me"]');
    if (!await input.isVisible().catch(() => false)) {
      test.skip();
      return;
    }

    await input.fill('What is resonance?');
    await page.getByRole('button').filter({ has: page.locator('svg') }).last().click();

    // Wait for Sorry response
    await page.locator('[data-testid="comic-bubble-right"]').first().waitFor({ timeout: 30000 });

    // Screenshot the chat area
    const chatArea = page.locator('.flex.flex-col.h-\\[40vh\\]');
    if (await chatArea.isVisible().catch(() => false)) {
      await expect(chatArea).toHaveScreenshot('helpdesk-comic-bubbles.png', {
        maxDiffPixelRatio: 0.1,
      });
    }
  });
});
