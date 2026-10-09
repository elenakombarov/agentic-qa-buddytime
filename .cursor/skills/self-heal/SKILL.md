---
name: self-heal
description: Repairs drifted Playwright locators after a UI change — patch the POM, re-run unchanged assertions, open a PR. Use when the build is red because a locator broke, fix the drifted selector, the test broke after a UI change, or heal the suite. Use ONLY after triage classifies the red run as a test issue (drift/locator drift); NEVER for a real app bug — route those to bug-reporter instead.
---

# Self-heal (locator drift)

Repair a **single** drifted locator in a page object after triage confirms test issue (drift). Assertions in `tests/` stay unchanged; the PR proves green with a POM-only diff.

## Prerequisite

A completed triage diagnosis classified **test issue (drift)** — see [`ci-failure-triage`](../ci-failure-triage/SKILL.md).

| Classification | Action |
|----------------|--------|
| Real app bug | Stop → [`jira-bug-reporter`](../jira-bug-reporter/SKILL.md) |
| Missing or ambiguous triage | Stop → finish triage first; do not heal |
| Test issue (drift) | Proceed with this skill |

## Steps

1. **Locate the break** — From the Playwright error and trace (`npx playwright trace`), identify the failing test, the assertion line in [`tests/`](../../../tests/) (read-only), the POM property in [`pages/`](../../../pages/) that supplied the locator, and the **old locator exactly as written** in source.
2. **Re-discover live** — Use Playwright MCP `browser_navigate` + `browser_snapshot` against `APP_URL` (from `process.env` / [`.env.example`](../../../.env.example)). Target the same **role** and the **current accessible name**. Never guess from screenshots alone.
3. **Patch the POM** — Change **only** that locator (minimal diff). Keep role-based locators per [constitution](../../rules/constitution.mdc) and [`pom-conventions`](../pom-conventions/SKILL.md): no CSS, no XPath, no broadening (extra `.or()`, loose regex, or `nth()` hacks) to force green. **One locator per heal run.**
4. **Prove green** — Re-run the failing spec (same project/browser as CI when possible). Success requires **zero changes under `tests/`** — assertions unchanged.
5. **Open a PR** — Branch `heal/<short-description>`. Body uses the [report template](#report-template) below. Do **not** merge.

## Stop and escalate

Stop healing and escalate to the human (or re-triage) when:

- Green requires **any** change under `tests/` (assertion, timeout, skip, tag).
- The **same** locator error persists after live re-discovery and one careful POM patch.
- Re-run surfaces a **new** failure that looks like a **product regression** → triage again; do not heal assertions.

## Report template (PR body)

```markdown
## Self-heal: locator drift

- **CI run:** `<run id or link>`
- **Triage:** test issue (drift) — <one-line cause from triage>
- **Spec:** `tests/...` (assertions unchanged)
- **POM:** `pages/...`

### Locator diff

| Property | Old | New |
|----------|-----|-----|
| `<propertyName>` | `<exact old locator as in repo>` | `<exact new locator>` |

### Re-run

- **Command:** `npx playwright test ...`
- **Result:** pass (N/N)

**assertions unchanged**
```

## Do / Don't

| Do | Don't |
|----|--------|
| Heal only after triage says **drift** | Heal a confirmed **app bug** (use bug-reporter) |
| Patch **one** locator in `pages/` per PR | Edit `tests/` assertions, tags, or skips to go green |
| Re-discover with **role + accessible name** on `APP_URL` | Invent labels from screenshots or memory |
| Keep locators **narrow and role-based** | Add CSS/XPath or `.or()` / loose matchers to “make it pass” |
| Cite run id, old → new locator, re-run output | Merge the heal PR yourself |
| Redact credentials and emails in PR text | Paste storageState secrets or `.env` values |

## Related

- Triage: [`ci-failure-triage`](../ci-failure-triage/SKILL.md)
- Product defects: [`jira-bug-reporter`](../jira-bug-reporter/SKILL.md)
- POM rules: [`pom-conventions`](../pom-conventions/SKILL.md)

## Verify

In Block 5 (P31): a drifted locator becomes a heal PR with **assertions unchanged**.
