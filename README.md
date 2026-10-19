# agentic-qa-buddytime

BuddyTime is the app under test: see when your kids' friends are free, and book a playdate in three taps. Stories live in Jira project **AQPBT**. Feature pages live in Confluence space **AQPBT**.

## Prerequisites

- Node.js 20 or newer

## Install

```bash
npm ci
npx playwright install --with-deps chromium
```

## Environment

```bash
cp .env.example .env
```

`.env.example` has two sections.

**Run tests.** `APP_URL` is Playwright's `baseURL`. `APP_USER_EMAIL` and `APP_USER_PASSWORD` sign in the main family in `tests/auth.setup.ts`. `APP_ALT_USER_EMAIL` and `APP_ALT_USER_PASSWORD` sign in a second family for two-parent flows. If either alt value is empty, second-family setup is skipped. Two accounts exist so a test can open the main family and another family in separate sessions.

**Agent / CI setup.** `CURSOR_API_KEY` and the `ATLASSIAN_*` variables (`ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, `JIRA_PROJECT_KEY`, `CONFLUENCE_SPACE_KEY`) are optional. They belong to P28 headless generation, which exists only on the `p28-headless-generation` branch. That workflow is not active on `main`. Scheduled generation is not running. These variables are not required for `npx playwright test`.

## Run tests

```bash
npm test
npx playwright test --project=app
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive
npx playwright test tests/aqpbt-3-communities-new.spec.ts
npx playwright show-report
```

`npm test` runs the full suite. `--project=app` selects the signed-in project; that project depends on `setup`, so auth still runs first. Each `npm run test:<slice>` greps one tag. `test:destructive` also uses `--workers=1`. `show-report` opens the last HTML report.

## CI

| Event | Slice |
|---|---|
| `push` | sanity (`npm run test:sanity`) |
| `pull_request` | smoke (`npm run test:smoke`) |
| `workflow_dispatch` | full suite (`npx playwright test`) |

## Agent parts

| Path | Role |
|---|---|
| `.cursor/rules` | Always-on constitution, Playwright conventions, and the QA orchestrator that routes a ticket or a red build. |
| `.cursor/skills` | Procedures for ticket analysis, page objects, API cleanup, triage, self-heal, bug reports, exploration, exploratory-charter, test-data-reset, and the eval report. |
| `.cursor/agents` | Specialists: test-writer (plan to spec), triage (classify a red run), bug-reporter (file a confirmed defect). |
| `.cursor/hooks` | `preToolUse` runs both guards on Write, StrReplace, and Delete. `afterFileEdit` runs both on Write only. `guard-constitution.mjs` covers `tests/` and `pages/`. `guard-test-assertions.mjs` covers test files only. |

## MCP

Connect **Atlassian** and **GitHub** in Cursor settings. Those IDE servers are not configured through `.env`. The Playwright server checked in at `.cursor/mcp.json` is separate.

## Typical flow

The orchestrator reads one AQPBT story and its linked page in Confluence space AQPBT, then saves the Gherkin plan to `features/<KEY>.feature.md`. The test-writer implements only that plan under `tests/` and `pages/`. The suite runs, and a red result is triaged before a locator is healed or a bug is drafted.
