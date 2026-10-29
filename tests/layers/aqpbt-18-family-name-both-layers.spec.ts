import { expect, test } from '../../fixtures/test';
import { ProfilePage } from '../../pages/profile.page';
import { getMe } from '../../support/api/me.api';
import { AppRoute } from '../../test-data/routes';

test(
  'unsaved family name edit leaves the saved family name unchanged',
  { tag: '@e2e' },
  async ({ page, mainFamilyApi }) => {
    const profile = new ProfilePage(page);
    let savedFamilyName = '';

    await test.step('API: arrange', async () => {
      const me = await getMe(mainFamilyApi);
      savedFamilyName = me.family.name;
    });

    await test.step('UI: check', async () => {
      await profile.goto();
      await expect(profile.familyNameInput).toHaveValue(savedFamilyName);
    });

    await test.step('UI: act', async () => {
      const temporaryFamilyName = `Unsaved${Date.now()}`;
      await profile.fillFamilyName(temporaryFamilyName);
      await expect(profile.familyNameInput).toHaveValue(temporaryFamilyName);
      await profile.header.openDashboard();
      await expect(page).toHaveURL(AppRoute.Dashboard);
    });

    await test.step('API: prove', async () => {
      const me = await getMe(mainFamilyApi);
      expect(me.family.name).toBe(savedFamilyName);
    });
  },
);
