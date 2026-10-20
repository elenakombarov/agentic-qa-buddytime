/**
 * Score a failure from artifact-backed evidence. The decision is computed here;
 * a score, confidence, or weight inside the evidence file is ignored as a number
 * and forces an inconclusive result.
 *
 * Usage: npx tsx scripts/score-evidence.ts <evidence.json> [--verify-only] [--root <dir>]
 */
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MIN_EXCERPT_LENGTH = 8;
const FORBIDDEN_FIELDS = new Set(['score', 'confidence', 'weight']);
const HEAD_PREFIXES = ['tests/', 'pages/', 'features/'];

type Side = 'drift' | 'bug';
type DecisionName = 'act' | 'escalate' | 'inconclusive';

export type ScoreOptions = {
  verifyOnly: boolean;
  root: string | null;
};

export type ScoreDecision = {
  decisionId: string;
  decision: DecisionName;
  side: Side | null;
  score: number;
  oracle: boolean;
  verified: string[];
  missing: string[];
  contradictions: string[];
  rule: number;
  allowedActions: string[];
};

type EvidenceItem = {
  id: string;
  kind: string;
  artifact: string;
  line?: number;
  excerpt?: string;
};

type Evidence = {
  test: { file: string; title: string };
  items: EvidenceItem[];
};

type RequiredRule = {
  id: string;
  kind: string;
  requiredWhenSide: Side | null;
};

type WeightedRule = {
  id: string;
  kind: string;
  side: Side | null;
  weight: number;
  oracle: boolean;
};

type Rubric = {
  required: RequiredRule[];
  weighted: WeightedRule[];
  actScore: number;
  escalateScore: number;
  actMinOracles: number;
};

type VerifiedWeight = {
  id: string;
  side: Side | null;
  weight: number;
  oracle: boolean;
};

type RerunVerdict =
  | { status: 'passed' }
  | { status: 'failed'; firstErrorLine: string }
  | { status: 'unusable' };

type FlatResult = {
  passed: boolean;
  failed: boolean;
  firstErrorLine: string | null;
};

type FlatSpec = {
  title: string;
  results: FlatResult[];
};

const repoRoot = path.resolve(__dirname, '..');

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function elements(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return (value as unknown[]).slice();
}

function hasForbiddenField(value: unknown): boolean {
  for (const entry of elements(value)) {
    if (hasForbiddenField(entry)) {
      return true;
    }
  }
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  for (const [key, child] of Object.entries(record)) {
    if (FORBIDDEN_FIELDS.has(key) || hasForbiddenField(child)) {
      return true;
    }
  }
  return false;
}

function parseSide(value: unknown, label: string): Side {
  if (value === 'drift' || value === 'bug') {
    return value;
  }
  throw new Error(`${label} must be drift or bug`);
}

function parseOptionalSide(value: unknown, label: string): Side | null {
  if (value === undefined) {
    return null;
  }
  return parseSide(value, label);
}

function parseOracle(value: unknown, label: string): boolean {
  if (value === undefined) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  throw new Error(`${label} oracle must be a boolean`);
}

