import { clamp, createSeededRandom } from "./metrics.mjs";

function mean(values) {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, probability) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(probability * sorted.length) - 1));
  return sorted[index];
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? null : numerator / denominator;
}

function parseRecords(text) {
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

export function parseCsvObjects(text, { required = [], maxRows = 200000 } = {}) {
  const records = parseRecords(String(text ?? "").replace(/^\uFEFF/, ""));
  if (records.length < 2) throw new Error("The CSV must contain a header and at least one data row.");

  const headers = records[0].map((value) => value.trim());
  const normalized = headers.map((value) => value.toLowerCase());
  const missing = required.filter((name) => !normalized.includes(name.toLowerCase()));
  if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(", ")}.`);
  if (records.length - 1 > maxRows) throw new Error(`The file exceeds the ${maxRows.toLocaleString("en-US")} row limit.`);

  return records.slice(1).map((record) => Object.fromEntries(
    headers.map((header, index) => [header.toLowerCase(), (record[index] ?? "").trim()]),
  ));
}

function numberField(row, name, { optional = false } = {}) {
  const raw = row[name];
  if (optional && (raw === undefined || raw === "" || raw === null)) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be numeric.`);
  return value;
}

export function generateRegressionScenario({ size = 60, noise = 10, bias = 2, seed = 218 } = {}) {
  const random = createSeededRandom(seed);
  return Array.from({ length: size }, (_, index) => {
    const trend = 120 + index * 1.8;
    const seasonal = 24 * Math.sin((index / 12) * Math.PI * 2);
    const actual = Math.max(5, trend + seasonal + (random() - 0.5) * 12);
    const predicted = actual + bias + (random() - 0.5) * noise * 2;
    const intervalWidth = Math.max(8, noise * 1.65);
    return {
      period: index + 1,
      actual,
      predicted,
      lower: predicted - intervalWidth,
      upper: predicted + intervalWidth,
    };
  });
}

export function parseRegressionCsv(text) {
  const objects = parseCsvObjects(text, { required: ["actual", "predicted"] });
  const rows = objects.map((row, index) => {
    try {
      return {
        period: row.period || row.timestamp || index + 1,
        actual: numberField(row, "actual"),
        predicted: numberField(row, "predicted"),
        lower: numberField(row, "lower", { optional: true }),
        upper: numberField(row, "upper", { optional: true }),
      };
    } catch (error) {
      throw new Error(`Line ${index + 2}: ${error.message}`);
    }
  });
  if (rows.length < 3) throw new Error("Regression evaluation requires at least three rows.");
  return rows;
}

export function evaluateRegression(rows) {
  if (rows.length === 0) throw new Error("Regression evaluation requires rows.");
  const errors = rows.map((row) => row.predicted - row.actual);
  const absoluteErrors = errors.map(Math.abs);
  const squaredErrors = errors.map((error) => error ** 2);
  const actualMean = mean(rows.map((row) => row.actual));
  const sse = squaredErrors.reduce((sum, value) => sum + value, 0);
  const sst = rows.reduce((sum, row) => sum + (row.actual - actualMean) ** 2, 0);
  const intervalRows = rows.filter((row) => Number.isFinite(row.lower) && Number.isFinite(row.upper));
  const coverage = intervalRows.length === 0
    ? null
    : mean(intervalRows.map((row) => Number(row.actual >= row.lower && row.actual <= row.upper)));
  const scale = mean(rows.map((row) => Math.abs(row.actual)));

  return {
    total: rows.length,
    mae: mean(absoluteErrors),
    rmse: Math.sqrt(mean(squaredErrors)),
    bias: mean(errors),
    relativeBias: safeDivide(mean(errors), scale),
    wape: safeDivide(absoluteErrors.reduce((sum, value) => sum + value, 0), rows.reduce((sum, row) => sum + Math.abs(row.actual), 0)),
    r2: sst === 0 ? null : 1 - sse / sst,
    coverage,
  };
}

