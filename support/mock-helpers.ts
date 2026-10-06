import type { Page } from '@playwright/test';

/**
 * Simulates GET `/api/v1/connections` failing (dependency edge — not the child
 * create/delete endpoints under test).
 */
export async function mockConnectionsUnavailable(page: Page): Promise<void> {
  await page.route('**/api/v1/connections', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'text/plain',
      body: 'Service Unavailable',
    }),
  );
}

/**
 * Simulates GET `/api/v1/me` failing (dependency edge — not child mutations).
 */
export async function mockMeUnavailable(page: Page): Promise<void> {
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'text/plain',
      body: 'Service Unavailable',
    }),
  );
}