function parseWeight(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} weight must be a finite number`);
  }
  return value;
}

function loadRubric(): Rubric {
  const rubricFile = path.join(repoRoot, 'config', 'evidence-rubric.json');
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(rubricFile, 'utf8')) as unknown;
  } catch {
    throw new Error(`Cannot read rubric: ${rubricFile}`);
  }
  const record = asRecord(raw);
  if (!record) {
    throw new Error('Rubric must be a JSON object');
  }

  const seen = new Set<string>();
  const required: RequiredRule[] = [];
  for (const entry of elements(record.required)) {
    const item = asRecord(entry);
    if (!item || typeof item.id !== 'string' || typeof item.kind !== 'string') {
      throw new Error('Each required rubric row needs id and kind');
    }
    if (seen.has(item.id)) {
      throw new Error(`Duplicate rubric id ${item.id}`);
    }
    seen.add(item.id);
    required.push({
      id: item.id,
      kind: item.kind,
      requiredWhenSide: parseOptionalSide(item.requiredWhenSide, `${item.id} requiredWhenSide`),
    });
  }

  const weighted: WeightedRule[] = [];
  for (const entry of elements(record.weighted)) {
    const item = asRecord(entry);
    if (!item || typeof item.id !== 'string' || typeof item.kind !== 'string') {
      throw new Error('Each weighted rubric row needs id and kind');
    }
    if (seen.has(item.id)) {
      throw new Error(`Duplicate rubric id ${item.id}`);
    }
    seen.add(item.id);
    weighted.push({
      id: item.id,
      kind: item.kind,
      side: parseOptionalSide(item.side, `${item.id} side`),
      weight: parseWeight(item.weight, item.id),
      oracle: parseOracle(item.oracle, item.id),
    });
  }

  const thresholds = asRecord(record.thresholds);
  const act = thresholds ? asRecord(thresholds.act) : null;
  const escalate = thresholds ? asRecord(thresholds.escalate) : null;
  if (!act || typeof act.score !== 'number' || typeof act.minOracles !== 'number') {
    throw new Error('Rubric thresholds.act needs score and minOracles');
  }
  if (!escalate || typeof escalate.score !== 'number') {
    throw new Error('Rubric thresholds.escalate needs score');
  }

  const failure = required.find((rule) => rule.kind === 'failure');
  const rerun = required.find((rule) => rule.kind === 'rerun');
  if (!failure || !rerun) {
    throw new Error('Rubric must require a failure item and a rerun item');
  }

  return {
    required,
    weighted,
    actScore: act.score,
    escalateScore: escalate.score,
    actMinOracles: act.minOracles,
  };
}

function parseEvidence(raw: unknown): Evidence {
  const record = asRecord(raw);
  if (!record) {
    throw new Error('Evidence must be a JSON object');
  }
  const test = asRecord(record.test);
  if (
    !test ||
    typeof test.file !== 'string' ||
    test.file.length === 0 ||
    typeof test.title !== 'string' ||
    test.title.length === 0
  ) {
    throw new Error('Evidence test.file and test.title must be non-empty strings');
  }
  const items: EvidenceItem[] = [];
  for (const entry of elements(record.items)) {
    const item = asRecord(entry);
    if (
      !item ||
      typeof item.id !== 'string' ||
      typeof item.kind !== 'string' ||
      typeof item.artifact !== 'string'
    ) {
      throw new Error('Each evidence item needs string id, kind, and artifact');
    }
    const parsed: EvidenceItem = {
      id: item.id,
      kind: item.kind,
      artifact: item.artifact,
    };
    if (item.line !== undefined) {
      if (typeof item.line !== 'number') {
        throw new Error(`Item ${item.id} line must be a number`);
      }
      parsed.line = item.line;
    }
    if (item.excerpt !== undefined) {
      if (typeof item.excerpt !== 'string') {
        throw new Error(`Item ${item.id} excerpt must be a string`);
      }
      parsed.excerpt = item.excerpt;
    }
    items.push(parsed);
  }
  if (!Array.isArray(record.items)) {
    throw new Error('Evidence items must be an array');
  }
  return { test: { file: test.file, title: test.title }, items };
}

function normalizeRepoPath(artifact: string): string | null {
  const normalized = artifact.replace(/\\/g, '/').replace(/^\.\//, '');
  if (normalized.length === 0 || normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return null;
  }
  const parts = normalized.split('/');
  if (parts.some((part) => part.length === 0 || part === '.' || part === '..')) {
    return null;
  }
  return parts.join('/');
}

function isHeadPath(repoPath: string): boolean {
  return HEAD_PREFIXES.some((prefix) => repoPath.startsWith(prefix));
}

function readWorkingFile(root: string, repoPath: string): string | null {
  const absolute = path.resolve(root, repoPath);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  try {
    if (!fs.statSync(absolute).isFile()) {
      return null;
    }
    return fs.readFileSync(absolute, 'utf8');
  } catch {
    return null;
  }
}

function readGitHead(root: string, repoPath: string): string | null {
  const result = spawnSync('git', ['--no-pager', 'show', `HEAD:${repoPath}`], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }
  return result.stdout;
}

function readArtifact(root: string, repoPath: string, fixtureRoot: boolean): string | null {
  if (!fixtureRoot && isHeadPath(repoPath)) {
    return readGitHead(root, repoPath);
  }
  return readWorkingFile(root, repoPath);
}

function citationOk(content: string, item: EvidenceItem): boolean {
  if (item.line === undefined && item.excerpt === undefined) {
    return true;
  }
  if (item.excerpt === undefined || item.excerpt.length < MIN_EXCERPT_LENGTH) {
    return false;
  }
  if (item.line === undefined || !Number.isInteger(item.line) || item.line < 1) {
    return false;
  }
  const text = content.split(/\r?\n/)[item.line - 1];
  return text !== undefined && text.includes(item.excerpt);
}

function firstLine(message: string): string {
  const [line] = message.split(/\r?\n/);
  return line ?? '';
}

function errorMessages(result: Record<string, unknown>): string[] {
  const messages: string[] = [];
  for (const entry of elements(result.errors)) {
    const error = asRecord(entry);
    if (error && typeof error.message === 'string' && error.message.length > 0) {
      messages.push(error.message);
    }
  }
  if (messages.length > 0) {
    return messages;
  }
  const error = asRecord(result.error);
  if (error && typeof error.message === 'string' && error.message.length > 0) {
    return [error.message];
  }
  return [];
}

function parseResult(value: unknown): FlatResult | null {
  const result = asRecord(value);
  if (!result) {
    return null;
  }
  const status = typeof result.status === 'string' ? result.status : '';
  const messages = errorMessages(result);
  return {
    passed: status === 'passed',
    failed: status === 'failed' || status === 'timedOut' || status === 'interrupted',
    firstErrorLine: messages.length > 0 ? firstLine(messages[0] ?? '') : null,
  };
}

function collectSpecs(value: unknown, specs: FlatSpec[]): void {
  const record = asRecord(value);
  if (!record) {
    return;
  }
  for (const entry of elements(record.specs)) {
    const spec = asRecord(entry);
    if (!spec || typeof spec.title !== 'string') {
      continue;
    }
    const results: FlatResult[] = [];
    for (const testEntry of elements(spec.tests)) {
      const testRecord = asRecord(testEntry);
      if (!testRecord) {
        continue;
      }
      for (const resultEntry of elements(testRecord.results)) {
        const parsed = parseResult(resultEntry);
        if (parsed) {
          results.push(parsed);
        }
      }
    }
    specs.push({ title: spec.title, results });
  }
  for (const child of elements(record.suites)) {
    collectSpecs(child, specs);
  }
}

function verdictForReport(report: unknown, title: string): RerunVerdict {
  const specs: FlatSpec[] = [];
  for (const suite of elements(asRecord(report)?.suites)) {
    collectSpecs(suite, specs);
  }
  const matching = specs.filter((spec) => spec.title === title);
  if (matching.length === 0) {
    return { status: 'unusable' };
  }
  let sawPass = false;
  for (const spec of matching) {
    for (const result of spec.results) {
      if (result.firstErrorLine !== null) {
        return { status: 'failed', firstErrorLine: result.firstErrorLine };
      }
      if (result.failed) {
        return { status: 'failed', firstErrorLine: '' };
      }
      if (result.passed) {
        sawPass = true;
      }
    }
  }
  if (sawPass) {
    return { status: 'passed' };
  }
  return { status: 'unusable' };
}

function parseJsonText(text: string): unknown | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    } catch {
      return null;
    }
  }
}

function readJsonFile(filePath: string): unknown | null {
  try {
    return parseJsonText(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function quoteForCmd(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function runPlaywright(root: string, testFile: string, title: string): string {
  const args = ['npx', 'playwright', 'test', testFile, '-g', title, '--reporter=json'];
  const result =
    process.platform === 'win32'
      ? spawnSync(args.map(quoteForCmd).join(' '), {
          cwd: root,
          encoding: 'utf8',
          windowsHide: true,
          shell: true,
          maxBuffer: 64 * 1024 * 1024,
        })
      : spawnSync('npx', args.slice(1), {
          cwd: root,
          encoding: 'utf8',
          windowsHide: true,
          maxBuffer: 64 * 1024 * 1024,
        });
  return typeof result.stdout === 'string' ? result.stdout : '';
}

function rerunReportPath(root: string, decisionId: string): string {
  return path.join(root, '.test-artifacts', 'reruns', `${decisionId}.json`);
}

function loadRerunReport(
  root: string,
  decisionId: string,
  evidence: Evidence,
  verifyOnly: boolean,
): unknown | null {
  const reportPath = rerunReportPath(root, decisionId);
  if (verifyOnly) {
    return readJsonFile(reportPath);
  }
  const stdout = runPlaywright(root, evidence.test.file, evidence.test.title);
  const parsed = parseJsonText(stdout);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    parsed === null ? stdout : `${JSON.stringify(parsed, null, 2)}\n`,
    'utf8',
  );
  return parsed;
}

function rerunAgrees(verdict: RerunVerdict, excerpt: string | null): { verified: boolean; passed: boolean } {
  if (verdict.status === 'passed') {
    return { verified: true, passed: true };
  }
  if (
    verdict.status === 'failed' &&
    excerpt !== null &&
    verdict.firstErrorLine.includes(excerpt)
  ) {
    return { verified: true, passed: false };
  }
  return { verified: false, passed: false };
}

function allowedActionsFor(decision: DecisionName, side: Side | null): string[] {
  if (decision === 'act' && side === 'drift') {
    return ['self-heal'];
  }
  if (decision === 'act' && side === 'bug') {
    return ['bug-reporter'];
  }
  if (decision === 'escalate') {
    return ['escalate'];
  }
  return [];
}

function decisionFor(
  decisionId: string,
  decision: DecisionName,
  side: Side | null,
  score: number,
  oracle: boolean,
  verified: readonly string[],
  missing: readonly string[],
  contradictions: readonly string[],
  rule: number,
): ScoreDecision {
  return {
    decisionId,
    decision,
    side,
    score,
    oracle,
    verified: [...verified],
    missing: [...missing],
    contradictions: [...contradictions],
    rule,
    allowedActions: allowedActionsFor(decision, side),
  };
}

function writeDecision(root: string, decision: ScoreDecision): void {
  const dir = path.join(root, '.test-artifacts', 'decisions');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${decision.decisionId}.json`),
    `${JSON.stringify(decision, null, 2)}\n`,
    'utf8',
  );
}

