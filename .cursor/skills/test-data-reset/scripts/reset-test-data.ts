import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { AUTH_FILE, ALT_AUTH_FILE } from '../../../../support/auth.constants';
import { cleanupTrackedRecords } from '../../../../support/cleanup-records';
import { loadTrackedRecords, type TrackedRecord } from '../../../../support/record-tracker';
import type { RecordOwner } from '../../../../support/family-owner';

dotenv.config();

type CliOptions = {
  dryRun: boolean;
  typeFilter: string | null;
};

function parseArgs(argv: readonly string[]): CliOptions {
  let dryRun = false;
  let typeFilter: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--type') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        throw new Error('--type requires a value (e.g. child)');
      }
      typeFilter = next;
      i += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dryRun, typeFilter };
}

function printUsage(): void {
  console.log(`Usage: npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts [options]

Options:
  --dry-run       List tracked targets; do not delete or change the tracker
  --type <type>   Only attempt records with this type (e.g. child)
  -h, --help      Show this help
`);
}

function scopeLabel(typeFilter: string | null): string {
  return typeFilter ? `type:${typeFilter}` : 'all tracked';
}

function ownersInRecords(records: readonly TrackedRecord[]): Set<RecordOwner> {
  return new Set(records.map((record) => record.owner));
}

function missingAuthFiles(owners: Set<RecordOwner>): string[] {
  const missing: string[] = [];
  if (owners.has('main') && !fs.existsSync(path.resolve(AUTH_FILE))) {
    missing.push(AUTH_FILE);
  }
  if (owners.has('alt') && !fs.existsSync(path.resolve(ALT_AUTH_FILE))) {
    missing.push(ALT_AUTH_FILE);
  }
  return missing;
}

function filterByType(
  records: readonly TrackedRecord[],
  typeFilter: string | null,
): TrackedRecord[] {
  if (!typeFilter) {
    return [...records];
  }
  return records.filter((record) => record.type === typeFilter);
}

function buildRecordHints(
  typeFilter: string | null,
): readonly TrackedRecord[] | undefined {
  if (!typeFilter) {
    return undefined;
  }
  return filterByType(loadTrackedRecords(), typeFilter);
}

function printResultSummary(input: {
  scope: string;
  found: number;
  deleted: number;
  failed: number;
  alreadyRemoved: number;
}): void {
  console.log('');
  console.log(
    `Scope · ${input.scope} · Found · ${input.found} · Deleted · ${input.deleted} · Failed · ${input.failed}`,
  );
  if (input.alreadyRemoved > 0) {
    console.log(`Already removed (HTTP 404) · ${input.alreadyRemoved}`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const scope = scopeLabel(options.typeFilter);
  const recordHints = buildRecordHints(options.typeFilter);

  if (options.dryRun) {
    const result = await cleanupTrackedRecords('http://dry-run.invalid', {
      records: recordHints,
      dryRun: true,
    });
    printResultSummary({
      scope,
      found: result.attempted.length,
      deleted: 0,
      failed: 0,
      alreadyRemoved: 0,
    });
    return;
  }

  const preview = await cleanupTrackedRecords('http://dry-run.invalid', {
    records: recordHints,
    dryRun: true,
  });
  const targets = preview.attempted;

  if (targets.length === 0) {
    printResultSummary({
      scope,
      found: 0,
      deleted: 0,
      failed: 0,
      alreadyRemoved: 0,
    });
    return;
  }

  const missingAuth = missingAuthFiles(ownersInRecords(targets));
  if (missingAuth.length > 0) {
    console.error(
      `Missing auth file(s): ${missingAuth.join(', ')}. Run: npx playwright test --project=setup`,
    );
    process.exit(1);
  }

  const appUrl = process.env.APP_URL ?? '';
  if (!appUrl) {
    console.error('APP_URL is not set (see .env.example).');
    process.exit(1);
  }

  const result = await cleanupTrackedRecords(appUrl, {
    records: targets,
  });

  printResultSummary({
    scope,
    found: result.attempted.length,
    deleted: result.deleted.length,
    failed: result.failed.length,
    alreadyRemoved: result.alreadyRemoved.length,
  });

  if (result.deleted.length + result.alreadyRemoved.length > 0) {
    console.log(
      `Tracker updated — ${result.remaining.length} record(s) still tracked.`,
    );
  }

  if (result.failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
