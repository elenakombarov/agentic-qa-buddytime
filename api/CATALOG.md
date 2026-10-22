# API catalog

Observed against APP_URL while signed in as the main family, opening AppRoute pages one at a time. Dynamic ids are written as `{id}`. Field types are from response bodies that were read. Sample token, password, and email values are not recorded.

Authentication on signed-in calls: `Authorization: Bearer`, using the `token` string from `POST /api/v1/auth/login`. The header name was observed as `authorization` on `GET /api/v1/me`. The same signed-in browser session sent the later write calls. Token values are not recorded.

A GET is safe for tests. A write is safe only when its cleanup was also observed and verified. `POST /api/v1/auth/login` is authentication setup, not a cleanup-backed CRUD write.

| Method | Path | Page | Authentication | Observed status | Request body fields | Response top-level fields and types | Safe for tests? | Evidence |
|---|---|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/login` | Login (`/login`) | Email and password in the JSON body. The request's authentication header was not inspected. | 200 | `email` string, `password` string | Object. `token` string. `parent` object: `id` string, `email` string, `name` string, `displayName` string, `phone` null, `emailVerified` boolean | No. Authentication setup, not a cleanup-backed CRUD operation. | Executed. A first POST failed before an HTTP status (`net::ERR_CONNECTION_CLOSED`). The retry returned 200. |
| GET | `/api/v1/me` | Dashboard (`/app`), Friends (`/friends`), Communities (`/communities`), Availability (`/availability`), Playdates (`/playdates`), Birthdays (`/birthdays`), Profile (`/profile`). Dashboard fetches it again after child create and after child delete. | Authorization Bearer | 200 | None | Object. `parent` object (`id` string, `email` string, `name` string, `displayName` string, `phone` null, `emailVerified` boolean). `family` object (`id` string, `name` string, `addressText` null, `addressVisibility` string, `tz` string, `parents` array, `children` array). `isAdmin` boolean. Family parent: `id` string, `name` string, `displayName` string, `role` string. Family child: `id` string, `firstName` string, `birthYear` number, `birthMonth` number, `age` number, `gender` string, `interests` array (empty on the observed children), `avatarKey` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/connections` | Dashboard, Friends, Communities, Availability, Playdates, Birthdays, Profile | Authorization Bearer | 200 | None | Array of objects. `id` string, `family` object (`id` string, `name` string), `children` array, `communities` array (empty on the observed items), `since` string, `status` string, `blockedByMe` boolean. Child: `id` string, `firstName` string, `birthYear` number, `birthMonth` null, `age` number, `gender` string, `interests` array of strings, `avatarKey` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/availability` | Dashboard, Availability | Authorization Bearer | 200 | None | Object. `rules` array, `exceptions` array. Rule: `id` string, `childId` null, `weekday` number, `startMin` number, `endMin` number, `hosting` string, `noticeHours` number. Exception: `id` string, `date` string, `kind` string, `startMin` number, `endMin` number, `note` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/playdates?filter=upcoming` | Dashboard | Authorization Bearer | 200 | None | Array. The observed body was empty, so item fields are unknown. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/playdates` | Playdates | Authorization Bearer | 200 | None | Array of objects (8 items on the later read). `id` string, `status` string, `startsAt` string, `endsAt` string, `locationKind` string, `locationText` string or null, `notes` string or null, `proposerFamily` object (`id` string, `name` string), `inviteeFamily` object (`id` string, `name` string), `otherFamily` object (`id` string, `name` string), `hostFamily` object (`id` string, `name` string) or null, `children` array (empty on some items), `proposedBy` object (`id` string, `name` string, `displayName` string or null), `respondedAt` string or null, `cancelledAt` string, `googleCalendarUrl` string (external URL; not requested), `icsUrl` string, `canRespond` boolean, `canCancel` boolean. Child, when present: `id` string, `firstName` string, `birthYear` number, `birthMonth` null, `age` number, `gender` string, `interests` array of strings, `avatarKey` string. Every observed `icsUrl` matched `/api/v1/playdates/{id}/ics`. That URL was not requested. | Yes | Executed. Status from the Playdates page load. Field union confirmed by a later authenticated GET of the same path. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/matches?days=21` | Playdates | Authorization Bearer | 200 | None | Array of objects. `date` string, `startMin` number, `endMin` number, `startsAt` string, `endsAt` string, `family` object (`id` string, `name` string), `suggestedHost` object (`id` string, `name` string) or null, `locationKind` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/communities` | Dashboard, Communities, Birthdays | Authorization Bearer | 200 | None | Array of objects. `id` string, `name` string, `type` string, `description` string, `myRole` string, `myStatus` string, `familiesCount` number, `pendingCount` number, `createdAt` string. | Yes | Executed. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/communities/{id}` | Birthdays. The app requested one community while that page loaded. | Authorization Bearer | 200 | None | Object. Same fields as a list item, plus `members` array. Member: `id` string, `family` object (`id` string, `name` string), `role` string, `status` string, `children` array (empty on some members), `connection` null or object, `since` string. Connection object: `id` string, `status` string, `requestedByMe` boolean, `canRequestAt` null. Child, when present: `id` string, `firstName` string, `birthYear` number, `birthMonth` null, `age` number, `gender` string, `interests` array of strings, `avatarKey` string. | Yes | Executed. Field union confirmed by a later authenticated GET of the same community id. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| GET | `/api/v1/events` | Birthdays | Authorization Bearer | 200 | None | Array of 365 objects. `id` string, `kind` string, `title` string, `childId` string or null, `childName` string or null, `startsAt` string, `endsAt` null, `venueText` string or null, `details` string or null, `cardKey` string, `status` string, `communityId` null, `communityName` null, `rsvpToken` string, `counts` object (`yes` number, `no` number, `maybe` number, `guestsComing` number), `createdAt` string, `canManage` boolean. | Yes | Executed. Types only. `rsvpToken` values were not copied. Content-Type: application/json; charset=utf-8. Unauthenticated status: 401. |
| POST | `/api/v1/children` | Dashboard | Authorization Bearer (same signed-in session) | 201 | `firstName` string, `birthYear` number, `birthMonth` number, `interests` array (empty in the observed request). `gender` and `avatarKey` were not sent. | Object. `id` string, `firstName` string, `birthYear` number, `birthMonth` number, `age` number, `gender` null, `interests` array (empty), `avatarKey` null. | Yes. The matching `DELETE /api/v1/children/{id}` for this same child returned 204, and the child no longer appeared. | Executed |
| DELETE | `/api/v1/children/{id}` | Dashboard | Authorization Bearer (same signed-in session) | 204 | Empty | Empty body | Yes. This was the cleanup for the child created above. The dashboard no longer showed that child. A following `GET /api/v1/me` did not include the test first name. The children that were already on the family remained. | Executed |

