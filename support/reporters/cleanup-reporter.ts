import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { cleanupTrackedRecords } from '../cleanup-records';
import { loadTrackedRecords } from '../record-tracker';

class CleanupReporter implements Reporter {
  private appUrl = '';

  onBegin(config: FullConfig): void {
    this.appUrl =
      config.projects[0]?.use?.baseURL?.toString() ??
      process.env.APP_URL ??
      '';
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    if (result.status === 'passed' || result.status === 'skipped') {
      return;
    }
    const pending = loadTrackedRecords();
    if (pending.length > 0) {
      console.warn(
        `[cleanup-reporter] ${pending.length} tracked record(s) remain after failed test "${test.title}"`,
      );
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (!this.appUrl) {
      console.warn('[cleanup-reporter] APP_URL missing; skipping API cleanup');
      return;
    }

    const { deleted, remaining } = await cleanupTrackedRecords(this.appUrl);
    if (deleted.length > 0) {
      console.log(
        `[cleanup-reporter] Deleted ${deleted.length} tracked record(s) via API`,
      );
    }
    if (remaining.length > 0) {
      console.warn(
        `[cleanup-reporter] ${remaining.length} tracked record(s) could not be deleted; kept for retry`,
      );
    }
  }
}

export default CleanupReporter;
