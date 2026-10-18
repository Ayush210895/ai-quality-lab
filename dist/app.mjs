import {
  allNegativeBaseline,
  assessLaunch,
  averagePrecision,
  evaluatePredictions,
  generateScenario,
  thresholdSweep,
} from "./metrics.mjs";

const defaults = {
  prevalence: 1,
  threshold: 0.5,
  falsePositiveCost: 10,
  falseNegativeCost: 1000,
  capacity: 8,
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
    "false-positive-output", "false-negative-output", "capacity-output",
  ].map((id) => [id, document.querySelector(`#${id}`)]),
);

let rows = [];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("en-US");

function percent(value, digits = 1) {
  return value === null || Number.isNaN(value) ? "N/A" : `${(value * 100).toFixed(digits)}%`;
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

function regenerateRows(state) {
  rows = generateScenario({ size: 10000, prevalence: state.prevalence / 100, seed: 218 });
}

function renderOutputs(state) {
  elements["prevalence-output"].value = `${state.prevalence.toFixed(1)}%`;
  elements["threshold-output"].value = state.threshold.toFixed(2);
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

function render({ regenerate = false } = {}) {
  const state = readState();
  if (regenerate || rows.length === 0) regenerateRows(state);
  renderOutputs(state);

  const costs = costsFrom(state);
  const metrics = evaluatePredictions(rows, state.threshold, costs);
  const baseline = allNegativeBaseline(rows, costs);
  const prAuc = averagePrecision(rows);
  const decision = assessLaunch(metrics, baseline.expectedCost, state.capacity / 100);

  elements.accuracy.textContent = percent(metrics.accuracy);
  elements.precision.textContent = percent(metrics.precision);
  elements.recall.textContent = percent(metrics.recall);
  elements["pr-auc"].textContent = percent(prAuc);
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
  elements["chart-caption"].textContent = `Current threshold: ${state.threshold.toFixed(2)} · Precision ${percent(metrics.precision)} · Recall ${percent(metrics.recall)}`;

  window.currentReport = {
    generatedAt: new Date().toISOString(),
    scenario: state,
    sample: { total: metrics.total, positives: metrics.positives },
    metrics: { ...metrics, prAuc },
    baseline,
    decision,
  };
}

controls.prevalence.addEventListener("input", () => render({ regenerate: true }));
[controls.threshold, controls.falsePositiveCost, controls.falseNegativeCost, controls.capacity]
  .forEach((control) => control.addEventListener("input", () => render()));

document.querySelector("#reset-button").addEventListener("click", () => {
  Object.entries(defaults).forEach(([name, value]) => { controls[name].value = String(value); });
  render({ regenerate: true });
});

document.querySelector("#export-button").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(window.currentReport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-quality-lab-decision-report.json";
  link.click();
  URL.revokeObjectURL(url);
});

window.addEventListener("resize", () => render());
render({ regenerate: true });

