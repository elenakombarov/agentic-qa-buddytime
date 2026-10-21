import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const hookPath = path.resolve('.cursor/hooks/guard-test-assertions.mjs');

function runHook(stdin) {
  return spawnSync(process.execPath, [hookPath], {
    input: stdin,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function preToolUse(toolName, toolInput) {
  return JSON.stringify({
    hook_event_name: 'preToolUse',
    tool_name: toolName,
    tool_input: toolInput,
  });
}

function permission(result) {
  const trimmed = (result.stdout ?? '').trim();
  assert.notEqual(trimmed, '', 'hook stdout was empty');
  return JSON.parse(trimmed).permission;
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-asserts-'));
const testsDir = path.join(root, 'tests');
fs.mkdirSync(testsDir);

const existingSpec = path.join(testsDir, 'existing.spec.ts');
const existingSource = [
  "import { test, expect } from '@playwright/test';",
  '',
  "test('keeps one assertion @e2e', async () => {",
  '  await expect(true).toBe(true);',
  '});',
  '',
].join('\n');
fs.writeFileSync(existingSpec, existingSource);

test('allows a new test file whose contents include assertions', () => {
  const newSpec = path.join(testsDir, 'new-case.spec.ts');
  const contents = [
    "import { test, expect } from '@playwright/test';",
    '',
    "test('adds coverage @e2e', async () => {",
    '  await expect(true).toBe(true);',
    '  await expect(false).toBe(false);',
    '});',
    '',
  ].join('\n');

  const result = runHook(
    preToolUse('Write', {
      path: newSpec,
      contents,
    }),
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(permission(result), 'allow');
  assert.match(result.stderr, /OK — 2 active expect\(/);
  assert.equal(fs.existsSync(newSpec), false);
});

test('allows an existing test when the assertion count stays the same', () => {
  const result = runHook(
    preToolUse('StrReplace', {
      path: existingSpec,
      old_string: "test('keeps one assertion @e2e'",
      new_string: "test('renamed assertion @e2e'",
    }),
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(permission(result), 'allow');
  assert.match(result.stderr, /OK — 1 active expect\(/);
});

test('allows an existing test when assertions are added', () => {
  const result = runHook(
    preToolUse('StrReplace', {
      path: existingSpec,
      old_string: '  await expect(true).toBe(true);',
      new_string: '  await expect(true).toBe(true);\n  await expect(1).toBe(1);',
    }),
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(permission(result), 'allow');
  assert.match(result.stderr, /OK — 2 active expect\(/);
});

test('blocks an existing test when assertions are removed', () => {
  const result = runHook(
    preToolUse('StrReplace', {
      path: existingSpec,
      old_string: '  await expect(true).toBe(true);\n',
      new_string: '',
    }),
  );

  assert.equal(result.status, 2, result.stderr);
  assert.equal(permission(result), 'deny');
  assert.match(result.stdout, /active expect\( count 1 -> 0/);
  assert.match(result.stderr, /active expect\( count 1 -> 0/);
});

test('blocks a patch aimed at a test file that does not exist', () => {
  const missingSpec = path.join(testsDir, 'missing-patch.spec.ts');
  const result = runHook(
    preToolUse('StrReplace', {
      path: missingSpec,
      old_string: 'await expect(true).toBe(true);',
      new_string: 'await expect(false).toBe(false);',
    }),
  );

  assert.equal(result.status, 1);
  assert.equal((result.stdout ?? '').trim(), '');
  assert.match(result.stderr, /file not found/);
});

test('blocks an existing path that is not a readable file', () => {
  const unreadable = path.join(testsDir, 'unreadable.spec.ts');
  fs.mkdirSync(unreadable);
  const result = runHook(
    preToolUse('Write', {
      path: unreadable,
      contents: 'await expect(true).toBe(true);\n',
    }),
  );

  assert.equal(result.status, 1);
  assert.equal((result.stdout ?? '').trim(), '');
  assert.match(result.stderr, /unreadable file/);
});

test('blocks malformed hook input', () => {
  const empty = runHook('');
  assert.equal(empty.status, 1);
  assert.equal((empty.stdout ?? '').trim(), '');
  assert.match(empty.stderr, /empty stdin/);

  const invalid = runHook('{');
  assert.equal(invalid.status, 1);
  assert.equal((invalid.stdout ?? '').trim(), '');
  assert.match(invalid.stderr, /invalid JSON/);
});

test.after(() => {
  fs.rmSync(root, { recursive: true, force: true });
});
