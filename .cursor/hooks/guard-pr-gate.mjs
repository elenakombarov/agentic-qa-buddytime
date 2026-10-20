#!/usr/bin/env node
/** On heal/*, gh pr create needs act+drift, or escalate plus a human approval file. */
import {
  denialMessage,
  gateDecision,
  gitBranch,
  isGhPrCreate,
  isHealBranch,
  readHookInput,
  repoRoot,
  respond,
  scoreCurrentEvidence,
} from './evidence-gate.mjs';

const GATE = 'guard-pr-gate';

function main() {
  const payload = readHookInput(GATE);
  const command = typeof payload.command === 'string' ? payload.command : '';
  if (!isGhPrCreate(command)) {
    respond('allow');
  }

  const cwd = typeof payload.cwd === 'string' && payload.cwd.length > 0 ? payload.cwd : repoRoot();
  const branch = gitBranch(cwd);
  if (branch === null) {
    respond(
      'deny',
      denialMessage(GATE, {
        decision: null,
        missing: ['git branch'],
        contradicting: ['cannot tell whether gh pr create is running on a heal/ branch'],
      }),
    );
  }
  if (!isHealBranch(branch)) {
    respond('allow');
  }

  const result = gateDecision(scoreCurrentEvidence(), 'drift');
  if (!result.allow) {
    respond('deny', denialMessage(GATE, result));
  }
  respond('allow');
}

main();
