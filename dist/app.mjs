import {
  allNegativeBaseline,
  assessLaunch,
  averagePrecision,
  evaluatePredictions,
  generateScenario,
  parsePredictionCsv,
  recommendThreshold,
  thresholdSweep,
} from "./metrics.mjs";

const defaults = {
  prevalence: 1,
  threshold: 0.5,
  falsePositiveCost: 10,
  falseNegativeCost: 1000,
  capacity: 15,
};

const controls = {
  prevalence: document.querySelector("#prevalence"),
  threshold: document.querySelector("#threshold"),
  falsePositiveCost: document.querySelector("#false-positive-cost"),
  falseNegativeCost: document.querySelector("#false-negative-cost"),
  capacity: document.querySelector("#capacity"),
};

const elements = Object.fromEntries(
  [
    "accuracy", "precision", "recall", "pr-auc", "alert-rate", "tp", "fp", "tn", "fn",
    "decision-banner", "decision-status", "decision-pill", "decision-summary", "cost-per-thousand",
    "cost-change", "baseline-copy", "sample-summary", "gate-list", "gate-count", "edge-message",
    "tradeoff-chart", "chart-caption", "prevalence-output", "threshold-output",
    "false-positive-output", "false-negative-output", "capacity-output", "dataset-badge",
    "synthetic-mode", "upload-mode", "upload-panel", "csv-file", "sample-button", "upload-status",
    "recommendation-note", "apply-recommendation", "policy-table",
  ].map((id) => [id, document.querySelector(`#${id}`)]),
);

let rows = [];
let dataMode = "synthetic";
let uploadedFilename = "";
let dataVersion = 0;
let cachedPrAuc = null;
let recommendationCache = { key: "", value: null };

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("en-US");

function percent(value, digits = 1) {
  return value === null || Number.isNaN(value) ? "N/A" : `${(value * 100).toFixed(digits)}%`;
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readState() {
  return {
    prevalence: Number(controls.prevalence.value),
    threshold: Number(controls.threshold.value),
    falsePositiveCost: Number(controls.falsePositiveCost.value),
    falseNegativeCost: Number(controls.falseNegativeCost.value),
    capacity: Number(controls.capacity.value),
  };
}

function costsFrom(state) {
  return {
    falsePositiveCost: state.falsePositiveCost,
    falseNegativeCost: state.falseNegativeCost,
  };
}

function setRows(nextRows) {
  rows = nextRows;
  dataVersion += 1;
  cachedPrAuc = averagePrecision(rows);
  recommendationCache = { key: "", value: null };
}

function regenerateRows(state) {
  setRows(generateScenario({ size: 10000, prevalence: state.prevalence / 100, seed: 218 }));
}

function actualPrevalence() {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + row.actual, 0) / rows.length;
}

function renderDataSource(state) {
  const synthetic = dataMode === "synthetic";
  elements["synthetic-mode"].setAttribute("aria-pressed", String(synthetic));
  elements["upload-mode"].setAttribute("aria-pressed", String(!synthetic));
  elements["upload-panel"].hidden = synthetic;
  controls.prevalence.disabled = !synthetic;
  elements["prevalence-output"].value = synthetic
    ? `${state.prevalence.toFixed(1)}%`
    : `${(actualPrevalence() * 100).toFixed(1)}%`;
  elements["dataset-badge"].textContent = synthetic
    ? "Synthetic evaluation set"
    : dataMode === "upload"
      ? `${uploadedFilename} · browser-local`
      : "Select a CSV · sample remains active";
}

function renderOutputs(state) {
  renderDataSource(state);
  elements["threshold-output"].value = state.threshold.toFixed(3);
  elements["false-positive-output"].value = currency.format(state.falsePositiveCost);
  elements["false-negative-output"].value = currency.format(state.falseNegativeCost);
  elements["capacity-output"].value = `${state.capacity.toFixed(1)}%`;
}

function renderMatrix(metrics) {
  ["tp", "fp", "tn", "fn"].forEach((name) => {
    elements[name].textContent = integer.format(metrics[name]);
  });
}

function gateValue(gate) {
  if (gate.format === "capacity") {
    return `${percent(gate.value)} vs ${percent(gate.target)} maximum`;
  }
  return `${percent(gate.value)} vs ${percent(gate.target)} target`;
}

function renderGates(decision) {
  elements["gate-list"].replaceChildren();
  decision.gates.forEach((gate) => {
    const item = document.createElement("div");
    item.className = `gate ${gate.pass ? "passed" : "failed"}`;
    item.innerHTML = `
      <span class="gate-indicator" aria-hidden="true"></span>
      <div><strong>${gate.name}</strong><span>${gateValue(gate)}</span></div>
    `;
    elements["gate-list"].append(item);
  });
  const passed = decision.gates.filter((gate) => gate.pass).length;
  elements["gate-count"].textContent = `${passed} of ${decision.gates.length} passed`;
}

