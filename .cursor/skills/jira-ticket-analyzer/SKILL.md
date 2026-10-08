---
name: jira-ticket-analyzer
description: Turns a Jira ticket's acceptance criteria into structured, reviewable Gherkin test scenarios. Use this skill whenever the user references a Jira ticket (AQPBT-1, AQPBT-2, etc.) and asks for test cases, a test plan, scenarios, or wants to plan testing for a ticket — even if they don't say the word "Gherkin".
---

# Jira Ticket to Gherkin Test Cases

The Gherkin is a human-readable checkpoint reviewed before any Playwright code is written.

## Workflow

1. Read the ticket with the Atlassian MCP: title, description, every acceptance criterion. If it links a Confluence page in space CONFLUENCE_SPACE_KEY, read that page too and use its business rules.
2. One Feature named after the ticket; every AC covered by at least one Scenario; add negative scenarios (what must NOT happen) and edge cases (boundaries, empty input, duplicates, special characters, max length, time-zone and overlap edges for scheduling rules, a second family's point of view).
3. Given / When / Then: Given = starting state, When = the action under test, Then = the observable expected outcome.
4. Group with comments: `# Happy paths`, `# Negative`, `# Edge cases`.
5. Use real, specific values from the ticket — never placeholders.
6. End with a comment block listing ambiguities or gaps in the acceptance criteria.

## Atlassian MCP (step 1)

- Resolve `cloudId` once via `getAccessibleAtlassianResources`.
- Load the issue with `getJiraIssue` using the ticket key from the user (e.g. `AQPBT-3`).
- Resolve `CONFLUENCE_SPACE_KEY` from `process.env` or [.env.example](../../../.env.example); do not assume a space key not confirmed there.
- When the ticket or Confluence page links a page in that space, fetch it with `getConfluenceContent` (or `searchConfluence` if only a title is known) and fold stated business rules into scenarios.

## Output

- Write **`features/<ticket-key>.feature.md`** at the repo root (e.g. `features/AQPBT-3.feature.md`).
- Structure:
  - Markdown title line: `# <KEY> — Gherkin (<short scope note if useful>)`
  - One fenced `gherkin` block containing the Feature and Scenarios
  - Trailing HTML comment `<!-- Ambiguities / gaps: ... -->` per step 6
- Prefer user-facing wording from the ticket (labels, routes, roles). Optional brief automation notes only when the ticket or Confluence explicitly names APIs, limits, or factories—never invent them.
- Style reference: [features/AQPBT-3.feature.md](../../../features/AQPBT-3.feature.md).

## Do not (unless the user asks)

- Write or change Playwright specs, POMs, or test data
- Weaken or invent acceptance criteria to fill gaps—list gaps in the comment block for story feedback instead
