import type { Page, Response } from '@playwright/test';
import {
  createChild,
  type CreateChildResponseBody,
} from '../support/api/children.api';
import {
  FAMILY_OWNER,
  RECORD_TYPE,
  type RecordOwner,
} from '../support/family-owner';
import {
  addTrackedRecord,
  isRealRecordId,
  type TrackedRecord,
} from '../support/record-tracker';
import {
  finalizeResponseTracking,
  registerResponseTrackingTask,
} from '../support/response-tracking-drain';
import { test as baseTest, expect } from './test';

export type TrackRecord = (record: TrackedRecord) => void;

type CleanupFixtures = {
  /** Manually register a successfully created record (API or other flows). */
  trackRecord: TrackRecord;
};

type CleanupOptions = {
  /** Owning family for UI POST `/api/v1/children` auto-tracking on this test. */
  recordOwner: RecordOwner;
};

function childrenCreatePath(url: string): boolean {
  try {
    return new URL(url).pathname.endsWith('/api/v1/children');
  } catch {
    return false;
  }
}

async function maybeTrackChildCreateFromResponse(
  response: Response,
  owner: RecordOwner,
): Promise<void> {
  const request = response.request();
  if (request.method() !== 'POST' || !childrenCreatePath(response.url())) {
    return;
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    const expectedOrigin = new URL(appUrl).origin;
    if (new URL(response.url()).origin !== expectedOrigin) {
      return;
    }
  }

  if (response.status() !== 201) {
    return;
  }

  const contentType = response.headers()['content-type'] ?? '';
  if (!contentType.includes('json')) {
    return;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return;
  }

  const id =
    typeof body === 'object' &&
    body !== null &&
    'id' in body &&
    typeof (body as { id: unknown }).id === 'string'
      ? (body as { id: string }).id
      : null;

  if (!id || !isRealRecordId(id)) {
    return;
  }

  addTrackedRecord({ type: RECORD_TYPE.Child, id, owner });
}

export const test = baseTest.extend<CleanupFixtures, CleanupOptions>({
  recordOwner: ['main', { option: true }],

  page: async ({ page, recordOwner }, use) => {
    const pendingTracking = new Set<Promise<void>>();
    const trackingErrors: unknown[] = [];

    const onResponse = (response: Response): void => {
      const task = maybeTrackChildCreateFromResponse(response, recordOwner);
      registerResponseTrackingTask(pendingTracking, trackingErrors, task);
    };

    page.on('response', onResponse);
    try {
      await use(page);
    } finally {
      page.off('response', onResponse);
      await finalizeResponseTracking(pendingTracking, trackingErrors);
    }
  },

  trackRecord: async ({ recordOwner }, use) => {
    const track: TrackRecord = (record) => {
      if (record.id && record.type) {
        addTrackedRecord({
          type: record.type,
          id: record.id,
          owner: record.owner ?? recordOwner,
        });
      }
    };
    await use(track);
  },
});

/**
 * Creates a child via POST `/api/v1/children` and tracks the response `id` on 201 only.
 */
export async function createTrackedChild(
  api: Parameters<typeof createChild>[0],
  owner: RecordOwner,
  trackRecord: TrackRecord,
  body: Parameters<typeof createChild>[1],
): Promise<CreateChildResponseBody> {
  const created = await createChild(api, body);
  trackRecord({ type: RECORD_TYPE.Child, id: created.id, owner });
  return created;
}

export { expect, FAMILY_OWNER, RECORD_TYPE };
export type { RecordOwner, TrackedRecord, Page };
