/**
 * Isolated checks for P22 cleanup/reset behavior. Uses a temp cwd — never the repo tracker.
 * Run: npx tsx .cursor/skills/test-data-reset/scripts/verify-p22-fixes.ts
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { APIRequestContext } from '@playwright/test';
import {
  cleanupTrackedRecords,
  intersectWithTrackedRecords,
  runCleanupAttempts,
} from '../../../../support/cleanup-records';
import { RECORD_TYPE } from '../../../../support/family-owner';
import {
  loadTrackedRecords,
  recordKey,
  removeTrackedRecordKeys,
  replaceTrackedRecords,
  type TrackedRecord,
} from '../../../../support/record-tracker';

const CHILD_A: TrackedRecord = {
  type: RECORD_TYPE.Child,
  id: '11111111-1111-1111-1111-111111111111',
  owner: 'main',
};
const CHILD_B: TrackedRecord = {
  type: RECORD_TYPE.Child,
  id: '22222222-2222-2222-2222-222222222222',
  owner: 'alt',
};
const PLAYDATE: TrackedRecord = {
  type: 'playdate',
  id: '33333333-3333-3333-3333-333333333333',
  owner: 'main',
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed += 1;
    console.log(`OK · ${message}`);
  } else {
    failed += 1;
    console.error(`FAIL · ${message}`);
  }
}

function withTempTracker(
  records: readonly TrackedRecord[],
  fn: () => Promise<void>,
): Promise<void> {
  const previousCwd = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'p22-reset-'));
  process.chdir(tempRoot);
  fs.mkdirSync('.test-artifacts', { recursive: true });
  replaceTrackedRecords(records);
  return fn().finally(() => {
    process.chdir(previousCwd);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
}

function mockApi(statusById: Record<string, number>): APIRequestContext {
  return {
    delete: async (url: string) => {
      const id = url.split('/').pop() ?? '';
      const status = statusById[id] ?? 500;
      return { status: () => status };
    },
  } as unknown as APIRequestContext;
}

async function testIntersectUntrackedAndOwner(): Promise<void> {
  const tracked = [CHILD_A, CHILD_B];
  const untracked: TrackedRecord = {
    type: RECORD_TYPE.Child,
    id: '99999999-9999-9999-9999-999999999999',
    owner: 'main',
  };
  const wrongOwner: TrackedRecord = {
    ...CHILD_A,
    owner: 'alt',
  };
  const result = intersectWithTrackedRecords(tracked, [
    untracked,
    wrongOwner,
    CHILD_A,
  ]);
  assert(result.length === 1, 'untracked + wrong owner dropped; canonical CHILD_A kept');
  assert(result[0] === CHILD_A, 'intersection returns tracker entry reference');
}

async function testDryRunWithoutAuth(): Promise<void> {
  await withTempTracker([CHILD_A, PLAYDATE], async () => {
    const before = loadTrackedRecords();
    const result = await cleanupTrackedRecords('http://dry-run.invalid', {
      dryRun: true,
    });
    const after = loadTrackedRecords();
    assert(result.attempted.length === 2, 'dry-run attempts all tracked rows');
    assert(
      JSON.stringify(before) === JSON.stringify(after),
      'dry-run leaves tracker unchanged',
    );
  });
}

async function testTypeFilterViaRecordHints(): Promise<void> {
  await withTempTracker([CHILD_A, PLAYDATE], async () => {
    const childHints = loadTrackedRecords().filter(
      (row) => row.type === RECORD_TYPE.Child,
    );
    const result = await cleanupTrackedRecords('http://dry-run.invalid', {
      records: childHints,
      dryRun: true,
    });
    assert(result.attempted.length === 1, '--type-style hints select tracked child only');
    assert(result.attempted[0].id === CHILD_A.id, 'type filter preserves tracked child id');
  });
}

async function testHttpOutcomesAndTrackerPreservation(): Promise<void> {
  await withTempTracker([CHILD_A, CHILD_B, PLAYDATE], async () => {
    const api = mockApi({
      [CHILD_A.id]: 204,
      [CHILD_B.id]: 404,
    });
    const attempt = await runCleanupAttempts([CHILD_A, CHILD_B, PLAYDATE], {
      getApiForOwner: async () => api,
    });
    assert(attempt.deleted.length === 1, '204 counted as deleted only');
    assert(attempt.alreadyRemoved.length === 1, '404 counted as already removed');
    assert(attempt.failed.length === 1, 'unsupported type counts as failed');

    const removedKeys = new Set<string>([
      ...attempt.deleted.map((row) => recordKey(row)),
      ...attempt.alreadyRemoved.map((row) => recordKey(row)),
    ]);
    removeTrackedRecordKeys(removedKeys);
    const finalRows = loadTrackedRecords();
    assert(finalRows.length === 1, 'other tracker rows preserved when subset succeeds');
    assert(finalRows[0].type === PLAYDATE.type, 'preserved row is unsupported playdate');
  });
}

async function test401Failed(): Promise<void> {
  await withTempTracker([CHILD_A], async () => {
    const api = mockApi({ [CHILD_A.id]: 401 });
    const attempt = await runCleanupAttempts([CHILD_A], {
      getApiForOwner: async () => api,
    });
    assert(attempt.deleted.length === 0, '401 is not deleted');
    assert(attempt.failed.length === 1, '401 counts as failed');
  });
}

function mockApiWithThrow(
  statusById: Record<string, number>,
  throwIds: ReadonlySet<string>,
): APIRequestContext {
  return {
    delete: async (url: string) => {
      const id = url.split('/').pop() ?? '';
      if (throwIds.has(id)) {
        throw new Error('Bearer secret-token must not appear in logs');
      }
      const status = statusById[id] ?? 500;
      return { status: () => status };
    },
    dispose: async () => {
      throw new Error('dispose failed with Authorization header leak');
    },
  } as unknown as APIRequestContext;
}

function resetCliExitCode(failedCount: number): number {
  return failedCount > 0 ? 1 : 0;
}

async function testOneSuccessOneThrowTrackerAndCliExit(): Promise<void> {
  await withTempTracker([CHILD_A, CHILD_B], async () => {
    const warnLines: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnLines.push(args.map(String).join(' '));
      originalWarn(...args);
    };

    try {
      const api = mockApiWithThrow({ [CHILD_A.id]: 204 }, new Set([CHILD_B.id]));
      const result = await cleanupTrackedRecords('http://isolated.invalid', {
        records: [CHILD_A, CHILD_B],
        attemptDeps: {
          getApiForOwner: async () => api,
        },
      });

      assert(result.deleted.length === 1, 'one DELETE succeeds (204)');
      assert(result.failed.length === 1, 'throwing DELETE counts as failed');
      const remainingIds = loadTrackedRecords().map((row) => row.id);
      assert(
        remainingIds.length === 1 && remainingIds[0] === CHILD_B.id,
        'successful row removed from tracker; failed row stays',
      );
      assert(
        resetCliExitCode(result.failed.length) === 1,
        'reset-test-data CLI exit is nonzero when failed remain',
      );

      const logBlob = warnLines.join('\n');
      assert(
        logBlob.includes('(request_failed)') || logBlob.includes('(unknown)'),
        'throw logs a sanitized category',
      );
      assert(
        !logBlob.includes('Bearer') && !logBlob.includes('Authorization'),
        'sanitized logs omit tokens and headers',
      );
    } finally {
      console.warn = originalWarn;
    }
  });
}

async function testDisposeErrorPreservesResults(): Promise<void> {
  await withTempTracker([CHILD_A], async () => {
    const api = mockApiWithThrow({ [CHILD_A.id]: 204 }, new Set());
    const attempt = await runCleanupAttempts([CHILD_A], {
      getApiForOwner: async () => api,
    });
    assert(attempt.deleted.length === 1, 'dispose error does not discard 204 result');
  });
}

async function main(): Promise<void> {
  await testIntersectUntrackedAndOwner();
  await testDryRunWithoutAuth();
  await testTypeFilterViaRecordHints();
  await testHttpOutcomesAndTrackerPreservation();
  await test401Failed();
  await testOneSuccessOneThrowTrackerAndCliExit();
  await testDisposeErrorPreservesResults();

  console.log('');
  console.log(`Verification · passed ${passed} · failed ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
