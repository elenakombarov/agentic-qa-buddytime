#!/usr/bin/env node
/** On heal/*, a Write under pages/ needs act+drift, or escalate plus a human approval file. */
import {
  denialMessage,
  gateDecision,
  gitBranch,
  isHealBranch,
  isPagesPath,
  readHookInput,
  repoRoot,
  respond,
  scoreCurrentEvidence,
  toolWritePath,
} from './evidence-gate.mjs';

const GATE = 'guard-heal-gate';

function main() {
  const payload = readHookInput(GATE);
  if (payload.tool_name !== 'Write') {
    respond('allow');
  }

  const filePath = toolWritePath(payload);
  const branch = gitBranch(repoRoot());
  if (!filePath) {
    if (isHealBranch(branch) || branch === null) {
      respond(
        'deny',
        denialMessage(GATE, {
          decision: null,
          missing: ['tool_input.path for this Write'],
          contradicting: ['preToolUse Write had no path, file_path, or filePath'],
        }),
      );
    }
    respond('allow');
  }

  if (!isPagesPath(filePath)) {
    respond('allow');
  }
  if (branch === null) {
    respond(
      'deny',
      denialMessage(GATE, {
        decision: null,
        missing: ['git branch'],
        contradicting: [`cannot tell whether ${filePath} is on a heal/ branch`],
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
