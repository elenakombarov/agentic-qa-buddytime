import { expect, type APIRequestContext } from '@playwright/test';

/** Observed on every safe GET, signed in and signed out. */
export const OBSERVED_JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

/** Observed status for a safe GET with no token. */
export const OBSERVED_UNAUTHENTICATED_STATUS = 401;

export async function readSignedIn(
  api: APIRequestContext,
  path: string,
): Promise<unknown> {
  const response = await api.get(path);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe(OBSERVED_JSON_CONTENT_TYPE);
  return (await response.json()) as unknown;
}

export async function expectSignedOut(
  api: APIRequestContext,
  path: string,
): Promise<void> {
  const response = await api.get(path);
  expect(response.status()).toBe(OBSERVED_UNAUTHENTICATED_STATUS);
  expect(response.headers()['content-type']).toBe(OBSERVED_JSON_CONTENT_TYPE);
}

export function asRecord(value: unknown): Record<string, unknown> {
  expect(typeof value).toBe('object');
  expect(value).not.toBeNull();
  expect(Array.isArray(value)).toBe(false);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('expected object');
  }
  return value as Record<string, unknown>;
}

export function asArray(value: unknown): unknown[] {
  expect(Array.isArray(value)).toBe(true);
  if (!Array.isArray(value)) {
    throw new Error('expected array');
  }
  return value;
}

export function expectString(value: unknown): void {
  expect(typeof value).toBe('string');
}

export function expectNumber(value: unknown): void {
  expect(typeof value).toBe('number');
}

export function expectBoolean(value: unknown): void {
  expect(typeof value).toBe('boolean');
}

export function expectNull(value: unknown): void {
  expect(value).toBeNull();
}

export function expectStringOrNull(value: unknown): void {
  expect(value === null || typeof value === 'string').toBe(true);
}

export function expectStringArray(value: unknown): void {
  for (const item of asArray(value)) {
    expectString(item);
  }
}

export function expectIdName(value: unknown): void {
  const record = asRecord(value);
  expectString(record.id);
  expectString(record.name);
}
