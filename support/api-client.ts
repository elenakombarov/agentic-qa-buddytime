import { request, type APIRequestContext } from '@playwright/test';
import { ALT_AUTH_FILE, AUTH_FILE } from './auth.constants';
import type { RecordOwner } from './family-owner';
import {
  appOriginFromUrl,
  MissingBtTokenError,
  readBtTokenFromStorageState,
} from './storage-state-auth';

/**
 * API context for one saved family session (`bt_token` from storageState).
 * @param owner `main` uses the setup project's auth file; `alt` uses the second family.
 */
export async function createApiContextForOwner(
  owner: RecordOwner,
): Promise<APIRequestContext> {
  const appUrl = process.env.APP_URL ?? '';
  if (!appUrl.trim()) {
    throw new Error('APP_URL must be set to create a family API request context.');
  }

  const storageStatePath = owner === 'main' ? AUTH_FILE : ALT_AUTH_FILE;
  const familyLabel = owner === 'main' ? 'main family' : 'second family';
  const origin = appOriginFromUrl(appUrl);
  const token = readBtTokenFromStorageState(storageStatePath, appUrl);
  if (!token) {
    throw new MissingBtTokenError(familyLabel, storageStatePath, origin);
  }

  return request.newContext({
    baseURL: appUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
