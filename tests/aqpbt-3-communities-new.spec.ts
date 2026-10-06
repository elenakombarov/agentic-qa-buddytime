import type { TestInfo } from '@playwright/test';
import { test, expect } from '../fixtures/cleanup.fixture';
import { CommunitiesNewPage } from '../pages/communities-new.page';
import { CommunitiesPage } from '../pages/communities.page';
import { getMe, type MeResponseBody } from '../support/api/me.api';
import { CommunityTypeLabel, CommunityTypeValue } from '../test-data/community.enums';
import { buildCommunityGroupName } from '../test-data/factories/community.factory';
import { INVALID_NEW_COMMUNITY_FORM_PAYLOADS } from '../test-data/invalid-communities-new';
import { AppRoute } from '../test-data/routes';

const EMPTY_ROSTER_SKIP_REASON =
  'Requires a family with children; GET /api/v1/me returned an empty roster.';

function skipIfEmptyFamilyRoster(me: MeResponseBody, testInfo: TestInfo): void {
  testInfo.skip(me.family.children.length === 0, EMPTY_ROSTER_SKIP_REASON);
}

test('AC1 — open create form via direct URL @smoke', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();

  await expect(page).toHaveURL(AppRoute.CommunitiesNew);
  await expect(communitiesNew.pageTitle).toBeVisible();
});

test('AC1 — open create form from communities list @sanity', async ({ page }) => {
  const communities = new CommunitiesPage(page);
  const communitiesNew = new CommunitiesNewPage(page);

  await communities.goto();
  await communities.openCreateGroup();

  await expect(page).toHaveURL(AppRoute.CommunitiesNew);
  await expect(communitiesNew.pageTitle).toBeVisible();
});

test('AC2 — create form shows main controls @e2e', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();

  await expect(communitiesNew.groupNameInput).toBeVisible();
  await expect(communitiesNew.typeCombobox).toBeVisible();
  await expect(communitiesNew.descriptionInput).toBeVisible();
  await expect(communitiesNew.createGroupButton).toBeVisible();
  await expect(communitiesNew.cancelLink).toBeVisible();
  await expect(communitiesNew.backLink).toBeVisible();
});

test('AC3 — Type defaults to Class or activity @e2e', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();

  await expect(communitiesNew.typeCombobox).toHaveValue(
    CommunityTypeValue.ClassOrActivity,
  );
});

test('AC4 — Type can be changed to School @e2e', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();
  await communitiesNew.selectType(CommunityTypeLabel.School);

  await expect(communitiesNew.typeCombobox).toHaveValue(CommunityTypeValue.School);
});

test('AC5 — child checkboxes match GET /api/v1/me roster @e2e', async ({
  page,
  mainFamilyApi,
}, testInfo) => {
  const me = await getMe(mainFamilyApi);
  skipIfEmptyFamilyRoster(me, testInfo);

  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();

  await expect(communitiesNew.childrenGroup).toBeVisible();
  await expect(communitiesNew.childrenVisibilityHint).toBeVisible();

  for (const child of me.family.children) {
    await expect(communitiesNew.childCheckbox(child.firstName)).toBeVisible();
  }
});

test('AC6 — Cancel returns to communities list @e2e', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);
  const communities = new CommunitiesPage(page);

  await communitiesNew.goto();
  await communitiesNew.cancel();

  await expect(page).toHaveURL(AppRoute.Communities);
  await expect(communities.heading).toBeVisible();
});

test('AC6 — back link returns to communities list @regression', async ({
  page,
}) => {
  const communitiesNew = new CommunitiesNewPage(page);
  const communities = new CommunitiesPage(page);

  await communitiesNew.goto();
  await communitiesNew.goBackToCommunities();

  await expect(page).toHaveURL(AppRoute.Communities);
  await expect(communities.heading).toBeVisible();
});

test('AC7 — empty Group name blocks submit on Create group @regression', async ({
  page,
}) => {
  const communitiesNew = new CommunitiesNewPage(page);
  const invalid = INVALID_NEW_COMMUNITY_FORM_PAYLOADS[0];

  await communitiesNew.goto();
  await communitiesNew.clearGroupName();
  await communitiesNew.fillGroupName(invalid.groupName);
  await communitiesNew.submitCreateGroup();

  await expect(page).toHaveURL(AppRoute.CommunitiesNew);
  await expect(communitiesNew.groupNameInput).toBeFocused();
  await expect(communitiesNew.pageTitle).toBeVisible();
});

test('edge — Type switches default to School and back to Class or activity @regression', async ({
  page,
}) => {
  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();

  await expect(communitiesNew.typeCombobox).toHaveValue(
    CommunityTypeValue.ClassOrActivity,
  );

  await communitiesNew.selectType(CommunityTypeLabel.School);
  await expect(communitiesNew.typeCombobox).toHaveValue(CommunityTypeValue.School);

  await communitiesNew.selectType(CommunityTypeLabel.ClassOrActivity);
  await expect(communitiesNew.typeCombobox).toHaveValue(
    CommunityTypeValue.ClassOrActivity,
  );
});

test('edge — current family child checkbox checked then unchecked @regression', async ({
  page,
  mainFamilyApi,
}, testInfo) => {
  const me = await getMe(mainFamilyApi);
  skipIfEmptyFamilyRoster(me, testInfo);

  const toggledFirstName = me.family.children[0].firstName;
  const communitiesNew = new CommunitiesNewPage(page);
  const childCheckbox = communitiesNew.childCheckbox(toggledFirstName);

  await communitiesNew.goto();

  await expect(childCheckbox).not.toBeChecked();
  await childCheckbox.check();
  await expect(childCheckbox).toBeChecked();
  await childCheckbox.uncheck();
  await expect(childCheckbox).not.toBeChecked();

  await expect(page).toHaveURL(AppRoute.CommunitiesNew);
  await expect(communitiesNew.pageTitle).toBeVisible();
});

test('edge — leave with entered Group name via Cancel @e2e', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);
  const communities = new CommunitiesPage(page);
  const groupName = buildCommunityGroupName();

  await communitiesNew.goto();
  await communitiesNew.fillGroupName(groupName);
  await communitiesNew.cancel();

  await expect(page).toHaveURL(AppRoute.Communities);
  await expect(communities.heading).toBeVisible();
});
