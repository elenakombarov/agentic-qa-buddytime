# Block 7 — Evidence Pack

Branch at the time of writing: `p35-api-discovery` at `8ca2180`. `origin/p35-api-discovery` is `74004ed`. This branch is ahead of that remote by 3 commits (`437fb8b`, `bf3ed28`, `8ca2180`). This pack does not re-run tests and does not start a GitHub Actions workflow.

Three labels are used below.

- **Executed and passed** means a retained command finished and the check it reports passed.
- **Observed but not independently tested** means a response was read and written into `api/CATALOG.md`, and no separate spec asserts that fact on its own.
- **Not yet tested** means the catalog lists it under Not Yet Tested, or no retained run covers the claim.

## 1. Block 7 overview

Block 7 adds an API job beside the existing UI job, records Calendar traffic in the catalog, and adds the rule, skill, and agent path that keeps later API work on observed contracts. P37 through P39 are on `origin/p35-api-discovery`. P40 through P42 are local only.

| Task | Commit | Files | State |
|---|---|---|---|
| P37 — API job in CI | `613faf6` | `.github/workflows/playwright.yml` | Pushed. First Actions run of that job failed. Later pushes of the repaired profile test are green. |
| Profile assertion repair | `8a66c92` | `api/me.api.spec.ts` | Pushed. `gender` and `avatarKey` use `expectStringOrNull`. The `P35Api` name check is gone. |
| P38 — API conventions | `3abe01b` | `.cursor/rules/api-conventions.mdc` | Pushed. |
| P39 — API discovery | `74004ed` | `.cursor/skills/api-discovery/SKILL.md`, `api/CATALOG.md` | Pushed. Calendar observations are in the catalog. This is `origin/p35-api-discovery`. |
| P40 — API contract tests skill | `437fb8b` | `.cursor/skills/api-contract-tests/SKILL.md` | Local only. No new spec was generated. |
| P41 — API test writer | `bf3ed28` | `.cursor/agents/api-test-writer.md` | Local only. |
| P42 — Orchestrator routing | `8ca2180` | `.cursor/rules/qa-orchestrator.mdc`, `.cursor/rules/constitution.mdc` | Local only. Constitution change is the `api-test-writer` agent index line. |

No application code was changed in these commits. No screenshot was produced for this pack.

## 2. API discovery

### Confirmed endpoints and observed contracts

`api/CATALOG.md` records these calls. Every row's Evidence cell says the call was executed. Field types are from response bodies that were read. Sample tokens, passwords, and emails are not in the catalog.

| Method | Path | Observed status | Safe for tests in the catalog |
|---|---|---|---|
| POST | `/api/v1/auth/login` | 200 | No. Authentication setup, not a cleanup-backed CRUD write. |
| GET | `/api/v1/me` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/connections` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/availability` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/playdates?filter=upcoming` | 200. Body was an empty array. Signed out: 401. | Yes |
| GET | `/api/v1/playdates` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/matches?days=21` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/communities` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/communities/{id}` | 200. Signed out: 401. | Yes |
| GET | `/api/v1/events` | 200. 365 objects. Signed out: 401. | Yes |
| POST | `/api/v1/children` | 201 | Yes, because the matching delete returned 204. |
| DELETE | `/api/v1/children/{id}` | 204 | Yes. Cleanup for the child created above. |

Signed-in GETs and the child write used `Authorization: Bearer`. The catalog records content type `application/json; charset=utf-8` on the safe GETs, including the signed-out 401s. The 401 body was not inspected.

P39 opened Calendar (`/calendar`) while signed in and updated existing rows. That page requested four calls already in the catalog:

- `GET /api/v1/me` — 200, same content type. Children had `gender` and `avatarKey` as string or null. Interest arrays were empty. Birth months on that body were numbers.
- `GET /api/v1/connections` — 200, same content type. Community arrays were empty.
- `GET /api/v1/playdates?filter=upcoming` — 200, empty array, same content type.
- `GET /api/v1/events` — 200, 365 objects, same content type. `endsAt`, `communityId`, and `communityName` were null on every object. `childId` and `childName` were string or null.

