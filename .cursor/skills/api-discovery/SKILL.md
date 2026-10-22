---
name: api-discovery
description: Records BuddyTime API calls observed in the signed-in browser network log. Use when discovering or cataloging API behavior on an unexplored application page. Read-only; does not write API tests or send write requests.
---

# API discovery

Update [`api/CATALOG.md`](../../../api/CATALOG.md) only when discovery is explicitly requested. Follow [`api-conventions.mdc`](../../../.cursor/rules/api-conventions.mdc). The constitution and [`api-cleanup`](../api-cleanup/SKILL.md) stay authoritative; do not restate them. Do not create API tests, clients, or fixtures.

## Preparation

1. Read [`api/CATALOG.md`](../../../api/CATALOG.md): the table, Not Yet Tested, and Discovery limitations.
2. List endpoints already recorded and the gaps for the requested page.
3. Do not assume which endpoints an unexplored page calls.

## Read-only discovery

1. Reuse the existing authenticated browser storage state. Never print tokens, cookies, or storageState contents. Do not rerun authentication setup.
2. Navigate to the requested page. Confirm it with `browser_snapshot`. Do not take screenshots.
3. Inspect `browser_network_requests` and `browser_network_request`. Record only requests the page actually made.
4. Do not submit forms or trigger an action whose effect is unknown.
5. Never send POST, PUT, PATCH, or DELETE. A confirming GET is allowed only for a URL the page already requested.

## Catalog updates

Keep the existing columns: Method, Path, Page, Authentication, Observed status, Request body fields, Response top-level fields and types, Safe for tests?, Evidence.

- Record content type in Evidence when it was observed.
- Write dynamic ids as `{id}`.
- Never record secrets or personal data: tokens, passwords, emails, cookies, Authorization values, or `rsvpToken` values.
- Do not invent field types for an empty array.
- Record a signed-out status only if that signed-out request was observed.

## Unknowns

Keep unverified behavior under Not Yet Tested. Add what this pass did not open or confirm under Discovery limitations. Never convert an assumption into a contract assertion.

## Safety

- Do not follow external calendar URLs (`googleCalendarUrl`).
- Do not fetch an ICS export URL unless the target page itself requested it.
- Do not modify application data.
- Stop if a requested action might create or modify data.

## Output

On an authorized discovery run, change [`api/CATALOG.md`](../../../api/CATALOG.md) only. Report the observed endpoints, the unknowns, and the evidence. Do not write specs.
