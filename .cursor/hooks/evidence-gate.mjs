#!/usr/bin/env node
/** Shared helpers for the evidence-score gates. The decision comes only from the scorer CLI. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const EVIDENCE_REL = '.test-artifacts/evidence/current.json';
export const BUG_ISSUE_TYPE = 'Bug';
const ATLASSIAN_SERVERS = new Set(['atlassian', 'plugin-atlassian-atlassian']);

export function repoRoot() {
  return process.cwd();
}

export function respond(permission, message) {
  if (permission === 'allow') {
    process.stdout.write(`${JSON.stringify({ permission: 'allow' })}\n`);
    process.exit(0);
  }
  const body = {
    permission: 'deny',
    user_message: message,
    agent_message: message,
  };
  process.stdout.write(`${JSON.stringify(body)}\n`);
  if (message) {
    process.stderr.write(`${message}\n`);
  }
  process.exit(2);
}

export function readHookInput(gate) {
  const raw = fs.readFileSync(0, 'utf8').replace(/^\uFEFF/, '');
  if (!raw.trim()) {
    respond(
      'deny',
      `Denied by ${gate}: decision unavailable (id none, side none), score unavailable, rule unreadable-input. Missing: hook stdin. Contradicting: empty stdin.`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'invalid JSON';
    respond(
      'deny',
      `Denied by ${gate}: decision unavailable (id none, side none), score unavailable, rule unreadable-input. Missing: JSON hook input. Contradicting: ${detail}.`,
    );
  }
  return null;
}

export function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

export function toolWritePath(payload) {
  const input = payload.tool_input;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  const filePath = input.path ?? input.file_path ?? input.filePath;
  return typeof filePath === 'string' && filePath.length > 0 ? filePath : null;
}

export function isPagesPath(filePath) {
  return /(?:^|\/)pages\//.test(normalizePath(filePath));
}

export function isApprovalsPath(filePath) {
  return /(?:^|\/)\.test-artifacts\/approvals\//.test(normalizePath(filePath));
}

export function gitBranch(cwd) {
  const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }
  const branch = result.stdout.trim();
  return branch.length > 0 ? branch : null;
}

export function isHealBranch(branch) {
  return typeof branch === 'string' && branch.startsWith('heal/');
}

export function isGhPrCreate(command) {
  if (typeof command !== 'string') {
    return false;
  }
  const segments = command.split(/(?:&&|\|\||[;&|\n])/);
  return segments.some((segment) =>
    /^gh(?:\.exe|\.cmd)?\s+pr\s+create(?:\s|$)/i.test(segment.trim()),
  );
}

export function isAtlassianServer(name) {
  return typeof name === 'string' && ATLASSIAN_SERVERS.has(name.toLowerCase());
}

export function mcpArguments(payload) {
  const raw = payload.tool_input;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  return null;
}

export function hasApproval(root, decisionId) {
  if (typeof decisionId !== 'string' || !/^[0-9a-f]{12}$/.test(decisionId)) {
    return false;
  }
  const approvalsDir = path.resolve(root, '.test-artifacts', 'approvals');
  const file = path.resolve(approvalsDir, `${decisionId}.json`);
  const relative = path.relative(approvalsDir, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return false;
  }
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function parseDecision(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end <= start) {
      return null;
    }
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function shortError(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('npm warn'));
  const chosen = lines.find((line) => line.startsWith('Error:')) ?? lines[0] ?? 'scorer failed';
  return chosen.length > 240 ? `${chosen.slice(0, 240)}…` : chosen;
}

export function scoreCurrentEvidence() {
  const root = repoRoot();
  const command = `npx tsx scripts/score-evidence.ts --verify-only ${EVIDENCE_REL}`;
  const result = spawnSync(command, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
    shell: true,
  });
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : '';
  if (result.status !== 0) {
    return {
      ok: false,
      error: shortError(stderr || stdout),
    };
  }
  const decision = parseDecision(stdout);
  if (!decision || typeof decision !== 'object' || typeof decision.decision !== 'string') {
    return { ok: false, error: 'scorer stdout was not a decision' };
  }
  return { ok: true, decision };
}

export function gateDecision(scored, requiredSide) {
  if (!scored.ok) {
    return {
      allow: false,
      decision: null,
      missing: ['verify-only score of .test-artifacts/evidence/current.json'],
      contradicting: [scored.error],
    };
  }
  const decision = scored.decision;
  const missing = Array.isArray(decision.missing) ? [...decision.missing] : [];
  const contradicting = Array.isArray(decision.contradictions) ? [...decision.contradictions] : [];
  if (decision.decision === 'act' && decision.side === requiredSide) {
    return { allow: true, decision, missing, contradicting };
  }
  if (decision.decision === 'escalate' && hasApproval(repoRoot(), decision.decisionId)) {
    return { allow: true, decision, missing, contradicting };
  }
  if (decision.decision === 'escalate') {
    const id = typeof decision.decisionId === 'string' ? decision.decisionId : 'unknown';
    missing.push(`.test-artifacts/approvals/${id}.json`);
  }
  if (decision.decision === 'act' && decision.side !== requiredSide) {
    contradicting.push(
      `side is ${decision.side ?? 'none'}; act is allowed only for side ${requiredSide}`,
    );
  }
  if (decision.decision === 'inconclusive' && decision.rule === 3 && contradicting.length === 0) {
    contradicting.push('re-run passed; a passing re-run is inconclusive, not drift');
  }
  if (missing.length === 0 && contradicting.length === 0) {
    contradicting.push(`decision ${decision.decision} does not permit this action`);
  }
  return { allow: false, decision, missing, contradicting };
}

export function denialMessage(gate, result, ruleOverride) {
  const decision = result.decision;
  const name = decision?.decision ?? 'unavailable';
  const id = decision?.decisionId ?? 'none';
  const side = decision?.side ?? 'none';
  const score =
    decision && typeof decision.score === 'number' ? String(decision.score) : 'unavailable';
  const rule =
    ruleOverride ??
    (decision && typeof decision.rule === 'number' ? String(decision.rule) : 'scorer-failed');
  const missing = result.missing.length > 0 ? result.missing.join(', ') : 'none';
  const contradicting =
    result.contradicting.length > 0 ? result.contradicting.join(', ') : 'none';
  return `Denied by ${gate}: decision ${name} (id ${id}, side ${side}), score ${score}, rule ${rule}. Missing: ${missing}. Contradicting: ${contradicting}.`;
}
