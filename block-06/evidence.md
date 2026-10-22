# Block 6 — Evidence Report

Branch at the time of writing: `p35-api-discovery` at `9bdd4d4`. That commit sits on `origin/main` (`3867ba4`). P30, P31, P32, and P33 exist only on their own branches. This report does not re-run tests.

## 1. Executive Summary

Block 6 produced a readable baseline, one ticket-backed Playwright spec, a controlled locator-drift and heal pair, a failing product-bug test that was not healed, a scoring harness with an empty answer key, an API catalog with ten local API tests, and a deterministic evidence scorer with safety-gate hooks. P29 and P36 are on `main`. P30 through P33 and P35 are open pull requests and are not merged.

Four words are used differently below.

- **Implemented** means the files and commits exist and were inspected.
- **Executed** means a command was run and a result was retained, either as a GitHub Actions run or as a local result recorded in a pull-request body, a proof file, or this session.
- **Inspected** means the text was read and was not re-executed for this report.
- **Not yet tested** means no retained run covers that claim.

Green sanity or smoke in GitHub Actions is not evidence that API tests, the P33 harness, the P32 AC5 spec, the P32 hook tests, or the P36 scorer tests ran in CI. Those workflows run `npm run test:sanity` on push and `npm run test:smoke` on pull request.

## 2. Evidence by Task

### P29 — Reproducible baseline

**Implementation.** Commit `a551b69` on `main` updates `README.md` with install and run steps and adds `eval-report.md`. The report is dated 2026-10-19. All four metrics are insufficient data. The reviewed window is three `playwright.yml` runs and PR #1 only. There is no P29 pull request.

**Executed evidence.** Push Actions run [39327792563](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39327792563) on `a551b69` succeeded. The push job checks out the repo and runs `npm run test:sanity`.

**Inspected evidence.** `README.md` and `eval-report.md` on `main`.

**Not yet tested.** A separate fresh-clone rehearsal. No log of that rehearsal is in the repository. The CI checkout is the only retained clean-checkout run, and it is a sanity slice, not a documented clone exercise.

**References.** `README.md`, `eval-report.md`, commit `a551b69`.

### P30 — Feature delivery

**Implementation.** Two unmerged branches.