function drawChart(points, currentThreshold) {
  const canvas = elements["tradeoff-chart"];
  const width = canvas.clientWidth;
  const height = 260;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);

  const padding = { top: 15, right: 16, bottom: 34, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = (value) => padding.left + value * plotWidth;
  const y = (value) => padding.top + (1 - value) * plotHeight;

  context.clearRect(0, 0, width, height);
  context.strokeStyle = "#d9e0e2";
  context.lineWidth = 1;
  context.fillStyle = "#5f6b70";
  context.font = "11px Inter, sans-serif";

  [0, 0.25, 0.5, 0.75, 1].forEach((tick) => {
    context.beginPath();
    context.moveTo(padding.left, y(tick));
    context.lineTo(width - padding.right, y(tick));
    context.stroke();
    context.fillText(`${Math.round(tick * 100)}%`, 5, y(tick) + 4);
    context.fillText(tick.toFixed(2), x(tick) - 10, height - 10);
  });

  const drawLine = (key, color) => {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = 3;
    points.forEach((point, index) => {
      const value = point[key] ?? 0;
      if (index === 0) context.moveTo(x(point.threshold), y(value));
      else context.lineTo(x(point.threshold), y(value));
    });
    context.stroke();
  };

  drawLine("precision", "#2878a5");
  drawLine("recall", "#c94a38");

  context.setLineDash([5, 4]);
  context.strokeStyle = "#172126";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(x(currentThreshold), padding.top);
  context.lineTo(x(currentThreshold), padding.top + plotHeight);
  context.stroke();
  context.setLineDash([]);
}

function getRecommendation(state, costs) {
  const key = [dataVersion, state.falsePositiveCost, state.falseNegativeCost, state.capacity].join(":");
  if (recommendationCache.key !== key) {
    recommendationCache = {
      key,
      value: recommendThreshold(rows, costs, {
        minRecall: 0.7,
        maxReviewRate: state.capacity / 100,
      }),
    };
  }
  return recommendationCache.value;
}

function policyRow(label, detail, threshold, metrics, decision, recommended = false) {
  const row = document.createElement("tr");
  if (recommended) row.className = "recommended-row";
  row.innerHTML = `
    <td class="table-policy">${label}<small>${detail}</small></td>
    <td>${threshold === null ? "N/A" : threshold.toFixed(3)}</td>
    <td>${percent(metrics.precision)}</td>
    <td>${percent(metrics.recall)}</td>
    <td>${percent(metrics.alertRate)}</td>
    <td>${currency.format(metrics.costPerThousand)}</td>
    <td><span class="table-status ${decision.tone}">${decision.status}</span></td>
  `;
  return row;
}

function renderPolicyComparison(state, costs, baseline, currentDecision) {
  const recommendation = getRecommendation(state, costs);
  const baselineDecision = assessLaunch(baseline, baseline.expectedCost, state.capacity / 100);
  const recommendedDecision = assessLaunch(
    recommendation.metrics,
    baseline.expectedCost,
    state.capacity / 100,
  );

  elements["policy-table"].replaceChildren(
    policyRow("All negative", "Reference policy", null, baseline, baselineDecision),
    policyRow("Current", "Slider selection", state.threshold, evaluatePredictions(rows, state.threshold, costs), currentDecision),
    policyRow(
      recommendation.feasible ? "Recommended" : "Lowest cost",
      recommendation.feasible ? "Clears recall and capacity" : "No threshold clears both constraints",
      recommendation.threshold,
      recommendation.metrics,
      recommendedDecision,
      true,
    ),
  );

  elements["recommendation-note"].textContent = recommendation.feasible
    ? `Threshold ${recommendation.threshold.toFixed(3)} minimizes expected cost while maintaining at least 70% recall and staying within ${state.capacity.toFixed(1)}% review capacity.`
    : `No threshold satisfies both 70% recall and ${state.capacity.toFixed(1)}% review capacity. The lowest-cost fallback is shown; improve the model or revise the constraint.`;
  elements["apply-recommendation"].textContent = recommendation.feasible
    ? "Apply recommended"
    : "Apply lowest cost";
  elements["apply-recommendation"].dataset.threshold = String(recommendation.threshold);
  return recommendation;
}

