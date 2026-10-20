#!/usr/bin/env node
/** createJiraIssue for issue type Bug needs act+bug, or escalate plus a human approval file. */
import {
  BUG_ISSUE_TYPE,
  denialMessage,
  gateDecision,
  isAtlassianServer,
  mcpArguments,
  readHookInput,
  respond,
  scoreCurrentEvidence,
} from './evidence-gate.mjs';

const GATE = 'guard-jira-bug-gate';

function main() {
  const payload = readHookInput(GATE);
  if (payload.tool_name !== 'createJiraIssue') {
    respond('allow');
  }

  const server = payload.mcp_server_name;
  if (typeof server === 'string' && server.length > 0 && !isAtlassianServer(server)) {
    respond('allow');
  }
  if (!isAtlassianServer(server)) {
    respond(
      'deny',
      denialMessage(GATE, {
        decision: null,
        missing: ['mcp_server_name atlassian or plugin-atlassian-atlassian'],
        contradicting: ['createJiraIssue had no recognizable Atlassian server name'],
      }),
    );
  }

  const args = mcpArguments(payload);
  if (!args) {
    respond(
      'deny',
      denialMessage(GATE, {
        decision: null,
        missing: ['JSON tool_input'],
        contradicting: ['beforeMCPExecution tool_input was not a JSON object'],
      }),
    );
  }
  if (args.issueType !== BUG_ISSUE_TYPE) {
    if (typeof args.issueType === 'string' && args.issueType.length > 0) {
      respond('allow');
    }
    respond(
      'deny',
      denialMessage(GATE, {
        decision: null,
        missing: [`issueType ${BUG_ISSUE_TYPE}`],
        contradicting: ['createJiraIssue did not name an issue type'],
      }),
    );
  }

  const result = gateDecision(scoreCurrentEvidence(), 'bug');
  if (!result.allow) {
    respond('deny', denialMessage(GATE, result));
  }
  respond('allow');
}

main();