- `p30-aqpbt-17-go-premium` at `97aed25` adds `features/AQPBT-17.feature.md`, `tests/aqpbt-17-go-premium.spec.ts`, and a header locator. [PR #2](https://github.com/elenakombarov/agentic-qa-buddytime/pull/2) is open against `main`.
- `p30-eval-report-update` at `c3365f9` changes only `eval-report.md`. [PR #3](https://github.com/elenakombarov/agentic-qa-buddytime/pull/3) is open against `main`.

AC1 is tagged `@sanity`. AC2 is tagged `@regression` and uses an empty `storageState`. The plan is Markdown, not a Playwright BDD feature.

**Executed evidence.** PR #2 states that a local run of `tests/aqpbt-17-go-premium.spec.ts` passed 2 tests, with auth setup also passing. This report did not re-run that spec. Actions on PR #2: push sanity [39511795095](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39511795095) passed, and pull-request smoke [39511801896](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39511801896) passed. Actions on PR #3: sanity [39513502936](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39513502936) and smoke [39513537677](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39513537677) passed. Smoke and sanity do not run `@regression`, so CI did not run AC2.

**Inspected evidence.** The spec, the feature Markdown, and both PR bodies. PR #2 links Jira `AQPBT-17` and says not to transition or close that issue. This report did not re-query Jira. PR #3 states flake 0/22 and generation-gate 1/1. Those figures were not recomputed here.

**Not yet tested.** AC2 in CI. A Jira transition for `AQPBT-17`. Neither branch is on `main`, so `main` has no AQPBT-17 spec. `eval-report.md` on `main` still describes the P29 window.

**References.** `features/AQPBT-17.feature.md`, `tests/aqpbt-17-go-premium.spec.ts`, `pages/components/header.component.ts`, commits `97aed25` and `c3365f9`, PRs #2 and #3, Jira `AQPBT-17`.

### P31 — Locator drift and controlled self-heal

**Implementation.** Drift commit `a49f5c5` on `p31-intentional-locator-drift` changes one locator in `pages/communities.page.ts` to the accessible name `P31 drifted create-group link`. Draft [PR #4](https://github.com/elenakombarov/agentic-qa-buddytime/pull/4) targets `main` and says it must not be merged. Heal commit `6b0a80f` on `heal/create-group-link` restores `getByRole('link', { name: '+ Create group' })`. [PR #5](https://github.com/elenakombarov/agentic-qa-buddytime/pull/5) targets `p31-intentional-locator-drift`, not `main`.

**Executed evidence.** PR #4 records a local `@sanity` timeout waiting for the drifted name. Push sanity [39667821418](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39667821418) failed. Pull-request smoke [39667909676](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39667909676) passed. That smoke job does not include the drifted `@sanity` test. PR #5 records a local re-run of 3/3 for the same grep. Push sanity [39672247353](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39672247353) passed, and pull-request smoke [39674482950](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39674482950) passed.

**Inspected evidence.** The one-line diffs. PR #5 says the scorer first returned `act`, side `drift`, score 75, rule 6, then `escalate`, side `drift`, score 55, rule 7, decision id `98990b584178`, after a human created `.test-artifacts/approvals/98990b584178.json`. That file is not in git. `.test-artifacts/` is gitignored. This report did not open the approval file. `main` still has `+ Create group` in `pages/communities.page.ts`.

**Not yet tested.** A merged heal. The approval file was not inspected from the repository.

**References.** `pages/communities.page.ts`, `tests/aqpbt-3-communities-new.spec.ts`, commits `a49f5c5` and `6b0a80f`, PRs #4 and #5.

### P32 — Real application bug and assertion protection

**Implementation.** Commits `4bad349` and `ea51755` on `p32-real-app-bug`. The branch adds `tests/aqpbt-5-dashboard-manage-kids.spec.ts`, dashboard locators, `docs/proofs/p32-real-bug-not-healed.md`, and a narrower fix in `.cursor/hooks/guard-test-assertions.mjs` with `.cursor/hooks/guard-test-assertions.test.mjs`. [PR #6](https://github.com/elenakombarov/agentic-qa-buddytime/pull/6) is open against `main`. These files are not on `main` or on `p35-api-discovery`.

The spec title is `AC5 — empty Add child focuses Birth year and adds no child @e2e`. It keeps `toBeFocused()` and marks the test with `test.fail` for `AQPBT-16`.

**Executed evidence.** The proof file says a local AC5 run received inactive instead of focused, that `toHaveCount` passed, and that the later expected-failure run exited 0. It also says `node --test .cursor/hooks/guard-test-assertions.test.mjs` passed 7 tests. It records scorer output `act`, side `bug`, score 60, rule 6, decision id `614c5c8421dc`. This report did not re-run those commands. Actions on PR #6: push sanity [39682889434](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39682889434) and pull-request smoke [39682929897](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39682929897) passed. Neither job runs an `@e2e` spec or the hook's `node --test` file.

**Inspected evidence.** `docs/proofs/p32-real-bug-not-healed.md`. It names Jira `AQPBT-16` as an existing bug related to story `AQPBT-5`, says no second bug was filed, and says a request to delete the last `expect` was refused. Jira was not re-queried for this report. The PR body's test-plan boxes for the AC5 run and the hook tests are still unchecked.

**Not yet tested.** CI coverage of AC5 and of the hook regression file. A live Jira status check.

**References.** `tests/aqpbt-5-dashboard-manage-kids.spec.ts`, `pages/dashboard.page.ts`, `docs/proofs/p32-real-bug-not-healed.md`, `.cursor/hooks/guard-test-assertions.mjs`, `.cursor/hooks/guard-test-assertions.test.mjs`, commits `4bad349` and `ea51755`, PR #6, Jira `AQPBT-16` and `AQPBT-5`.

### P33 — Scoring harness

**Implementation.** Commit `4bc885b` on `p33-scoring-harness` adds `evals/README.md`, `evals/triage/answer-key.json`, `evals/score.ts`, `evals/score.test.ts`, and `.cursor/skills/score-agent/SKILL.md`. [PR #7](https://github.com/elenakombarov/agentic-qa-buddytime/pull/7) is open against `main`. The branch is not on `main`.

**Executed evidence.** The PR body says `npx tsx --test evals/score.test.ts` passed 9 tests and that `npx tsc --noEmit --strict evals/score.ts evals/score.test.ts` passed. This report did not re-run either command. Actions on PR #7: push sanity [39691625282](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39691625282) and pull-request smoke [39691661710](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39691661710) passed. Those jobs do not run `evals/score.test.ts`.

**Inspected evidence.** `evals/triage/answer-key.json` is `[]`. There is no `evals/<agent>/runs/` directory. The README says an empty key, or fewer than two runs, prints insufficient data for agreement.

**Not yet tested.** The instructor's 10 seeded cases. Three independent agent runs. Any real accuracy or agreement figure. The PR states that those cases were not provided.

**References.** `evals/README.md`, `evals/triage/answer-key.json`, `evals/score.ts`, `evals/score.test.ts`, `.cursor/skills/score-agent/SKILL.md`, commit `4bc885b`, PR #7.

### P35 — API discovery and API tests

**Implementation.** Commit `9bdd4d4` on `p35-api-discovery`. [PR #8](https://github.com/elenakombarov/agentic-qa-buddytime/pull/8) is open against `main`. `api/CATALOG.md` records 12 observed requests. Ten `api/*.api.spec.ts` files carry one `@api` tag each. `playwright.config.ts` adds project `api`. `npm run test:api` is `playwright test --project=api`.

**Executed evidence.** Local commands `npx playwright test --project=api` and `npm run test:api` each listed the same 10 API tests plus 2 setup tests and passed 12/12. Global teardown logged `Deleted child 548ba55e-7aa2-4fc6-9ab1-69c323d1b85e` and `Deleted child 13d4811a-ec99-4d0f-9c2c-0fcf58a80ce9`, one id per run. After each run, `GET /api/v1/me` showed Mia and Maria only. Actions on PR #8: push sanity [39702966191](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39702966191) and pull-request smoke [39703001711](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39703001711) passed. Those jobs did not run the API project.

**Inspected evidence.** `api/CATALOG.md`, including its Not Yet Tested section. The create helper sends `avatarKey`. The catalogued UI create omitted `avatarKey` and `gender`.

**Not yet tested.** Pagination, rate limits, 401 response bodies, unauthenticated login and child writes, item fields for `GET /api/v1/playdates?filter=upcoming`, and `GET /api/v1/playdates/{id}/ics`. API tests in CI.

**References.** `api/CATALOG.md`, `api/fixtures.ts`, `api/http.ts`, `api/*.api.spec.ts`, `playwright.config.ts`, `package.json`, commit `9bdd4d4`, PR #8.

### P36 — Deterministic evidence scorer and safety gates

**Implementation.** Both commits are on `main`, and therefore in this branch's history. `92997cf` adds `scripts/score-evidence.ts`, `scripts/score-evidence.test.ts`, `config/evidence-rubric.json`, and eight synthetic fixtures under `scripts/evidence-fixtures/`. `3867ba4` adds `.cursor/hooks/evidence-gate.mjs`, `guard-approvals.mjs`, `guard-heal-gate.mjs`, `guard-jira-bug-gate.mjs`, `guard-pr-gate.mjs`, and the wiring in `.cursor/hooks.json`, plus the related rule and skill edits. There is no P36 pull request.

**Executed evidence.** On this branch, after the audit:

```text
npx tsx --test scripts/score-evidence.test.ts
```

Result: 11 passed, 0 failed, 0 skipped. Exit code 0. Duration 453 ms. The 11 tests are the eight fixture cases (`min-act-drift`, `min-act-bug`, `min-escalate`, `missing-required`, `contradiction`, `neutral-oracle`, `flaky`, `model-score`) plus `rejects an unknown flag`, `committed tests/ files are read from git HEAD`, and `uncommitted tests/ files are not evidence`. The run used those local fixtures and `--verify-only`. It did not execute live safety hooks, a Jira write, a self-heal, or app cleanup. Push Actions [39480502698](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39480502698) on `3867ba4` succeeded and ran the sanity slice only. No Actions run is recorded with head `92997cf` alone. Sanity does not run `scripts/score-evidence.test.ts`.

**Inspected evidence.** The scorer, the rubric, the fixture directory, and the gate scripts. No `tsconfig.json` and no `typescript` dependency are in the project. `package.json` has no typecheck script, so no TypeScript check was run.

**Not yet tested.** A CI run of the 11 scorer tests. A `workflow_dispatch` full-suite run. A live exercise of the safety-gate hooks.

**References.** `scripts/score-evidence.ts`, `scripts/score-evidence.test.ts`, `config/evidence-rubric.json`, `scripts/evidence-fixtures/`, `.cursor/hooks/evidence-gate.mjs`, `.cursor/hooks/guard-approvals.mjs`, `.cursor/hooks/guard-heal-gate.mjs`, `.cursor/hooks/guard-jira-bug-gate.mjs`, `.cursor/hooks/guard-pr-gate.mjs`, `.cursor/hooks.json`, commits `92997cf` and `3867ba4`.

## 3. Verification Matrix

| Task | Local verification | GitHub Actions | Outstanding limitations |
|---|---|---|---|
| P29 | None retained for a fresh clone | Push sanity [39327792563](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39327792563) passed | Eval metrics are insufficient data. No clone log. |
| P30 | PR #2 claims 2 passed for the AQPBT-17 spec. Not re-run here. | Sanity and smoke passed on PRs #2 and #3 | AC2 is `@regression` and was not in those CI jobs. PR #3 metrics were not recomputed. |
| P31 | Drift timeout and heal 3/3 are recorded in the PR bodies | Drift push sanity failed. Drift smoke passed. Heal sanity and smoke passed | Approval file is gitignored. Neither PR is merged. Smoke did not run the drifted test. |
| P32 | Proof claims an expected AC5 failure and 7 hook tests. Not re-run here. | Sanity and smoke on PR #6 passed | CI did not run the `@e2e` spec or the hook tests. PR checklist boxes are unchecked. |
| P33 | PR #7 claims 9 harness tests and a strict `tsc` pass. Not re-run here. | Sanity and smoke on PR #7 passed | CI did not run the harness. Answer key is empty. No seeded cases and no agent runs. |
| P35 | Both API commands passed 12/12, including setup. Teardown deleted one child per run. | Sanity and smoke on PR #8 passed | CI did not run the API project. |
| P36 | `npx tsx --test scripts/score-evidence.test.ts`: 11 passed, 0 failed, 0 skipped, exit 0, 453 ms | Push sanity [39480502698](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39480502698) passed | CI did not run the scorer tests. No typecheck. Gates were not exercised live. |

## 4. Open Pull Requests

All of the following remain open and unmerged.

| PR | Title | Head | Base | Note |
|---|---|---|---|---|
| [#2](https://github.com/elenakombarov/agentic-qa-buddytime/pull/2) | P30: AQPBT-17 Go Premium coming-soon checks | `p30-aqpbt-17-go-premium` | `main` | Open |
| [#3](https://github.com/elenakombarov/agentic-qa-buddytime/pull/3) | P30: Refresh Agentic QA evaluation report | `p30-eval-report-update` | `main` | Open |
| [#4](https://github.com/elenakombarov/agentic-qa-buddytime/pull/4) | P31: Intentional locator drift for self-healing proof | `p31-intentional-locator-drift` | `main` | Draft |
| [#5](https://github.com/elenakombarov/agentic-qa-buddytime/pull/5) | P31: Heal the create-group link locator | `heal/create-group-link` | `p31-intentional-locator-drift` | Open. Does not target `main`. |
| [#6](https://github.com/elenakombarov/agentic-qa-buddytime/pull/6) | P32: Real App Bug Triage and Assertion Safety Proof | `p32-real-app-bug` | `main` | Open |
| [#7](https://github.com/elenakombarov/agentic-qa-buddytime/pull/7) | P33: scoring harness | `p33-scoring-harness` | `main` | Open |
| [#8](https://github.com/elenakombarov/agentic-qa-buddytime/pull/8) | P35: API catalog and first API tests | `p35-api-discovery` | `main` | Open |

P36 is already on `main` as commits `92997cf` and `3867ba4`. It has no pull request.

## 5. Known Limitations

- `evals/triage/answer-key.json` on the P33 branch is `[]`.
- The instructor did not provide 10 seeded cases.
- There are no three independent P33 agent runs, and no agreement score against a real key.
- The 10 API tests passed locally. They are not part of the sanity or smoke CI jobs.
- The P32 AC5 spec is `@e2e`, and the hook file is `node --test`. CI sanity and smoke do not run them. The proof claims local runs. The PR checklist still leaves those boxes open.
- The P31 approval file `.test-artifacts/approvals/98990b584178.json` is cited in PR #5 and is not in git.
- P29 has no retained repository log of a fresh-clone rehearsal.
- `playwright-bdd` is not a dependency and is not referenced. Feature plans are Markdown files.
- No instructor sign-off is recorded in the repository or in these pull requests.
- No `workflow_dispatch` full-suite Actions run was found for this block.
- The P36 scorer run did not execute the live safety-gate hooks, a Jira write, a self-heal, or app cleanup. No TypeScript typecheck exists in this repo.

## 6. Module 1 in One Paragraph

The project shows a Playwright suite organized with page objects, a signed-in setup project, and tracked cleanup for records a test creates, plus a GitHub Actions workflow that runs a sanity slice on push and a smoke slice on pull request. Agent skills and hooks route ticket work, locator repair, and bug reporting, and the P31 pair shows a drifted locator being restored only after an evidence decision rather than by weakening an assertion. The P32 spec leaves a real BuddyTime focus bug failing under `test.fail`, the P35 catalog and API project check observed HTTP contracts without sending those tests through CI, and the P36 scorer turns fixture evidence into a deterministic decision while the safety gates themselves were not exercised live. What remains visible is the limit of an autonomous QA agent: green CI does not cover every proof, several proofs sit on unmerged branches, the scoring answer key is empty, and no instructor sign-off is stored with the work.
