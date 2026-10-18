import test from "node:test";
import assert from "node:assert/strict";

import {
  assessLlm,
  assessMonitoring,
  assessRanking,
  assessRegression,
  evaluateLlm,
  evaluateMonitoring,
  evaluateRanking,
  evaluateRegression,
  generateLlmScenario,
  generateMonitoringScenario,
  generateRankingScenario,
  generateRegressionScenario,
  parseCsvObjects,
  parseLlmCsv,
  parseMonitoringCsv,
  parseRankingCsv,
  parseRegressionCsv,
} from "../dist/model-metrics.mjs";

test("generic CSV parser supports quoted fields", () => {
  const rows = parseCsvObjects('actual,predicted,note\n10,11,"north, west"\n', { required: ["actual"] });
  assert.equal(rows[0].note, "north, west");
});

test("regression evaluator reports exact perfect predictions", () => {
  const metrics = evaluateRegression([
    { actual: 10, predicted: 10, lower: 9, upper: 11 },
    { actual: 20, predicted: 20, lower: 19, upper: 21 },
    { actual: 30, predicted: 30, lower: 29, upper: 31 },
  ]);
  assert.equal(metrics.mae, 0);
  assert.equal(metrics.rmse, 0);
  assert.equal(metrics.wape, 0);
  assert.equal(metrics.r2, 1);
  assert.equal(metrics.coverage, 1);
  assert.equal(assessRegression(metrics).status, "Pass");
});

test("regression CSV parser accepts optional intervals", () => {
  const rows = parseRegressionCsv("actual,predicted,lower,upper\n10,9,8,11\n20,19,17,21\n30,31,28,33\n");
  assert.equal(rows.length, 3);
  assert.equal(rows[0].lower, 8);
});

test("regression generator is deterministic", () => {
  assert.deepEqual(generateRegressionScenario({ size: 3 }), generateRegressionScenario({ size: 3 }));
});

test("ranking evaluator produces perfect top-k metrics", () => {
  const rows = [
    { queryId: "a", itemId: "1", relevance: 3, score: 0.9 },
    { queryId: "a", itemId: "2", relevance: 1, score: 0.8 },
    { queryId: "a", itemId: "3", relevance: 0, score: 0.1 },
  ];
  const metrics = evaluateRanking(rows, 2);
  assert.equal(metrics.precisionAtK, 1);
  assert.equal(metrics.recallAtK, 1);
  assert.equal(metrics.ndcgAtK, 1);
  assert.equal(metrics.mrr, 1);
});

test("ranking CSV parser and generator create valid groups", () => {
  const rows = parseRankingCsv("query_id,item_id,relevance,score\nq1,a,2,0.9\nq1,b,0,0.1\n");
  assert.equal(rows[0].queryId, "q1");
  assert.equal(generateRankingScenario({ queries: 2, itemsPerQuery: 3 }).length, 6);
  assert.ok(["Pass", "Conditional pass", "Stop"].includes(assessRanking(evaluateRanking(rows, 1)).status));
});

test("LLM evaluator aggregates quality, latency, cost, and safety", () => {
  const rows = [
    { quality: 0.9, groundedness: 0.9, retrieval: 0.8, citation: 1, latencyMs: 1000, costUsd: 0.02, safetyPass: 1 },
    { quality: 0.8, groundedness: 1, retrieval: 0.9, citation: 0.8, latencyMs: 2000, costUsd: 0.03, safetyPass: 1 },
  ];
  const metrics = evaluateLlm(rows);
  assert.ok(Math.abs(metrics.quality - 0.85) < 1e-12);
  assert.equal(metrics.p95LatencyMs, 2000);
  assert.ok(Math.abs(metrics.averageCostUsd - 0.025) < 1e-12);
  assert.equal(assessLlm(metrics).status, "Pass");
});

test("LLM CSV parser validates bounded evaluator scores", () => {
  const csv = "quality,groundedness,retrieval,citation,latency_ms,cost_usd,safety_pass\n0.9,0.9,0.8,1,1200,0.02,1\n";
  assert.equal(parseLlmCsv(csv).length, 1);
  assert.throws(() => parseLlmCsv(csv.replace("0.9", "1.2")), /between 0 and 1/);
  assert.equal(generateLlmScenario({ size: 4 }).length, 4);
});

test("monitoring evaluator detects healthy identical populations", () => {
  const rows = Array.from({ length: 100 }, (_, index) => ({ reference: index / 100, current: index / 100 }));
  const metrics = evaluateMonitoring({ rows, baselinePerformance: 0.8, currentPerformance: 0.8 });
  assert.equal(metrics.psi, 0);
  assert.equal(metrics.meanShift, 0);
  assert.equal(metrics.missingRate, 0);
  assert.equal(assessMonitoring(metrics).status, "Healthy");
});

test("monitoring parser preserves missing current values", () => {
  const csv = ["reference,current,baseline_performance,current_performance"];
  for (let index = 0; index < 20; index += 1) csv.push(`${index / 20},${index === 0 ? "" : index / 20},0.9,0.84`);
  const parsed = parseMonitoringCsv(csv.join("\n"));
  assert.equal(parsed.rows[0].current, null);
  assert.equal(parsed.baselinePerformance, 0.9);
  assert.equal(parsed.currentPerformance, 0.84);
  assert.equal(generateMonitoringScenario({ size: 25 }).rows.length, 25);
});
