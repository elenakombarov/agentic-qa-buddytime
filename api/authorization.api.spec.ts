import type { APIResponse } from '@playwright/test';
import {
  createTrackedChild,
  FAMILY_OWNER,
} from '../fixtures/cleanup.fixture';
import { buildChildPayload } from '../test-data/factories/child.factory';
import { expect, test } from './fixtures';

async function listedChildIds(response: APIResponse): Promise<string[] | null> {
  const contentType = response.headers()['content-type'] ?? '';
  if (!contentType.includes('json')) {
    return null;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  if (typeof body !== 'object' || body === null || !('family' in body)) {
    return null;
  }
  const family = (body as { family: unknown }).family;
  if (typeof family !== 'object' || family === null || !('children' in family)) {
    return null;
  }
  const children = (family as { children: unknown }).children;
  if (!Array.isArray(children)) {
    return null;
  }

  return children.flatMap((child) => {
    if (typeof child !== 'object' || child === null || !('id' in child)) {
      return [];
    }
    const id = (child as { id: unknown }).id;
    return typeof id === 'string' ? [id] : [];
  });
}

test(
  'second family cannot delete the main family child',
  { tag: '@api' },
  async ({ apiMain, apiAlt, trackRecord }) => {
    const created = await createTrackedChild(
      apiMain,
      FAMILY_OWNER.Main,
      trackRecord,
      buildChildPayload(),
    );

    const deleteResponse = await apiAlt.delete(`/api/v1/children/${created.id}`);
    expect(deleteResponse.status()).toBe(404);

    const mainMe = await apiMain.get('/api/v1/me');
    const altMe = await apiAlt.get('/api/v1/me');
    const mainIds = await listedChildIds(mainMe);
    const altIds = await listedChildIds(altMe);

    expect(mainIds).toContain(created.id);
    expect(altIds).not.toContain(created.id);
  },
);

test(
  'request without a token cannot delete the main family child',
  { tag: '@api' },
  async ({ apiMain, apiAnonymous, trackRecord }) => {
    const created = await createTrackedChild(
      apiMain,
      FAMILY_OWNER.Main,
      trackRecord,
      buildChildPayload(),
    );

    const deleteResponse = await apiAnonymous.delete(
      `/api/v1/children/${created.id}`,
    );
    expect(deleteResponse.status()).toBe(401);

    const mainMe = await apiMain.get('/api/v1/me');
    const mainIds = await listedChildIds(mainMe);

    expect(mainIds).toContain(created.id);
  },
);
