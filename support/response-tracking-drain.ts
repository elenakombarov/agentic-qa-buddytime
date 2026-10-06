/** Fixed detail for operators; never echoes raw rejection payloads. */
export const SAFE_TRACKING_ERROR_DETAIL = 'response auto-tracking failed';

/** User-safe message from a tracking rejection (never includes tokens or response data). */
export function sanitizeTrackingError(_reason: unknown): string {
  return SAFE_TRACKING_ERROR_DETAIL;
}

/**
 * Registers a response-tracking promise: rejections are stored immediately so they
 * survive after the task is removed from `pendingTracking`.
 */
export function registerResponseTrackingTask(
  pendingTracking: Set<Promise<void>>,
  trackingErrors: unknown[],
  task: Promise<void>,
): void {
  pendingTracking.add(task);
  task.then(
    () => {
      pendingTracking.delete(task);
    },
    (reason: unknown) => {
      trackingErrors.push(reason);
      pendingTracking.delete(task);
    },
  );
}

/**
 * Waits for in-flight tracking tasks, then throws if any rejection was recorded.
 */
export async function finalizeResponseTracking(
  pendingTracking: Set<Promise<void>>,
  trackingErrors: unknown[],
): Promise<void> {
  if (pendingTracking.size > 0) {
    await Promise.allSettled([...pendingTracking]);
  }

  if (trackingErrors.length > 0) {
    const detail = trackingErrors.map(sanitizeTrackingError);
    throw new Error(
      `Child create response auto-tracking failed (${trackingErrors.length}): ${detail.join('; ')}`,
    );
  }
}
