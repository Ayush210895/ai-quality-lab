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
  parseLlmCsv,
  parseMonitoringCsv,
  parseRankingCsv,
  parseRegressionCsv,
} from "./model-metrics.mjs";

const $ = (id) => document.querySelector(`#${id}`);
const percent = (value, digits = 1) => value === null || !Number.isFinite(value) ? "N/A" : `${(value * 100).toFixed(digits)}%`;
const decimal = (value, digits = 2) => value === null || !Number.isFinite(value) ? "N/A" : value.toFixed(digits);
const integer = new Intl.NumberFormat("en-US");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 });

const titles = {
  classification: "Classification Decision Lab",
  regression: "Regression & Forecasting Lab",
  ranking: "Ranking & Recommendation Lab",
  llm: "LLM & RAG Evaluation Lab",
  monitoring: "Production Monitoring Lab",
};

const moduleState = {
  regression: { rows: generateRegressionScenario(), uploaded: false, filename: "" },
  ranking: { rows: generateRankingScenario(), uploaded: false, filename: "" },
  llm: { rows: generateLlmScenario(), uploaded: false, filename: "" },
  monitoring: { data: generateMonitoringScenario(), uploaded: false, filename: "" },
};

function download(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function setStatus(id, message, tone = "") {
  const element = $(id);
  element.className = `upload-status${tone ? ` ${tone}` : ""}`;
  element.textContent = message;
}

function renderDecision(prefix, decision, summary, primary, source) {
  $(`${prefix}-banner`).className = `decision-banner ${decision.tone}`;
  $(`${prefix}-decision`).textContent = decision.status;
  $(`${prefix}-pill`).textContent = decision.status;
  $(`${prefix}-summary`).textContent = summary;
  $(`${prefix}-primary`).textContent = primary;
  $(`${prefix}-source`).textContent = source;
}

function formatGate(gate) {
  if (gate.unit === "ms") return `${integer.format(Math.round(gate.value))} ms vs ${integer.format(gate.target)} ms maximum`;
  if (gate.unit === "currency") return `${currency.format(gate.value)} vs ${currency.format(gate.target)} maximum`;
  if (gate.format === "number") return `${decimal(gate.value)} vs ${decimal(gate.target)} maximum`;
  return `${percent(gate.value)} vs ${percent(gate.target)} ${gate.direction === "max" ? "maximum" : "minimum"}`;
}

function renderGates(prefix, decision, healthyWord = "passed") {
  const container = $(`${prefix}-gates`);
  container.replaceChildren();
  decision.gates.forEach((gate) => {
    const item = document.createElement("div");
    item.className = `gate ${gate.pass ? "passed" : "failed"}`;
    const indicator = document.createElement("span");
    indicator.className = "gate-indicator";
    indicator.setAttribute("aria-hidden", "true");
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = gate.name;
    const value = document.createElement("span");
    value.textContent = formatGate(gate);
    copy.append(name, value);
    item.append(indicator, copy);
    container.append(item);
  });
  const passed = decision.gates.filter((gate) => gate.pass).length;
  $(`${prefix}-gate-count`).textContent = `${passed} of ${decision.gates.length} ${healthyWord}`;
}

function prepareCanvas(canvas) {
  const width = canvas.clientWidth;
  const height = 270;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function drawLineChart(canvas, series) {
  const { context, width, height } = prepareCanvas(canvas);
  if (width < 10) return;
  const values = series.flatMap((item) => item.values).filter(Number.isFinite);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const spread = Math.max(1, high - low);
  const padding = { top: 18, right: 18, bottom: 28, left: 48 };
  const x = (index, count) => padding.left + (index / Math.max(1, count - 1)) * (width - padding.left - padding.right);
  const y = (value) => padding.top + (1 - (value - low) / spread) * (height - padding.top - padding.bottom);

  context.strokeStyle = "#d9e0e2";
  context.fillStyle = "#5f6b70";
  context.font = "11px Inter, sans-serif";
  for (let step = 0; step <= 4; step += 1) {
    const value = low + (spread * step) / 4;
    context.beginPath();
    context.moveTo(padding.left, y(value));
    context.lineTo(width - padding.right, y(value));
    context.stroke();
    context.fillText(value.toFixed(0), 4, y(value) + 4);
  }
  series.forEach((item) => {
    context.beginPath();
    context.strokeStyle = item.color;
    context.lineWidth = 2.5;
    item.values.forEach((value, index) => {
      if (index === 0) context.moveTo(x(index, item.values.length), y(value));
      else context.lineTo(x(index, item.values.length), y(value));
    });
    context.stroke();
  });
}

function drawBars(canvas, items) {
  const { context, width, height } = prepareCanvas(canvas);
  if (width < 10) return;
  const padding = { top: 18, right: 18, bottom: 58, left: 44 };
  const plotHeight = height - padding.top - padding.bottom;
  const slot = (width - padding.left - padding.right) / items.length;
  context.strokeStyle = "#d9e0e2";
  context.fillStyle = "#5f6b70";
  context.font = "11px Inter, sans-serif";
  [0, 0.25, 0.5, 0.75, 1].forEach((tick) => {
    const y = padding.top + (1 - tick) * plotHeight;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(`${Math.round(tick * 100)}%`, 2, y + 4);
  });
  items.forEach((item, index) => {
    const barWidth = Math.min(70, slot * 0.55);
    const x = padding.left + index * slot + (slot - barWidth) / 2;
    const bounded = Math.max(0, Math.min(1, item.value));
    const barHeight = bounded * plotHeight;
    context.fillStyle = item.color || "#2878a5";
    context.fillRect(x, padding.top + plotHeight - barHeight, barWidth, barHeight);
    context.fillStyle = "#172126";
    context.textAlign = "center";
    context.fillText(percent(item.value), x + barWidth / 2, padding.top + plotHeight - barHeight - 7);
    context.fillStyle = "#5f6b70";
    context.fillText(item.label, x + barWidth / 2, height - 28);
  });
  context.textAlign = "left";
}

function renderRegression() {
  const state = moduleState.regression;
  const maxWape = Number($("reg-max-wape").value) / 100;
  const metrics = evaluateRegression(state.rows);
  const decision = assessRegression(metrics, { maxWape });
  $("reg-noise-output").value = $("reg-noise").value;
  const bias = Number($("reg-bias").value);
  $("reg-bias-output").value = `${bias >= 0 ? "+" : ""}${bias}`;
  $("reg-max-wape-output").value = percent(maxWape, 0);
  $("reg-mae").textContent = decimal(metrics.mae, 1);
  $("reg-rmse").textContent = decimal(metrics.rmse, 1);
  $("reg-bias-metric").textContent = `${metrics.bias >= 0 ? "+" : ""}${decimal(metrics.bias, 1)}`;
  $("reg-r2").textContent = decimal(metrics.r2, 2);
  $("reg-coverage").textContent = percent(metrics.coverage);
  $("reg-count").textContent = `${integer.format(metrics.total)} observations`;
  const source = state.uploaded ? state.filename : "Synthetic 60-period forecast";
  renderDecision("reg", decision, decision.status === "Pass" ? "Error, directional bias, and uncertainty coverage clear the selected release gates." : "At least one forecast-reliability condition needs mitigation before release.", percent(metrics.wape), source);
  renderGates("reg", decision);
  drawLineChart($("reg-chart"), [
    { values: state.rows.map((row) => row.actual), color: "#2878a5" },
    { values: state.rows.map((row) => row.predicted), color: "#c94a38" },
  ]);
  window.currentReport = { module: "regression-forecasting", generatedAt: new Date().toISOString(), source, metrics, decision };
}

function regenerateRegression() {
  moduleState.regression.rows = generateRegressionScenario({ noise: Number($("reg-noise").value), bias: Number($("reg-bias").value) });
  moduleState.regression.uploaded = false;
  moduleState.regression.filename = "";
  $("reg-noise").disabled = false;
  $("reg-bias").disabled = false;
  setStatus("reg-status", "Synthetic 60-period forecast active.");
  renderRegression();
}

function renderRanking() {
  const state = moduleState.ranking;
  const k = Number($("rank-k").value);
  const minNdcg = Number($("rank-min-ndcg").value) / 100;
  const minCoverage = Number($("rank-min-coverage").value) / 100;
  const metrics = evaluateRanking(state.rows, k);
  const decision = assessRanking(metrics, { minNdcg, minCoverage });
  $("rank-k-output").value = String(k);
  $("rank-min-ndcg-output").value = percent(minNdcg, 0);
  $("rank-min-coverage-output").value = percent(minCoverage, 0);
  $("rank-precision").textContent = percent(metrics.precisionAtK);
  $("rank-recall").textContent = percent(metrics.recallAtK);
  $("rank-ndcg").textContent = percent(metrics.ndcgAtK);
  $("rank-mrr").textContent = percent(metrics.mrr);
  $("rank-coverage").textContent = percent(metrics.coverage);
  $("rank-count").textContent = `${integer.format(metrics.queries)} queries · K=${k}`;
  const source = state.uploaded ? state.filename : "Synthetic recommendation set";
  renderDecision("rank", decision, decision.status === "Pass" ? "The serving cutoff clears relevance, retrieval, and catalog-exposure gates." : "The current ranking needs relevance or coverage mitigation before broad serving.", percent(metrics.ndcgAtK), source);
  renderGates("rank", decision);
  drawBars($("rank-chart"), [
    { label: "Precision", value: metrics.precisionAtK, color: "#2878a5" },
    { label: "Recall", value: metrics.recallAtK, color: "#087e72" },
    { label: "NDCG", value: metrics.ndcgAtK, color: "#26844b" },
    { label: "MRR", value: metrics.mrr, color: "#b66a00" },
    { label: "Coverage", value: metrics.coverage, color: "#c94a38" },
  ]);
  window.currentReport = { module: "ranking-recommendations", generatedAt: new Date().toISOString(), source, metrics, decision };
}

function renderLlm() {
  const state = moduleState.llm;
  const minQuality = Number($("llm-min-quality").value) / 100;
  const maxP95LatencyMs = Number($("llm-max-latency").value);
  const maxCostUsd = Number($("llm-max-cost").value);
  const metrics = evaluateLlm(state.rows);
  const decision = assessLlm(metrics, { minQuality, maxP95LatencyMs, maxCostUsd });
  $("llm-quality-output").value = `${$("llm-quality").value}%`;
  $("llm-min-quality-output").value = percent(minQuality, 0);
  $("llm-max-latency-output").value = `${integer.format(maxP95LatencyMs)} ms`;
  $("llm-max-cost-output").value = currency.format(maxCostUsd);
  $("llm-quality-metric").textContent = percent(metrics.quality);
  $("llm-groundedness").textContent = percent(metrics.groundedness);
  $("llm-retrieval").textContent = percent(metrics.retrieval);
  $("llm-citation").textContent = percent(metrics.citation);
  $("llm-safety").textContent = percent(metrics.safetyPassRate);
  $("llm-latency").textContent = `${integer.format(Math.round(metrics.p95LatencyMs))} ms`;
  $("llm-cost").textContent = currency.format(metrics.averageCostUsd);
  $("llm-count").textContent = `${integer.format(metrics.total)} evaluation cases`;
  const source = state.uploaded ? state.filename : "Generic synthetic evaluations";
  renderDecision("llm", decision, decision.status === "Pass" ? "Quality, evidence, safety, latency, and cost clear the selected launch gates." : "The system needs mitigation on at least one quality, safety, performance, or cost dimension.", percent(metrics.groundedness), source);
  renderGates("llm", decision);
  drawBars($("llm-chart"), [
    { label: "Quality", value: metrics.quality, color: "#2878a5" },
    { label: "Grounded", value: metrics.groundedness, color: "#087e72" },
    { label: "Retrieval", value: metrics.retrieval, color: "#26844b" },
    { label: "Citations", value: metrics.citation, color: "#b66a00" },
    { label: "Safety", value: metrics.safetyPassRate, color: "#c94a38" },
  ]);
  window.currentReport = { module: "llm-rag", generatedAt: new Date().toISOString(), source, metrics, decision };
}

function regenerateLlm() {
  moduleState.llm.rows = generateLlmScenario({ quality: Number($("llm-quality").value) / 100 });
  moduleState.llm.uploaded = false;
  moduleState.llm.filename = "";
  $("llm-quality").disabled = false;
  setStatus("llm-status", "Generic synthetic cases active. No RAG project data is accessed.");
  renderLlm();
}

function renderMonitoring() {
  const state = moduleState.monitoring;
  const maxPsi = Number($("mon-max-psi").value);
  const maxPerformanceDrop = Number($("mon-max-drop").value) / 100;
  const metrics = evaluateMonitoring(state.data);
  const decision = assessMonitoring(metrics, { maxPsi, maxPerformanceDrop });
  $("mon-drift-output").value = `${$("mon-drift").value}%`;
  $("mon-missing-output").value = `${Number($("mon-missing").value).toFixed(1)}%`;
  $("mon-max-psi-output").value = Number($("mon-max-psi").value).toFixed(2);
  $("mon-max-drop-output").value = `${$("mon-max-drop").value}%`;
  $("mon-psi").textContent = decimal(metrics.psi, 3);
  $("mon-shift").textContent = `${metrics.meanShift >= 0 ? "+" : ""}${decimal(metrics.meanShift, 2)}σ`;
  $("mon-missing-metric").textContent = percent(metrics.missingRate);
  $("mon-performance").textContent = metrics.performanceDelta === null ? "N/A" : `${metrics.performanceDelta >= 0 ? "+" : ""}${percent(metrics.performanceDelta)}`;
  $("mon-count").textContent = `${integer.format(metrics.total)} observations`;
  const source = state.uploaded ? state.filename : "Synthetic monitoring windows";
  renderDecision("mon", decision, decision.status === "Healthy" ? "Production signals remain inside the selected operational limits." : "One or more production signals require investigation or incident response.", decimal(metrics.psi, 3), source);
  renderGates("mon", decision, "healthy");
  drawBars($("mon-chart"), [
    { label: "PSI", value: Math.min(1, metrics.psi / Math.max(maxPsi, 0.01)), color: "#2878a5" },
    { label: "Mean shift", value: Math.min(1, Math.abs(metrics.meanShift) / 0.5), color: "#087e72" },
    { label: "Missing", value: Math.min(1, metrics.missingRate / 0.03), color: "#b66a00" },
    { label: "Perf. drop", value: metrics.performanceDelta === null ? 0 : Math.min(1, Math.max(0, -metrics.performanceDelta) / maxPerformanceDrop), color: "#c94a38" },
  ]);
  window.currentReport = { module: "production-monitoring", generatedAt: new Date().toISOString(), source, metrics, decision };
}

function regenerateMonitoring() {
  moduleState.monitoring.data = generateMonitoringScenario({ drift: Number($("mon-drift").value) / 100, missingRate: Number($("mon-missing").value) / 100 });
  moduleState.monitoring.uploaded = false;
  moduleState.monitoring.filename = "";
  $("mon-drift").disabled = false;
  $("mon-missing").disabled = false;
  setStatus("mon-status", "Synthetic reference and current windows active.");
  renderMonitoring();
}

const renderers = { regression: renderRegression, ranking: renderRanking, llm: renderLlm, monitoring: renderMonitoring };

function switchModule(name) {
  document.body.dataset.activeModule = name;
  document.querySelectorAll("[data-module-view]").forEach((view) => { view.hidden = view.dataset.moduleView !== name; });
  document.querySelectorAll("[data-module]").forEach((button) => { button.setAttribute("aria-selected", String(button.dataset.module === name)); });
  $("module-heading").textContent = titles[name];
  if (name === "classification") {
    window.renderClassification?.();
  } else {
    renderers[name]();
    $("dataset-badge").textContent = moduleState[name].uploaded ? `${moduleState[name].filename} · browser-local` : "Synthetic evaluation set";
  }
}

document.querySelectorAll("[data-module]").forEach((button) => {
  button.addEventListener("click", () => switchModule(button.dataset.module));
});

[$("reg-noise"), $("reg-bias")].forEach((control) => control.addEventListener("input", regenerateRegression));
$("reg-max-wape").addEventListener("input", renderRegression);
[$("rank-k"), $("rank-min-ndcg"), $("rank-min-coverage")].forEach((control) => control.addEventListener("input", renderRanking));
$("llm-quality").addEventListener("input", regenerateLlm);
[$("llm-min-quality"), $("llm-max-latency"), $("llm-max-cost")].forEach((control) => control.addEventListener("input", renderLlm));
[$("mon-drift"), $("mon-missing")].forEach((control) => control.addEventListener("input", regenerateMonitoring));
[$("mon-max-psi"), $("mon-max-drop")].forEach((control) => control.addEventListener("input", renderMonitoring));

async function loadFile(event, moduleName, parser, apply, statusId) {
  const [file] = event.target.files;
  if (!file) return;
  setStatus(statusId, "Validating CSV...");
  try {
    if (file.size > 15 * 1024 * 1024) throw new Error("The file exceeds the 15 MB browser limit.");
    apply(parser(await file.text()), file.name);
    setStatus(statusId, `${file.name} loaded and evaluated locally.`, "success");
    $("dataset-badge").textContent = `${file.name} · browser-local`;
    renderers[moduleName]();
  } catch (error) {
    setStatus(statusId, error.message, "error");
  }
}

$("reg-file").addEventListener("change", (event) => loadFile(event, "regression", parseRegressionCsv, (rows, filename) => {
  moduleState.regression = { rows, uploaded: true, filename };
  $("reg-noise").disabled = true;
  $("reg-bias").disabled = true;
}, "reg-status"));

$("rank-file").addEventListener("change", (event) => loadFile(event, "ranking", parseRankingCsv, (rows, filename) => {
  moduleState.ranking = { rows, uploaded: true, filename };
}, "rank-status"));

$("llm-file").addEventListener("change", (event) => loadFile(event, "llm", parseLlmCsv, (rows, filename) => {
  moduleState.llm = { rows, uploaded: true, filename };
  $("llm-quality").disabled = true;
}, "llm-status"));

$("mon-file").addEventListener("change", (event) => loadFile(event, "monitoring", parseMonitoringCsv, (data, filename) => {
  moduleState.monitoring = { data, uploaded: true, filename };
  $("mon-drift").disabled = true;
  $("mon-missing").disabled = true;
}, "mon-status"));

$("reg-sample").addEventListener("click", () => {
  const rows = generateRegressionScenario({ size: 40 });
  download(["period,actual,predicted,lower,upper", ...rows.map((row) => [row.period, row.actual, row.predicted, row.lower, row.upper].map((value) => Number(value).toFixed(3)).join(","))].join("\n"), "text/csv", "regression-forecast-sample.csv");
});
$("rank-sample").addEventListener("click", () => {
  const rows = generateRankingScenario({ queries: 8, itemsPerQuery: 8 });
  download(["query_id,item_id,relevance,score", ...rows.map((row) => `${row.queryId},${row.itemId},${row.relevance},${row.score.toFixed(4)}`)].join("\n"), "text/csv", "ranking-sample.csv");
});
$("llm-sample").addEventListener("click", () => {
  const rows = generateLlmScenario({ size: 25 });
  download(["case_id,quality,groundedness,retrieval,citation,latency_ms,cost_usd,safety_pass", ...rows.map((row) => `${row.caseId},${row.quality.toFixed(3)},${row.groundedness.toFixed(3)},${row.retrieval.toFixed(3)},${row.citation.toFixed(3)},${row.latencyMs.toFixed(0)},${row.costUsd.toFixed(4)},${row.safetyPass}`)].join("\n"), "text/csv", "llm-rag-evaluation-sample.csv");
});
$("mon-sample").addEventListener("click", () => {
  const data = generateMonitoringScenario({ size: 100 });
  download(["reference,current,baseline_performance,current_performance", ...data.rows.map((row, index) => `${row.reference.toFixed(4)},${row.current === null ? "" : row.current.toFixed(4)},${index === 0 ? data.baselinePerformance : ""},${index === 0 ? data.currentPerformance : ""}`)].join("\n"), "text/csv", "production-monitoring-sample.csv");
});

window.addEventListener("reset-active-module", () => {
  const active = document.body.dataset.activeModule;
  if (active === "regression") {
    $("reg-noise").value = "10"; $("reg-bias").value = "2"; $("reg-max-wape").value = "12"; $("reg-file").value = ""; regenerateRegression();
  } else if (active === "ranking") {
    $("rank-k").value = "5"; $("rank-min-ndcg").value = "75"; $("rank-min-coverage").value = "60";
    $("rank-file").value = ""; moduleState.ranking = { rows: generateRankingScenario(), uploaded: false, filename: "" }; setStatus("rank-status", "Synthetic recommendation set active."); renderRanking();
  } else if (active === "llm") {
    $("llm-quality").value = "84"; $("llm-min-quality").value = "80"; $("llm-max-latency").value = "3000"; $("llm-max-cost").value = "0.04"; $("llm-file").value = ""; regenerateLlm();
  } else if (active === "monitoring") {
    $("mon-drift").value = "35"; $("mon-missing").value = "1.5"; $("mon-max-psi").value = "0.2"; $("mon-max-drop").value = "5"; $("mon-file").value = ""; regenerateMonitoring();
  }
  $("dataset-badge").textContent = "Synthetic evaluation set";
});

window.addEventListener("resize", () => {
  const active = document.body.dataset.activeModule;
  if (active && active !== "classification") renderers[active]?.();
});

document.body.dataset.activeModule = "classification";