No other `/api/v1` request was observed on that page. Signed-out requests were not sent on that pass. `googleCalendarUrl` was not followed. An ICS URL was not requested.

### Documented, observed, and assumed

- **Documented.** `api/CATALOG.md` is the observed reference in the repo. `.cursor/rules/api-conventions.mdc` states that types in `support/api/` restate those rows and are not a second source. The same rule states that this repo has no separate authoritative API document.
- **Observed.** Each catalog row above, including the Calendar notes in the Evidence column. Route prefetches (`GET` with `?_rsc=`) for `/app`, `/friends`, `/communities`, `/availability`, `/playdates`, `/birthdays`, `/profile`, and `/admin` returned 200 during the Calendar pass. Those bodies were not read. `POST /cdn-cgi/rum` returned 204 and was left out of the table. `GET /favicon.ico` returned 404 and was left out of the table.
- **Assumed.** Anything under Not Yet Tested, and any status or field the catalog does not mention.

### Remaining discovery limitations

These limits are copied from the catalog's Discovery limitations and Not Yet Tested sections.

- The first login POST failed with `net::ERR_CONNECTION_CLOSED` before an HTTP status. The retry returned 200.
- Friends and Profile called only `GET /api/v1/me` and `GET /api/v1/connections`.
- `GET /api/v1/communities/{id}` was triggered by Birthdays, not by opening a community from the Communities page.
- Playdate and community field unions were confirmed with a later authenticated GET of the same URLs. Those GETs did not create or change data.
- The signed-in header was read on `GET /api/v1/me`. Child create and delete ran in that same session. Their request headers were not read separately.
- `GET /api/v1/playdates?filter=upcoming` was an empty array, so its item shape is unknown.
- Pagination, error bodies, and rate limits were not exercised.
- `GET /api/v1/playdates/{id}/ics` appeared only as `icsUrl` text.
- No existing children were modified during discovery.
- AppRoute pages not opened: Landing, Sign up, Forgot password, Communities new, Playdates new, Admin.
- Write calls other than login and the one child create/delete were not sent. No edits, invites, approvals, or deletes of existing data.

## 3. API contract coverage

The Playwright `api` project runs `api/*.api.spec.ts` and depends on `setup`. Each contract `test()` has one `@api` tag. A positive check and a signed-out check live in the same `test()` for every safe GET below. `readSignedIn` requires status 200 and `application/json; charset=utf-8`. `expectSignedOut` requires status 401 and that same content type. `expectSignedOut` does not read the body.

`tests/p10-cleanup.verification.spec.ts` also carries `@api`. Those tests sit under `tests/` and are not part of the `api` project. They are outside this coverage table.

### Executed and passed — authenticated requests

Latest local run of `npx playwright test --project=api` on current `HEAD`: 12 passed, 0 failed, 0 skipped, 12.7s. Both setup tests passed. Details are in section 6.

| Spec check | Authenticated call | What the passing spec asserts |
|---|---|---|
| `api/me.api.spec.ts` | `GET /api/v1/me` | 200, JSON content type, and the catalogued profile shape. `gender` and `avatarKey` are string or null. `interests` is an array. |
| `api/connections.api.spec.ts` | `GET /api/v1/connections` | 200, JSON content type, and the catalogued connection shape. `communities` is an array. |
| `api/availability.api.spec.ts` | `GET /api/v1/availability` | 200, JSON content type, rules, and exceptions. |
| `api/playdates.api.spec.ts` | `GET /api/v1/playdates?filter=upcoming` | 200, JSON content type, and an array. Item fields are not asserted. |
| `api/playdates.api.spec.ts` | `GET /api/v1/playdates` | 200, JSON content type, and the catalogued playdate shape. `icsUrl` is matched as text. The ICS URL is not requested. |
| `api/playdates.api.spec.ts` | `GET /api/v1/matches?days=21` | 200, JSON content type, and the catalogued match shape. |
| `api/communities.api.spec.ts` | `GET /api/v1/communities` | 200, JSON content type, and the catalogued list shape. |
| `api/communities.api.spec.ts` | `GET /api/v1/communities/{id}` | 200 for an id taken from that list, JSON content type, and the catalogued member shape. |
| `api/events.api.spec.ts` | `GET /api/v1/events` | 200, JSON content type, and the catalogued event shape, including null `endsAt`, `communityId`, and `communityName`. |
| `api/children.api.spec.ts` | `POST /api/v1/children`, then `GET /api/v1/me` | One tracked child is created and then appears on the profile. The spec sends `avatarKey: 'fox'` and an empty `interests` array. It does not assert `gender` or `avatarKey` on the created child. Global teardown deletes that child. |

