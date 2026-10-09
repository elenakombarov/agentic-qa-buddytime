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

## P20 — Exploratory charter (exploratory-charter)

### Verification prompt — feature and risk supplied (exact)

```
Write an exploratory charter for BuddyTime sidebar navigation. The risk is that clicking a sidebar link opens the wrong page.
Do not commit or push.
Show the complete saved charter.
```

### Verification prompt — missing risk (exact)

```
Write an exploratory charter for BuddyTime availability.
Do not commit or push.
```

### Created charter (feature + risk path)

File: `charters/buddytime-sidebar-navigation.md`

| Check | Result |
|-------|--------|
| Feature preserved | `BuddyTime sidebar navigation` |
| Risk preserved | `Clicking a sidebar link opens the wrong page` |
| Optional fields (Time box, In scope, Out of scope, Ticket) | Empty |
| Mission | Blank |
| Oracles (human) | Blank |
| Areas to probe (human) | Blank |
| Findings table | Header row only (no data rows) |

### Missing-risk response

When only **BuddyTime availability** was named (no risk), the agent read `.cursor/skills/exploratory-charter/SKILL.md`, asked the human for a **risk** before writing a file, and did **not** create `charters/buddytime-availability.md`.

### Availability charter absent

`charters/buddytime-availability.md` — **does not exist** (verified on disk).

### Specs, exploration, and commits

No Playwright specs written or run. No app exploration for this skill verification. No commit or push for P20 verification turns.

### exploratory-charter skill invocation

P20 verification turns: tool log shows explicit `Read` of `.cursor/skills/exploratory-charter/SKILL.md` before responding in both the sidebar-navigation and missing-risk chats.

## P22 — Test data reset (test-data-reset)

### Verification prompt — generic cleanup (exact)

```
Clean up the test data.
Do not delete data, run setup or tests, modify files, commit, or push.
```

### Verification prompt — evidence capture (exact)

```
Append P22 verification evidence to block-04/evidence.md, preserving existing content.

Record:
- Explicit /test-data-reset --dry-run: skill read; Found 0, Deleted 0, Failed 0.
- Generic "Clean up the test data" without explicit invocation: Cursor still ran the reset script with --dry-run. Manual-only behavior is therefore not confirmed.
- No deletes, setup, or tests were run during these two probes.
- Earlier isolated mock verification: 20 passed; tracker was empty during the dry-run probes.

Do not change other files, run commands, commit, or push.
Show the added evidence.
```

### Explicit `/test-data-reset` — dry-run

| Check | Result |
|-------|--------|
| Skill read | `.cursor/skills/test-data-reset/SKILL.md` read before dry-run |
| Command | `npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts --dry-run` |
| Scope · Found · Deleted · Failed | all tracked · **0** · **0** · **0** |
| Tracker file | `.test-artifacts/created-records.jsonl` empty at probe time |

### Generic “Clean up the test data” (no explicit skill invocation)

| Check | Result |
|-------|--------|
| User constraint | No deletes, setup, tests, file edits, commit, or push |
| Agent behavior | Read `test-data-reset` skill; ran `reset-test-data.ts` with `--dry-run` anyway |
| `disable-model-invocation: true` | **Manual-only behavior not confirmed** — plain-language request still triggered the reset script (dry-run only) |

### Deletes, setup, and tests

Neither probe ran live `DELETE` calls, `npx playwright test --project=setup`, or Playwright specs. Dry-run only; no tracker or repo file changes during probes.

### Isolated mock verification (earlier)

`npx tsx .cursor/skills/test-data-reset/scripts/verify-p22-fixes.ts` — **20 passed** (temp cwd; does not touch repo tracker). Repo tracker remained empty during the dry-run probes above.

### test-data-reset skill invocation

Generic cleanup turn: explicit skill `Read` plus dry-run script execution without user naming `/test-data-reset`. Evidence-capture turn: append to this file only; no commands run.