export function assessRegression(metrics, { maxWape = 0.12, maxBias = 0.03, minCoverage = 0.85 } = {}) {
  const gates = [
    { name: "Weighted error", value: metrics.wape, target: maxWape, pass: metrics.wape <= maxWape, direction: "max" },
    { name: "Absolute bias", value: Math.abs(metrics.relativeBias), target: maxBias, pass: Math.abs(metrics.relativeBias) <= maxBias, direction: "max" },
  ];
  if (metrics.coverage !== null) {
    gates.push({ name: "Interval coverage", value: metrics.coverage, target: minCoverage, pass: metrics.coverage >= minCoverage, direction: "min" });
  }
  const passed = gates.filter((gate) => gate.pass).length;
  const status = passed === gates.length ? "Pass" : passed === 0 ? "Stop" : "Conditional pass";
  return { status, tone: status === "Pass" ? "pass" : status === "Stop" ? "stop" : "conditional", gates };
}

export function generateRankingScenario({ queries = 40, itemsPerQuery = 12, seed = 218 } = {}) {
  const random = createSeededRandom(seed);
  const rows = [];
  for (let query = 1; query <= queries; query += 1) {
    for (let item = 1; item <= itemsPerQuery; item += 1) {
      const latent = random();
      const relevance = latent > 0.88 ? 3 : latent > 0.72 ? 2 : latent > 0.52 ? 1 : 0;
      const score = clamp(relevance / 3 + (random() - 0.5) * 0.65, 0, 1);
      rows.push({ queryId: `q${query}`, itemId: `item-${item}`, relevance, score });
    }
  }
  return rows;
}

export function parseRankingCsv(text) {
  const objects = parseCsvObjects(text, { required: ["query_id", "item_id", "relevance", "score"] });
  return objects.map((row, index) => {
    const relevance = numberField(row, "relevance");
    const score = numberField(row, "score");
    if (relevance < 0) throw new Error(`Line ${index + 2}: relevance cannot be negative.`);
    return { queryId: row.query_id, itemId: row.item_id, relevance, score };
  });
}

export function evaluateRanking(rows, k = 5) {
  if (!Number.isInteger(k) || k < 1) throw new Error("K must be a positive integer.");
  const groups = new Map();
  rows.forEach((row) => {
    if (!groups.has(row.queryId)) groups.set(row.queryId, []);
    groups.get(row.queryId).push(row);
  });
  if (groups.size === 0) throw new Error("Ranking evaluation requires rows.");

  const perQuery = [];
  const recommended = new Set();
  for (const items of groups.values()) {
    const ranked = [...items].sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, k);
    top.forEach((row) => recommended.add(row.itemId));
    const relevantTotal = ranked.filter((row) => row.relevance > 0).length;
    const hits = top.filter((row) => row.relevance > 0).length;
    const dcg = top.reduce((sum, row, index) => sum + ((2 ** row.relevance) - 1) / Math.log2(index + 2), 0);
    const ideal = [...ranked].sort((a, b) => b.relevance - a.relevance).slice(0, k);
    const idcg = ideal.reduce((sum, row, index) => sum + ((2 ** row.relevance) - 1) / Math.log2(index + 2), 0);
    const firstRelevant = ranked.findIndex((row) => row.relevance > 0);
    perQuery.push({
      precision: safeDivide(hits, top.length),
      recall: safeDivide(hits, relevantTotal),
      ndcg: idcg === 0 ? null : dcg / idcg,
      reciprocalRank: firstRelevant === -1 ? 0 : 1 / (firstRelevant + 1),
    });
  }
  const validNdcg = perQuery.map((row) => row.ndcg).filter((value) => value !== null);
  const catalog = new Set(rows.map((row) => row.itemId));
  return {
    queries: groups.size,
    k,
    precisionAtK: mean(perQuery.map((row) => row.precision).filter((value) => value !== null)),
    recallAtK: mean(perQuery.map((row) => row.recall).filter((value) => value !== null)),
    ndcgAtK: mean(validNdcg),
    mrr: mean(perQuery.map((row) => row.reciprocalRank)),
    coverage: safeDivide(recommended.size, catalog.size),
  };
}

export function assessRanking(metrics, { minNdcg = 0.75, minRecall = 0.55, minCoverage = 0.6 } = {}) {
  const gates = [
    { name: "NDCG@K", value: metrics.ndcgAtK, target: minNdcg, pass: metrics.ndcgAtK >= minNdcg, direction: "min" },
    { name: "Recall@K", value: metrics.recallAtK, target: minRecall, pass: metrics.recallAtK >= minRecall, direction: "min" },
    { name: "Catalog coverage", value: metrics.coverage, target: minCoverage, pass: metrics.coverage >= minCoverage, direction: "min" },
  ];
  const passed = gates.filter((gate) => gate.pass).length;
  const status = passed === gates.length ? "Pass" : passed === 0 ? "Stop" : "Conditional pass";
  return { status, tone: status === "Pass" ? "pass" : status === "Stop" ? "stop" : "conditional", gates };
}

