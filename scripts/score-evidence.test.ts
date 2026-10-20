import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { runCli, type ScoreDecision } from './score-evidence';

const repoRoot = path.resolve(__dirname, '..');
const fixturesDir = path.join(repoRoot, 'scripts', 'evidence-fixtures');

type ExpectedDecision = {
  name: string;
  decision: ScoreDecision['decision'];
  side: ScoreDecision['side'];
  score: number;
  oracle: boolean;
  verified: string[];
  missing: string[];
  contradictions: string[];
  rule: number;
  allowedActions: string[];
};

const cases: ExpectedDecision[] = [
  {
    name: 'min-act-drift',
    decision: 'act',
    side: 'drift',
    score: 60,
    oracle: true,
    verified: ['R1', 'R2', 'R3', 'R4', 'D1', 'D2'],
    missing: [],
    contradictions: [],
    rule: 6,
    allowedActions: ['self-heal'],
  },
  {
    name: 'min-act-bug',
    decision: 'act',
    side: 'bug',
    score: 60,
    oracle: true,
    verified: ['R1', 'R2', 'R4', 'B1', 'B3'],
    missing: [],
    contradictions: [],
    rule: 6,
    allowedActions: ['bug-reporter'],
  },
  {
    name: 'min-escalate',
    decision: 'escalate',
    side: 'drift',
    score: 40,
    oracle: true,
    verified: ['R1', 'R2', 'R3', 'R4', 'D1'],
    missing: [],
    contradictions: [],
    rule: 7,
    allowedActions: ['escalate'],
  },
  {
    name: 'missing-required',
    decision: 'inconclusive',
    side: null,
    score: 0,
    oracle: false,
    verified: ['R1', 'R2', 'R3', 'D1', 'D4'],
    missing: ['R4'],
    contradictions: [],
    rule: 2,
    allowedActions: [],
  },
  {
    name: 'contradiction',
    decision: 'inconclusive',
    side: null,
    score: 0,
    oracle: false,
    verified: ['R1', 'R2', 'R3', 'R4', 'D1', 'B2'],
    missing: [],
    contradictions: ['D1', 'B2'],
    rule: 4,
    allowedActions: [],
  },
  {
    name: 'neutral-oracle',
    decision: 'escalate',
    side: 'drift',
    score: 35,
    oracle: false,
    verified: ['R1', 'R2', 'R3', 'R4', 'N', 'D2', 'D3'],
    missing: [],
    contradictions: [],
    rule: 7,
    allowedActions: ['escalate'],
  },
  {
    name: 'flaky',
    decision: 'inconclusive',
    side: null,
    score: 0,
    oracle: false,
    verified: ['R1', 'R2', 'R3', 'R4', 'D1'],
    missing: [],
    contradictions: [],
    rule: 3,
    allowedActions: [],
  },
  {
    name: 'model-score',
    decision: 'inconclusive',
    side: null,
    score: 0,
    oracle: false,
    verified: [],
    missing: [],
    contradictions: [],
    rule: 1,
    allowedActions: [],
  },
];

function decisionIdOf(evidencePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(evidencePath)).digest('hex').slice(0, 12);
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
}

function scoreFixture(name: string): { decision: ScoreDecision; root: string } {
  const root = path.join(fixturesDir, name);
  const evidencePath = path.join(root, 'evidence.json');
  const decision = runCli([evidencePath, '--verify-only', '--root', root]);
  assert.equal(decision.decisionId, decisionIdOf(evidencePath));
  const written = readJson(
    path.join(root, '.test-artifacts', 'decisions', `${decision.decisionId}.json`),
  );
  assert.deepEqual(written, decision);
  fs.rmSync(path.join(root, '.test-artifacts', 'decisions'), { recursive: true, force: true });
  return { decision, root };
}

for (const expected of cases) {
  test(expected.name, () => {
    const { decision } = scoreFixture(expected.name);
    assert.deepEqual(decision, {
      decisionId: decision.decisionId,
      decision: expected.decision,
      side: expected.side,
      score: expected.score,
      oracle: expected.oracle,
      verified: expected.verified,
      missing: expected.missing,
      contradictions: expected.contradictions,
      rule: expected.rule,
      allowedActions: expected.allowedActions,
    });
  });
}

test('rejects an unknown flag', () => {
  assert.throws(() => runCli(['evidence.json', '--score']), /Unknown argument/);
});

test('committed tests/ files are read from git HEAD', () => {
  const shown = spawnSync('git', ['--no-pager', 'show', 'HEAD:tests/auth.setup.ts'], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(shown.status, 0, shown.stderr);
  const lines = (shown.stdout ?? '').split(/\r?\n/);
  const lineIndex = lines.findIndex((line) => line.includes("from '@playwright/test'"));
  assert.ok(lineIndex >= 0);
  const probeDir = path.join(repoRoot, '.test-artifacts', 'evidence-git-probe');
  fs.mkdirSync(probeDir, { recursive: true });
  const evidencePath = path.join(probeDir, 'committed.json');
  const evidence = {
    test: { file: 'tests/auth.setup.ts', title: 'auth setup' },
    items: [
      {
        id: 'R2',
        kind: 'test_location',
        artifact: 'tests/auth.setup.ts',
        line: lineIndex + 1,
        excerpt: "from '@playwright/test'",
      },
    ],
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  try {
    const decision = runCli([evidencePath, '--verify-only']);
    assert.equal(decision.rule, 2);
    assert.deepEqual(decision.verified, ['R2']);
    assert.deepEqual(decision.missing, ['R1', 'R4']);
    fs.rmSync(
      path.join(repoRoot, '.test-artifacts', 'decisions', `${decision.decisionId}.json`),
      { force: true },
    );
  } finally {
    fs.rmSync(evidencePath, { force: true });
  }
});

test('uncommitted tests/ files are not evidence', () => {
  const rel = 'tests/evidence-scorer-untracked.txt';
  const absolute = path.join(repoRoot, rel);
  const probeDir = path.join(repoRoot, '.test-artifacts', 'evidence-git-probe');
  fs.mkdirSync(probeDir, { recursive: true });
  fs.writeFileSync(absolute, 'uncommitted evidence line for the scorer\n');
  const evidencePath = path.join(probeDir, 'uncommitted.json');
  const evidence = {
    test: { file: rel, title: 'uncommitted' },
    items: [
      {
        id: 'R2',
        kind: 'test_location',
        artifact: rel,
        line: 1,
        excerpt: 'uncommitted evidence line',
      },
    ],
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  try {
    const decision = runCli([evidencePath, '--verify-only']);
    assert.equal(decision.rule, 2);
    assert.deepEqual(decision.verified, []);
    assert.deepEqual(decision.missing, ['R1', 'R2', 'R4']);
    fs.rmSync(
      path.join(repoRoot, '.test-artifacts', 'decisions', `${decision.decisionId}.json`),
      { force: true },
    );
  } finally {
    fs.rmSync(absolute, { force: true });
    fs.rmSync(evidencePath, { force: true });
  }
});
