/**
 * Score saved agent runs against the human-owned triage answer key.
 *
 * Usage: npx tsx evals/score.ts <agent>
 */
import * as fs from 'fs';
import * as path from 'path';

const LABELS = ['drift', 'bug', 'ambiguous'] as const;

type Label = (typeof LABELS)[number];

type Ratio = {
  numerator: number;
  denominator: number;
};

type AnswerCase = {
  id: string;
  input: string;
  expected: Label;
};

type Prediction = {
  id: string;
  predicted: Label;
  evidence: string;
};

type RunFile = {
  model: string;
  startedAt: string;
  finishedAt: string;
  predictions: Prediction[];
};

type LoadedRun = {
  fileName: string;
  run: RunFile;
};

type Observation = {
  id: string;
  predicted: Label;
  expected: Label;
};

type ClassCounts = {
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
};

export type ScoreSummary = {
  observations: number;
  precision: Record<Label, Ratio | null>;
  recall: Record<Label, Ratio | null>;
  falsePositives: Record<Label, number | null>;
  accuracy: Ratio | null;
  agreement: Ratio | null;
};

const repoRoot = path.resolve(__dirname, '..');
const answerKeyPath = path.join(repoRoot, 'evals', 'triage', 'answer-key.json');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLabel(value: string): value is Label {
  return LABELS.some((label) => label === value);
}

function readJson(filePath: string): unknown {
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text) as unknown;
}

