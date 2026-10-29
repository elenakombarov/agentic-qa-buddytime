import type { APIRequestContext } from '@playwright/test';
import { test as cleanupTest, expect } from '../fixtures/cleanup.fixture';
import { createApiContextForOwner } from '../support/api-client';

type ApiFixtures = {
  /** No Authorization header. baseURL comes from APP_URL. */
  unauthenticatedApi: APIRequestContext;
  /** Main family. Authorization from that family's saved session. */
  apiMain: APIRequestContext;
  /** Second family. Built the same way as apiMain, for the alt owner. */
  apiAlt: APIRequestContext;
  /** No Authorization header. Same context as unauthenticatedApi. */
  apiAnonymous: APIRequestContext;
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

  apiMain: async ({}, use) => {
    const context = await createApiContextForOwner('main');
    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },

  apiAlt: async ({}, use) => {
    const context = await createApiContextForOwner('alt');
    try {
      await use(context);
    } finally {
      await context.dispose();
    }
  },

  apiAnonymous: async ({ unauthenticatedApi }, use) => {
    await use(unauthenticatedApi);
  },
});

export { expect };
