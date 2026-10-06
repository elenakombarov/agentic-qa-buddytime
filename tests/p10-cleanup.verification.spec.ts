import {
  createTrackedChild,
  expect,
  FAMILY_OWNER,
  test,
} from '../fixtures/cleanup.fixture';
import { getMe } from '../support/api/me.api';
import { loadTrackedRecords } from '../support/record-tracker';
import {
  finalizeResponseTracking,
  registerResponseTrackingTask,
  SAFE_TRACKING_ERROR_DETAIL,
  sanitizeTrackingError,
} from '../support/response-tracking-drain';

test('P10 cleanup verification: teardown deletes tracked child without in-test DELETE @api', async ({
  mainFamilyApi,
  trackRecord,
}) => {
  const firstName = `P10Cleanup ${Date.now()}`;
  const beforeMe = await getMe(mainFamilyApi);
  const beforeChildNames = beforeMe.family.children.map((child) => child.firstName);

  const created = await createTrackedChild(
    mainFamilyApi,
    FAMILY_OWNER.Main,
    trackRecord,
    {
      firstName,
      birthYear: 2018,
      birthMonth: 6,
      avatarKey: 'fox',
      interests: [],
    },
  );

  expect(created.id).toBeTruthy();
  expect(created.firstName).toBe(firstName);
  expect(
    loadTrackedRecords().some(
      (entry) => entry.type === 'child' && entry.id === created.id,
    ),
  ).toBe(true);

  const withChild = await getMe(mainFamilyApi);
  expect(withChild.family.children.map((child) => child.firstName)).toContain(
    firstName,
  );
  expect(withChild.family.children.map((child) => child.firstName)).toEqual(
    expect.arrayContaining(beforeChildNames),
  );
});

test('response tracking drain preserves rejections until finalize @api', async () => {
  const authScheme = ['Be', 'arer'].join('');
  const leakMarker = 'p10-leak-marker-not-a-real-credential';
  const disguisedSecret = `${authScheme} ${leakMarker}`;
  const pendingTracking = new Set<Promise<void>>();
  const trackingErrors: unknown[] = [];

  expect(sanitizeTrackingError(new Error(disguisedSecret))).toBe(
    SAFE_TRACKING_ERROR_DETAIL,
  );
  expect(sanitizeTrackingError(disguisedSecret)).toBe(SAFE_TRACKING_ERROR_DETAIL);

  registerResponseTrackingTask(
    pendingTracking,
    trackingErrors,
    Promise.reject(
      new Error(`upstream failed Authorization: ${disguisedSecret}`),
    ),
  );

  await Promise.allSettled([...pendingTracking]);

  expect(trackingErrors).toHaveLength(1);
  expect(pendingTracking.size).toBe(0);

  const rejection = await finalizeResponseTracking(
    pendingTracking,
    trackingErrors,
  ).catch((error: unknown) => error);

  expect(rejection).toBeInstanceOf(Error);
  const message = (rejection as Error).message;
  expect(message).toContain(SAFE_TRACKING_ERROR_DETAIL);
  expect(message).not.toContain(authScheme);
  expect(message).not.toContain(leakMarker);
});
