#!/usr/bin/env node
/** Agents cannot write human approval files. */
import {
  denialMessage,
  isApprovalsPath,
  readHookInput,
  respond,
  scoreCurrentEvidence,
  toolWritePath,
} from './evidence-gate.mjs';

const GATE = 'guard-approvals';

function main() {
  const payload = readHookInput(GATE);
  if (payload.tool_name !== 'Write') {
    respond('allow');
  }

  const filePath = toolWritePath(payload);
  if (!filePath) {
    respond(
      'deny',
      denialMessage(
        GATE,
        {
          decision: null,
          missing: ['tool_input.path for this Write'],
          contradicting: ['preToolUse Write had no path, file_path, or filePath'],
        },
        GATE,
      ),
    );
  }
  if (!isApprovalsPath(filePath)) {
    respond('allow');
  }

  const scored = scoreCurrentEvidence();
  const decision = scored.ok ? scored.decision : null;
  const missing = ['a human-created approval file; agents cannot Write under .test-artifacts/approvals/'];
  const contradicting = [`agent Write targets ${filePath}`];
  if (!scored.ok) {
    contradicting.push(scored.error);
  }
  respond(
    'deny',
    denialMessage(
      GATE,
      {
        decision,
        missing,
        contradicting,
      },
      GATE,
    ),
  );
}

main();
