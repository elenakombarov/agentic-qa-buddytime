import type { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { cleanupTrackedRecords } from './support/cleanup-records';

dotenv.config();

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  const appUrl = process.env.APP_URL ?? '';
  if (!appUrl) {
    console.warn('[global-teardown] APP_URL is not set; skipping tracked-record cleanup');
    return;
  }

  const { deleted, remaining } = await cleanupTrackedRecords(appUrl);
  if (deleted.length > 0) {
    console.log(
      `[global-teardown] Deleted ${deleted.length} tracked record(s) via API`,
    );
  }
  if (remaining.length > 0) {
    console.warn(
      `[global-teardown] ${remaining.length} tracked record(s) remain for a later retry`,
    );
  }
}
