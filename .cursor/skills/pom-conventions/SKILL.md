---
name: pom-conventions
description: Page Object Model conventions for Playwright tests in this project. Apply whenever generating, refactoring, or reviewing any Playwright test that interacts with the app under test (BuddyTime) — even if the user doesn't say "POM". Tests should never contain inline locators.
paths: "tests/**, pages/**"
---

# Page Object Model (BuddyTime)

Specs orchestrate flows and own all assertions. Page objects and components in `pages/` own locators and user actions only. **Never put locators inline in `tests/`.**

## Steps

1. **One class per page or distinct UI component** — e.g. `LoginPage`, `HeaderComponent`, `InviteFamilyPanelComponent`.
2. **Locators as `readonly` properties** set in the constructor. Prefer `getByRole` → `getByLabel` → `getByText`; never CSS/XPath in POMs.
3. **Methods = user actions** (click, fill, navigate). They do not call `expect()`.
4. **No assertions in `pages/`** — web-first `expect(locator)` lives in specs (or setup files under `tests/`).
5. **Compose components** — pages hold `readonly header: HeaderComponent` (and similar), instantiated in the constructor. Do not extend a shared base page class.
6. **Specs import POMs** and construct with `new XxxPage(page)` (or `new XxxComponent(page)`). Use action methods and exposed locators for assertions.

## BuddyTime page inventory

Routes come from [`test-data/routes.ts`](../../../test-data/routes.ts) (`AppRoute`). Do not invent routes or page classes not listed here.

| Route | Page object | Notes |
|-------|-------------|--------|
| `/` | `LandingPage` | Marketing landing; `goto()` |
| `/login` | `LoginPage` | Auth entry; heading “Welcome back” |
| `/signup` | `SignUpPage` | Registration |
| `/forgot-password` | `ForgotPasswordPage` | Password reset flow |
| `/app` | `DashboardPage` | Signed-in home; composes `HeaderComponent`, invite/avatar panels |
| `/calendar` | `CalendarPage` | |
| `/friends` | `FriendsPage` | Composes `HeaderComponent`, invite/manage panels |
| `/communities` | `CommunitiesPage` | List; navigates to create form |
| `/communities/new` | `CommunitiesNewPage` | Create form; composes `HeaderComponent` |
| `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | `CommunityDetailPage` | Maple Class only (`gotoMapleClass()`); tabs + announcement/event form components |
| `/availability` | `AvailabilityPage` | |
| `/playdates` | `PlaydatesPage` | |
| `/playdates/new` | `PlaydatesNewPage` | |
| `/birthdays` | `BirthdaysPage` | |
| `/profile` | `ProfilePage` | |
| `/admin` | `AdminPage` | |

### Components (no dedicated route)

| Where used | Component | Notes |
|------------|-----------|--------|
| Signed-in pages | `HeaderComponent` | Sidebar nav + top banner |
| Dashboard | `InviteFamilyPanelComponent`, `InviteCoparentPanelComponent`, `ChangeAvatarPanelComponent` | Opened from dashboard actions |
| Friends | `InviteFamilyPanelComponent`, `FriendManagePanelComponent` | |
| Community detail | `CommunityGroupEventFormComponent`, `CommunityAnnouncementFormComponent` | Returned from tab action methods |

Barrel export today: [`pages/index.ts`](../../../pages/index.ts) re-exports `LoginPage` only; other specs import from `../pages/<file>.page` (see existing tests).

## Locator rules

- **Scope dialogs** — define a `readonly dialog = page.getByRole('dialog', { name: '…' })` (or similar) and chain child locators from it so page content does not match accidentally.
- **`{ exact: true }`** — when labels or link names share a prefix (e.g. “Log in” vs “Log in with …”, “Sign up” vs “Sign up for …”), match the exact accessible name.
- **Rows and cards** — interact by accessible name (role + name, or scoped group/card) rather than nth-child or CSS.
- **No hardcoded `APP_URL`** — POMs call `this.page.goto(AppRoute.SomeRoute)` with relative paths; Playwright `baseURL` is set from `process.env.APP_URL` in config.
- **Shared chrome** — header/sidebar is a **component the page holds**, not a base class to extend.
- **Two-family flows** — one page object instance per `Page` / browser context (main vs `browser.newContext({ storageState: ALT_AUTH_FILE })`); do not reuse one POM across two contexts.

## Known app issues

Add a row only when the instructor confirms a defect; mark the test with `test.fail(true, '<AQPBT bug key>: <reason>')`.

| AQPBT key | Symptom | Workaround in tests |
|-----------|---------|---------------------|

## Output

- **Page objects:** `pages/*.page.ts`, shared UI in `pages/components/*.component.ts`
- **Specs:** `tests/*.spec.ts` — import POMs, `new XxxPage(page)`, assert on POM locators

## Examples from this repo

### POM — [`pages/login.page.ts`](../../../pages/login.page.ts)

```typescript
export class LoginPage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly logInButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.logInButton = page.getByRole('button', { name: 'Log in', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Login);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.logInButton.click();
  }
}
```

### Spec — [`tests/auth.setup.ts`](../../../tests/auth.setup.ts) (uses POM, assertions in spec)

```typescript
import { LoginPage } from '../pages';

setup('authenticate main family', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.fillEmail(process.env.APP_USER_EMAIL!);
  await loginPage.fillPassword(process.env.APP_USER_PASSWORD!);
  await loginPage.submit();

  await expect(page).toHaveURL(AppRoute.Dashboard);
});
```

### Spec — [`tests/aqpbt-3-communities-new.spec.ts`](../../../tests/aqpbt-3-communities-new.spec.ts) (assert on POM locators)

```typescript
test('AC1 — open create form via direct URL @smoke', async ({ page }) => {
  const communitiesNew = new CommunitiesNewPage(page);

  await communitiesNew.goto();

  await expect(page).toHaveURL(AppRoute.CommunitiesNew);
  await expect(communitiesNew.pageTitle).toBeVisible();
});
```

When adding a new screen, add or extend a page object first, register its route in `AppRoute` if new, then write the spec against that class — never the reverse.