`POST /api/v1/auth/login` has no contract spec. The catalog marks it as setup. The two setup tests in the latest API run passed, which is the retained sign-in evidence.

### Executed and passed — intentional 401

Each safe GET spec above calls `expectSignedOut` in the same `test()` as its 200 check. One `@api` tag covers both. There is no second test for the 401.

The children spec does not send an unsigned create or delete. The catalog says those unsigned calls were not sent.

### Observed but not independently tested

- Calendar's four GETs are recorded in the catalog. The specs call the same paths through the API client. They do not open `/calendar`.
- `DELETE /api/v1/children/{id}` returning 204 is catalogued and is what global teardown performs. No spec asserts 204 itself.
- The discovery create omitted `gender` and `avatarKey` and observed both null. The children spec sends `avatarKey` and does not assert those two response fields.
- 401 content type is asserted. The 401 JSON body is not.
- RSC prefetch bodies, `POST /cdn-cgi/rum`, and `GET /favicon.ico` were seen in the browser log and are not specs.

### Not yet tested

From `api/CATALOG.md`:

- Pagination. No page, cursor, or limit was observed.
- Error response formats and error response bodies. No application 4xx or 5xx JSON body was read. No 429 and no rate-limit header was observed.
- Login, child create, and child delete without a token.
- `GET /api/v1/playdates/{id}/ics`.
- `googleCalendarUrl`.
- Item fields for `GET /api/v1/playdates?filter=upcoming`.
- Other values of `filter` and `days`.
- `POST /api/v1/children` with `gender`, `avatarKey`, or a non-empty `interests` array. The children spec does send `avatarKey: 'fox'`, and the catalog bullet still lists that request shape as not yet tested. The spec does not assert the resulting `gender` or `avatarKey`.
- `DELETE /api/v1/children/{id}` returning 404. Only 204 was observed.
- Object fields inside connection `communities`. The observed arrays were empty.
- Whether `birthMonth` on `GET /api/v1/me` children can be null, and whether those `interests` items can be non-empty.
- Whether event `endsAt`, `communityId`, and `communityName` can be non-null. The events spec asserts the nulls that were observed.
- Whether `connection.canRequestAt` can be non-null.
- Whether playdate `cancelledAt` can be null.
- The unopened AppRoute pages listed above.
- Write calls other than login and the one child create/delete.

## 4. Rules, skills, and agents

Inspected on `HEAD`. These files describe behavior. This pack did not invoke the agents.

### API conventions

`.cursor/rules/api-conventions.mdc` applies to `api/**` and `support/api/**`. It points specs at `api/*.api.spec.ts`, project `api`, `mainFamilyApi`, `unauthenticatedApi`, and relative paths under `APP_URL`. It names `api/CATALOG.md` as the observed reference, `readSignedIn` as 200 plus the JSON content type, and `expectSignedOut` as 401 plus that content type, and only when the catalog records the signed-out status. Writes go through `createTrackedChild`. One `@api` tag goes on `test()`, not on `describe()`. The rule forbids `route.fulfill` of the endpoint under test, weakened assertions, and application changes made to satisfy a test.

### API discovery

`.cursor/skills/api-discovery/SKILL.md` records calls from the signed-in browser network log and updates `api/CATALOG.md` only when discovery is requested. It reuses storage state, confirms the page with `browser_snapshot`, and records only requests the page made. It does not write specs or send POST, PUT, PATCH, or DELETE. P39 is the retained use of that procedure on `/calendar`.

### API contract tests

