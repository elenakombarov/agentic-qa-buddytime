import fs from 'fs';
import path from 'path';
import type { RecordOwner } from './family-owner';

export const TRACKER_PATH = '.test-artifacts/created-records.jsonl';

const LOCK_PATH = `${TRACKER_PATH}.lock`;
const LOCK_STALE_MS = 30_000;
const LOCK_RETRY_MS = 25;
const LOCK_MAX_ATTEMPTS = 400;

const REAL_RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TrackedRecord = {
  type: string;
  id: string;
  owner: RecordOwner;
};

export function isRealRecordId(id: string): boolean {
  return REAL_RECORD_ID.test(id);
}

export function recordKey(record: Pick<TrackedRecord, 'type' | 'id'>): string {
  return `${record.type}:${record.id}`;
}

function ensureArtifactsDir(): void {
  fs.mkdirSync(path.dirname(path.resolve(TRACKER_PATH)), { recursive: true });
}

function sleepMs(ms: number): void {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    /* spin until lock retry */
  }
}

/** Exclusive lock so parallel workers do not corrupt the shared JSONL tracker. */
export function acquireTrackerLock(): void {
  ensureArtifactsDir();
  const lockResolved = path.resolve(LOCK_PATH);

  for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      const fd = fs.openSync(lockResolved, 'wx');
      fs.writeFileSync(fd, String(process.pid));
      fs.closeSync(fd);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') {
        throw error;
      }
      try {
        const stat = fs.statSync(lockResolved);
        if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
          fs.unlinkSync(lockResolved);
          continue;
        }
      } catch {
        /* lock released between stat and unlink */
      }
      sleepMs(LOCK_RETRY_MS);
    }
  }

  throw new Error('Timed out acquiring created-records tracker lock');
}

export function releaseTrackerLock(): void {
  try {
    fs.unlinkSync(path.resolve(LOCK_PATH));
  } catch {
    /* ignore */
  }
}

export function withTrackerLock<T>(fn: () => T): T {
  acquireTrackerLock();
  try {
    return fn();
  } finally {
    releaseTrackerLock();
  }
}

/** Loads tracked records; last line wins for duplicate type+id pairs. */
export function loadTrackedRecords(): TrackedRecord[] {
  const resolved = path.resolve(TRACKER_PATH);
  if (!fs.existsSync(resolved)) {
    return [];
  }

  const lines = fs.readFileSync(resolved, 'utf8').split(/\r?\n/).filter(Boolean);
  const byKey = new Map<string, TrackedRecord>();
  for (const line of lines) {
    const record = JSON.parse(line) as TrackedRecord;
    byKey.set(recordKey(record), record);
  }
  return [...byKey.values()];
}

function writeTrackedRecordsLocked(records: readonly TrackedRecord[]): void {
  const deduped = [...new Map(records.map((r) => [recordKey(r), r])).values()];
  const body = deduped.map((record) => JSON.stringify(record)).join('\n');
  fs.writeFileSync(path.resolve(TRACKER_PATH), body ? `${body}\n` : '', 'utf8');
}

/** Appends a record if type+id is not already tracked. */
export function addTrackedRecord(record: TrackedRecord): void {
  withTrackerLock(() => {
    const existing = loadTrackedRecords();
    if (existing.some((entry) => recordKey(entry) === recordKey(record))) {
      return;
    }
    ensureArtifactsDir();
    fs.appendFileSync(
      path.resolve(TRACKER_PATH),
      `${JSON.stringify(record)}\n`,
      'utf8',
    );
  });
}

/** Replaces the tracker file (used after cleanup removes deleted ids). */
export function replaceTrackedRecords(records: readonly TrackedRecord[]): void {
  withTrackerLock(() => {
    writeTrackedRecordsLocked(records);
  });
}

/**
 * After API deletes, reloads the live tracker and drops only successful type+id keys.
 * Records added during cleanup and failed deletes are preserved. Caller must not hold the lock.
 */
export function removeTrackedRecordKeys(
  deletedKeys: ReadonlySet<string>,
): TrackedRecord[] {
  acquireTrackerLock();
  try {
    const current = loadTrackedRecords();
    const remaining = current.filter(
      (record) => !deletedKeys.has(recordKey(record)),
    );
    writeTrackedRecordsLocked(remaining);
    return remaining;
  } finally {
    releaseTrackerLock();
  }
}
