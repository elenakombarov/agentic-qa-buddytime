import {
  expect,
  FAMILY_OWNER,
  RECORD_TYPE,
  test,
} from '../../fixtures/cleanup.fixture';
import { DashboardPage } from '../../pages/dashboard.page';
import { createChild } from '../../support/api/children.api';
import { createApiContextForOwner } from '../../support/api-client';
import { getMe } from '../../support/api/me.api';
import { buildChildPayload } from '../../test-data/factories/child.factory';

/** Dashboard summary line: "Mia, 7 · Girl" when gender is set, otherwise "Mia, 7". */
function childRowText(child: {
  firstName: string;
  age: number;
  gender: string | null;
}): string {
  const genderLabel =
    child.gender === 'girl' ? 'Girl' : child.gender === 'boy' ? 'Boy' : null;
  if (!genderLabel) {
    return `${child.firstName}, ${child.age}`;
  }
  return `${child.firstName}, ${child.age} · ${genderLabel}`;
}

test(
  'API-created child is listed on the dashboard and gone after remove',
  { tag: '@destructive' },
  async ({ page, trackRecord, mainFamilyApi }) => {
    const dashboard = new DashboardPage(page);
    let kidsBefore = 0;
    let childId = '';
    let rowText = '';

    await test.step('API: arrange', async () => {
      const api = await createApiContextForOwner('main');
      try {
        const before = await getMe(api);
        kidsBefore = before.family.children.length;
        const created = await createChild(api, buildChildPayload());
        trackRecord({
          type: RECORD_TYPE.Child,
          id: created.id,
          owner: FAMILY_OWNER.Main,
        });
        childId = created.id;
        rowText = childRowText(created);
      } finally {
        await api.dispose();
      }
    });

    await test.step('UI: check', async () => {
      await dashboard.goto();
      await expect(dashboard.childRow(rowText)).toBeVisible();
      await expect(dashboard.myKidsCount).toHaveText(String(kidsBefore + 1));
    });

    await test.step('UI: act', async () => {
      await dashboard.removeChild(rowText);
    });

    await test.step('API: prove', async () => {
      await expect
        .poll(async () => {
          const me = await getMe(mainFamilyApi);
          return me.family.children.map((child) => child.id);
        })
        .not.toContain(childId);
    });
  },
);
