import { test, expect } from '../fixtures/cleanup.fixture';
import { DashboardPage } from '../pages/dashboard.page';

test('AC5 — empty Add child focuses Birth year and adds no child @e2e', async ({
  page,
}) => {
  test.fail(true, 'AQPBT-16: Empty Add child submission does not focus Birth year');

  const dashboard = new DashboardPage(page);

  await dashboard.goto();
  await expect(dashboard.childFirstNameInput).toBeVisible();
  await expect(dashboard.addChildButton).toBeVisible();

  const childCount = await dashboard.childRemoveButtons.count();

  await dashboard.submitAddChild();

  await expect(dashboard.childRemoveButtons).toHaveCount(childCount);
  await expect(dashboard.birthYearInput).toBeFocused();
});
