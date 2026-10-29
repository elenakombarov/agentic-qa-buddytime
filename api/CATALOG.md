# API catalog

Observed against APP_URL while signed in as the main family, opening AppRoute pages one at a time. Dynamic ids are written as `{id}`. Field types are from response bodies that were read. Sample token, password, and email values are not recorded.

Authentication on signed-in calls: `Authorization: Bearer`, using the `token` string from `POST /api/v1/auth/login`. The header name was observed as `authorization` on `GET /api/v1/me`. The same signed-in browser session sent the later write calls. Token values are not recorded.

A GET is safe for tests. A write is safe only when its cleanup was also observed and verified. `POST /api/v1/auth/login` is authentication setup, not a cleanup-backed CRUD write.

| Method | Path | Page | Authentication | Observed status | Request body fields | Response top-level fields and types | Safe for tests? | Evidence |
|---|---|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/login` | Login (`/login`) | Email and password in the JSON body. The request's authentication header was not inspected. | 200 | `email` string, `password` string | Object. `token` string. `parent` object: `id` string, `email` string, `name` string, `displayName` string, `phone` null, `emailVerified` boolean | No. Authentication setup, not a cleanup-backed CRUD operation. | Executed. A first POST failed before an HTTP status (`net::ERR_CONNECTION_CLOSED`). The retry returned 200. |
| GET | `/api/v1/me` | Dashboard (`/app`), Friends (`/friends`), Communities (`/communities`), Availability (`/availability`), Playdates (`/playdates`), Birthdays (`/birthdays`), Profile (`/profile`), Calendar (`/calendar`). Dashboard fetches it again after child create and after child delete. | Authorization Bearer | 200 | None | Object. `parent` object (`id` string, `email` string, `name` string, `displayName` string, `phone` null, `emailVerified` boolean). `family` object (`id` string, `name` string, `addressText` null, `addressVisibility` string, `tz` string, `parents` array, `children` array). `isAdmin` boolean. Family parent: `id` string, `name` string, `displayName` string, `role` string. Family child: `id` string, `firstName` string, `birthYear` number, `birthMonth` number, `age` number, `gender` string or null, `interests` array (empty on the observed children), `avatarKey` string or null. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. Calendar page load returned 200 with the same content type. That body had children with `gender` and `avatarKey` as strings, and one child with both null. Interest arrays on those children were empty. A signed-out request was not sent on this pass. |
| GET | `/api/v1/connections` | Dashboard, Friends, Communities, Availability, Playdates, Birthdays, Profile, Calendar (`/calendar`) | Authorization Bearer | 200 | None | Array of objects. `id` string, `family` object (`id` string, `name` string), `children` array, `communities` array (empty on the observed items), `since` string, `status` string, `blockedByMe` boolean. Child: `id` string, `firstName` string, `birthYear` number, `birthMonth` null, `age` number, `gender` string, `interests` array of strings, `avatarKey` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. Calendar page load returned 200 with the same content type. Community arrays on the observed items were empty. A signed-out request was not sent on this pass. |
| GET | `/api/v1/availability` | Dashboard, Availability | Authorization Bearer | 200 | None | Object. `rules` array, `exceptions` array. Rule: `id` string, `childId` null, `weekday` number, `startMin` number, `endMin` number, `hosting` string, `noticeHours` number. Exception: `id` string, `date` string, `kind` string, `startMin` number, `endMin` number, `note` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/playdates?filter=upcoming` | Dashboard, Calendar (`/calendar`) | Authorization Bearer | 200 | None | Array. The observed body was empty, so item fields are unknown. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. Calendar page load returned 200 with an empty array and the same content type. A signed-out request was not sent on this pass. |
| GET | `/api/v1/playdates` | Playdates | Authorization Bearer | 200 | None | Array of objects (8 items on the later read). `id` string, `status` string, `startsAt` string, `endsAt` string, `locationKind` string, `locationText` string or null, `notes` string or null, `proposerFamily` object (`id` string, `name` string), `inviteeFamily` object (`id` string, `name` string), `otherFamily` object (`id` string, `name` string), `hostFamily` object (`id` string, `name` string) or null, `children` array (empty on some items), `proposedBy` object (`id` string, `name` string, `displayName` string or null), `respondedAt` string or null, `cancelledAt` string, `googleCalendarUrl` string (external URL; not requested), `icsUrl` string, `canRespond` boolean, `canCancel` boolean. Child, when present: `id` string, `firstName` string, `birthYear` number, `birthMonth` null, `age` number, `gender` string, `interests` array of strings, `avatarKey` string. Every observed `icsUrl` matched `/api/v1/playdates/{id}/ics`. That URL was not requested. | Yes | Executed. Status from the Playdates page load. Field union confirmed by a later authenticated GET of the same path. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/matches?days=21` | Playdates | Authorization Bearer | 200 | None | Array of objects. `date` string, `startMin` number, `endMin` number, `startsAt` string, `endsAt` string, `family` object (`id` string, `name` string), `suggestedHost` object (`id` string, `name` string) or null, `locationKind` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/communities` | Dashboard, Communities, Birthdays | Authorization Bearer | 200 | None | Array of objects. `id` string, `name` string, `type` string, `description` string, `myRole` string, `myStatus` string, `familiesCount` number, `pendingCount` number, `createdAt` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/communities/{id}` | Birthdays. The app requested one community while that page loaded. | Authorization Bearer | 200 | None | Object. Same fields as a list item, plus `members` array. Member: `id` string, `family` object (`id` string, `name` string), `role` string, `status` string, `children` array (empty on some members), `connection` null or object, `since` string. Connection object: `id` string, `status` string, `requestedByMe` boolean, `canRequestAt` null. Child, when present: `id` string, `firstName` string, `birthYear` number, `birthMonth` null, `age` number, `gender` string, `interests` array of strings, `avatarKey` string. | Yes | Executed. Field union confirmed by a later authenticated GET of the same community id. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/events` | Birthdays, Calendar (`/calendar`) | Authorization Bearer | 200 | None | Array of 365 objects. `id` string, `kind` string, `title` string, `childId` string or null, `childName` string or null, `startsAt` string, `endsAt` null, `venueText` string or null, `details` string or null, `cardKey` string, `status` string, `communityId` null, `communityName` null, `rsvpToken` string, `counts` object (`yes` number, `no` number, `maybe` number, `guestsComing` number), `createdAt` string, `canManage` boolean. | Yes | Executed. Types only. `rsvpToken` values were not copied. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. Calendar page load returned 200 with 365 objects and the same content type. `endsAt`, `communityId`, and `communityName` were null on every object. `childId` and `childName` were string or null. A signed-out request was not sent on this pass. |
| POST | `/api/v1/children` | Dashboard | Authorization Bearer (same signed-in session) | 201 | `firstName` string, `birthYear` number, `birthMonth` number, `interests` array (empty in the observed request). `gender` and `avatarKey` were not sent. | Object. `id` string, `firstName` string, `birthYear` number, `birthMonth` number, `age` number, `gender` null, `interests` array (empty), `avatarKey` null. | Yes. The matching `DELETE /api/v1/children/{id}` for this same child returned 204, and the child no longer appeared. | Executed |
| DELETE | `/api/v1/children/{id}` | Dashboard | Authorization Bearer (same signed-in session) | 204 | Empty | Empty body | Yes. This was the cleanup for the child created above. The dashboard no longer showed that child. A following `GET /api/v1/me` did not include the test first name. The children that were already on the family remained. | Executed |

