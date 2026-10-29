# Authorization probe plan

Written before any probe request. Sources: `api/CATALOG.md` table rows and `api/authorization.api.spec.ts`. Paths that are not table rows are out of scope. `POST /api/v1/auth/login` is skipped.

No token, password, email, rsvp value, auth header, child id, or child name is recorded here.

## Proposal

- Scope: this plan, then `api/authz-probe.api.spec.ts`, one Playwright run, then `qa-run/authz-report.json`. No application code, catalog, or existing spec edits.
- Self-assessment: 7. The call budget cannot cover every qualifying row with a before-and-after owner read.
- Rationale: keep `{id}` rows and caller-private reads. Give each attempted cross-family or anonymous call an owner follow-up so a denial can be scored HELD. Drop reads whose catalogued bodies name other families, and drop the second attempt when the twentieth call is already the community before-snapshot.
- Unknowns: whether the main family has any availability ids or community ids will be known only after those owner reads. An empty availability id set cannot prove the alt body is someone else's. An empty community list means the `{id}` attempt is not sent.

## Qualifying rows

| Row | Why it qualifies | This run |
|---|---|---|
| GET `/api/v1/me` | Caller profile: parent, family, children | Alt and anonymous |
| GET `/api/v1/connections` | Caller's connections; names other families | Not attempted |
| GET `/api/v1/availability` | Caller's rules and exceptions | Alt only |
| GET `/api/v1/playdates?filter=upcoming` | Caller's playdates | Not attempted |
| GET `/api/v1/playdates` | Caller's playdates; names other families | Not attempted |
| GET `/api/v1/matches?days=21` | Match list; names other families | Not attempted |
| GET `/api/v1/communities` | Caller's communities | Not an attempt. Main GET is id discovery only |
| GET `/api/v1/communities/{id}` | Path contains `{id}` | Alt only |
| GET `/api/v1/events` | Caller's events, including the rsvp field and child ids | Alt only |
| POST `/api/v1/children` | Creates one family's child | Main setup only. Alt and anonymous are not allowed writes |
| DELETE `/api/v1/children/{id}` | Path contains `{id}` | Alt and anonymous, disposable child only |

## Numbered HTTP calls

Maximum 20. Later calls are not sent after any 5xx, or if create does not return 201. Calls 15–16 are sent only when the disposable child is still on the main profile. Calls 18–20 are sent only when call 17 returns a community id. No id is invented.

| # | Caller | Method and path | Role |
|---|---|---|---|
| 1 | main | POST `/api/v1/children` | Setup via `createTrackedChild`. Stop if not 201 |
| 2 | main | GET `/api/v1/me` | Baseline profile |
| 3 | alt | GET `/api/v1/me` | Attempt |
| 4 | main | GET `/api/v1/me` | Follow-up for 3 |
| 5 | anonymous | GET `/api/v1/me` | Attempt |
| 6 | main | GET `/api/v1/me` | Follow-up for 5 |
| 7 | main | GET `/api/v1/availability` | Baseline |
| 8 | alt | GET `/api/v1/availability` | Attempt |
| 9 | main | GET `/api/v1/availability` | Follow-up for 8 |
| 10 | main | GET `/api/v1/events` | Baseline |
| 11 | alt | GET `/api/v1/events` | Attempt |
| 12 | main | GET `/api/v1/events` | Follow-up for 11 |
| 13 | alt | DELETE `/api/v1/children/{id}` | Attempt against the disposable child |
| 14 | main | GET `/api/v1/me` | Follow-up for 13 |
| 15 | anonymous | DELETE `/api/v1/children/{id}` | Attempt, only if the child is still listed |
| 16 | main | GET `/api/v1/me` | Follow-up for 15, only if 15 was sent |
| 17 | main | GET `/api/v1/communities` | Discover one id. Not an attempt |
| 18 | main | GET `/api/v1/communities/{id}` | Before snapshot, only if an id was observed |
| 19 | alt | GET `/api/v1/communities/{id}` | Attempt |
| 20 | main | GET `/api/v1/communities/{id}` | Follow-up for 19 |

## Not attempted this run

- GET `/api/v1/connections` as alt and as anonymous. The catalog says this list names other families. Budget kept for `{id}` rows and caller-private reads.
- GET `/api/v1/playdates?filter=upcoming` as alt and as anonymous. Same reason.
- GET `/api/v1/playdates` as alt and as anonymous. Playdate families name other families.
- GET `/api/v1/matches?days=21` as alt and as anonymous. Match families name other families.
- GET `/api/v1/communities` as alt and as anonymous. The main GET is discovery only.
- GET `/api/v1/communities/{id}` as anonymous. Call 18 is the owner before-snapshot so the alt read can be compared. No call remains for an anonymous read plus its own follow-up.
- GET `/api/v1/availability` as anonymous.
- GET `/api/v1/events` as anonymous.
- POST `/api/v1/children` as alt or anonymous. The only allowed create is the main family's disposable child.
- POST `/api/v1/auth/login`.

Out of scope, because they are not table rows: `GET /api/v1/playdates/{id}/ics`, Google Calendar URLs, a wrong or expired token, and unsigned login or child create.

## How a result is scored

Evidence is the attempt status plus booleans. HELD needs an owner follow-up whose snapshot matches the owner snapshot taken before that attempt. A 401, 403, or 404 without that follow-up is undocumented. A 5xx is undocumented, and the probe sends nothing further.

BREACHED if any of these is true:

- GET `/api/v1/me`: the body contains the main family id, parent id, parent email, disposable child id, disposable child name, or another main-family child id.
- GET `/api/v1/availability`: the body contains a main-family rule or exception id, the parent email, or the disposable child id or name.
- GET `/api/v1/events`: the body contains a main-family event id, a main-family rsvp value, or the disposable child id or name. A pre-existing main-family child id alone is undocumented: the catalog does not say whether events can name a connected family's child.
- DELETE `/api/v1/children/{id}`: the owner follow-up no longer lists that disposable child, or the delete body contains the parent email, family id, a pre-existing child id, an event rsvp value, or the disposable child name. The id was already in the request path, so the id echoing in the body is not treated as new private data.
- GET `/api/v1/communities/{id}`: the body contains the parent email, a main-family availability id, or a main-family rsvp value. Member family names and member children are catalogued. Their presence is not a breach.

Undocumented when it is not a breach and any of these is true: the body was not read, the owner follow-up is missing or differed, the main profile was not parsed, availability had no id to compare, events had no id to compare, or the only event overlap is a pre-existing child id. The report states which of those applies.

Connections, community members, playdate families, and match families naming other families is not a breach. Those reads are not attempted in this run.
