import { test } from './fixtures';
import {
  asArray,
  asRecord,
  expectBoolean,
  expectNull,
  expectNumber,
  expectSignedOut,
  expectString,
  expectStringOrNull,
  readSignedIn,
} from './http';

test('GET /api/v1/events returns the observed event list @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const events = asArray(await readSignedIn(mainFamilyApi, '/api/v1/events'));

  for (const entry of events) {
    const event = asRecord(entry);
    expectString(event.id);
    expectString(event.kind);
    expectString(event.title);
    expectStringOrNull(event.childId);
    expectStringOrNull(event.childName);
    expectString(event.startsAt);
    expectNull(event.endsAt);
    expectStringOrNull(event.venueText);
    expectStringOrNull(event.details);
    expectString(event.cardKey);
    expectString(event.status);
    expectNull(event.communityId);
    expectNull(event.communityName);
    expectString(event.rsvpToken);
    const counts = asRecord(event.counts);
    expectNumber(counts.yes);
    expectNumber(counts.no);
    expectNumber(counts.maybe);
    expectNumber(counts.guestsComing);
    expectString(event.createdAt);
    expectBoolean(event.canManage);
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/events');
});
