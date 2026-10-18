export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createSeededRandom(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function generateScenario({ size = 10000, prevalence = 0.01, seed = 42 } = {}) {
  const random = createSeededRandom(seed);
  const rows = [];

  for (let index = 0; index < size; index += 1) {
    const actual = random() < prevalence ? 1 : 0;
    const draw = random();
    const jitter = (random() - 0.5) * 0.12;
    const score = actual
      ? clamp(0.18 + 0.82 * (1 - Math.pow(draw, 1.65)) + jitter, 0.001, 0.999)
      : clamp(0.72 * Math.pow(draw, 2.65) + jitter, 0.001, 0.999);

    rows.push({ actual, score });
  }

  return rows;
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? null : numerator / denominator;
}

export function evaluatePredictions(
  rows,
  threshold,
  { falsePositiveCost = 10, falseNegativeCost = 1000 } = {},
) {
  const counts = { tp: 0, fp: 0, tn: 0, fn: 0 };

  for (const row of rows) {
    if ((row.actual !== 0 && row.actual !== 1) || row.score < 0 || row.score > 1) {
      throw new Error("Each row must contain actual as 0 or 1 and score between 0 and 1.");
    }

    const predicted = row.score >= threshold ? 1 : 0;
    if (row.actual === 1 && predicted === 1) counts.tp += 1;
    if (row.actual === 0 && predicted === 1) counts.fp += 1;
    if (row.actual === 0 && predicted === 0) counts.tn += 1;
    if (row.actual === 1 && predicted === 0) counts.fn += 1;
  }

  const total = rows.length;
  const precision = safeDivide(counts.tp, counts.tp + counts.fp);
  const recall = safeDivide(counts.tp, counts.tp + counts.fn);
  const accuracy = safeDivide(counts.tp + counts.tn, total);
  const f1 = precision === null || recall === null || precision + recall === 0
    ? null
    : (2 * precision * recall) / (precision + recall);
  const alertRate = safeDivide(counts.tp + counts.fp, total);
  const expectedCost = counts.fp * falsePositiveCost + counts.fn * falseNegativeCost;

  return {
    ...counts,
    total,
    positives: counts.tp + counts.fn,
    precision,
    recall,
    accuracy,
    f1,
    alertRate,
    expectedCost,
    costPerThousand: total === 0 ? 0 : (expectedCost / total) * 1000,
  };
}

export function averagePrecision(rows) {
  const positives = rows.reduce((sum, row) => sum + row.actual, 0);
  if (positives === 0) return null;

  const ranked = [...rows].sort((a, b) => b.score - a.score);
  let truePositives = 0;
  let area = 0;

  ranked.forEach((row, index) => {
    if (row.actual === 1) {
      truePositives += 1;
      area += truePositives / (index + 1);
    }
  });

  return area / positives;
}

export function allNegativeBaseline(rows, costs) {
  return evaluatePredictions(rows, 1.01, costs);
}

export function assessLaunch(metrics, baselineCost, maxReviewRate) {
  if (metrics.total === 0 || metrics.positives === 0) {
    return {
      status: "Insufficient evidence",
      tone: "neutral",
      savingsRate: null,
      gates: [],
      summary: "The evaluation set needs at least one positive example.",
    };
  }

  const savingsRate = baselineCost === 0
    ? null
    : (baselineCost - metrics.expectedCost) / baselineCost;
  const gates = [
    {
      name: "Minority-class recall",
      value: metrics.recall,
      target: 0.7,
      pass: metrics.recall !== null && metrics.recall >= 0.7,
      format: "percent",
    },
    {
      name: "Cost improvement",
      value: savingsRate,
      target: 0.15,
      pass: savingsRate !== null && savingsRate >= 0.15,
      format: "percent",
    },
    {
      name: "Review capacity",
      value: metrics.alertRate,
      target: maxReviewRate,
      pass: metrics.alertRate !== null && metrics.alertRate <= maxReviewRate,
      format: "capacity",
    },
  ];

  const passed = gates.filter((gate) => gate.pass).length;
  if ((savingsRate !== null && savingsRate <= 0) || (metrics.recall ?? 0) < 0.3) {
    return {
      status: "Stop",
      tone: "stop",
      savingsRate,
      gates,
      summary: "The current operating point does not justify launch. Change the threshold or improve the model.",
    };
  }

  if (passed === gates.length) {
    return {
      status: "Pass",
      tone: "pass",
      savingsRate,
      gates,
      summary: "The operating point clears the quality, economics, and capacity gates for a controlled launch.",
    };
  }

  return {
    status: "Conditional pass",
    tone: "conditional",
    savingsRate,
    gates,
    summary: "The model shows value, but at least one launch condition needs mitigation or explicit acceptance.",
  };
}

export function thresholdSweep(rows, costs) {
  const points = [];
  for (let step = 2; step <= 19; step += 1) {
    const threshold = step / 20;
    points.push({ threshold, ...evaluatePredictions(rows, threshold, costs) });
  }
  return points;
}