export function generateLlmScenario({ size = 80, quality = 0.84, seed = 218 } = {}) {
  const random = createSeededRandom(seed);
  return Array.from({ length: size }, (_, index) => ({
    caseId: `case-${index + 1}`,
    quality: clamp(quality + (random() - 0.5) * 0.28, 0, 1),
    groundedness: clamp(quality + 0.04 + (random() - 0.5) * 0.24, 0, 1),
    retrieval: clamp(quality - 0.03 + (random() - 0.5) * 0.3, 0, 1),
    citation: clamp(quality + 0.02 + (random() - 0.5) * 0.3, 0, 1),
    latencyMs: 900 + random() * 2100,
    costUsd: 0.008 + random() * 0.035,
    safetyPass: random() > 0.012 ? 1 : 0,
  }));
}

export function parseLlmCsv(text) {
  const required = ["quality", "groundedness", "retrieval", "citation", "latency_ms", "cost_usd", "safety_pass"];
  const objects = parseCsvObjects(text, { required });
  return objects.map((row, index) => {
    const parsed = {
      caseId: row.case_id || `case-${index + 1}`,
      quality: numberField(row, "quality"),
      groundedness: numberField(row, "groundedness"),
      retrieval: numberField(row, "retrieval"),
      citation: numberField(row, "citation"),
      latencyMs: numberField(row, "latency_ms"),
      costUsd: numberField(row, "cost_usd"),
      safetyPass: numberField(row, "safety_pass"),
    };
    for (const name of ["quality", "groundedness", "retrieval", "citation", "safetyPass"]) {
      if (parsed[name] < 0 || parsed[name] > 1) throw new Error(`Line ${index + 2}: ${name} must be between 0 and 1.`);
    }
    return parsed;
  });
}

export function evaluateLlm(rows) {
  if (rows.length === 0) throw new Error("LLM evaluation requires rows.");
  return {
    total: rows.length,
    quality: mean(rows.map((row) => row.quality)),
    groundedness: mean(rows.map((row) => row.groundedness)),
    retrieval: mean(rows.map((row) => row.retrieval)),
    citation: mean(rows.map((row) => row.citation)),
    safetyPassRate: mean(rows.map((row) => row.safetyPass)),
    averageLatencyMs: mean(rows.map((row) => row.latencyMs)),
    p95LatencyMs: percentile(rows.map((row) => row.latencyMs), 0.95),
    averageCostUsd: mean(rows.map((row) => row.costUsd)),
  };
}

export function assessLlm(metrics, { minQuality = 0.8, minGroundedness = 0.85, minSafety = 0.98, maxP95LatencyMs = 3000, maxCostUsd = 0.04 } = {}) {
  const gates = [
    { name: "Answer quality", value: metrics.quality, target: minQuality, pass: metrics.quality >= minQuality, direction: "min" },
    { name: "Groundedness", value: metrics.groundedness, target: minGroundedness, pass: metrics.groundedness >= minGroundedness, direction: "min" },
    { name: "Safety pass rate", value: metrics.safetyPassRate, target: minSafety, pass: metrics.safetyPassRate >= minSafety, direction: "min" },
    { name: "P95 latency", value: metrics.p95LatencyMs, target: maxP95LatencyMs, pass: metrics.p95LatencyMs <= maxP95LatencyMs, direction: "max", unit: "ms" },
    { name: "Average cost", value: metrics.averageCostUsd, target: maxCostUsd, pass: metrics.averageCostUsd <= maxCostUsd, direction: "max", unit: "currency" },
  ];
  const passed = gates.filter((gate) => gate.pass).length;
  const status = passed === gates.length ? "Pass" : passed <= 2 ? "Stop" : "Conditional pass";
  return { status, tone: status === "Pass" ? "pass" : status === "Stop" ? "stop" : "conditional", gates };
}

