The human-owned answer key is evals/triage/answer-key.json, a JSON array of { "id", "input", "expected" } with expected set to drift, bug, or ambiguous, and its cases are never filled in by an agent.
One agent attempt is saved as evals/<agent>/runs/<date>-<n>.json with model, startedAt, finishedAt, and predictions of { "id", "predicted", "evidence" }.
The agent under evaluation is given each case id and input by the operator and must not open answer-key.json while it predicts.
npx tsx evals/score.ts <agent> reads that key and every JSON file in the agent's runs directory, then prints per-class precision, recall, and false positives, plus overall accuracy and agreement across runs.
Each saved prediction whose id is in the key is one observation; an unknown id or a predicted value other than drift, bug, or ambiguous exits non-zero, and an empty key, fewer than two runs, or a missing runs directory prints insufficient data for agreement instead of a score.
