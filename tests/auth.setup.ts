import fs from 'fs';
import path from 'path';
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages';
import { AUTH_FILE, ALT_AUTH_FILE } from '../support/auth.constants';
import { AppRoute } from '../test-data/routes';

const ALT_FAMILY_SKIP_REASON =
  'APP_ALT_USER_EMAIL and APP_ALT_USER_PASSWORD must both be set (non-empty) to authenticate the second family';

function hasAltFamilyCredentials(): boolean {
  const email = process.env.APP_ALT_USER_EMAIL?.trim() ?? '';
  const password = process.env.APP_ALT_USER_PASSWORD?.trim() ?? '';
  return email.length > 0 && password.length > 0;
}

setup('authenticate main family', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillEmail(process.env.APP_USER_EMAIL!);
  await loginPage.fillPassword(process.env.APP_USER_PASSWORD!);
  await loginPage.submit();

  await expect(page).toHaveURL(AppRoute.Dashboard);
  await expect(page).not.toHaveURL(AppRoute.Login);

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});

setup('authenticate second family', async ({ page }, testInfo) => {
  testInfo.skip(!hasAltFamilyCredentials(), ALT_FAMILY_SKIP_REASON);

  const email = process.env.APP_ALT_USER_EMAIL!.trim();
  const password = process.env.APP_ALT_USER_PASSWORD!;

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillEmail(email);
  await loginPage.fillPassword(password);
  await loginPage.submit();

  await expect(page).toHaveURL(AppRoute.Dashboard);
  await expect(page).not.toHaveURL(AppRoute.Login);

  fs.mkdirSync(path.dirname(ALT_AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: ALT_AUTH_FILE });
});
