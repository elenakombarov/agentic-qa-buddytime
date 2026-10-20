---
name: ci-failure-triage
description: When a CI run is red, pull the run's logs and the playwright-report artifact via GitHub MCP or GH CLI, read the Playwright error and trace, cross-reference the spec, POM, and app source in the repo, classify real app bug vs test issue, and post a structured diagnosis to the PR. Use whenever a build fails — even if triage isn't asked for.
---

# CI failure triage

## Steps

1. Pull the failed run's logs and the playwright-report artifact (GitHub MCP, or
   `gh run view <id> --log` and `gh run download <id>`). For a local red run, use the
   local report and [`test-results/`](../../../test-results/).
2. Read the error: failing test, expected vs received, trace path. Inspect the trace
   from the command line with `npx playwright trace`. Quote the aria snapshot from the
   error context when Playwright includes one.
3. Cross-reference the spec in [`tests/`](../../../tests/), the page object in [`pages/`](../../../pages/), the story's acceptance criteria in [`features/`](../../../features/) and Confluence. BuddyTime's source isn't in this repo; compare against the
   documented behavior instead (see [`playwright.config.ts`](../../../playwright.config.ts) for projects and reporters).
4. Write `.test-artifacts/evidence/<run>-<test>.json` and copy the same bytes to
   `.test-artifacts/evidence/current.json`. `<run>` is the CI run id, or `local`.
   `<test>` is the test title with every character outside `[A-Za-z0-9_-]` replaced
   by `-`. Each item has `id`, `kind`, `artifact`, `line`, and `excerpt`. `id` and
   `kind` match one row in [`config/evidence-rubric.json`](../../../config/evidence-rubric.json).
   The excerpt is a quote from that line of the artifact. Never put `score`,
   `confidence`, or `weight` anywhere in the file.
5. Run `npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json`
   and report that command's `decision` and `allowedActions`. Do not read a saved file
   under `.test-artifacts/decisions/` and do not treat a chat label as the decision.

   | Re-run | What to record |
   |---|---|
   | Passes | inconclusive, not drift. The scorer reports this as rule 3. Do not call it locator drift or a flake from timing. |

6. Report: root cause, affected file and line, expected/actual, the scorer decision,
   and evidence (trace or screenshot path, run id) — as a PR comment when a PR exists,
   otherwise to the parent agent. Redact sensitive values before posting (see Rules).

## Rules

- Before sharing logs, errors, snapshots, or evidence, redact credentials, tokens, cookies, and account emails.
- Never merge or apply a fix yourself; a real defect goes to [`jira-bug-reporter`](../../../.cursor/skills/jira-bug-reporter/SKILL.md).
- The diagnosis names the location and the cause, not just the symptom.

## Verify

In Block 5, on the first red CI run (P31).

## Since v1

`npx playwright trace` (1.59) lets an agent read a trace without a browser, and since 1.60 a failing `expect` can carry the element's aria snapshot in its error context.
