import { test } from './fixtures';
import {
  asArray,
  asRecord,
  expectBoolean,
  expectNull,
  expectNumber,
  expectSignedOut,
  expectString,
  expectStringArray,
  readSignedIn,
} from './http';

function expectCommunitySummary(record: Record<string, unknown>): void {
  expectString(record.id);
  expectString(record.name);
  expectString(record.type);
  expectString(record.description);
  expectString(record.myRole);
  expectString(record.myStatus);
  expectNumber(record.familiesCount);
  expectNumber(record.pendingCount);
  expectString(record.createdAt);
}

function expectMemberChild(value: unknown): void {
  const child = asRecord(value);
  expectString(child.id);
  expectString(child.firstName);
  expectNumber(child.birthYear);
  expectNull(child.birthMonth);
  expectNumber(child.age);
  expectString(child.gender);
  expectStringArray(child.interests);
  expectString(child.avatarKey);
}

test('GET /api/v1/communities returns the observed community list @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const communities = asArray(
    await readSignedIn(mainFamilyApi, '/api/v1/communities'),
  );

  for (const entry of communities) {
    expectCommunitySummary(asRecord(entry));
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/communities');
});

test('GET /api/v1/communities/{id} returns the observed community @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const communities = asArray(
    await readSignedIn(mainFamilyApi, '/api/v1/communities'),
  );
  const first = asRecord(communities[0]);
  expectString(first.id);
  const communityId = first.id;
  if (typeof communityId !== 'string') {
    throw new Error('expected community id');
  }

  const community = asRecord(
    await readSignedIn(mainFamilyApi, `/api/v1/communities/${communityId}`),
  );
  expectCommunitySummary(community);

  for (const entry of asArray(community.members)) {
    const member = asRecord(entry);
    expectString(member.id);
    const family = asRecord(member.family);
    expectString(family.id);
    expectString(family.name);
    expectString(member.role);
    expectString(member.status);
    for (const child of asArray(member.children)) {
      expectMemberChild(child);
    }
    if (member.connection === null) {
      expectNull(member.connection);
    } else {
      const connection = asRecord(member.connection);
      expectString(connection.id);
      expectString(connection.status);
      expectBoolean(connection.requestedByMe);
      expectNull(connection.canRequestAt);
    }
    expectString(member.since);
  }

  await expectSignedOut(
    unauthenticatedApi,
    `/api/v1/communities/${communityId}`,
  );
});
