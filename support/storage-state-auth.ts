import fs from 'fs';
import path from 'path';

/** Playwright `storageState` JSON shape (cookies + per-origin localStorage). */
export type PlaywrightStorageState = {
  cookies: readonly unknown[];
  origins: readonly {
    origin: string;
    localStorage: readonly { name: string; value: string }[];
  }[];
};

export const BT_TOKEN_STORAGE_KEY = 'bt_token';

/** Normalizes `APP_URL` to an origin for matching `storageState.origins[].origin`. */
export function appOriginFromUrl(appUrl: string): string {
  return new URL(appUrl).origin;
}

/**
 * Reads `bt_token` from a family's storageState file for the app origin.
 * Returns null if the file, origin bucket, or token entry is missing.
 */
export function readBtTokenFromStorageState(
  storageStatePath: string,
  appUrl: string,
): string | null {
  const resolved = path.resolve(storageStatePath);
  if (!fs.existsSync(resolved)) {
    return null;
  }

  const raw = fs.readFileSync(resolved, 'utf8');
  const state = JSON.parse(raw) as PlaywrightStorageState;
  const origin = appOriginFromUrl(appUrl);
  const bucket = state.origins.find((entry) => entry.origin === origin);
  if (!bucket) {
    return null;
  }

  const tokenEntry = bucket.localStorage.find(
    (item) => item.name === BT_TOKEN_STORAGE_KEY,
  );
  return tokenEntry?.value ?? null;
}

/** Thrown when a family's storageState has no usable `bt_token` for `APP_URL`. */
export class MissingBtTokenError extends Error {
  constructor(
    readonly familyLabel: string,
    readonly storageStatePath: string,
    readonly origin: string,
  ) {
    super(
      `Missing ${BT_TOKEN_STORAGE_KEY} for ${familyLabel}: storageState at ${storageStatePath} has no token for origin ${origin}. Re-run the setup project after signing in.`,
    );
    this.name = 'MissingBtTokenError';
  }
}
