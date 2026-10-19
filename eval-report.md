# Eval report

| Field | Value |
|-------|-------|
| Generated | 2026-10-19 |
| Window | Last N=30 `playwright.yml` runs requested; 3 runs exist, all reviewed. PRs reviewed through #1 (2026-10-19). |
| Trigger | `eval-report.md` was missing |

## Metrics

### 1. Flake rate

- **Value:** insufficient data
- **Measured:** Three passing `playwright.yml` runs: [39322938284](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39322938284) (push, `main`), [39312576071](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39312576071) (pull_request, attempt 3), [39312496769](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39312496769) (push, attempt 2). The default window is 30 runs. Retry logs were not scored into a rate.
- **Interpretation:** Three green runs are too small a window to state a flake rate.

### 2. Heal success rate

- **Value:** insufficient data
- **Measured:** `gh pr list --state all` returned PR #1 only (`P27: CI workflow`, branch `p28-headless-generation`, closed). No `heal/` branch and no self-heal or “assertions unchanged” body.
- **Masked regressions:** insufficient data
- **Interpretation:** There is no heal PR to score, so the rate and the masked-regression count are undefined.

### 3. Generation-gate pass rate

- **Value:** insufficient data
- **Measured:** PR #1 adds CI workflows. Its title and body do not reference an `AQPBT-*` key, a `features/<KEY>.feature.md` plan, or new Playwright coverage from a ticket.
- **Interpretation:** No ticket-first generation PR is in the window.

### 4. Ask vs guess

- **Value:** insufficient data
- **Measured:** PR sample is #1 (2026-10-19), a CI workflow pull request with no ticket, label, route, or env-value episode. Agent transcripts were not scored.
- **Interpretation:** The available sample does not support an ask-versus-guess count.

## Summary

- **Top reliability risk:** The suite has three green CI runs and no scored retry, heal, or generation history, so a reliability rate is not yet known.
- **Next action:** Refresh this report after more `playwright.yml` runs exist, and score passing-run logs for in-run Playwright retries before publishing a flake rate.