## Authorization (two families)

A disposable child was created with `POST /api/v1/children` as the main family, then the calls below were sent. The create client accepts only status 201, and both creates continued. Response bodies on the rejected deletes were not read. Child ids, names, and tokens are not recorded.

- executed (observed): `DELETE /api/v1/children/{id}` as the second family, for a child the main family had just created. Status 404. Content-Type `application/json; charset=utf-8`. The body was non-empty.
- executed (observed): `GET /api/v1/me` as the main family after that delete. Status 200. Content-Type `application/json; charset=utf-8`. That child id was still in `family.children`.
- executed (observed): `GET /api/v1/me` as the second family after that delete. Status 200. Content-Type `application/json; charset=utf-8`. That child id was not in `family.children`.
- executed (observed): `DELETE /api/v1/children/{id}` with no Authorization header, for a second child the main family had just created. Status 401. Content-Type `application/json; charset=utf-8`. The body was non-empty.
- executed (observed): `GET /api/v1/me` as the main family after that unsigned delete. Status 200. Content-Type `application/json; charset=utf-8`. That child id was still in `family.children`.

Not yet tested:

- Fields inside the 404 and 401 delete bodies. Those bodies were not read.
- `POST /api/v1/auth/login` and `POST /api/v1/children` with no token. Those requests were not sent.
- The main family deleting a child that belongs to the second family.
- The owning family deleting an unknown child id. The 404 above was the second family's token against a child that still existed for the owner. The owner's own delete of their child remains the 204 row in the table.
- A wrong or expired token. Only a missing token was sent.
- A 403 on this delete. That status was not observed. The only delete statuses observed in this section are 404 for the second family and 401 with no token.
- Cross-family or unsigned calls other than this child delete.