function finish(root: string, decision: ScoreDecision): ScoreDecision {
  writeDecision(root, decision);
  return decision;
}

function findRule<T extends { id: string; kind: string }>(
  rules: readonly T[],
  item: EvidenceItem,
): T | undefined {
  return rules.find((rule) => rule.id === item.id && rule.kind === item.kind);
}

function applicableMissing(
  rubric: Rubric,
  verifiedIds: ReadonlySet<string>,
  driftCount: number,
  bugCount: number,
): string[] {
  const soleSide: Side | null =
    driftCount > 0 && bugCount === 0 ? 'drift' : bugCount > 0 && driftCount === 0 ? 'bug' : null;
  const missing: string[] = [];
  for (const rule of rubric.required) {
    if (rule.requiredWhenSide !== null && rule.requiredWhenSide !== soleSide) {
      continue;
    }
    if (!verifiedIds.has(rule.id)) {
      missing.push(rule.id);
    }
  }
  return missing;
}

export function scoreEvidence(evidencePath: string, options: ScoreOptions): ScoreDecision {
  const absoluteEvidence = path.resolve(evidencePath);
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(absoluteEvidence);
  } catch {
    throw new Error(`Cannot read evidence file: ${absoluteEvidence}`);
  }
  const decisionId = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  if (!/^[0-9a-f]{12}$/.test(decisionId)) {
    throw new Error(`Invalid decision id: ${decisionId}`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(bytes.toString('utf8')) as unknown;
  } catch {
    throw new Error(`Evidence file is not valid JSON: ${absoluteEvidence}`);
  }

  const effectiveRoot = options.root ? path.resolve(options.root) : repoRoot;
  const rubric = loadRubric();

  // 1. A score, confidence, or weight field anywhere in the evidence.
  if (hasForbiddenField(raw)) {
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'inconclusive', null, 0, false, [], [], [], 1),
    );
  }

  const evidence = parseEvidence(raw);
  const failureRule = rubric.required.find((rule) => rule.kind === 'failure');
  const rerunRule = rubric.required.find((rule) => rule.kind === 'rerun');
  if (!failureRule || !rerunRule) {
    throw new Error('Rubric must require a failure item and a rerun item');
  }

  const failureItem = evidence.items.find(
    (item) => item.id === failureRule.id && item.kind === failureRule.kind,
  );
  const failureExcerpt =
    failureItem?.excerpt !== undefined && failureItem.excerpt.length >= MIN_EXCERPT_LENGTH
      ? failureItem.excerpt
      : null;

  const rerunRequested = evidence.items.some(
    (item) => item.id === rerunRule.id && item.kind === rerunRule.kind,
  );
  const rerunVerdict = rerunRequested
    ? verdictForReport(
        loadRerunReport(effectiveRoot, decisionId, evidence, options.verifyOnly),
        evidence.test.title,
      )
    : ({ status: 'unusable' } as const);
  const rerun = rerunAgrees(rerunVerdict, failureExcerpt);

  const verified: string[] = [];
  const weightedHits: VerifiedWeight[] = [];
  for (const item of evidence.items) {
    const required = findRule(rubric.required, item);
    const weighted = findRule(rubric.weighted, item);
    const rule = required ?? weighted;
    if (!rule) {
      continue;
    }
    const repoPath = normalizeRepoPath(item.artifact);
    const content = repoPath === null ? null : readArtifact(effectiveRoot, repoPath, options.root !== null);
    const artifactOk = content !== null && citationOk(content, item);
    const rerunOk = rule.kind !== 'rerun' || rerun.verified;
    if (!artifactOk || !rerunOk) {
      continue;
    }
    verified.push(item.id);
    if (weighted) {
      weightedHits.push({
        id: weighted.id,
        side: weighted.side,
        weight: weighted.weight,
        oracle: weighted.oracle,
      });
    }
  }

  const drift = weightedHits.filter((item) => item.side === 'drift');
  const bug = weightedHits.filter((item) => item.side === 'bug');
  const verifiedIds = new Set(verified);

  // 2. A required item is missing or unverified. R3 applies only when drift is the sole side.
  const missing = applicableMissing(rubric, verifiedIds, drift.length, bug.length);
  if (missing.length > 0) {
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'inconclusive', null, 0, false, verified, missing, [], 2),
    );
  }

  // 3. The re-run passed, so the failure did not reproduce.
  if (rerun.passed) {
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'inconclusive', null, 0, false, verified, [], [], 3),
    );
  }

  // 4. Verified drift-side and bug-side items are both present. Neutral items do not contradict.
  if (drift.length > 0 && bug.length > 0) {
    const contradictions = weightedHits
      .filter((item) => item.side === 'drift' || item.side === 'bug')
      .map((item) => item.id);
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'inconclusive', null, 0, false, verified, [], contradictions, 4),
    );
  }

  const side: Side | null = drift.length > 0 ? 'drift' : bug.length > 0 ? 'bug' : null;
  const sideItems = side === 'drift' ? drift : side === 'bug' ? bug : [];
  const score = sideItems.reduce((sum, item) => sum + item.weight, 0);
  const oracleCount = sideItems.filter((item) => item.oracle).length;
  const oracle = oracleCount > 0;

  // 5. No remaining side, or the remaining side contributes no weight.
  if (side === null || score === 0) {
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'inconclusive', side, score, false, verified, [], [], 5),
    );
  }

  // 6. Act only at the act threshold with a verified oracle on that side.
  if (score >= rubric.actScore && oracleCount >= rubric.actMinOracles) {
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'act', side, score, true, verified, [], [], 6),
    );
  }

  // 7. Escalate once the score reaches the escalate threshold.
  if (score >= rubric.escalateScore) {
    return finish(
      effectiveRoot,
      decisionFor(decisionId, 'escalate', side, score, oracle, verified, [], [], 7),
    );
  }

  // 8. Otherwise the evidence does not clear either threshold.
  return finish(
    effectiveRoot,
    decisionFor(decisionId, 'inconclusive', side, score, oracle, verified, [], [], 8),
  );
}

