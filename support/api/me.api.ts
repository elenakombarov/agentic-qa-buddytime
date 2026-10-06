import type { APIRequestContext } from '@playwright/test';

/** Observed child shape under `family.children` on GET `/api/v1/me`. */
export type MeFamilyChild = {
  id: string;
  firstName: string;
  birthYear: number;
  birthMonth: number | null;
  age: number;
  gender: string | null;
  interests: string[];
  avatarKey: string | null;
};

/** Observed GET `/api/v1/me` JSON body (partial). */
export type MeResponseBody = {
  family: {
    children: MeFamilyChild[];
  };
};

/** Returns GET `/api/v1/me` when authenticated (observed 200). */
export async function getMe(api: APIRequestContext): Promise<MeResponseBody> {
  const response = await api.get('/api/v1/me');
  if (response.status() !== 200) {
    throw new Error(`getMe: expected 200, got ${response.status()}`);
  }
  return (await response.json()) as MeResponseBody;
}

/** Names of probe children left in the family (e.g. ApiProbe from verification). */
export function findProbeChildFirstNames(me: MeResponseBody): string[] {
  return me.family.children
    .map((child) => child.firstName)
    .filter((name) => /^(ApiProbe|ProbeChild)\b/.test(name));
}
