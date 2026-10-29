import { expect, test } from './fixtures';
import {
  asArray,
  asRecord,
  expectBoolean,
  expectNumber,
  expectSignedOut,
  expectString,
  expectStringArray,
  readSignedIn,
} from './http';

test('GET /api/v1/connections returns the observed connection list @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const connections = asArray(
    await readSignedIn(mainFamilyApi, '/api/v1/connections'),
  );

  for (const entry of connections) {
    const connection = asRecord(entry);
    expectString(connection.id);
    const family = asRecord(connection.family);
    expectString(family.id);
    expectString(family.name);
    expect(Array.isArray(connection.communities)).toBe(true);
    expectString(connection.since);
    expectString(connection.status);
    expectBoolean(connection.blockedByMe);

    for (const childRow of asArray(connection.children)) {
      const child = asRecord(childRow);
      expectString(child.id);
      expectString(child.firstName);
      expectNumber(child.birthYear);
      expect(
        child.birthMonth === null ||
          (typeof child.birthMonth === 'number' &&
            Number.isInteger(child.birthMonth) &&
            child.birthMonth >= 1 &&
            child.birthMonth <= 12),
      ).toBe(true);
      expectNumber(child.age);
      expectString(child.gender);
      expectStringArray(child.interests);
      expectString(child.avatarKey);
    }
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/connections');
});