`.cursor/skills/api-contract-tests/SKILL.md` generates specs from catalog rows: a positive check, and a signed-out 401 only when the catalog records it. It skips a check that already exists, allows the positive and signed-out checks in one `test()`, and tells the writer to run `npx playwright test --project=api` once. It forbids invented endpoints, weakened assertions, and application changes. P40 added the skill. No spec was added in that commit.

### API test writer

`.cursor/agents/api-test-writer.md` writes only under `api/*.api.spec.ts`, from a catalogued endpoint. A missing catalog row stops and goes to api-discovery. After an authorized change it runs the API project once, reports pass and fail, and does not rerun to fix a failure. It does not self-heal, weaken an assertion, edit application code, or log a secret.

### Orchestrator routing and API hard stop

`.cursor/rules/qa-orchestrator.mdc` keeps the Ticket and No ticket paths on UI work and `test-writer`. An API contract or discovery request uses the API contract route: read the catalog, run api-discovery and stop when the call is absent, otherwise delegate to `api-test-writer`. One run is `npx playwright test --project=api`.

API failure is a hard stop. The rule says not to triage it, not to enter Heal on red, and not to repair the failing API test. It forbids self-heal, a weakened assertion, an edit to an API contract or to `api/CATALOG.md`, and an application code change. Heal on red is limited to UI locator failures. A failure in `api/*.api.spec.ts`, or from `npx playwright test --project=api`, stops before the decision table.

The constitution agent index lists `api-test-writer`. The constitution skills index lists `api-discovery` and `api-contract-tests`. That index edit is uncommitted and is not part of `8ca2180`. The orchestrator skills table lists both skills as well.

## 5. CI evidence

This pack did not start a workflow. The runs below already existed on `p35-api-discovery`. Job conclusions and artifact names were read from GitHub while writing this pack. The HTML reports were not re-opened here, so this section does not restate a CI test count.

### Existing API job

`.github/workflows/playwright.yml` still triggers on `push`, `pull_request`, and `workflow_dispatch`. Job `test` is unchanged: push runs `npm run test:sanity` and uploads `playwright-report-sanity`; pull request runs `npm run test:smoke` and uploads `playwright-report-smoke`; `workflow_dispatch` runs `npx playwright test` under the name regression. Job `api` checks out the repo, sets up Node 20 with the npm cache, runs `npm ci`, installs Chromium with dependencies, runs `npx playwright test --project=api`, and uploads `playwright-report/` as `playwright-report-api` with retention 30 days when the job was not cancelled. It uses the same `APP_*` secrets as the UI job. No `workflow_dispatch` run is recorded for this block.

### Earlier red API job

Push run [39842870766](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39842870766) on `613faf6` (`P37: API job in CI`) completed with workflow conclusion failure. Job `api` failed. Job `sanity` succeeded. The retained investigation of that API job: `GET /api/v1/me returns the observed family profile @api` failed at `api/me.api.spec.ts:50` on the first try and both retries, because a null `gender` was allowed only when `firstName` started with `P35Api`. The other 11 tests in that job passed. Teardown deleted tracked child `f3110f7c-2ecb-4a35-9e0e-169d17b037b3`. The trace still showed `GET /api/v1/me` status 200. That failure was classified as a test assumption. Commit `8a66c92` removed the prefix check.

Pull-request run [39842877686](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39842877686) on the same commit also completed with workflow conclusion failure. Its jobs were not re-opened for this pack.

### Green API and UI jobs after the repair

These are the latest Actions runs on `origin/p35-api-discovery` (`74004ed`). Both include a green `api` job. P40, P41, and P42 are not in either SHA.

| Run | Event | Head | Jobs | Artifacts |
|---|---|---|---|---|
| [39856112216](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39856112216) | push, title `P39: API discovery skill and Calendar catalog` | `74004ed` | `api` success, `sanity` success | `playwright-report-api` id `12459598090` (256963 bytes, not expired). `playwright-report-sanity` id `12459488629` (196617 bytes, not expired). |
| [39856117437](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39856117437) | pull request, title `P35: API catalog and first API tests` | `74004ed` | `api` success, `smoke` success | `playwright-report-api` id `12459872424` (270345 bytes, not expired). `playwright-report-smoke` id `12460770707` (212230 bytes, not expired). |

