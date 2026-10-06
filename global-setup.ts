import type { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { cleanupTrackedRecords } from './support/cleanup-records';
import { TRACKER_PATH } from './support/record-tracker';
import fs from 'fs';
import path from 'path';

dotenv.config();

export default async function globalSetup(_config: FullConfig): Promise<void> {
  fs.mkdirSync(path.dirname(path.resolve(TRACKER_PATH)), { recursive: true });

  const appUrl = process.env.APP_URL ?? '';
  if (!appUrl) {
    console.warn('[global-setup] APP_URL is not set; skipping tracked-record cleanup');
    return;
  }

  const { deleted, remaining } = await cleanupTrackedRecords(appUrl);
  if (deleted.length > 0) {
    console.log(
      `[global-setup] Removed ${deleted.length} leftover tracked record(s) from a prior run`,
    );
  }
  if (remaining.length > 0) {
    console.warn(
      `[global-setup] ${remaining.length} tracked record(s) still pending delete`,
    );
  }
}
