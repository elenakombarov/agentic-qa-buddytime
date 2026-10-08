---
name: api-cleanup
description: Ensures Playwright tests clean up the data they create. Use whenever generating or reviewing tests that create persistent records in the app under test (BuddyTime availability, playdates, invites, or anything else), so test data does not accumulate in the shared test environment. Apply this to every test that creates data — even if cleanup isn't explicitly requested.
paths: "tests/**"
---

# API cleanup (Playwright)

Keep the shared BuddyTime test environment free of records tests create. Tracking and teardown are centralized; specs register what they create and rely on global/reporter cleanup—not manual `afterAll` delete blocks.

## Steps

1. Import `test` and `expect` from [`fixtures/cleanup.fixture.ts`](../../../fixtures/cleanup.fixture.ts), not from `@playwright/test`.
2. **UI creates:** only certain create responses are tracked automatically today (see table). For everything else—including API setup—call `trackRecord({ type, id, owner })` immediately after a successful create, with `owner` `'main'` or `'alt'`. Prefer [`createTrackedChild`](../../../fixtures/cleanup.fixture.ts) for API child setup when applicable.
3. **No manual `afterAll` cleanup blocks** — [`fixtures/cleanup.fixture.ts`](../../../fixtures/cleanup.fixture.ts), [`global-teardown.ts`](../../../global-teardown.ts), [`global-setup.ts`](../../../global-setup.ts), and [`support/reporters/cleanup-reporter.ts`](../../../support/reporters/cleanup-reporter.ts) handle deletion via [`support/cleanup-records.ts`](../../../support/cleanup-records.ts).
4. Cleanup uses delete helpers in [`support/api/children.api.ts`](../../../support/api/children.api.ts) (invoked from [`support/cleanup-records.ts`](../../../support/cleanup-records.ts)) with the owning family’s storage state (`AUTH_FILE` for `main`, `ALT_AUTH_FILE` for `alt`). P10 verified API cleanup for tracked child records only. No UI teardown for other record types is currently documented in this repo. If a record type has no supported delete call, **stop and report a cleanup gap** before adding a test that creates that data—**never leave data behind**.
5. Never hardcode a credential. Never delete data the test did not create (only IDs recorded in [`.test-artifacts/created-records.jsonl`](../../../support/record-tracker.ts) via tracking).

## Tracked record types

Derived from [`support/family-owner.ts`](../../../support/family-owner.ts) (`RECORD_TYPE`), create/delete in [`support/api/children.api.ts`](../../../support/api/children.api.ts), and delete routing in [`support/cleanup-records.ts`](../../../support/cleanup-records.ts).

| type | create request | delete request | owner |
|------|----------------|----------------|-------|
| `child` | `POST /api/v1/children` (`createChild` in `support/api/children.api.ts`) | `DELETE /api/v1/children/{id}` (`tryDeleteChild` / `deleteChild` in `support/api/children.api.ts`) | `main` or `alt` |

### UI auto-tracking (limited)

Automatic response tracking in the cleanup fixture applies **only** to:

- Method: `POST`
- Path: ends with `/api/v1/children`
- Status: `201`, JSON body with UUID `id`
- Owner: test option `recordOwner` (default `main`)

Other entity types are not currently supported by the tracker and cleanup routing. Before generating a test that creates them, add and verify tracking and deletion support, or document an agreed UI teardown. Calling trackRecord alone is insufficient. Until then, report the cleanup gap and do not create those records.

## Helpers

- **`trackRecord`** — fixture callback; defaults `owner` to `recordOwner` when omitted.
- **`createTrackedChild(api, owner, trackRecord, body)`** — `POST /api/v1/children` + track on success ([`fixtures/cleanup.fixture.ts`](../../../fixtures/cleanup.fixture.ts)).
- **Verification reference:** [`tests/p10-cleanup.verification.spec.ts`](../../../tests/p10-cleanup.verification.spec.ts) — tracked child removed by teardown without in-test DELETE.

## When reviewing or generating tests

- If the test creates persistent data not in the table above → **report cleanup gap** (no delete in `cleanup-records`, no auto UI track).
- Use unique data (`Date.now()` / factories); track only IDs your test created.
- Two-family flows: set `test.use({ recordOwner: 'alt' })` or pass explicit `owner` on `trackRecord` to match who created the record.

## Since v1

The `paths` frontmatter field scopes this skill to test work under `tests/**`, so it stays out of context for unrelated tasks.
