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

function summarizeCounts(counts, costs) {
  const total = counts.tp + counts.fp + counts.tn + counts.fn;
  const precision = safeDivide(counts.tp, counts.tp + counts.fp);
  const recall = safeDivide(counts.tp, counts.tp + counts.fn);
  const accuracy = safeDivide(counts.tp + counts.tn, total);
  const f1 = precision === null || recall === null || precision + recall === 0
    ? null
    : (2 * precision * recall) / (precision + recall);
  const alertRate = safeDivide(counts.tp + counts.fp, total);
  const expectedCost = counts.fp * costs.falsePositiveCost + counts.fn * costs.falseNegativeCost;

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

  return summarizeCounts(counts, { falsePositiveCost, falseNegativeCost });
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

function parseCsvRecords(text) {
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.trim() !== "")) records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  record.push(field);
  if (record.some((value) => value.trim() !== "")) records.push(record);
  return records;
}

export function parsePredictionCsv(text, { maxRows = 200000 } = {}) {
  const cleanText = String(text ?? "").replace(/^\uFEFF/, "");
  const records = parseCsvRecords(cleanText);
  if (records.length < 2) {
    throw new Error("The CSV must contain a header and at least one data row.");
  }

  const headers = records[0].map((value) => value.trim().toLowerCase());
  const actualIndex = headers.indexOf("actual");
  const scoreIndex = headers.indexOf("score");
  if (actualIndex === -1 || scoreIndex === -1) {
    throw new Error('Required columns are missing. Use headers named "actual" and "score".');
  }
  if (records.length - 1 > maxRows) {
    throw new Error(`The file exceeds the ${maxRows.toLocaleString("en-US")} row limit.`);
  }

  const rows = [];
  const issues = [];
  records.slice(1).forEach((record, index) => {
    const line = index + 2;
    const actualText = (record[actualIndex] ?? "").trim();
    const scoreText = (record[scoreIndex] ?? "").trim();
    const actual = Number(actualText);
    const score = Number(scoreText);

    if (!/^[01]$/.test(actualText)) {
      issues.push(`line ${line}: actual must be 0 or 1`);
    } else if (scoreText === "" || !Number.isFinite(score) || score < 0 || score > 1) {
      issues.push(`line ${line}: score must be between 0 and 1`);
    } else {
      rows.push({ actual, score });
    }
  });

  if (issues.length > 0) {
    const preview = issues.slice(0, 3).join("; ");
    const remainder = issues.length > 3 ? `; plus ${issues.length - 3} more` : "";
    throw new Error(`Invalid CSV values: ${preview}${remainder}.`);
  }

  const positives = rows.reduce((sum, row) => sum + row.actual, 0);
  if (positives === 0 || positives === rows.length) {
    throw new Error("The evaluation data must contain both positive and negative outcomes.");
  }

  return {
    rows,
    metadata: {
      total: rows.length,
      positives,
      negatives: rows.length - positives,
      ignoredColumns: headers.filter((name) => name !== "actual" && name !== "score"),
    },
  };
}

export function recommendThreshold(
  rows,
  costs,
  { minRecall = 0.7, maxReviewRate = 0.08 } = {},
) {
  if (rows.length === 0) throw new Error("Threshold recommendation requires evaluation rows.");

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const positives = rows.reduce((sum, row) => sum + row.actual, 0);
  const counts = { tp: 0, fp: 0, tn: rows.length - positives, fn: positives };
  const candidates = [];

  if (sorted[0].score < 1) {
    candidates.push({ threshold: 1, metrics: summarizeCounts(counts, costs) });
  }

  for (let index = 0; index < sorted.length;) {
    const score = sorted[index].score;
    while (index < sorted.length && sorted[index].score === score) {
      if (sorted[index].actual === 1) {
        counts.tp += 1;
        counts.fn -= 1;
      } else {
        counts.fp += 1;
        counts.tn -= 1;
      }
      index += 1;
    }
    candidates.push({ threshold: score, metrics: summarizeCounts({ ...counts }, costs) });
  }

  if (candidates[candidates.length - 1].threshold > 0) {
    candidates.push({ threshold: 0, metrics: summarizeCounts({ ...counts }, costs) });
  }
  const feasible = candidates.filter(({ metrics }) => (
    metrics.recall !== null
    && metrics.recall >= minRecall
    && metrics.alertRate !== null
    && metrics.alertRate <= maxReviewRate
  ));
  const pool = feasible.length > 0 ? feasible : candidates;
  const best = pool.reduce((winner, candidate) => {
    if (candidate.metrics.expectedCost < winner.metrics.expectedCost) return candidate;
    if (
      candidate.metrics.expectedCost === winner.metrics.expectedCost
      && candidate.threshold > winner.threshold
    ) return candidate;
    return winner;
  });

  return {
    ...best,
    feasible: feasible.length > 0,
    constraints: { minRecall, maxReviewRate },
    candidateCount: candidates.length,
  };
}

