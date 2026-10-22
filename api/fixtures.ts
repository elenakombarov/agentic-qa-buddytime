import type { APIRequestContext } from '@playwright/test';
import { test as cleanupTest, expect } from '../fixtures/cleanup.fixture';

type ApiFixtures = {
  /** No Authorization header. baseURL comes from APP_URL. */
  unauthenticatedApi: APIRequestContext;
};

/**
 * API specs use the cleanup fixture, so mainFamilyApi, altFamilyApi,
 * and trackRecord stay on the existing family auth path.
 */
export const test = cleanupTest.extend<ApiFixtures>({
  unauthenticatedApi: async ({ playwright }, use) => {
    const appUrl = process.env.APP_URL;
    if (!appUrl?.trim()) {
      throw new Error(
        'APP_URL must be set to create an unauthenticated API request context.',
      );
    }
    const context = await playwright.request.newContext({ baseURL: appUrl });
    await use(context);
    await context.dispose();
  },
});

export { expect };