function usageError(detail: string): Error {
  return new Error(
    `${detail}\nUsage: npx tsx scripts/score-evidence.ts <evidence.json> [--verify-only] [--root <dir>]`,
  );
}

function parseArgs(argv: readonly string[]): { evidencePath: string; options: ScoreOptions } {
  const positional: string[] = [];
  let verifyOnly = false;
  let root: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--verify-only') {
      verifyOnly = true;
      continue;
    }
    if (arg === '--root') {
      const next = argv[index + 1];
      if (!next || next.startsWith('-')) {
        throw usageError('--root requires a directory');
      }
      root = next;
      index += 1;
      continue;
    }
    if (arg !== undefined && arg.startsWith('-')) {
      throw usageError(`Unknown argument: ${arg}`);
    }
    if (arg !== undefined) {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    throw usageError('Provide one evidence file');
  }
  const evidencePath = positional[0];
  if (evidencePath === undefined) {
    throw usageError('Provide one evidence file');
  }
  return { evidencePath, options: { verifyOnly, root } };
}

export function runCli(argv: readonly string[]): ScoreDecision {
  const parsed = parseArgs(argv);
  return scoreEvidence(parsed.evidencePath, parsed.options);
}

function invokedAsCli(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  const base = path.basename(entry);
  return base === 'score-evidence.ts' || base === 'score-evidence.js';
}

function main(): void {
  try {
    const decision = runCli(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

if (invokedAsCli()) {
  main();
}