## Not Yet Tested

- Pagination. No page, cursor, or limit parameter was observed. `days=21` and `filter=upcoming` were the only queries seen.
- Error response formats. No application 4xx or 5xx JSON body was observed.
- Rate limits. No 429 and no rate-limit header was observed.
- Error response bodies. Each safe GET without a token returned 401 with content type `application/json; charset=utf-8`. The body was not inspected.
- Behavior of login, child create, and child delete without a token. Those requests were not sent.
- `GET /api/v1/playdates/{id}/ics`. The path was present on playdate `icsUrl` values and was not requested.
- `googleCalendarUrl` values point at Google Calendar and were not requested.
- Item fields for `GET /api/v1/playdates?filter=upcoming`. The body was an empty array.
- Other values of `filter` and `days`.
- `POST /api/v1/children` with `gender`, `avatarKey`, or a non-empty `interests` array.
- `DELETE /api/v1/children/{id}` returning 404. Only 204 was observed.
- Object fields inside `GET /api/v1/connections` `communities`. The observed arrays were empty.
- Whether `birthMonth`, `gender`, `avatarKey`, or `interests` items on `GET /api/v1/me` children can be null or non-empty. The observed family children had numbers, strings, and empty interest arrays.
- Whether event `endsAt`, `communityId`, and `communityName` can be non-null. Only null was observed.
- Whether `connection.canRequestAt` can be non-null. Only null was observed.
- Whether playdate `cancelledAt` can be null. Only strings were observed.
- AppRoute pages not opened: Landing, Sign up, Forgot password, Calendar, Communities new, Playdates new, Admin.
- Write calls other than login and the one child create/delete. No edits, invites, approvals, or deletes of existing data.

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
