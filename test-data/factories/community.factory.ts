import { faker } from '@faker-js/faker';
import {
  CommunityTypeValue,
  MainFamilyChildLabel,
} from '../community.enums';

/** Fields on `/communities/new` that the story covers (submit success is out of scope). */
export type NewCommunityFormPayload = {
  groupName: string;
  type: CommunityTypeValue;
  description: string;
  children: readonly MainFamilyChildLabel[];
};

const GROUP_NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

const UNIQUE_SUFFIX_SEPARATOR = ' ';

/** Appends `Date.now()` after truncating only `base` so the full suffix fits in `maxLength`. */
function withUniqueSuffix(base: string, maxLength: number): string {
  const suffix = String(Date.now());
  const reserved = UNIQUE_SUFFIX_SEPARATOR.length + suffix.length;
  const baseMax = Math.max(0, maxLength - reserved);
  const trimmedBase = base.slice(0, baseMax);
  return `${trimmedBase}${UNIQUE_SUFFIX_SEPARATOR}${suffix}`;
}

/** Unique **Group name** within live maxlength (required, max 100). */
export function buildCommunityGroupName(): string {
  const base = faker.location.street().replace(/\s+/g, ' ').trim();
  return withUniqueSuffix(base, GROUP_NAME_MAX_LENGTH);
}

/** Optional **Description (optional)** text within live maxlength (max 500). */
export function buildCommunityDescription(): string {
  const sentence = faker.lorem.sentence({ min: 3, max: 8 });
  return withUniqueSuffix(sentence, DESCRIPTION_MAX_LENGTH);
}

/** Default form payload: unique name and description, default **Type** = class, no children selected. */
export function buildNewCommunityFormPayload(
  overrides: Partial<NewCommunityFormPayload> = {},
): NewCommunityFormPayload {
  return {
    groupName: buildCommunityGroupName(),
    type: CommunityTypeValue.ClassOrActivity,
    description: buildCommunityDescription(),
    children: [],
    ...overrides,
  };
}
