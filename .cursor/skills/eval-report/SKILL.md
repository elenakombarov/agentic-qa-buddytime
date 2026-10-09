---
name: eval-report
description: Refreshes eval-report.md — flake rate, heal success, generation-gate pass rate, ask-vs-guess — from CI logs, PR history, and session review. Use when the orchestrator closes a session, after a heal chain, at the end of backlog mode, when the user asks for suite reliability, or when eval-report.md is stale (>14 days). Cursor has no built-in telemetry; this skill defines how to measure each metric manually.
---

# Eval report (suite reliability)

Refresh [`eval-report.md`](../../../eval-report.md) at the repo root. **Report only** — no Jira tickets, no test or POM changes.

## When it is mandatory

Run a full refresh when **any** of these is true:

- A heal PR was opened or a red run was triaged
- A generation PR was opened
- `eval-report.md` is missing or older than **14 days**

Otherwise, stop after noting in chat or in a one-line stub:

`eval: skipped — no trigger`

## Inputs

Collect evidence before computing metrics. Default window **N = 30** Playwright workflow runs unless the user specifies another N.

| Source | Command / action |
|--------|------------------|
| Recent CI runs | `gh run list --workflow=playwright.yml --limit 30` |
| Run logs | `gh run view <id> --log` (repeat for runs in the window) |
| PR history | `gh pr list --state all` |
| PR CI | `gh pr checks <number>` |
| PR diffs | `gh pr diff <number>` |
| Agent behavior | Manual review of recent agent transcripts (`.cursor`/project transcripts) and PR bodies |

Cross-reference heal PRs with [`self-heal`](../self-heal/SKILL.md), triage with [`ci-failure-triage`](../ci-failure-triage/SKILL.md), and ticket-first generation with [`jira-ticket-analyzer`](../jira-ticket-analyzer/SKILL.md) / [`explore-and-generate`](../explore-and-generate/SKILL.md) PR patterns.

## Metrics

For **each** metric, record:

1. **Value** — `numerator/denominator` or `insufficient data`
2. **How measured** — which runs, PRs, or transcripts you used
3. **Interpretation** — one line on what the number means for reliability

### 1. Flake rate

**Definition:** test cases that passed only on Playwright retry / test cases in passing workflow runs (same population for numerator and denominator).

**How to measure:**

- Limit to workflow runs that **passed** within window N (`playwright.yml`).
- **Test case identity:** `project` + `spec file` + `test title` — count each test case **once per run**.
- **Numerator:** test cases that **passed only after a Playwright test retry** within that run (log evidence of retry on that test case, then pass).
- **Denominator:** all test cases executed in those same passing runs (same identity rule).
- **Do not** treat GitHub Actions workflow reruns or job reruns as Playwright test retries; only in-run Playwright `retries` count.
- **Exclude:** API cleanup teardown **404**s and similar expected cleanup noise — not flakes (see [`api-cleanup`](../api-cleanup/SKILL.md) if present).

### 2. Heal success rate

**Definition:** heal PRs green on first CI with assertions unchanged / all heal PRs (aligned with [`self-heal`](../self-heal/SKILL.md)).

**How to measure:**

- Identify heal PRs: branch prefix `heal/`, or PR body citing self-heal / triage drift / **assertions unchanged**.
- **Numerator:** PRs where the **first** CI run on the PR branch is green **and** `gh pr diff` shows **zero changes under `tests/`** (assertions unchanged — same bar as self-heal: POM-only heal, no test-file edits to go green).
- **Denominator:** all heal PRs in the review window.
- **Masked regressions:** count PRs where `expect()` was removed, commented out, softened, or skipped to go green. This count **must be 0**; if > 0, call it out as a reliability incident in interpretation (still report the heal success fraction honestly, or **`insufficient data`** if the denominator is zero).

### 3. Generation-gate pass rate

**Definition:** ticket-first PRs that are CI green + conforming + mapped to AC / all ticket-first generation PRs.

**How to measure:**

- **Ticket-first generation PRs:** PR title or body references a Jira key (e.g. `AQPBT-*`), links AC or a `features/<KEY>.feature.md`, and adds or extends Playwright coverage from that ticket — not ticket-less explore-only PRs.
- **Pass (numerator):** CI green on the PR; diff conforms to [constitution](../../rules/constitution.mdc) (role locators, one tag per test, no forbidden patterns); scenarios trace to stated AC (feature file or ticket text in PR).
- **Denominator:** all ticket-first generation PRs in the window.

### 4. Ask vs guess

**Definition:** explicit asks vs invented values.

**How to measure:**

- Sample recent agent transcripts and PR descriptions in the window; **state the sample** (e.g. transcript ids, PR numbers, date range).
- Tally **exact observed counts** of episodes where the agent **asked the human** for missing ticket/env/label/route data vs **invented** values later contradicted by repo, `.env.example`, or CI — only when you can cite each episode in the sample.
- If exact counts are not practical, give a **qualitative assessment** tied to that stated sample (no numeric estimates).
- Never invent numbers. If the sample is empty or unavailable, use **`insufficient data`**.

## Rules

- Missing evidence, an empty sample, or a **zero denominator** → **`insufficient data`**. Never report **0%** or **0/N** as a stand-in when N is 0 or data was not collected.
- Missing data → **`insufficient data`**, never a guess or placeholder percentage.
- Cleanup **404**s are noise, not flakes.
- End the report with **top reliability risk** (one sentence) and **next action** (one concrete step).
- Do **not** open tickets or change tests as part of this skill.

## Output

Write or overwrite [`eval-report.md`](../../../eval-report.md) at the repo root using this template:

```markdown
# Eval report

| Field | Value |
|-------|-------|
| Generated | <ISO date> |
| Window | Last N=<N> `playwright.yml` runs; PRs reviewed through <date or PR #> |
| Trigger | <mandatory trigger or "eval: skipped — no trigger"> |

## Metrics

### 1. Flake rate

- **Value:** <numerator/denominator or insufficient data>
- **Measured:** <runs, log lines, or insufficient data>
- **Interpretation:** <one line>

### 2. Heal success rate

- **Value:** <numerator/denominator or insufficient data>
- **Measured:** <PR numbers, diff review, or insufficient data>
- **Masked regressions:** <0 or count; if insufficient data, say so>
- **Interpretation:** <one line>

### 3. Generation-gate pass rate

- **Value:** <numerator/denominator or insufficient data>
- **Measured:** <PR numbers, AC mapping, or insufficient data>
- **Interpretation:** <one line>

### 4. Ask vs guess

- **Value:** <exact ask/guess counts from sample, qualitative assessment, or insufficient data — never invented numbers>
- **Measured:** <stated sample: transcript ids, PR #s, dates, or insufficient data>
- **Interpretation:** <one line>

## Summary

- **Top reliability risk:** <one sentence>
- **Next action:** <one concrete step>
```

## Related

- Triage: [`ci-failure-triage`](../ci-failure-triage/SKILL.md)
- Heal: [`self-heal`](../self-heal/SKILL.md)
- Ticket scenarios: [`jira-ticket-analyzer`](../jira-ticket-analyzer/SKILL.md)

## Verify

In Block 5, once CI has run (P27). Before that, every metric should read **`insufficient data`** — never a guessed number.
