import { expect, test } from './fixtures';
import {
  asArray,
  asRecord,
  expectBoolean,
  expectIdName,
  expectNull,
  expectNumber,
  expectSignedOut,
  expectString,
  expectStringArray,
  expectStringOrNull,
  readSignedIn,
} from './http';

function expectPlaydateChild(value: unknown): void {
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

test('GET /api/v1/playdates?filter=upcoming returns an array @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const body = await readSignedIn(
    mainFamilyApi,
    '/api/v1/playdates?filter=upcoming',
  );
  expect(Array.isArray(body)).toBe(true);
  await expectSignedOut(
    unauthenticatedApi,
    '/api/v1/playdates?filter=upcoming',
  );
});

test('GET /api/v1/playdates returns the observed playdate list @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const playdates = asArray(await readSignedIn(mainFamilyApi, '/api/v1/playdates'));

  for (const entry of playdates) {
    const playdate = asRecord(entry);
    expectString(playdate.id);
    expectString(playdate.status);
    expectString(playdate.startsAt);
    expectString(playdate.endsAt);
    expectString(playdate.locationKind);
    expectStringOrNull(playdate.locationText);
    expectStringOrNull(playdate.notes);
    expectIdName(playdate.proposerFamily);
    expectIdName(playdate.inviteeFamily);
    expectIdName(playdate.otherFamily);
    if (playdate.hostFamily === null) {
      expectNull(playdate.hostFamily);
    } else {
      expectIdName(playdate.hostFamily);
    }
    for (const child of asArray(playdate.children)) {
      expectPlaydateChild(child);
    }
    const proposedBy = asRecord(playdate.proposedBy);
    expectString(proposedBy.id);
    expectString(proposedBy.name);
    expectStringOrNull(proposedBy.displayName);
    expectStringOrNull(playdate.respondedAt);
    expectString(playdate.cancelledAt);
    expectString(playdate.googleCalendarUrl);
    expectString(playdate.icsUrl);
    expect(playdate.icsUrl).toMatch(/^\/api\/v1\/playdates\/[^/]+\/ics$/);
    expectBoolean(playdate.canRespond);
    expectBoolean(playdate.canCancel);
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/playdates');
});

test('GET /api/v1/matches?days=21 returns the observed match list @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const matches = asArray(
    await readSignedIn(mainFamilyApi, '/api/v1/matches?days=21'),
  );

  for (const entry of matches) {
    const match = asRecord(entry);
    expectString(match.date);
    expectNumber(match.startMin);
    expectNumber(match.endMin);
    expectString(match.startsAt);
    expectString(match.endsAt);
    expectIdName(match.family);
    if (match.suggestedHost === null) {
      expectNull(match.suggestedHost);
    } else {
      expectIdName(match.suggestedHost);
    }
    expectString(match.locationKind);
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/matches?days=21');
});
