# Eval report

| Field | Value |
|-------|-------|
| Generated | 2026-10-20 |
| Window | Last N=30 `playwright.yml` runs requested; 7 runs exist, all completed success, all reviewed. PRs reviewed through #2 (2026-10-20). |
| Trigger | A generation PR was opened (PR #2) |

## Metrics

### 1. Flake rate

- **Value:** 0/22
- **Measured:** All 7 passing `playwright.yml` runs in the window. Logs were searched for `retry`, `flaky`, and `failed`. Each run printed only a passing total and no retry or failed line: [39511801896](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39511801896) (pull_request, smoke, 3 passed), [39511795095](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39511795095) (push, sanity, 4 passed), [39480502698](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39480502698) (push, sanity, 3 passed), [39327792563](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39327792563) (push, sanity, 3 passed), [39322938284](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39322938284) (push, sanity, 3 passed), [39312576071](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39312576071) (pull_request, smoke, attempt 3, 3 passed), [39312496769](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39312496769) (push, sanity, attempt 2, 3 passed). Denominator is those reporter totals (22). GitHub Actions attempt numbers were not counted as Playwright retries. The requested window is 30 runs; only 7 exist.
- **Interpretation:** No passing test in these logs needed a Playwright retry. The sample is the whole available history, and it is smaller than 30 runs.

### 2. Heal success rate

- **Value:** insufficient data
- **Measured:** `gh pr list --state all` returned PR #1 (`P27: CI workflow`, `p28-headless-generation`, closed, not merged) and PR #2 (`P30: AQPBT-17 Go Premium coming-soon checks`, `p30-aqpbt-17-go-premium`, open). Neither branch starts with `heal/`, and neither body cites self-heal, triage drift, or assertions unchanged.
- **Masked regressions:** insufficient data
- **Interpretation:** There is no heal PR to score, so the rate and the masked-regression count are undefined.

### 3. Generation-gate pass rate

- **Value:** 1/1
- **Measured:** Ticket-first generation PRs are those whose title or body names an `AQPBT-*` key, a `features/<KEY>.feature.md` plan, and new Playwright coverage. PR #1 does not. PR #2 does: it links AQPBT-17, `features/AQPBT-17.feature.md`, and `tests/aqpbt-17-go-premium.spec.ts`. Its pull_request check ([39511801896](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39511801896), smoke) and its push check ([39511795095](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39511795095), sanity) both succeeded. The sanity log includes AC1. The smoke log does not include this spec. AC2 is `@regression` and did not run in either job. The diff is the feature plan, `HeaderComponent.premiumComingSoonStatus` (`getByRole('status')` plus exact text), and two tests with one tag each (`@sanity`, `@regression`). Scenarios in the feature file map to AC1 and AC2.
- **Interpretation:** The one ticket-first PR is green, conforming, and mapped to the stated criteria. CI did not execute AC2.

### 4. Ask vs guess

- **Value:** qualitative assessment
- **Measured:** Sample is PR #1 (2026-10-19), PR #2 (2026-10-20), and the AQPBT-17 session that produced PR #2. PR #1 has no ticket, label, route, or env episode. PR #2 uses the story’s routes and the status text confirmed on the failure snapshot. In that session the first status locator used an accessible name; the snapshot showed the message as text on an unnamed `status` node, and the locator was changed to match that text before the local run passed. No numeric ask-versus-guess ratio was counted.
- **Interpretation:** The cited sample has one corrected locator assumption and no invented route, label, or env value left in the PR.

## Summary

- **Top reliability risk:** Seven green runs show no Playwright retry, but AC2 has never executed in CI, so a green pull-request check does not cover that criterion.
- **Next action:** Run the Playwright workflow with `workflow_dispatch` so the `@regression` slice, including AQPBT-17 AC2, is in the next report.
