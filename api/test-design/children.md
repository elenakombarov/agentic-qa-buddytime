# Children endpoints — test design

Scope: `POST /api/v1/children`, `DELETE /api/v1/children/{id}`, and `GET /api/v1/me` from `api/CATALOG.md`. Nested `children` arrays on other resources stay out of scope. `GET /api/v1/me` is in scope because its executed row records `family.children`.

Expected status and body are filled only for executed catalog rows. Every other row is `not yet tested` or `assumed — ask` and has no expected result.

A later test for a create may run only because the catalog marks that write safe: the matching delete of the same child returned 204. Do not delete a child the test did not create. Discovery limitations: no existing children were modified.

## POST `/api/v1/children`

| ID | type (positive / negative / error) | what we send | expected status | expected body (rule, key values) | source (API.md section or OpenAPI schema) | technique |
| --- | --- | --- | --- | --- | --- | --- |
| CH-POST-01 | positive | Authorization Bearer, main family. JSON: `firstName` string, `birthYear` number, `birthMonth` number, `interests` []. Do not send `gender` or `avatarKey`. | 201 | Object. `id` string. `firstName` string. `birthYear` number. `birthMonth` number. `age` number. `gender` null. `interests` empty array. `avatarKey` null. | `api/CATALOG.md` executed row `POST /api/v1/children` | Main success. Recorded defaults on that row: empty `interests`, omitted `gender`, omitted `avatarKey`. |
| CH-POST-02 | positive | CH-POST-01 body, plus `gender`. | | | `api/CATALOG.md` Not Yet Tested: `POST /api/v1/children` with `gender`, `avatarKey`, or a non-empty `interests` array. | not yet tested |
| CH-POST-03 | positive | CH-POST-01 body, plus `avatarKey`. | | | Same Not Yet Tested bullet. | not yet tested |
| CH-POST-04 | positive | CH-POST-01 body, with a non-empty `interests` array. | | | Same Not Yet Tested bullet. | not yet tested |
| CH-POST-05 | negative | Omit `firstName`. Send the other observed fields. | | | Catalog gap: no executed validation row. Not Yet Tested: error response formats. No application 4xx or 5xx JSON body was observed. | Equivalence: missing field. assumed — ask |
| CH-POST-06 | negative | Omit `birthYear`. Send the other observed fields. | | | Same gap. | Equivalence: missing field. assumed — ask |
| CH-POST-07 | negative | Omit `birthMonth`. Send the other observed fields. | | | Same gap. | Equivalence: missing field. assumed — ask |
| CH-POST-08 | negative | Omit `interests`. Send the other observed fields. | | | Same gap. | Equivalence: missing field. assumed — ask |
| CH-POST-09 | negative | `firstName` as an empty string. Other observed fields unchanged. | | | Same gap. | Equivalence: empty string. assumed — ask |
| CH-POST-10 | negative | `firstName` as a number. Other observed fields unchanged. | | | Same gap. | Equivalence: wrong type. assumed — ask |
| CH-POST-11 | negative | `birthYear` as a string. Other observed fields unchanged. | | | Same gap. | Equivalence: wrong type. assumed — ask |
| CH-POST-12 | negative | `birthMonth` as a string. Other observed fields unchanged. | | | Same gap. | Equivalence: wrong type. assumed — ask |
| CH-POST-13 | negative | `birthYear` negative. Other observed fields unchanged. | | | Same gap. | Equivalence: negative number. assumed — ask |
| CH-POST-14 | negative | `birthMonth` negative. Other observed fields unchanged. | | | Same gap. | Equivalence: negative number. assumed — ask |
| CH-POST-15 | negative | `birthYear` 0. Other observed fields unchanged. | | | Catalog gap: no numeric bounds recorded for `birthYear` or `birthMonth`. | Boundary: 0. assumed — ask |
| CH-POST-16 | negative | `birthMonth` 0. Other observed fields unchanged. | | | Same gap. | Boundary: 0. assumed — ask |
| CH-POST-17 | negative | `birthYear` and `birthMonth` at a smallest valid value, exactly at a limit, and one over a limit. | | | Same gap. Those limits are not in the catalog, so the values are unknown. | Boundary: smallest valid, exactly at a limit, one over the limit. assumed — ask |
| CH-POST-18 | negative | Send the observed body twice. | | | Catalog gap: no uniqueness rule recorded. | State: operation performed twice. assumed — ask |
| CH-POST-19 | negative | Observed body. No Authorization token. | | | `api/CATALOG.md` Not Yet Tested: behavior of child create without a token. Those requests were not sent. | Two families: with no token. not yet tested |
| CH-POST-20 | negative | Observed body. Authorization Bearer for the other family. | | | Catalog gap: the executed write used the main family session only. | Two families: the other family sends the same create. assumed — ask |

POST does not take an id, so unknown-id coverage does not apply. No executed row records a business-rule violation or an error status for this path. One unit more than ordered, and one cent more than received, do not apply: the body has no order quantity and no money field.

## DELETE `/api/v1/children/{id}`

