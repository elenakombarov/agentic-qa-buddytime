import type { APIRequestContext } from '@playwright/test';
import { request as playwrightRequest } from 'playwright';
import { AUTH_FILE, ALT_AUTH_FILE } from './auth.constants';
import { tryDeleteChild } from './api/children.api';
import { RECORD_TYPE, type RecordOwner } from './family-owner';
import {
  loadTrackedRecords,
  ownerRecordKey,
  recordKey,
  removeTrackedRecordKeys,
  type TrackedRecord,
} from './record-tracker';
import {
  MissingBtTokenError,
  readBtTokenFromStorageState,
} from './storage-state-auth';

export type CleanupRecordsResult = {
  /** HTTP 204 — record deleted in the app. */
  deleted: TrackedRecord[];
  /** Failed deletes stay tracked for a later global setup / reporter retry. */
  remaining: TrackedRecord[];
  /** HTTP 404 — already gone in the app; removed from the tracker. */
  alreadyRemoved: TrackedRecord[];
  /** Attempted rows that could not be removed (auth, unsupported type, non-404 errors). */
  failed: TrackedRecord[];
  /** Rows selected for this run after intersecting with the tracker file. */
  attempted: TrackedRecord[];
};

export type CleanupErrorCategory =
  | 'auth_missing'
  | 'auth_invalid'
  | 'request_failed'
  | 'unsupported_type'
  | 'unknown';

export type CleanupTrackedRecordsOptions = {
  /** Hints for subset selection; only rows present in the tracker (type+id+owner) are used. */
  records?: readonly TrackedRecord[];
  /** List targets only; does not call delete APIs or change the tracker. */
  dryRun?: boolean;
  /** Isolated verification only — inject API context factory (never use against live app data). */
  attemptDeps?: CleanupAttemptDeps;
};

