---
name: api-test-design
description: Designs API test cases as a table a human approves, from api/CATALOG.md only, before any test code exists. Use when the user asks what to test for an endpoint or an area of the API, asks for test cases, test ideas, or a test plan. Writes api/test-design/<area>.md and stops for approval. Do NOT use to write test code — that is api-contract-tests.
paths: "api/**"
---

# API test design

This skill designs test cases only. api-contract-tests writes the tests after approval.

## 1. Read the catalog

Read `api/CATALOG.md` only. This API has no specification.

Expected results come only from rows labeled executed (observed). These become characterization tests.

Anything else is a row marked "assumed — ask" or "not yet tested", with no expected result.

## 2. Create the design document

Create `api/test-design/<area>.md`.

Use one table per endpoint.

Required columns:

| ID | type (positive / negative / error) | what we send | expected status | expected body (rule, key values) | source (API.md section or OpenAPI schema) | technique |
| --- | --- | --- | --- | --- | --- | --- |

Cite the executed catalog row in the source cell. Leave expected status and expected body empty unless that row is executed (observed).

## 3. Include positive coverage

- Main success case, only when an executed row records it.
- One row for each option or default an executed row records.

## 4. Include negative coverage

Explicitly name the testing technique.

Apply techniques only where relevant to the endpoint. Do not invent unsupported requirements. A case with no executed row is "assumed — ask" or "not yet tested", with no expected result.

Boundary values:

- 0
- Smallest valid value
- Exactly at a limit
- One over the limit
- One unit more than ordered
- One cent more than received

Equivalence classes:

- Missing field
- Empty string
- Wrong type
- Negative number

State:

- Operation performed in the wrong order
- Operation performed twice

Two families:

- The same request as the other family on this family's data (apiAlt on an id apiMain created)
- With no token (apiAnonymous)

## 5. Include error coverage

- Unknown ID, without a rule. Expect a status only when an executed row records it. Otherwise mark the row "not yet tested" or "assumed — ask" and leave the expected result empty.
- Every business rule an executed row records for the endpoint: at least one attempt to violate it, expecting only the status and body that row records.

Apply unknown-ID coverage where the endpoint accepts or references an ID.

## 6. Behavior the catalog does not record as executed

- Add a row marked "assumed — ask" or "not yet tested".
- Point at the catalog gap, including a Not Yet Tested bullet when one exists.
- Do not invent an expected result.

## 7. Stop for approval

STOP after writing the design document.

Show the test-case table to the human.

Ask for explicit approval: "Please review the test design. Reply 'approved' or request changes."

Do not write test code. Do not create or modify `.spec.ts` files.
