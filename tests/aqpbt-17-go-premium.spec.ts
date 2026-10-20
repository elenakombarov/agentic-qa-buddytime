import { test, expect } from '../fixtures/test';
import { DashboardPage } from '../pages/dashboard.page';
import { AppRoute } from '../test-data/routes';

test('AC1 — signed-in Go Premium shows coming soon on the dashboard @sanity', async ({
  page,
}) => {
  const dashboard = new DashboardPage(page);

  await dashboard.goto();

  await expect(dashboard.header.goPremiumButton).toBeVisible();
  await dashboard.header.openGoPremium();
  await expect(page).toHaveURL(AppRoute.Dashboard);
  await expect(dashboard.header.premiumComingSoonStatus).toBeVisible();
});

test.describe(() => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('AC2 — logged-out dashboard redirects to login without Go Premium @regression', async ({
    page,
  }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();

    await expect(page).toHaveURL(AppRoute.Login);
    await expect(dashboard.header.goPremiumButton).not.toBeVisible();
  });
});
