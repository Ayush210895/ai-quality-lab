import assert from "node:assert/strict";
import test from "node:test";

import {
  allNegativeBaseline,
  assessLaunch,
  averagePrecision,
  evaluatePredictions,
  generateScenario,
} from "../dist/metrics.mjs";

const rows = [
  { actual: 1, score: 0.9 },
  { actual: 1, score: 0.4 },
  { actual: 0, score: 0.8 },
  { actual: 0, score: 0.1 },
];

test("calculates confusion-matrix metrics and expected cost", () => {
  const result = evaluatePredictions(rows, 0.5, {
    falsePositiveCost: 10,
    falseNegativeCost: 100,
  });

  assert.deepEqual(
    { tp: result.tp, fp: result.fp, tn: result.tn, fn: result.fn },
    { tp: 1, fp: 1, tn: 1, fn: 1 },
  );
  assert.equal(result.precision, 0.5);
  assert.equal(result.recall, 0.5);
  assert.equal(result.expectedCost, 110);
});

test("all-negative baseline exposes misleading accuracy", () => {
  const imbalanced = [
    ...Array.from({ length: 99 }, () => ({ actual: 0, score: 0.1 })),
    { actual: 1, score: 0.9 },
  ];
  const result = allNegativeBaseline(imbalanced, {
    falsePositiveCost: 10,
    falseNegativeCost: 1000,
  });

  assert.equal(result.accuracy, 0.99);
  assert.equal(result.recall, 0);
  assert.equal(result.fn, 1);
});

test("average precision is perfect for a perfectly ranked sample", () => {
  const ranked = [
    { actual: 1, score: 0.9 },
    { actual: 1, score: 0.8 },
    { actual: 0, score: 0.2 },
    { actual: 0, score: 0.1 },
  ];
  assert.equal(averagePrecision(ranked), 1);
});

test("launch assessment passes only when quality, cost, and capacity clear", () => {
  const decision = assessLaunch(
    {
      total: 1000,
      positives: 100,
      recall: 0.8,
      alertRate: 0.05,
      expectedCost: 700,
    },
    1000,
    0.08,
  );
  assert.equal(decision.status, "Pass");
  assert.equal(decision.gates.every((gate) => gate.pass), true);
});

test("launch assessment stops a harmful operating point", () => {
  const decision = assessLaunch(
    {
      total: 1000,
      positives: 100,
      recall: 0.2,
      alertRate: 0.12,
      expectedCost: 1200,
    },
    1000,
    0.08,
  );
  assert.equal(decision.status, "Stop");
});

test("synthetic scenario is reproducible and valid", () => {
  const first = generateScenario({ size: 100, prevalence: 0.05, seed: 7 });
  const second = generateScenario({ size: 100, prevalence: 0.05, seed: 7 });
  assert.deepEqual(first, second);
  assert.equal(first.length, 100);
  assert.equal(first.every((row) => row.score >= 0 && row.score <= 1), true);
});

