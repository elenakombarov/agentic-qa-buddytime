import { expect, test } from './fixtures';
import {
  asArray,
  asRecord,
  expectBoolean,
  expectNull,
  expectNumber,
  expectSignedOut,
  expectString,
  readSignedIn,
} from './http';

test('GET /api/v1/me returns the observed family profile @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const body = asRecord(await readSignedIn(mainFamilyApi, '/api/v1/me'));
  const parent = asRecord(body.parent);
  expectString(parent.id);
  expectString(parent.email);
  expectString(parent.name);
  expectString(parent.displayName);
  expectNull(parent.phone);
  expectBoolean(parent.emailVerified);

  const family = asRecord(body.family);
  expectString(family.id);
  expectString(family.name);
  expectNull(family.addressText);
  expectString(family.addressVisibility);
  expectString(family.tz);
  expectBoolean(body.isAdmin);

  for (const parentRow of asArray(family.parents)) {
    const row = asRecord(parentRow);
    expectString(row.id);
    expectString(row.name);
    expectString(row.displayName);
    expectString(row.role);
  }

  for (const childRow of asArray(family.children)) {
    const child = asRecord(childRow);
    expectString(child.id);
    expectString(child.firstName);
    expectNumber(child.birthYear);
    expectNumber(child.birthMonth);
    expectNumber(child.age);
    if (child.gender === null) {
      expect(typeof child.firstName === 'string' && child.firstName.startsWith('P35Api')).toBe(
        true,
      );
    } else {
      expectString(child.gender);
    }
    expect(Array.isArray(child.interests)).toBe(true);
    expectString(child.avatarKey);
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/me');
});
