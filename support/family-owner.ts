/** Credential family that owns a record created during a test. */
export type RecordOwner = 'main' | 'alt';

/** @deprecated Use RecordOwner */
export type FamilyOwner = RecordOwner;

export const FAMILY_OWNER = {
  Main: 'main',
  Alt: 'alt',
} as const satisfies Record<string, RecordOwner>;

export const RECORD_TYPE = {
  Child: 'child',
} as const;