## Not Yet Tested

- Pagination. No page, cursor, or limit parameter was observed. `days=21` and `filter=upcoming` were the only queries seen.
- Error response formats. The 404 and 401 child-delete bodies in Authorization (two families) were not read. No other application 4xx or 5xx JSON body was observed.
- Rate limits. No 429 and no rate-limit header was observed.
- Error response bodies. Each safe GET without a token returned 401 with content type `application/json; charset=utf-8`. The body was not inspected. The unsigned child-delete body was also not read.
- Behavior of login and child create without a token. Those requests were not sent. Unsigned child delete is recorded under Authorization (two families).
- `GET /api/v1/playdates/{id}/ics`. The path was present on playdate `icsUrl` values and was not requested.
- `googleCalendarUrl` values point at Google Calendar and were not requested.
- Item fields for `GET /api/v1/playdates?filter=upcoming`. The body was an empty array.
- Other values of `filter` and `days`.
- `POST /api/v1/children` with `gender`, `avatarKey`, or a non-empty `interests` array.
- The owning family calling `DELETE /api/v1/children/{id}` for an unknown id. That request was not sent. A 404 was observed only for the second family's delete in Authorization (two families).
- Object fields inside `GET /api/v1/connections` `communities`. The observed arrays were empty.
- Whether `birthMonth` on `GET /api/v1/me` children can be null, and whether `interests` items on those children can be non-empty. Calendar's `GET /api/v1/me` had numeric birth months and empty interest arrays. `gender` and `avatarKey` were string or null on that response.
- Whether event `endsAt`, `communityId`, and `communityName` can be non-null. Only null was observed, including on the Calendar page load.
- Whether `connection.canRequestAt` can be non-null. Only null was observed.
- Whether playdate `cancelledAt` can be null. Only strings were observed.
- AppRoute pages not opened: Landing, Sign up, Forgot password, Communities new, Playdates new, Admin.
- Write calls other than login, the owner child create/delete, and the rejected deletes in Authorization (two families). No edits, invites, or approvals were sent. No existing children were deleted.

## Discovery limitations

- The first login POST failed with `net::ERR_CONNECTION_CLOSED` before an HTTP status. The retry returned 200.
- Friends and Profile called only `GET /api/v1/me` and `GET /api/v1/connections`.
- `GET /api/v1/communities/{id}` was triggered by Birthdays, not by opening a community from the Communities page.
- Playdate and community field unions were confirmed with a later authenticated GET of the same URLs. Those GETs did not create or change data.
- The signed-in header was read on `GET /api/v1/me`. Child create and delete ran in that same session; their request headers were not read separately.
- `GET /api/v1/playdates?filter=upcoming` was an empty array, so its item shape is unknown.
- Pagination, error bodies, and rate limits were not exercised. A later signed-out GET of each safe read returned 401; that error body was not inspected.
- `GET /api/v1/playdates/{id}/ics` appeared only as `icsUrl` text. It was not called.
- No existing children were modified.
- Calendar (`/calendar`) was opened while signed in. The page requested `GET /api/v1/me`, `GET /api/v1/connections`, `GET /api/v1/playdates?filter=upcoming`, and `GET /api/v1/events`. No other `/api/v1` request was observed. No extra confirming GET was sent. Signed-out requests were not sent. `googleCalendarUrl` was not followed. An ICS URL was not requested. No form was submitted and no calendar control was clicked.
- The Calendar page also requested route prefetches (`GET` with `?_rsc=`) for `/app`, `/friends`, `/communities`, `/availability`, `/playdates`, `/birthdays`, `/profile`, and `/admin`. Each returned 200. Those bodies were not read.
- The browser sent `POST /cdn-cgi/rum` and received 204. That call is not an application API and was not added as a catalog row. This pass did not send a write.
- `GET /favicon.ico` returned 404. It is not an application API.
