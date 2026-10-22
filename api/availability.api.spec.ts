import { test } from './fixtures';
import {
  asArray,
  asRecord,
  expectNull,
  expectNumber,
  expectSignedOut,
  expectString,
  readSignedIn,
} from './http';

test('GET /api/v1/availability returns the observed rules and exceptions @api', async ({
  mainFamilyApi,
  unauthenticatedApi,
}) => {
  const body = asRecord(await readSignedIn(mainFamilyApi, '/api/v1/availability'));

  for (const entry of asArray(body.rules)) {
    const rule = asRecord(entry);
    expectString(rule.id);
    expectNull(rule.childId);
    expectNumber(rule.weekday);
    expectNumber(rule.startMin);
    expectNumber(rule.endMin);
    expectString(rule.hosting);
    expectNumber(rule.noticeHours);
  }

  for (const entry of asArray(body.exceptions)) {
    const exception = asRecord(entry);
    expectString(exception.id);
    expectString(exception.date);
    expectString(exception.kind);
    expectNumber(exception.startMin);
    expectNumber(exception.endMin);
    expectString(exception.note);
  }

  await expectSignedOut(unauthenticatedApi, '/api/v1/availability');
});
