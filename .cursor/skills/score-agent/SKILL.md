---
name: score-agent
description: Scores an agent against an answer key and appends the result to eval-report.md. Use when measuring triage-agent agreement on drift, bug, or ambiguous cases.
---

# Score agent

Score repeated agent runs against the human-owned answer key and append the scorer output to [`eval-report.md`](../../../eval-report.md).

## Rules

- The agent under evaluation must never read [`evals/triage/answer-key.json`](../../../evals/triage/answer-key.json) during a run.
- Never populate or edit cases in that file. A human owns the key.
- Never invent predictions, labels, or accuracy numbers. If the scorer prints `insufficient data`, copy that.

## Steps

1. The operator supplies each case `id` and `input`. Do not open the answer key to obtain them.
2. Run the agent once per case. Save one run file at `evals/<agent>/runs/<YYYY-MM-DD>-<n>.json`:

```json
{
  "model": "<model id>",
  "startedAt": "<ISO-8601>",
  "finishedAt": "<ISO-8601>",
  "predictions": [
    { "id": "<case id>", "predicted": "drift | bug | ambiguous", "evidence": "<why>" }
  ]
}
```

3. Repeat N times. Default N is 3. Use the next `<n>` for each run on that date.
4. Run `npx tsx evals/score.ts <agent>`.
5. Append a dated `## Agent accuracy` section to `eval-report.md` with the printed metrics and this methodology: each prediction whose id is in the key is one observation; precision, recall, and false positives are per class (`drift`, `bug`, `ambiguous`); accuracy is correct observations over labeled observations; agreement is the share of answer-key cases for which every run file contains exactly one prediction and those predictions are the same class. Agreement is `insufficient data` when there are fewer than two runs or the answer key has no cases. A missing prediction does not count as agreement.

## Verify

Do not append a section when no run file was saved. A non-zero scorer exit means an unknown case id, a predicted value other than drift, bug, or ambiguous, a duplicate id, or an unreadable run; fix the run files and score again before appending.
