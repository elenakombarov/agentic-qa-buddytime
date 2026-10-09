---
name: test-data-reset
description: Deletes records that Playwright tests created in the app under test, using the delete calls in support/api-client.ts. Use only when the user explicitly asks to reset test data after an interrupted run left records behind.
disable-model-invocation: true
---

# Test data reset (destructive)

Manual cleanup for **tracked** records only — rows in [`.test-artifacts/created-records.jsonl`](../../../.test-artifacts/created-records.jsonl) written by [`support/record-tracker.ts`](../../../support/record-tracker.ts). Never deletes IDs that were not recorded by our tests (shared MVP data from other users stays untouched).

There is **no** [`support/api-client.ts`](../../../support/) in this repository. Delete routing reuses [`support/cleanup-records.ts`](../../../support/cleanup-records.ts), which today supports **only** the `child` type (P10-verified `DELETE /api/v1/children/{id}` in [`support/api/children.api.ts`](../../../support/api/children.api.ts)). Other record types are reported as unsupported and stay in the tracker. Do not duplicate API logic in specs or ad-hoc scripts.

## When to run

Only when the user **explicitly** invokes this skill (e.g. `/test-data-reset`) after an interrupted run left tracked records behind. Plain-language requests like “clean up the test data” must **not** auto-run this skill — confirm intent and name the skill first.

## Steps

1. **Confirm intent** — destructive; scope is tracked records only, not the whole environment.
2. **Auth files** (real runs only) — for each `owner` in the selected tracker rows (`main` → [`playwright/.auth/user.json`](../../../playwright/.auth/user.json), `alt` → [`playwright/.auth/alt-user.json`](../../../playwright/.auth/alt-user.json)). If missing, run setup before delete:
   ```bash
   npx playwright test --project=setup
   ```
3. **Dry-run first** unless the user already confirmed deletion in this thread (no auth or `APP_URL` required):
   ```bash
   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts --dry-run
   ```
4. **Execute** (after confirmation):
   ```bash
   npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts
   ```
   Optional filter: `--type child` (only types registered in [`support/cleanup-records.ts`](../../../support/cleanup-records.ts)).

Real execution requires `APP_URL` in the environment (same as Playwright). The CLI exits non-zero if any selected row failed or is unsupported.

## HTTP outcomes

| Status | Meaning |
|--------|---------|
| **401** | Storage state expired or invalid — re-run `--project=setup`, then retry. |
| **404** | Already removed in the app — dropped from the tracker; counted separately from **Deleted** (204). |

## Result template

After the script finishes, report:

```text
Scope · <all tracked | type:…> · Found · <n> · Deleted · <n> · Failed · <n>
Already removed (HTTP 404) · <n>   # when non-zero
```

**Deleted** = HTTP 204 only. **Already removed** = HTTP 404 only.

## Since v1

`disable-model-invocation: true` — run only when invoked by name; destructive work must not auto-trigger. Unlike v1’s “delete everything”, this utility deletes **only** what our tracker recorded, so a shared MVP environment is not wiped for other teams.
