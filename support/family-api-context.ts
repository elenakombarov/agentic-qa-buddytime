import type { APIRequestContext, Playwright } from '@playwright/test';
import {
  MissingBtTokenError,
  appOriginFromUrl,
  readBtTokenFromStorageState,
} from './storage-state-auth';

export type FamilyApiContextOptions = {
  storageStatePath: string;
  familyLabel: string;
  appUrl: string;
};

/**
 * Builds an API request context with `Authorization: Bearer …` from storageState
 * (`bt_token` in localStorage for the app origin). Does not rely on cookies or
 * Playwright automatically forwarding auth headers.
 */
export async function createFamilyApiContext(
  playwright: Playwright,
  options: FamilyApiContextOptions,
): Promise<APIRequestContext> {
  const { appUrl, familyLabel, storageStatePath } = options;
  if (!appUrl?.trim()) {
    throw new Error('APP_URL must be set to create a family API request context.');
  }

  const origin = appOriginFromUrl(appUrl);
  const token = readBtTokenFromStorageState(storageStatePath, appUrl);
  if (!token) {
    throw new MissingBtTokenError(familyLabel, storageStatePath, origin);
  }

  return playwright.request.newContext({
    baseURL: appUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