Earlier green workflow conclusions on this branch, after `8a66c92` and before `74004ed`, are [39846721445](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39846721445) (push) and [39846728213](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39846728213) (pull request) at `8a66c92`, and [39850508578](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39850508578) (push) and [39850515153](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39850515153) (pull request) at `3abe01b`. Their jobs were not re-opened for this pack. The workflow conclusion on each of those four is success.

Block 6 recorded push sanity [39702966191](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39702966191) and pull-request smoke [39703001711](https://github.com/elenakombarov/agentic-qa-buddytime/actions/runs/39703001711) on `9bdd4d4`. Those runs predate the API job.

## 6. Evidence examples

### Executed and passed — authenticated 200

Command, run locally on current `HEAD` before this pack was written:

```text
npx playwright test --project=api
```

Result: 12 passed, 0 failed, 0 skipped, duration 12.7 seconds. Setup tests `authenticate main family` (4.4s) and `authenticate second family` (4.3s) passed. There were no authentication failures. Global teardown deleted the one child this run created, `d7126843-04b8-444f-81f5-aecd1d211f21`, and logged `Deleted 1 tracked record(s) via API`.

The passing test `GET /api/v1/me returns the observed family profile @api` calls `readSignedIn(mainFamilyApi, '/api/v1/me')`. That helper requires status 200 and `application/json; charset=utf-8`.

An earlier local run, after `8a66c92` and before P38, also passed 12 tests in 28.9s and deleted child `56f60467-6e20-4bde-a51f-f18c007e456e`. Block 6 recorded two still earlier 12/12 runs on `9bdd4d4`. The 12.7s run is the latest retained local result.

### Executed and passed — intentional 401

The same `GET /api/v1/me` test then calls `expectSignedOut(unauthenticatedApi, '/api/v1/me')`. That helper requires status 401 and `application/json; charset=utf-8`. The test passed in the 12.7s run, so both the 200 check and the 401 check passed inside one `test()`.

### Not yet tested

`api/CATALOG.md` lists `GET /api/v1/playdates/{id}/ics`. The path was present on playdate `icsUrl` values and was not requested. The playdates spec matches that string and does not send the GET.

## 7. Readiness checklist and remaining limitations

| Check | Result |
|---|---|
| Working tree before this pack | Clean, on `p35-api-discovery`, ahead of `origin/p35-api-discovery` by 3 commits |
| Latest local `npx playwright test --project=api` | Executed and passed: 12 passed, 0 failed, 0 skipped, 12.7s. Both setup tests passed. Teardown deleted the created child. |
| API job present in `.github/workflows/playwright.yml` | Inspected. UI job and its slices are still present. |
| Latest pushed SHA `74004ed` | Existing Actions: push `api` and `sanity` success; pull request `api` and `smoke` success. Report artifacts listed above are not expired. |
| Current `HEAD` `8ca2180` | No Actions run. P40, P41, and P42 are unpushed. |
| Catalog, conventions, discovery skill, contract skill, API test writer, orchestrator hard stop | Inspected on `HEAD`. |
| One passing 200 and one passing 401 | Both are the `GET /api/v1/me` test in the 12.7s run. |
| One explicit Not Yet Tested scenario | `GET /api/v1/playdates/{id}/ics` |

Remaining limitations:

- P40, P41, and P42 have no GitHub Actions run. The green API job is evidence for `74004ed`, which includes P37, the profile repair, P38, and P39.
- This pack did not open the Playwright HTML reports, so it does not restate how many tests those green jobs printed.
- The first API job, on `613faf6`, failed. The repair is `8a66c92`. The later green jobs are the retained CI evidence after that repair.
- 401 bodies, unsigned login and child writes, ICS download, `googleCalendarUrl`, pagination, rate limits, and the other Not Yet Tested bullets remain untested.
- Upcoming playdate item fields, empty `communities` arrays, and several null-only fields are observed shapes. Specs that only assert an array, or that assert today's null, do not establish the unseen variants.
- No `workflow_dispatch` run is recorded for this block.
- No instructor sign-off is recorded in the repository.
