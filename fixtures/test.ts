import fs from 'fs';
import {
  test as base,
  expect,
  type APIRequestContext,
} from '@playwright/test';
import { AUTH_FILE, ALT_AUTH_FILE } from '../support/auth.constants';
import { createFamilyApiContext } from '../support/family-api-context';
import { MissingBtTokenError } from '../support/storage-state-auth';

type FamilyApiFixtures = {
  /** Main practicum family — always authenticated via storageState `bt_token`. */
  mainFamilyApi: APIRequestContext;
  /**
   * Second family when `alt-user.json` exists and contains `bt_token` for APP_URL;
   * null when the alt storage file or token is missing (tests can skip).
   */
  altFamilyApi: APIRequestContext | null;
};

export const test = base.extend<FamilyApiFixtures>({
  mainFamilyApi: async ({ playwright }, use) => {
    const context = await createFamilyApiContext(playwright, {
      storageStatePath: AUTH_FILE,
      familyLabel: 'main family',
      appUrl: process.env.APP_URL ?? '',
    });
    await use(context);
    await context.dispose();
  },

  altFamilyApi: async ({ playwright }, use) => {
    if (!fs.existsSync(ALT_AUTH_FILE)) {
      await use(null);
      return;
    }

    try {
      const context = await createFamilyApiContext(playwright, {
        storageStatePath: ALT_AUTH_FILE,
        familyLabel: 'second family',
        appUrl: process.env.APP_URL ?? '',
      });
      await use(context);
      await context.dispose();
    } catch (error) {
      if (error instanceof MissingBtTokenError) {
        await use(null);
        return;
      }
      throw error;
    }
  },
});

export { expect };
