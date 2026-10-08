---
name: jira-bug-reporter
description: Analyzes Playwright test failures, identifies root cause, and creates detailed Jira bug tickets. Use when a test fails and needs investigation and bug reporting.
---

# Jira Bug Reporter (Playwright failures)

Investigate a red Playwright run, decide product bug vs test/drift, and draft a Jira Bug for human approval before filing.

## Workflow

1. **Read the failure** — assertion message, stack trace, and artifact paths (screenshot, trace, video if present) under `test-results/` and the HTML report. Note the spec file, test title, and tag.
2. **Confirm it reproduces** — re-run the failing test once (same project/browser as the failure when possible). If the re-run is green, treat as flake or environment drift; do not file a product bug without a second red run or clear product evidence.
3. **Identify root cause** — read the spec, fixtures, and page objects involved; infer app behavior from the UI and network (BuddyTime application source is not available in this repo—describe observable behavior precisely). Classify: **product defect** (file bug), **test drift** (fix test/heal skill), **data/setup** (fix factories or auth), **flake** (stabilize or quarantine—do not file as Bug).
4. **Search for duplicates** — in Jira project `JIRA_PROJECT_KEY`, search for similar **open** bugs before drafting a new one (summary/text keywords from the failure and user-facing symptom).
5. **Draft the bug** (markdown in chat) with these fields:
   - **Title** — specific, user-impact focused
   - **Type** — Bug
   - **Severity** / **Priority** — justified in one line each (use project-appropriate values; ask the human if the site’s scheme is unclear)
   - **Steps to reproduce** — numbered, from login via storageState auth, naming which **main family** or **alt family** performs each step
   - **Expected** — from the story AC and/or linked Confluence page in space `CONFLUENCE_SPACE_KEY`
   - **Actual** — what happened in the app
   - **Environment** — `APP_URL` **host only**, browser/project name, account **role** (main vs alt)—never an email or password
   - **Evidence** — relative paths to screenshot and trace (and video if any)
   - **Playwright error** — exact assertion/timeout message
   - **Linked story** — originating ticket key (e.g. `AQPBT-N`)
6. **Human gate** — show the full draft. File with the Atlassian MCP **only after explicit approval**, and link the new bug to the originating story.

## Configuration (read from environment)

Resolve from `process.env` or [`.env.example`](../../../.env.example)—do not hardcode site URLs, project keys, or account identifiers:

| Variable | Use |
|----------|-----|
| `JIRA_PROJECT_KEY` | Duplicate search and new Bug project (example: `AQPBT`) |
| `APP_URL` | Environment host in the bug body |
| `CONFLUENCE_SPACE_KEY` | Fetch AC/business rules for Expected when the story links Confluence |

Never read or paste `APP_USER_EMAIL`, `APP_USER_PASSWORD`, `APP_ALT_*`, `ATLASSIAN_*`, or token values into the draft or Jira description.

## Atlassian MCP

1. Resolve `cloudId` once via `getAccessibleAtlassianResources`.
2. Load the originating story with `getJiraIssue` (acceptance criteria, links).
3. If the story references Confluence in `CONFLUENCE_SPACE_KEY`, use `getConfluenceContent` or `searchConfluence` for Expected behavior.
4. Duplicate check: `searchJiraIssuesUsingJql` with JQL along the lines of `project = "<JIRA_PROJECT_KEY>" AND type = Bug AND statusCategory != Done AND (text ~ "…" OR summary ~ "…")` — adjust keywords from the failure.
5. After approval: `createJiraIssue` (Bug) with description assembled from the draft; link to the originating story. If linking requires a separate operation, use `discover` and the appropriate `executeWrite` only with operations returned by `discover`.

## Rules

- Never file for a **test issue** (wrong locator, bad data, missing skip) or a **green** run.
- Redact credentials, tokens, cookies, and account emails from errors and evidence before sharing; replace sensitive values with `[REDACTED]`. Never attach artifacts containing secrets.
- Never include **credentials** or storageState secrets in Jira or chat output.
- Do not weaken or delete assertions to “verify” the bug—triage per [constitution](../../rules/constitution.mdc).

## Do not (unless the user asks)

- File Jira issues before human approval
- “Heal” a confirmed product defect by changing the test to pass
- Reference a hardcoded local clone path or admin email in the template (v1)—always use env-driven host and role labels

## Verification note

This skill is exercised in lesson **P32** (manual chat trigger test: new chat, failing test context, do not name the skill).