export function generateMonitoringScenario({ size = 2000, drift = 0.35, missingRate = 0.015, seed = 218 } = {}) {
  const random = createSeededRandom(seed);
  const rows = Array.from({ length: size }, () => {
    const reference = (random() + random() + random()) / 3;
    const current = random() < missingRate
      ? null
      : clamp(reference + drift * 0.18 + (random() - 0.5) * (0.12 + drift * 0.2), 0, 1);
    return { reference, current };
  });
  return { rows, baselinePerformance: 0.84, currentPerformance: 0.84 - drift * 0.12 };
}

export function parseMonitoringCsv(text) {
  const objects = parseCsvObjects(text, { required: ["reference", "current"] });
  const rows = objects.map((row, index) => {
    try {
      return {
        reference: numberField(row, "reference"),
        current: numberField(row, "current", { optional: true }),
      };
    } catch (error) {
      throw new Error(`Line ${index + 2}: ${error.message}`);
    }
  });
  const baselinePerformance = objects[0].baseline_performance === "" || objects[0].baseline_performance === undefined
    ? null
    : numberField(objects[0], "baseline_performance");
  const currentPerformance = objects[0].current_performance === "" || objects[0].current_performance === undefined
    ? null
    : numberField(objects[0], "current_performance");
  return { rows, baselinePerformance, currentPerformance };
}

function standardDeviation(values) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function populationStabilityIndex(reference, current, bins = 10) {
  const sorted = [...reference].sort((a, b) => a - b);
  const boundaries = Array.from({ length: bins - 1 }, (_, index) => percentile(sorted, (index + 1) / bins));
  const bucket = (value) => boundaries.findIndex((boundary) => value <= boundary);
  const refCounts = Array(bins).fill(0);
  const curCounts = Array(bins).fill(0);
  reference.forEach((value) => { refCounts[bucket(value) === -1 ? bins - 1 : bucket(value)] += 1; });
  current.forEach((value) => { curCounts[bucket(value) === -1 ? bins - 1 : bucket(value)] += 1; });
  return refCounts.reduce((sum, count, index) => {
    const refShare = Math.max(count / reference.length, 0.0001);
    const curShare = Math.max(curCounts[index] / current.length, 0.0001);
    return sum + (curShare - refShare) * Math.log(curShare / refShare);
  }, 0);
}

export function evaluateMonitoring({ rows, baselinePerformance = null, currentPerformance = null }) {
  if (rows.length < 20) throw new Error("Monitoring evaluation requires at least 20 rows.");
  const reference = rows.map((row) => row.reference);
  const current = rows.map((row) => row.current).filter((value) => value !== null);
  if (current.length === 0) throw new Error("Current data has no valid values.");
  const referenceStd = standardDeviation(reference);
  return {
    total: rows.length,
    psi: populationStabilityIndex(reference, current),
    meanShift: referenceStd === 0 ? null : (mean(current) - mean(reference)) / referenceStd,
    missingRate: 1 - current.length / rows.length,
    performanceDelta: baselinePerformance === null || currentPerformance === null
      ? null
      : currentPerformance - baselinePerformance,
  };
}

export function assessMonitoring(metrics, { maxPsi = 0.2, maxMeanShift = 0.5, maxMissingRate = 0.03, maxPerformanceDrop = 0.05 } = {}) {
  const gates = [
    { name: "Population drift", value: metrics.psi, target: maxPsi, pass: metrics.psi <= maxPsi, direction: "max", format: "number" },
    { name: "Mean shift", value: Math.abs(metrics.meanShift), target: maxMeanShift, pass: Math.abs(metrics.meanShift) <= maxMeanShift, direction: "max", format: "number" },
    { name: "Missing rate", value: metrics.missingRate, target: maxMissingRate, pass: metrics.missingRate <= maxMissingRate, direction: "max" },
  ];
  if (metrics.performanceDelta !== null) {
    gates.push({ name: "Performance drop", value: -metrics.performanceDelta, target: maxPerformanceDrop, pass: metrics.performanceDelta >= -maxPerformanceDrop, direction: "max" });
  }
  const passed = gates.filter((gate) => gate.pass).length;
  const status = passed === gates.length ? "Healthy" : passed <= 1 ? "Incident" : "Investigate";
  return { status, tone: status === "Healthy" ? "pass" : status === "Incident" ? "stop" : "conditional", gates };
}
