import type { NewCommunityFormPayload } from './factories/community.factory';

/** One invalid field set for empty **Group name** submit (AQPBT-3 AC7). */
export type InvalidNewCommunityFormPayload = Pick<
  NewCommunityFormPayload,
  'groupName'
>;

/**
 * Invalid `/communities/new` inputs named in AQPBT-3 acceptance criteria only.
 *
 * Open question (story + Confluence): whether at least one child must be selected,
 * maxlength violations, and validation copy for empty **Group name** — not listed here.
 */
export const INVALID_NEW_COMMUNITY_FORM_PAYLOADS = [
  {
    groupName: '',
    // AC7: Given I am on `/communities/new` with an empty **Group name**, **When** I click **Create group**, **Then** the URL is `/communities/new`, the textbox **Group name** is focused, and **Create a community** is still visible.
  },
] as const satisfies readonly InvalidNewCommunityFormPayload[];