| ID | type (positive / negative / error) | what we send | expected status | expected body (rule, key values) | source (API.md section or OpenAPI schema) | technique |
| --- | --- | --- | --- | --- | --- | --- |
| CH-DEL-01 | positive | Authorization Bearer, main family. DELETE `/api/v1/children/{id}` with an empty body. `{id}` is the child created by the observed POST in the same session. | 204 | Empty body. A following `GET /api/v1/me` does not include that child's first name. Children already on the family remain. The dashboard no longer shows that child. | `api/CATALOG.md` executed row `DELETE /api/v1/children/{id}` | Main success. Empty body is the recorded request. |
| CH-DEL-02 | error | Authorization Bearer, main family. DELETE `/api/v1/children/{id}` where `{id}` was never created. | | | `api/CATALOG.md` Not Yet Tested: `DELETE /api/v1/children/{id}` returning 404. Only 204 was observed. Also: error response formats. No application 4xx or 5xx JSON body was observed. | Error: unknown id. State: delete before create. not yet tested |
| CH-DEL-03 | negative | DELETE the same created `{id}` a second time. Authorization Bearer, main family. | | | Same 404 bullet. | State: operation performed twice. not yet tested |
| CH-DEL-04 | negative | DELETE the created `{id}` with no Authorization token. | | | `api/CATALOG.md` Not Yet Tested: behavior of child delete without a token. Those requests were not sent. | Two families: with no token. not yet tested |
| CH-DEL-05 | negative | Other family's Bearer token. DELETE the `{id}` the main family created. | | | Catalog gap: no second-family call on this path. The executed delete used the main family session. | Two families: the other family on this family's id. assumed — ask |
| CH-DEL-06 | error | DELETE `/api/v1/children/{id}` with an empty or otherwise unusable `{id}`. | | | Catalog gap: no id format rule and no error status recorded. | Equivalence: empty / wrong type. assumed — ask |

Do not add a case that deletes a child already on the family. Discovery limitations say no existing children were modified. The executed delete was only the child created in that session.

One unit more than ordered, and one cent more than received, do not apply. Boundary values on the id do not apply: the catalog records `id` as a string and records no numeric limit.

## GET `/api/v1/me`

| ID | type (positive / negative / error) | what we send | expected status | expected body (rule, key values) | source (API.md section or OpenAPI schema) | technique |
| --- | --- | --- | --- | --- | --- | --- |
| ME-01 | positive | Authorization Bearer, main family. No request body. | 200 | Content-Type `application/json; charset=utf-8`. Object. `isAdmin` boolean. `parent`: `id` string, `email` string, `name` string, `displayName` string, `phone` null, `emailVerified` boolean. `family`: `id` string, `name` string, `addressText` null, `addressVisibility` string, `tz` string, `parents` array, `children` array. Family parent: `id` string, `name` string, `displayName` string, `role` string. Family child: `id` string, `firstName` string, `birthYear` number, `birthMonth` number, `age` number, `gender` string or null, `interests` empty array, `avatarKey` string or null. Calendar's body included children with `gender` and `avatarKey` as strings, and one child with both null. | `api/CATALOG.md` executed row `GET /api/v1/me` | Main success. Recorded defaults: `phone` null, `addressText` null, numeric `birthMonth`, empty `interests`, `gender` string or null, `avatarKey` string or null. Same status and content type on the listed pages, including Calendar. |
| ME-02 | positive | Authorization Bearer, main family. `GET /api/v1/me` again after the observed child delete. No request body. | 200 | That child's first name is absent. Children already on the family remain. | `api/CATALOG.md` executed row `GET /api/v1/me` (dashboard fetches it again after child delete) and executed row `DELETE /api/v1/children/{id}` (following GET omitted the test first name; existing children remained). Same observation as CH-DEL-01. | State: read after the observed delete. |
| ME-03 | positive | Authorization Bearer, main family. No request body. Same call as ME-01. | | | `api/CATALOG.md` Not Yet Tested: whether `birthMonth` on `GET /api/v1/me` children can be null. Calendar's body had numeric birth months. | not yet tested. Response variant: a child with `birthMonth` null. |
| ME-04 | positive | Authorization Bearer, main family. No request body. Same call as ME-01. | | | Same Not Yet Tested bullet: whether `interests` items on those children can be non-empty. Observed interest arrays were empty. | not yet tested. Response variant: a child with a non-empty `interests` array. |
| ME-05 | negative | No Authorization token. No request body. | 401 | Content-Type `application/json; charset=utf-8`. The JSON body was not inspected, so no body keys are expected. | `api/CATALOG.md` executed row `GET /api/v1/me`: unauthenticated status 401. Not Yet Tested: each safe GET without a token returned 401 with that content type; the body was not inspected. Discovery limitations: a later signed-out GET of each safe read returned 401. | Two families: with no token. |
| ME-06 | negative | Authorization Bearer for the other family. No request body. | | | Catalog gap: `GET /api/v1/me` was read on the main family session. This path takes no id, so there is no executed call of the other family against this family's data. | Two families: the other family sends the same request. assumed — ask |
| ME-07 | negative | Empty or malformed Authorization token. No request body. | | | Catalog gap: the recorded signed-out call is no token. A bad token was not sent. Not Yet Tested covers error bodies, which were not inspected. | Equivalence: empty / wrong type. assumed — ask |
| ME-08 | negative | Authorization Bearer, main family. No request body. Same call as ME-01. | | | Catalog gap: the executed row records `parent.phone` and `family.addressText` as null. No Not Yet Tested bullet says either can be non-null. | assumed — ask. Response variant: `phone` or `addressText` non-null. |
| ME-09 | error | Repeated signed-in `GET /api/v1/me`, watching for a rate limit. | | | `api/CATALOG.md` Not Yet Tested: rate limits. No 429 and no rate-limit header was observed. | not yet tested |

`GET /api/v1/me` has no request body, no path id, and no observed query. Missing field, empty string, wrong type, and negative number do not apply to what we send. Unknown id does not apply. Boundary values, one unit more than ordered, and one cent more than received do not apply.

The catalog lists a dashboard refetch after child create and records no roster change for that GET. Presence of the created child on `GET /api/v1/me` has no expected result here.

The executed row records `isAdmin` and `emailVerified` as booleans and does not record which value. It records `family.children` as an array and does not record whether that array can be empty. Pagination parameters were not observed on this path.
