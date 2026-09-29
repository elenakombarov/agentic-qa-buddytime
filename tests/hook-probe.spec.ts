import { expect, test } from '@playwright/test';

test('hook probe - page title @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
