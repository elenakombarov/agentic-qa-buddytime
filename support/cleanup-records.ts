import type { APIRequestContext } from '@playwright/test';
import { request as playwrightRequest } from 'playwright';
import { AUTH_FILE, ALT_AUTH_FILE } from './auth.constants';
import { tryDeleteChild } from './api/children.api';
import { RECORD_TYPE, type RecordOwner } from './family-owner';
import {
  loadTrackedRecords,
  recordKey,
  removeTrackedRecordKeys,
  type TrackedRecord,
} from './record-tracker';
import {
  MissingBtTokenError,
  readBtTokenFromStorageState,
} from './storage-state-auth';

export type CleanupRecordsResult = {
  deleted: TrackedRecord[];
  /** Failed deletes stay tracked for a later global setup / reporter retry. */
  remaining: TrackedRecord[];
};

function storagePathForOwner(owner: RecordOwner): string {
  return owner === 'main' ? AUTH_FILE : ALT_AUTH_FILE;
}

function ownerLabel(owner: RecordOwner): string {
  return owner === 'main' ? 'main family' : 'second family';
}

function warnFailedDelete(
  record: TrackedRecord,
  status: number | 'unknown',
): void {
  console.warn(
    `[cleanup-records] Failed delete ${record.type} ${record.id} HTTP ${status}`,
  );
}

async function createOwnerRequestContext(
  appUrl: string,
  owner: RecordOwner,
): Promise<APIRequestContext> {
  const storageStatePath = storagePathForOwner(owner);
  const token = readBtTokenFromStorageState(storageStatePath, appUrl);
  if (!token) {
    throw new MissingBtTokenError(
      ownerLabel(owner),
      storageStatePath,
      new URL(appUrl).origin,
    );
  }
  return playwrightRequest.newContext({
    baseURL: appUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

async function deleteTrackedRecord(
  api: APIRequestContext,
  record: TrackedRecord,
): Promise<{ ok: true } | { ok: false; status: number }> {
  if (record.type === RECORD_TYPE.Child) {
    return tryDeleteChild(api, record.id);
  }
  console.warn(
    `[cleanup-records] Unknown record type "${record.type}" — kept ${record.type} ${record.id}`,
  );
  return { ok: false, status: 0 };
}

/**
 * Deletes tracked records via observed APIs. Logs `Deleted <type> <id>` per success.
 * Failed deletes remain in the tracker file.
 */
export async function cleanupTrackedRecords(
  appUrl: string,
): Promise<CleanupRecordsResult> {
  const toAttempt = loadTrackedRecords();
  if (toAttempt.length === 0) {
    return { deleted: [], remaining: [] };
  }

  const deleted: TrackedRecord[] = [];
  const deletedKeys = new Set<string>();
  const contexts = new Map<RecordOwner, APIRequestContext>();
  const authWarnedForOwner = new Set<RecordOwner>();

  try {
    for (const record of toAttempt) {
      let api = contexts.get(record.owner);
      if (!api) {
        try {
          api = await createOwnerRequestContext(appUrl, record.owner);
          contexts.set(record.owner, api);
        } catch (error) {
          if (
            error instanceof MissingBtTokenError &&
            !authWarnedForOwner.has(record.owner)
          ) {
            authWarnedForOwner.add(record.owner);
            console.warn(
              `[cleanup-records] Missing authentication for ${ownerLabel(record.owner)} — kept tracked records for this owner (re-run setup project)`,
            );
          }
          continue;
        }
      }

      const outcome = await deleteTrackedRecord(api, record);
      if (outcome.ok) {
        deleted.push(record);
        deletedKeys.add(recordKey(record));
        console.log(`Deleted ${record.type} ${record.id}`);
      } else {
        warnFailedDelete(record, outcome.status);
      }
    }
  } finally {
    for (const api of contexts.values()) {
      await api.dispose();
    }
  }

  const remaining =
    deletedKeys.size > 0
      ? removeTrackedRecordKeys(deletedKeys)
      : loadTrackedRecords();

  return { deleted, remaining };
}

/** @deprecated Use cleanupTrackedRecords */
export async function cleanupTrackedChildren(appUrl: string): Promise<{
  deletedIds: string[];
  remaining: TrackedRecord[];
}> {
  const result = await cleanupTrackedRecords(appUrl);
  return {
    deletedIds: result.deleted.map((r) => r.id),
    remaining: result.remaining,
  };
}