export type CleanupAttemptDeps = {
  getApiForOwner: (
    owner: RecordOwner,
  ) => Promise<APIRequestContext | null | undefined>;
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

/** Maps thrown values to a safe log label (no messages, headers, tokens, or storageState). */
export function categorizeCleanupError(error: unknown): CleanupErrorCategory {
  if (error instanceof MissingBtTokenError) {
    return 'auth_missing';
  }
  if (error instanceof Error && error.name === 'MissingBtTokenError') {
    return 'auth_missing';
  }
  if (error instanceof TypeError) {
    return 'request_failed';
  }
  return 'unknown';
}

function logCleanupFailure(
  record: TrackedRecord,
  category: CleanupErrorCategory,
): void {
  console.warn(
    `[cleanup-records] Failed delete ${record.type} ${record.id} (${category})`,
  );
}

function logOwnerAuthFailure(
  owner: RecordOwner,
  category: CleanupErrorCategory,
): void {
  console.warn(
    `[cleanup-records] Authentication error for ${ownerLabel(owner)} (${category})`,
  );
}

async function disposeApiContexts(
  contexts: Iterable<APIRequestContext>,
): Promise<void> {
  for (const api of contexts) {
    try {
      await api.dispose?.();
    } catch {
      console.warn('[cleanup-records] Context disposal failed (request_failed)');
    }
  }
}

/**
 * Keeps only rows that exist in `tracked`, matching type, id, and owner.
 * Returns canonical tracker entries (never caller-supplied owner overrides).
 */
export function intersectWithTrackedRecords(
  tracked: readonly TrackedRecord[],
  requested?: readonly TrackedRecord[],
): TrackedRecord[] {
  if (requested === undefined) {
    return [...tracked];
  }

  const byIdentity = new Map(
    tracked.map((record) => [ownerRecordKey(record), record] as const),
  );
  const selected: TrackedRecord[] = [];
  for (const candidate of requested) {
    const canonical = byIdentity.get(ownerRecordKey(candidate));
    if (canonical) {
      selected.push(canonical);
    }
  }
  return selected;
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
): Promise<
  | { ok: true; status: 204 | 404 }
  | { ok: false; status: number }
> {
  if (record.type === RECORD_TYPE.Child) {
    return tryDeleteChild(api, record.id);
  }
  console.warn(
    `[cleanup-records] Unknown record type "${record.type}" — kept ${record.type} ${record.id}`,
  );
  return { ok: false, status: 0 };
}

/** @internal Exported for isolated verification with injected API contexts. */
export async function runCleanupAttempts(
  toAttempt: readonly TrackedRecord[],
  deps: CleanupAttemptDeps,
): Promise<
  Pick<
    CleanupRecordsResult,
    'deleted' | 'alreadyRemoved' | 'failed' | 'attempted'
  >
> {
  const deleted: TrackedRecord[] = [];
  const alreadyRemoved: TrackedRecord[] = [];
  const failed: TrackedRecord[] = [];
  const contexts = new Map<RecordOwner, APIRequestContext>();
  const authWarnedForOwner = new Set<RecordOwner>();
  const ownerContextFailed = new Set<RecordOwner>();

  for (const record of toAttempt) {
    let api = contexts.get(record.owner);
    if (!api) {
      if (ownerContextFailed.has(record.owner)) {
        failed.push(record);
        continue;
      }
      try {
        const resolved = await deps.getApiForOwner(record.owner);
        if (!resolved) {
          ownerContextFailed.add(record.owner);
          if (!authWarnedForOwner.has(record.owner)) {
            authWarnedForOwner.add(record.owner);
            console.warn(
              `[cleanup-records] Missing authentication for ${ownerLabel(record.owner)} — kept tracked records for this owner (re-run setup project)`,
            );
          }
          failed.push(record);
          continue;
        }
        api = resolved;
        contexts.set(record.owner, api);
      } catch (error) {
        ownerContextFailed.add(record.owner);
        const category = categorizeCleanupError(error);
        if (!authWarnedForOwner.has(record.owner)) {
          authWarnedForOwner.add(record.owner);
          logOwnerAuthFailure(record.owner, category);
        }
        failed.push(record);
        continue;
      }
    }

    try {
      const outcome = await deleteTrackedRecord(api, record);
      if (outcome.ok) {
        if (outcome.status === 404) {
          alreadyRemoved.push(record);
          console.log(`Already removed ${record.type} ${record.id} (HTTP 404)`);
        } else {
          deleted.push(record);
          console.log(`Deleted ${record.type} ${record.id}`);
        }
      } else if (outcome.status === 401) {
        console.warn(
          `[cleanup-records] HTTP 401 for ${record.type} ${record.id} — storage state may be expired; re-run the setup project`,
        );
        warnFailedDelete(record, outcome.status);
        failed.push(record);
      } else if (outcome.status === 0) {
        logCleanupFailure(record, 'unsupported_type');
        failed.push(record);
      } else {
        warnFailedDelete(record, outcome.status);
        failed.push(record);
      }
    } catch (error) {
      logCleanupFailure(record, categorizeCleanupError(error));
      failed.push(record);
    }
  }

  await disposeApiContexts(contexts.values());

  return {
    deleted,
    alreadyRemoved,
    failed,
    attempted: [...toAttempt],
  };
}

/**
 * Deletes tracked records via observed APIs. Only **child** rows are supported
 * (`support/api/children.api.ts`); there is no `support/api-client.ts` in this repo.
 * Failed deletes remain in the tracker file.
 */
export async function cleanupTrackedRecords(
  appUrl: string,
  options?: CleanupTrackedRecordsOptions,
): Promise<CleanupRecordsResult> {
  const tracked = loadTrackedRecords();
  const toAttempt = intersectWithTrackedRecords(tracked, options?.records);

  if (toAttempt.length === 0) {
    return {
      deleted: [],
      remaining: tracked,
      alreadyRemoved: [],
      failed: [],
      attempted: [],
    };
  }

  if (options?.dryRun) {
    for (const record of toAttempt) {
      console.log(
        `[dry-run] ${record.type} ${record.id} (owner: ${record.owner})`,
      );
    }
    return {
      deleted: [],
      remaining: tracked,
      alreadyRemoved: [],
      failed: [],
      attempted: toAttempt,
    };
  }

  const attemptResult = await runCleanupAttempts(
    toAttempt,
    options?.attemptDeps ?? {
      async getApiForOwner(owner) {
        try {
          return await createOwnerRequestContext(appUrl, owner);
        } catch (error) {
          if (error instanceof MissingBtTokenError) {
            return null;
          }
          throw error;
        }
      },
    },
  );

  const removedKeys = new Set<string>([
    ...attemptResult.deleted.map((record) => recordKey(record)),
    ...attemptResult.alreadyRemoved.map((record) => recordKey(record)),
  ]);

  const remaining =
    removedKeys.size > 0
      ? removeTrackedRecordKeys(removedKeys)
      : loadTrackedRecords();

  return {
    deleted: attemptResult.deleted,
    alreadyRemoved: attemptResult.alreadyRemoved,
    failed: attemptResult.failed,
    remaining,
    attempted: attemptResult.attempted,
  };
}

/** @deprecated Use cleanupTrackedRecords */
export async function cleanupTrackedChildren(appUrl: string): Promise<{
  deletedIds: string[];
  remaining: TrackedRecord[];
}> {
  const result = await cleanupTrackedRecords(appUrl);
  return {
    deletedIds: [...result.deleted, ...result.alreadyRemoved].map((r) => r.id),
    remaining: result.remaining,
  };
}
