import { faker } from '@faker-js/faker';
import type { CreateChildRequestBody } from '../../support/api/children.api';

/**
 * Unique POST `/api/v1/children` body.
 * January birth month keeps the displayed age stable for the rest of the calendar year.
 * Gender `girl` is what the dashboard renders as `Girl` on the summary line.
 */
export function buildChildPayload(
  overrides: Partial<CreateChildRequestBody> = {},
): CreateChildRequestBody {
  const suffix = String(Date.now());
  const baseName = faker.person.firstName().replace(/[^A-Za-z]/g, '');

  return {
    firstName: `${baseName}${suffix}`,
    birthYear: 2019,
    birthMonth: 1,
    avatarKey: 'fox',
    interests: [],
    gender: 'girl',
    ...overrides,
  };
}
