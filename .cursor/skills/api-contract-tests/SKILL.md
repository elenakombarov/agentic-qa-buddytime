---
name: api-contract-tests
description: Generates Playwright API contract tests from observed rows in api/CATALOG.md. Use when the user asks for API contract tests, coverage for a catalogued endpoint, or a positive and signed-out check the catalog already records. Does not invent endpoints, statuses, or fields.
---

# API contract tests

Generate evidence-based contract specs under [`api/`](../../../api/). Follow [`api-conventions.mdc`](../../../.cursor/rules/api-conventions.mdc). The constitution and [`api-cleanup`](../api-cleanup/SKILL.md) stay authoritative; do not restate them. If a call is not in the catalog, stop and use [`api-discovery`](../api-discovery/SKILL.md). Do not invent an endpoint, status, field, or contract.

[`api/CATALOG.md`](../../../api/CATALOG.md) is the observed reference. A status, path, content type, or field type is observed only when that file records it from a response that was read. Types in [`support/api/`](../../../support/api/) restate those rows; they are not a second source. Not Yet Tested bullets, and anything the catalog does not mention, are assumptions. This repo has no separate authoritative API document. If one is identified, name it and reconcile it with the catalog before changing a test.

## Tests

Import `test` and `expect` from [`api/fixtures.ts`](../../../api/fixtures.ts). Specs live in `api/*.api.spec.ts` and run in the Playwright `api` project (`npx playwright test --project=api`), which depends on `setup`. Use relative paths. `baseURL` is `process.env.APP_URL`.

Put exactly one `@api` tag on each `test()`. Do not tag `test.describe()`.

**Positive.** Signed-in call with `mainFamilyApi`. For a catalogued safe GET that returned 200, use `readSignedIn` from [`api/http.ts`](../../../api/http.ts) (status 200 and `application/json; charset=utf-8`), then the shape helpers for fields the catalog records. Use `expectStringOrNull` for a string-or-null field. If the body was an empty array, assert the array only. For a supported write, use the existing [`support/api/`](../../../support/api/) client and its observed status (`createChild` expects 201). Do not assume every endpoint returns 200.

**Intentional error.** Only when the catalog records that negative result. A signed-out GET whose Evidence includes unauthenticated status 401 uses `unauthenticatedApi` and `expectSignedOut`. Do not add a 401 for login, child create, or child delete; those unsigned calls were not sent. Do not invent another 4xx or 5xx.

Use `altFamilyApi` only when the test needs the second family. Do not use the built-in `request` fixture as an authenticated context. Do not `route.fulfill` the endpoint under test.

## Writes

Follow [`api-cleanup`](../api-cleanup/SKILL.md). Create a child only with `createTrackedChild` and unique data (`Date.now()`, or an existing factory). Stop when cleanup for that record type has not been verified. Do not create an untracked persistent record.

## Verification

1. Read the catalog table, Not Yet Tested, and Discovery limitations.
2. Read [`api/*.api.spec.ts`](../../../api/) and skip a positive or signed-out check that already exists. An `@api` test under `tests/` is not coverage in the `api` project.
3. Select catalogued endpoints whose positive call, or whose observed negative call, has no spec yet.
4. Generate only those tests, and only where the catalog records the status, content type, and fields being asserted.
5. Run `npx playwright test --project=api` once.
6. Report pass or fail, and the catalog rows that still have no positive test or no observed negative test.

Never weaken or delete an assertion to make a test pass. Never change application behavior to satisfy a test.
