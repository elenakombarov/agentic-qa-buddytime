# Block 10 — Authorization evidence

Sources: `qa-run/authz-report.json`, `qa-run/authz-plan.md`, and `api/CATALOG.md`. No request was sent while writing this file. Tokens, credentials, emails, and child ids are not copied. `{id}` stands for the disposable child. `<APP_TOKEN>` stands for a saved family token and is not a real value.

## 1. HELD

Evidence item:
Family B (`alt`) attempts to `DELETE` family A's disposable child.

Basis:
HELD in `qa-run/authz-report.json` for `DELETE /api/v1/children/{id}`, who `alt`, status 404. The plan scores HELD only when the main family's follow-up snapshot matches the snapshot taken before the attempt. `api/CATALOG.md`, Authorization (two families), records the same direction: the second family's delete, then the main family's `GET /api/v1/me`.

Test performed:
Plan calls 13 and 14. Call 1 creates the disposable child as the main family and is setup, not the attempt. Call 13 is family B's delete of that child. Call 14 is the main family's `GET /api/v1/me` follow-up. The report's evidence for the delete is `ownerFollowUp=true`, `ownerParsed=true`, `childStillPresent=true`, `childRemoved=false`, and `ownerUnchanged=true`.

Command or request:
`DELETE /api/v1/children/{id}` as family B, `Authorization: Bearer <APP_TOKEN>`.
Follow-up: `GET /api/v1/me` as family A, `Authorization: Bearer <APP_TOKEN>`.

Expected status:
The plan does not require a status code by itself. HELD requires the follow-up profile to match the profile from before the delete, with that child still listed. The catalog's own-child delete is 204. The catalog's second-family delete is the observed 404 below.

Actual status:
404 on family B's `DELETE /api/v1/children/{id}` (`qa-run/authz-report.json`). The catalog records content type `application/json; charset=utf-8` for that 404. The catalog records the main family's following `GET /api/v1/me` as 200, with the same content type.

Expected body:
The plan does not record an expected JSON document. It treats this delete as HELD when the owner follow-up still lists the disposable child and the delete body does not contain the main parent's email, the main family id, a pre-existing main-family child id, an event rsvp value, or the disposable child's name. An id that only echoes the `{id}` already sent in the path is not treated as new private data.

Actual body:
The response JSON was not stored. The probe read the delete body (`bodyRead=true`) and recorded these absences: `containsParentEmail=false`, `containsFamilyId=false`, `containsPreexistingMainChild=false`, `containsRsvpValue=false`, `containsDisposableChildName=false`. The catalog says that 404 body was non-empty and that its fields were not copied. The follow-up profile was parsed. `childStillPresent=true` and `childRemoved=false`. The catalog says that child was still in `family.children`. `ownerUnchanged=true`.

What this proves:
Family B's delete of family A's disposable child returned 404, and family A's following `GET /api/v1/me` still listed that child. For this child, the boundary held.

What this does not prove:
It does not prove a particular 404 error shape. Those fields were not recorded. It does not prove that every cross-family delete returns 404, that family A cannot delete family B's child, that a signed-in caller is ever answered with 403, or that a wrong or expired token is rejected. The catalog says the only delete statuses observed in that section are 404 for the second family and 401 with no token.

Open question:
None for this attempt. The unread fields of the 404 body, and the unsent reverse delete, are separate catalog items and are not claimed here.

## 2. Undocumented / open question

Evidence item:
The main family deleting a child that belongs to the second family.

Basis:
not yet tested

Test performed:
None. `api/CATALOG.md`, Authorization (two families), lists this under Not yet tested. `qa-run/authz-plan.md` does not number this call. The only allowed child create in that plan is the main family's disposable child. No second-family child was created for a delete.

Command or request:
Not sent. The catalog names the unsent call as the main family calling `DELETE /api/v1/children/{id}` for a child that belongs to the second family. No URL, token, or body was recorded for it.

Expected status:
None recorded. The catalog does not state a status for this call.

Actual status:
None. The request was not sent.

Expected body:
None recorded.

Actual body:
None. The request was not sent.

What this proves:
Nothing. There is no response.

What this does not prove:
It does not prove whether family A can delete family B's child, or which status or body that call would return. The observed 404 applies only to the opposite direction: family B deleting family A's disposable child.

Open question:
Product Owner: when the main family calls `DELETE /api/v1/children/{id}` for a child that belongs to the second family, should that delete be refused, and what should the response be? This request was not sent. The only observed cross-family delete is the second family deleting the main family's disposable child, which returned 404 and left that child on the main family's profile.
