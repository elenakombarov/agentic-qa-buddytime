# Block 04 — Evidence

## P16 — Login heading probe (Playwright + POM)

### Verification prompt (exact)

```
Write a test that the login page shows its heading.
Do not run tests or commit yet.
```

### Probe artifact

File created for the probe: `tests/login.spec.ts` (untracked; removed after evidence capture — see disposition below).

### LoginPage usage in the probe

**Import**

```typescript
import { LoginPage } from '../pages';
```

**Instantiation**

```typescript
const loginPage = new LoginPage(page);
```

**Heading assertion** (web-first; locator owned by `LoginPage.heading` → `getByRole('heading', { name: 'Welcome back' })`)

```typescript
await expect(loginPage.heading).toBeVisible();
```

**Full probe spec (as generated)**

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';
import { AppRoute } from '../test-data/routes';

test.use({ storageState: { cookies: [], origins: [] } });

test('login page shows welcome heading @smoke', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  await expect(page).toHaveURL(AppRoute.Login);
  await expect(loginPage.heading).toBeVisible();
});
```

### POM skill invocation

When asked whether `.cursor/skills/pom-conventions/SKILL.md` was read during probe generation, the agent reported **no** explicit `Read` of that skill file in the tool log (only an automatic “may be relevant” hint after reading `pages/login.page.ts`). **Automatic skill invocation is not confirmed** for this run.

### Disposition

- `tests/login.spec.ts`: **deleted** — `git status` showed `??` (untracked probe from this chat), not a tracked repo file.
- Probe was not run and not committed.

## P18 — Ticket-less sidebar navigation discovery (explore-and-generate)

### Verification prompt (exact)

```
Complete the ticket-less discovery task. Explore sidebar navigation using browser_navigate and browser_snapshot, read-only, without screenshots or data changes.

Check whether the selected flow already has a Jira ticket or acceptance criteria; if it does, choose another ticket-less flow.

Select ONE coverage gap and save features/explore-<page-slug>-<flow-slug>.feature.md with all required output sections and exactly two Gherkin scenarios: one positive and one edge case. Use real control names from the live snapshot.

Do not write or run specs, create Jira issues, or commit.
Show the saved file's complete contents and git status --short.
Also report whether you actually read .cursor/skills/explore-and-generate/SKILL.md during the original request, based on the tool log.
```

### Saved plan

`features/explore-sidebar-calendar-nav.feature.md`

### Selected gap

Signed-in parent opens **Calendar** from the sidebar while on **Dashboard** (navigate to `/calendar`, banner **Calendar**, copy **Your family calendar**; edge scenario returns via sidebar **Dashboard** to `/app` with banner **Dashboard**). No matching AQPBT story for sidebar → Calendar; AQPBT-2 (dashboard content) and AQPBT-3 (communities create form) were not used as the selected flow.

### Exploration

Read-only: `browser_navigate` to `/app`, `browser_snapshot`, sidebar link **Calendar** → `/calendar`, snapshot; link **Dashboard** → `/app`, snapshot. No screenshots, no form submits, no invites, no data changes.

### Specs and test runs

No Playwright specs written or executed for this discovery task.

### explore-and-generate skill invocation

On the **initial** request (“What flows in BuddyTime are we not testing?”), the tool log shows only a **partial** `Read` of `.cursor/skills/explore-and-generate/SKILL.md` (`limit: 80`), not a full-file read, and no live browser crawl. **Automatic skill invocation is not confirmed** for that turn. The P18 verification turn performed a full skill read and MCP exploration.
