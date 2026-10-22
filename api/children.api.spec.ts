import {
  createTrackedChild,
  FAMILY_OWNER,
} from '../fixtures/cleanup.fixture';
import { getMe } from '../support/api/me.api';
import { expect, test } from './fixtures';

test('POST /api/v1/children creates one tracked child @api', async ({
  mainFamilyApi,
  trackRecord,
}) => {
  const before = await getMe(mainFamilyApi);
  const beforeIds = before.family.children.map((child) => child.id);
  const firstName = `P35Api${Date.now()}`;

  const created = await createTrackedChild(
    mainFamilyApi,
    FAMILY_OWNER.Main,
    trackRecord,
    {
      firstName,
      birthYear: 2015,
      birthMonth: 9,
      avatarKey: 'fox',
      interests: [],
    },
  );

  expect(typeof created.id).toBe('string');
  expect(created.firstName).toBe(firstName);
  expect(created.birthYear).toBe(2015);
  expect(created.birthMonth).toBe(9);
  expect(typeof created.age).toBe('number');
  expect(Array.isArray(created.interests)).toBe(true);
  expect(beforeIds).not.toContain(created.id);

  const withChild = await getMe(mainFamilyApi);
  const withIds = withChild.family.children.map((child) => child.id);
  expect(withIds).toContain(created.id);
  for (const id of beforeIds) {
    expect(withIds).toContain(id);
  }
});
