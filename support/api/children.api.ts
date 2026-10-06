import type { APIRequestContext } from '@playwright/test';

/** Observed POST `/api/v1/children` JSON body. */
export type CreateChildRequestBody = {
  firstName: string;
  birthYear: number;
  birthMonth: number;
  avatarKey: string;
  interests: string[];
};

/** Observed 201 response body from POST `/api/v1/children`. */
export type CreateChildResponseBody = {
  id: string;
  firstName: string;
  birthYear: number;
  birthMonth: number;
  age: number;
  gender: string | null;
  interests: string[];
  avatarKey: string;
};

/**
 * Creates a child via POST `/api/v1/children`.
 * @returns Parsed 201 body; the new record id is in `id`.
 */
export async function createChild(
  api: APIRequestContext,
  body: CreateChildRequestBody,
): Promise<CreateChildResponseBody> {
  const response = await api.post('/api/v1/children', { data: body });
  if (response.status() !== 201) {
    throw new Error(`createChild: expected 201, got ${response.status()}`);
  }
  return (await response.json()) as CreateChildResponseBody;
}

/** Deletes a child via DELETE `/api/v1/children/{id}` (observed 204, empty body). */
export async function deleteChild(
  api: APIRequestContext,
  childId: string,
): Promise<void> {
  const outcome = await tryDeleteChild(api, childId);
  if (!outcome.ok) {
    throw new Error(`deleteChild: expected 204 or 404, got ${outcome.status}`);
  }
}

/**
 * Deletes a child without throwing. 204 and 404 count as success (already gone).
 * Other statuses leave the record for a later cleanup retry.
 */
export async function tryDeleteChild(
  api: APIRequestContext,
  childId: string,
): Promise<{ ok: true } | { ok: false; status: number }> {
  const response = await api.delete(`/api/v1/children/${childId}`);
  const status = response.status();
  if (status === 204 || status === 404) {
    return { ok: true };
  }
  return { ok: false, status };
}