function requireString(record: Record<string, unknown>, field: string, where: string): string {
  const value = record[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${where} field ${field} must be a non-empty string`);
  }
  return value;
}

function parseAnswerKey(value: unknown): AnswerCase[] {
  if (!Array.isArray(value)) {
    throw new Error('Answer key must be a JSON array');
  }
  const cases: AnswerCase[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (!isRecord(entry)) {
      throw new Error('Answer key case must be an object');
    }
    const id = requireString(entry, 'id', 'Answer key');
    const input = requireString(entry, 'input', `Answer key case ${id}`);
    const expectedText = requireString(entry, 'expected', `Answer key case ${id}`);
    if (!isLabel(expectedText)) {
      throw new Error(`Answer key case ${id} expected must be drift, bug, or ambiguous`);
    }
    if (seen.has(id)) {
      throw new Error(`Answer key repeats id ${id}`);
    }
    seen.add(id);
    cases.push({ id, input, expected: expectedText });
  }
  return cases;
}

export function parseRun(value: unknown, fileName: string): RunFile {
  if (!isRecord(value)) {
    throw new Error(`${fileName} must be a JSON object`);
  }
  const model = requireString(value, 'model', fileName);
  const startedAt = requireString(value, 'startedAt', fileName);
  const finishedAt = requireString(value, 'finishedAt', fileName);
  if (!Array.isArray(value.predictions)) {
    throw new Error(`${fileName} predictions must be an array`);
  }
  const predictions: Prediction[] = [];
  const seen = new Set<string>();
  for (const entry of value.predictions) {
    if (!isRecord(entry)) {
      throw new Error(`${fileName} prediction must be an object`);
    }
    const id = requireString(entry, 'id', fileName);
    const predictedText = requireString(entry, 'predicted', `${fileName} prediction ${id}`);
    if (!isLabel(predictedText)) {
      throw new Error(
        `${fileName} prediction ${id} predicted must be drift, bug, or ambiguous`,
      );
    }
    const predicted: Label = predictedText;
    const evidence = requireString(entry, 'evidence', `${fileName} prediction ${id}`);
    if (seen.has(id)) {
      throw new Error(`${fileName} repeats id ${id}`);
    }
    seen.add(id);
    predictions.push({ id, predicted, evidence });
  }
  return { model, startedAt, finishedAt, predictions };
}

function listRunFiles(agent: string): LoadedRun[] {
  const runsDir = path.join(repoRoot, 'evals', agent, 'runs');
  if (!fs.existsSync(runsDir)) {
    return [];
  }
  const names = fs
    .readdirSync(runsDir)
    .filter((name) => name.endsWith('.json'))
    .sort();
  return names.map((fileName) => {
    const value = readJson(path.join(runsDir, fileName));
    return { fileName, run: parseRun(value, fileName) };
  });
}

function emptyClassRecord<T>(value: T): Record<Label, T> {
  return { drift: value, bug: value, ambiguous: value };
}

function ratio(numerator: number, denominator: number): Ratio | null {
  if (denominator === 0) {
    return null;
  }
  return { numerator, denominator };
}

function predictionsFor(run: RunFile, id: string): Prediction[] {
  return run.predictions.filter((prediction) => prediction.id === id);
}

function agreementRatio(runs: readonly LoadedRun[], cases: readonly AnswerCase[]): Ratio | null {
  if (runs.length < 2 || cases.length === 0) {
    return null;
  }
  let matches = 0;
  for (const answerCase of cases) {
    const labels: Label[] = [];
    let predictedByEveryRun = true;
    for (const loaded of runs) {
      const hits = predictionsFor(loaded.run, answerCase.id);
      if (hits.length !== 1) {
        predictedByEveryRun = false;
        break;
      }
      const label = hits[0]?.predicted;
      if (label === undefined) {
        predictedByEveryRun = false;
        break;
      }
      labels.push(label);
    }
    const first = labels[0];
    if (predictedByEveryRun && first !== undefined && labels.every((label) => label === first)) {
      matches += 1;
    }
  }
  return { numerator: matches, denominator: cases.length };
}

export function summarize(runs: readonly LoadedRun[], cases: readonly AnswerCase[]): {
  summary: ScoreSummary;
  unknownIds: string[];
} {
  const expectedById = new Map<string, Label>();
  for (const answerCase of cases) {
    expectedById.set(answerCase.id, answerCase.expected);
  }

  const unknown = new Set<string>();
  const observations: Observation[] = [];

  for (const loaded of runs) {
    for (const prediction of loaded.run.predictions) {
      const expected = expectedById.get(prediction.id);
      if (expected === undefined) {
        unknown.add(prediction.id);
        continue;
      }
      observations.push({
        id: prediction.id,
        predicted: prediction.predicted,
        expected,
      });
    }
  }

  const counts: Record<Label, ClassCounts> = {
    drift: { truePositives: 0, falsePositives: 0, falseNegatives: 0 },
    bug: { truePositives: 0, falsePositives: 0, falseNegatives: 0 },
    ambiguous: { truePositives: 0, falsePositives: 0, falseNegatives: 0 },
  };
  let correct = 0;
  for (const observation of observations) {
    if (observation.predicted === observation.expected) {
      correct += 1;
    }
    for (const label of LABELS) {
      const classCounts = counts[label];
      if (observation.predicted === label && observation.expected === label) {
        classCounts.truePositives += 1;
      } else if (observation.predicted === label && observation.expected !== label) {
        classCounts.falsePositives += 1;
      } else if (observation.expected === label && observation.predicted !== label) {
        classCounts.falseNegatives += 1;
      }
    }
  }

  const labeled = observations.length > 0;
  const precision = emptyClassRecord<Ratio | null>(null);
  const recall = emptyClassRecord<Ratio | null>(null);
  const falsePositives = emptyClassRecord<number | null>(labeled ? 0 : null);
  for (const label of LABELS) {
    const classCounts = counts[label];
    precision[label] = ratio(
      classCounts.truePositives,
      classCounts.truePositives + classCounts.falsePositives,
    );
    recall[label] = ratio(
      classCounts.truePositives,
      classCounts.truePositives + classCounts.falseNegatives,
    );
    if (labeled) {
      falsePositives[label] = classCounts.falsePositives;
    }
  }

  const agreement = agreementRatio(runs, cases);

  return {
    summary: {
      observations: observations.length,
      precision,
      recall,
      falsePositives,
      accuracy: ratio(correct, observations.length),
      agreement,
    },
    unknownIds: sortedIds(unknown),
  };
}

function sortedIds(ids: Set<string>): string[] {
  const values: string[] = [];
  ids.forEach((id) => {
    values.push(id);
  });
  values.sort();
  return values;
}

function formatRatio(value: Ratio | null): string {
  if (value === null) {
    return 'insufficient data';
  }
  const decimal = (value.numerator / value.denominator).toFixed(3);
  return `${value.numerator}/${value.denominator} (${decimal})`;
}

function formatCount(value: number | null): string {
  if (value === null) {
    return 'insufficient data';
  }
  return String(value);
}

function printSummary(agent: string, caseCount: number, runCount: number, summary: ScoreSummary): void {
  const lines = [
    `agent: ${agent}`,
    `answerKeyCases: ${caseCount}`,
    `runFiles: ${runCount}`,
    `observations: ${summary.observations}`,
  ];
  for (const label of LABELS) {
    lines.push(`precision ${label}: ${formatRatio(summary.precision[label])}`);
  }
  for (const label of LABELS) {
    lines.push(`recall ${label}: ${formatRatio(summary.recall[label])}`);
  }
  for (const label of LABELS) {
    lines.push(`falsePositives ${label}: ${formatCount(summary.falsePositives[label])}`);
  }
  lines.push(`accuracy: ${formatRatio(summary.accuracy)}`);
  lines.push(`agreement: ${formatRatio(summary.agreement)}`);
  process.stdout.write(`${lines.join('\n')}\n`);
}

function agentName(value: string | undefined): string {
  if (value === undefined || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)) {
    throw new Error('Usage: npx tsx evals/score.ts <agent>');
  }
  return value;
}

export function scoreAgent(agent: string): number {
  if (!fs.existsSync(answerKeyPath)) {
    throw new Error(`Answer key not found: ${answerKeyPath}`);
  }
  const cases = parseAnswerKey(readJson(answerKeyPath));
  const runs = listRunFiles(agent);
  const { summary, unknownIds } = summarize(runs, cases);
  printSummary(agent, cases.length, runs.length, summary);
  if (unknownIds.length > 0) {
    process.stderr.write(
      `Unknown answer-key id${unknownIds.length === 1 ? '' : 's'}: ${unknownIds.join(', ')}\n`,
    );
    return 1;
  }
  return 0;
}

function main(): void {
  try {
    const agent = agentName(process.argv[2]);
    process.exitCode = scoreAgent(agent);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

const entry = process.argv[1];
if (entry !== undefined && (path.basename(entry) === 'score.ts' || path.basename(entry) === 'score.js')) {
  main();
}
