import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRun, summarize } from './score';

type Label = 'drift' | 'bug' | 'ambiguous';

function answer(id: string, expected: Label): { id: string; input: string; expected: Label } {
  return { id, input: id, expected };
}

function prediction(id: string, predicted: Label): { id: string; predicted: Label; evidence: string } {
  return { id, predicted, evidence: 'synthetic' };
}

function runFile(
  fileName: string,
  predictions: { id: string; predicted: Label; evidence: string }[],
): {
  fileName: string;
  run: {
    model: string;
    startedAt: string;
    finishedAt: string;
    predictions: { id: string; predicted: Label; evidence: string }[];
  };
} {
  return {
    fileName,
    run: {
      model: 'synthetic',
      startedAt: '2026-10-21T00:00:00.000Z',
      finishedAt: '2026-10-21T00:00:01.000Z',
      predictions,
    },
  };
}

const bugCase = [answer('case-1', 'bug')];

test('three runs that predict the same class agree', () => {
  const runs = [1, 2, 3].map((number) => runFile(`${number}.json`, [prediction('case-1', 'bug')]));
  const { summary, unknownIds } = summarize(runs, bugCase);

  assert.deepEqual(unknownIds, []);
  assert.deepEqual(summary.agreement, { numerator: 1, denominator: 1 });
  assert.deepEqual(summary.accuracy, { numerator: 3, denominator: 3 });
  assert.deepEqual(summary.precision.bug, { numerator: 3, denominator: 3 });
  assert.deepEqual(summary.recall.bug, { numerator: 3, denominator: 3 });
  assert.equal(summary.falsePositives.bug, 0);
  assert.equal(summary.falsePositives.drift, 0);
});

test('three runs do not agree when one predicts a different class', () => {
  const runs = [
    runFile('1.json', [prediction('case-1', 'bug')]),
    runFile('2.json', [prediction('case-1', 'bug')]),
    runFile('3.json', [prediction('case-1', 'drift')]),
  ];
  const { summary } = summarize(runs, bugCase);

  assert.deepEqual(summary.agreement, { numerator: 0, denominator: 1 });
  assert.deepEqual(summary.accuracy, { numerator: 2, denominator: 3 });
  assert.deepEqual(summary.precision.bug, { numerator: 2, denominator: 2 });
  assert.deepEqual(summary.recall.bug, { numerator: 2, denominator: 3 });
  assert.equal(summary.falsePositives.drift, 1);
  assert.equal(summary.falsePositives.bug, 0);
});

test('three runs do not treat a missing prediction as agreement', () => {
  const cases = [answer('kept', 'bug'), answer('omitted', 'drift')];
  const complete = [prediction('kept', 'bug'), prediction('omitted', 'drift')];
  const runs = [
    runFile('1.json', complete),
    runFile('2.json', complete),
    runFile('3.json', [prediction('kept', 'bug')]),
  ];
  const { summary } = summarize(runs, cases);

  assert.deepEqual(summary.agreement, { numerator: 1, denominator: 2 });
  assert.deepEqual(summary.accuracy, { numerator: 5, denominator: 5 });
});

test('three runs do not agree when one run has no predictions', () => {
  const runs = [
    runFile('1.json', [prediction('case-1', 'bug')]),
    runFile('2.json', [prediction('case-1', 'bug')]),
    runFile('3.json', []),
  ];
  const { summary } = summarize(runs, bugCase);

  assert.deepEqual(summary.agreement, { numerator: 0, denominator: 1 });
  assert.deepEqual(summary.accuracy, { numerator: 2, denominator: 2 });
  assert.equal(summary.falsePositives.bug, 0);
});

test('one run cannot establish agreement', () => {
  const { summary } = summarize([runFile('1.json', [prediction('case-1', 'bug')])], bugCase);

  assert.equal(summary.agreement, null);
  assert.deepEqual(summary.accuracy, { numerator: 1, denominator: 1 });
});

test('an invalid predicted class is rejected', () => {
  assert.throws(
    () =>
      parseRun(
        {
          model: 'synthetic',
          startedAt: '2026-10-21T00:00:00.000Z',
          finishedAt: '2026-10-21T00:00:01.000Z',
          predictions: [{ id: 'case-1', predicted: 'other', evidence: 'synthetic' }],
        },
        'run.json',
      ),
    /predicted must be drift, bug, or ambiguous/,
  );
});

test('duplicate case ids in one run are rejected', () => {
  assert.throws(
    () =>
      parseRun(
        {
          model: 'synthetic',
          startedAt: '2026-10-21T00:00:00.000Z',
          finishedAt: '2026-10-21T00:00:01.000Z',
          predictions: [
            { id: 'case-1', predicted: 'bug', evidence: 'first' },
            { id: 'case-1', predicted: 'drift', evidence: 'second' },
          ],
        },
        'run.json',
      ),
    /repeats id case-1/,
  );
});

test('an unknown case id is reported and is not an agreement case', () => {
  const { summary, unknownIds } = summarize(
    [
      runFile('1.json', [prediction('not-in-key', 'bug')]),
      runFile('2.json', [prediction('not-in-key', 'bug')]),
    ],
    bugCase,
  );

  assert.deepEqual(unknownIds, ['not-in-key']);
  assert.deepEqual(summary.agreement, { numerator: 0, denominator: 1 });
  assert.equal(summary.accuracy, null);
  assert.equal(summary.falsePositives.bug, null);
});

test('an empty answer key leaves agreement and accuracy insufficient', () => {
  const { summary, unknownIds } = summarize(
    [
      runFile('1.json', [prediction('case-1', 'bug')]),
      runFile('2.json', [prediction('case-1', 'bug')]),
    ],
    [],
  );

  assert.deepEqual(unknownIds, ['case-1']);
  assert.equal(summary.agreement, null);
  assert.equal(summary.accuracy, null);
  assert.equal(summary.observations, 0);
});