function render({ regenerate = false } = {}) {
  const state = readState();
  if (regenerate || rows.length === 0) regenerateRows(state);
  renderOutputs(state);

  const costs = costsFrom(state);
  const metrics = evaluatePredictions(rows, state.threshold, costs);
  const baseline = allNegativeBaseline(rows, costs);
  const decision = assessLaunch(metrics, baseline.expectedCost, state.capacity / 100);

  elements.accuracy.textContent = percent(metrics.accuracy);
  elements.precision.textContent = percent(metrics.precision);
  elements.recall.textContent = percent(metrics.recall);
  elements["pr-auc"].textContent = percent(cachedPrAuc);
  elements["alert-rate"].textContent = percent(metrics.alertRate);
  elements["sample-summary"].textContent = `${integer.format(metrics.total)} transactions · ${integer.format(metrics.positives)} positives`;
  renderMatrix(metrics);

  elements["decision-banner"].className = `decision-banner ${decision.tone}`;
  elements["decision-status"].textContent = decision.status;
  elements["decision-pill"].textContent = decision.status === "Pass" ? "All gates clear" : decision.status;
  elements["decision-summary"].textContent = decision.summary;
  elements["cost-per-thousand"].textContent = currency.format(metrics.costPerThousand);
  elements["cost-change"].textContent = decision.savingsRate === null
    ? "No comparable baseline"
    : `${percent(Math.abs(decision.savingsRate))} ${decision.savingsRate >= 0 ? "lower" : "higher"} than baseline`;
  elements["baseline-copy"].textContent = `${integer.format(baseline.fn)} positives missed · ${currency.format(baseline.costPerThousand)} expected cost per 1,000.`;
  renderGates(decision);

  const noAlerts = metrics.tp + metrics.fp === 0;
  elements["edge-message"].hidden = !noAlerts;
  elements["edge-message"].textContent = noAlerts
    ? "No transactions are being sent for review. Precision is undefined, and the apparent accuracy hides every missed positive."
    : "";

  const points = thresholdSweep(rows, costs);
  drawChart(points, state.threshold);
  elements["chart-caption"].textContent = `Current threshold: ${state.threshold.toFixed(3)} · Precision ${percent(metrics.precision)} · Recall ${percent(metrics.recall)}`;
  const recommendation = renderPolicyComparison(state, costs, baseline, decision);

  window.currentReport = {
    module: "classification",
    generatedAt: new Date().toISOString(),
    dataSource: dataMode === "upload"
      ? { type: "csv", filename: uploadedFilename, processedLocally: true }
      : { type: "synthetic", seed: 218 },
    scenario: { ...state, observedPrevalence: actualPrevalence() },
    sample: { total: metrics.total, positives: metrics.positives },
    metrics: { ...metrics, prAuc: cachedPrAuc },
    baseline,
    recommendation,
    decision,
  };
}

controls.prevalence.addEventListener("input", () => render({ regenerate: true }));
[controls.threshold, controls.falsePositiveCost, controls.falseNegativeCost, controls.capacity]
  .forEach((control) => control.addEventListener("input", () => render()));

elements["synthetic-mode"].addEventListener("click", () => {
  dataMode = "synthetic";
  uploadedFilename = "";
  elements["csv-file"].value = "";
  elements["upload-status"].className = "upload-status";
  elements["upload-status"].textContent = "Processed locally in your browser.";
  render({ regenerate: true });
});

elements["upload-mode"].addEventListener("click", () => {
  if (dataMode === "synthetic") dataMode = "upload-pending";
  render();
  elements["csv-file"].focus();
});

elements["csv-file"].addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  elements["upload-status"].className = "upload-status";
  elements["upload-status"].textContent = "Validating CSV...";
  try {
    if (file.size > 15 * 1024 * 1024) throw new Error("The file exceeds the 15 MB browser limit.");
    const parsed = parsePredictionCsv(await file.text());
    dataMode = "upload";
    uploadedFilename = file.name;
    setRows(parsed.rows);
    const ignored = parsed.metadata.ignoredColumns.length > 0
      ? ` Ignored columns: ${parsed.metadata.ignoredColumns.join(", ")}.`
      : "";
    elements["upload-status"].className = "upload-status success";
    elements["upload-status"].textContent = `${integer.format(parsed.metadata.total)} rows loaded locally.${ignored}`;
    render();
  } catch (error) {
    elements["upload-status"].className = "upload-status error";
    elements["upload-status"].textContent = error.message;
  }
});

elements["sample-button"].addEventListener("click", () => {
  const sampleRows = generateScenario({ size: 250, prevalence: 0.08, seed: 218 });
  const csv = ["actual,score", ...sampleRows.map((row) => `${row.actual},${row.score.toFixed(6)}`)].join("\n");
  downloadBlob(csv, "text/csv", "ai-quality-lab-sample.csv");
});

elements["apply-recommendation"].addEventListener("click", () => {
  controls.threshold.value = elements["apply-recommendation"].dataset.threshold;
  render();
});

document.querySelector("#reset-button").addEventListener("click", () => {
  if ((document.body.dataset.activeModule || "classification") !== "classification") {
    window.dispatchEvent(new CustomEvent("reset-active-module"));
    return;
  }
  Object.entries(defaults).forEach(([name, value]) => { controls[name].value = String(value); });
  dataMode = "synthetic";
  uploadedFilename = "";
  elements["csv-file"].value = "";
  elements["upload-status"].className = "upload-status";
  elements["upload-status"].textContent = "Processed locally in your browser.";
  render({ regenerate: true });
});

document.querySelector("#export-button").addEventListener("click", () => {
  const moduleName = window.currentReport?.module || "model";
  downloadBlob(
    JSON.stringify(window.currentReport, null, 2),
    "application/json",
    `ai-quality-lab-${moduleName}-report.json`,
  );
});

window.addEventListener("resize", () => {
  if ((document.body.dataset.activeModule || "classification") === "classification") render();
});
window.renderClassification = render;
render({ regenerate: true });
