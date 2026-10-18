import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Check,
  CircleAlert,
  Command,
  Download,
  ExternalLink,
  FileUp,
  FlaskConical,
  FolderGit2,
  Gauge,
  GitCompare,
  ListOrdered,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import {
  allNegativeBaseline,
  assessLaunch,
  averagePrecision,
  evaluatePredictions,
  generateScenario,
  parsePredictionCsv,
  recommendThreshold,
  thresholdSweep,
} from "./lib/metrics.mjs";
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
} from "./lib/model-metrics.mjs";
import { travelEvaluation } from "./data/travelEvaluation";
import { portfolioProjects, type PortfolioProject, type ProjectStatus } from "./data/projectRegistry";
import { projectBySlug, type ProjectStory } from "./data/projectStories";
import PortfolioSite, { ConstellationField, ScrollProgress } from "./PortfolioSite";

type ModuleId = "portfolio" | "classification" | "comparison" | "regression" | "ranking" | "llm" | "monitoring";
type Tone = "pass" | "conditional" | "stop" | "neutral";
type Report = {
  product: string;
  version: string;
  module: string;
  generatedAt: string;
  dataset: string;
  settings: Record<string, unknown>;
  metrics: Record<string, unknown>;
  assessment: Record<string, unknown>;
};

const reportSchema = z.object({
  product: z.literal("AI Quality Lab"),
  version: z.string(),
  module: z.string(),
  generatedAt: z.string(),
  dataset: z.string(),
  settings: z.record(z.string(), z.unknown()),
  metrics: z.record(z.string(), z.unknown()),
  assessment: z.record(z.string(), z.unknown()),
});

const MODULES: Array<{ id: ModuleId; label: string; short: string; description: string; color: string; tint: string; icon: typeof Gauge }> = [
  { id: "classification", label: "Classification", short: "Classify", description: "Threshold, cost and capacity", color: "#087e72", tint: "#e7f5f2", icon: Gauge },
  { id: "comparison", label: "GitHub model comparison", short: "Compare", description: "Business-aware ranking policy", color: "#b24837", tint: "#fbece8", icon: GitCompare },
  { id: "regression", label: "Regression & forecasting", short: "Forecast", description: "Error, bias and uncertainty", color: "#2878a5", tint: "#e8f3f9", icon: TrendingUp },
  { id: "ranking", label: "Ranking & recommendations", short: "Rank", description: "Relevance, order and coverage", color: "#7a4db5", tint: "#f1ebf8", icon: ListOrdered },
  { id: "llm", label: "LLM & RAG", short: "LLM", description: "Quality, grounding and cost", color: "#a85f00", tint: "#fff2dc", icon: BrainCircuit },
  { id: "monitoring", label: "Production monitoring", short: "Monitor", description: "Drift and production health", color: "#277443", tint: "#e9f5ec", icon: Activity },
  { id: "portfolio", label: "Evidence registry", short: "Evidence", description: "Committed project artifacts", color: "#46545a", tint: "#edf1f1", icon: FolderGit2 },
];

const chartTooltipStyle = {
  border: "1px solid #d8e0df",
  borderRadius: 6,
  boxShadow: "0 8px 24px rgba(21,33,38,.12)",
  fontSize: 12,
};

function percent(value: number | null | undefined, digits = 1) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "N/A"
    : `${(value * 100).toFixed(digits)}%`;
}

function number(value: number | null | undefined, digits = 2) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "N/A"
    : value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function money(value: number | null | undefined, digits = 0) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? "N/A"
    : value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits });
}

function download(name: string, contents: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function makeReport(module: string, dataset: string, settings: Record<string, unknown>, metrics: Record<string, unknown>, assessment: Record<string, unknown>): Report {
  return { product: "AI Quality Lab", version: "3.0", module, generatedAt: new Date().toISOString(), dataset, settings, metrics, assessment };
}

function toneClass(tone: Tone) {
  return tone === "pass"
    ? "border-success bg-emerald-50 text-success"
    : tone === "conditional"
      ? "border-amber bg-amber-50 text-amber"
      : tone === "stop"
        ? "border-coral bg-red-50 text-coral"
        : "border-slate-400 bg-slate-50 text-slate-700";
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[6px] border border-line bg-white ${className}`}>{children}</section>;
}

function RangeControl({ label, value, display, min, max, step, help, onChange }: {
  label: string; value: number; display: string; min: number; max: number; step: number | "any"; help: string; onChange: (value: number) => void;
}) {
  return (
    <label className="block border-b border-line py-4 last:border-b-0">
      <span className="flex items-baseline justify-between gap-3 text-sm font-semibold text-ink">
        <span>{label}</span><output className="shrink-0 tabular-nums text-navy">{display}</output>
      </span>
      <input className="my-2 block h-6 w-full cursor-pointer" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="block text-xs leading-5 text-slate-500">{help}</span>
    </label>
  );
}

function UploadBox({ schema, sample, onRows }: { schema: string; sample: string; onRows: (text: string, name: string) => void }) {
  const [message, setMessage] = useState("Processed locally in this browser.");
  const [error, setError] = useState(false);
  async function handle(file?: File) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError(true); setMessage("File is larger than the 15 MB limit."); return;
    }
    try {
      onRows(await file.text(), file.name);
      setError(false); setMessage(`${file.name} is active.`);
    } catch (reason) {
      setError(true); setMessage(reason instanceof Error ? reason.message : "Could not read this file.");
    }
  }
  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="mb-2 text-[11px] font-extrabold uppercase text-teal">Use your data</p>
      <label className="block cursor-pointer rounded-[6px] border border-dashed border-slate-400 bg-slate-50 p-3 hover:border-teal">
        <span className="flex items-center gap-2 text-sm font-bold"><FileUp size={16} /> Upload CSV</span>
        <span className="mt-1 block break-words text-xs leading-5 text-slate-500">{schema}</span>
        <input className="mt-3 block w-full text-xs" type="file" accept=".csv,text/csv" onChange={(event) => void handle(event.target.files?.[0])} />
      </label>
      <button className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal hover:text-navy" type="button" onClick={() => download("ai-quality-lab-sample.csv", sample, "text/csv")}>
        <Download size={14} /> Sample CSV
      </button>
      <p className={`mt-2 text-xs leading-5 ${error ? "font-semibold text-coral" : "text-slate-500"}`} role="status">{message}</p>
    </div>
  );
}

function DecisionBanner({ label, status, tone, summary, metricLabel, metric, source }: {
  label: string; status: string; tone: Tone; summary: string; metricLabel: string; metric: string; source: string;
}) {
  const Icon = tone === "pass" ? ShieldCheck : tone === "stop" ? CircleAlert : Activity;
  return (
    <section className={`grid gap-5 rounded-[6px] border-l-4 bg-white p-5 shadow-[0_8px_24px_rgba(21,33,38,.07)] md:grid-cols-[1fr_auto] md:items-center ${toneClass(tone)}`}>
      <div>
        <p className="mb-1 text-[11px] font-extrabold uppercase text-teal">{label}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-ink">{status}</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold"><Icon size={14} /> {status}</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{summary}</p>
      </div>
      <div className="border-t border-line pt-4 md:min-w-48 md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right">
        <span className="block text-xs text-slate-500">{metricLabel}</span>
        <strong className="my-1 block text-2xl font-bold tabular-nums text-ink">{metric}</strong>
        <small className="text-xs text-slate-500">{source}</small>
      </div>
    </section>
  );
}

function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: string; help: string; accent?: string }> }) {
  return (
    <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 2xl:grid-cols-5" aria-label="Evaluation metrics">
      {metrics.map((metric) => (
        <article key={metric.label} className={`min-h-28 rounded-[6px] border border-line bg-white p-4 ${metric.accent ?? ""}`}>
          <span className="block text-xs font-bold text-slate-500">{metric.label}</span>
          <strong className="my-1.5 block text-2xl font-bold tabular-nums text-ink">{metric.value}</strong>
          <small className="text-xs leading-5 text-slate-500">{metric.help}</small>
        </article>
      ))}
    </section>
  );
}

function GateList({ gates }: { gates: any[] }) {
  const passed = gates.filter((gate) => gate.pass).length;
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[11px] font-extrabold uppercase text-teal">Decision evidence</p><h2 className="mt-1 text-base font-bold">Production gates</h2></div>
        <span className="text-xs font-bold tabular-nums text-slate-600">{passed} of {gates.length} passed</span>
      </div>
      <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {gates.map((gate) => {
          const currency = gate.unit === "currency";
          const millis = gate.unit === "ms";
          const rawNumber = gate.format === "number";
          const isMaximum = gate.direction === "max" || gate.format === "capacity";
          const formatValue = (value: number) => currency ? money(value, 3) : millis ? `${number(value, 0)} ms` : rawNumber ? number(value, 3) : percent(value);
          return (
            <div key={gate.name} className="grid grid-cols-[18px_1fr] gap-2 rounded-[6px] border border-line p-3">
              <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ${gate.pass ? "bg-success text-white" : "bg-red-100 text-coral"}`}>
                {gate.pass ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
              </span>
              <div><strong className="block text-sm">{gate.name}</strong><span className="mt-1 block text-xs text-slate-500">{formatValue(gate.value)} · target {isMaximum ? "≤" : "≥"} {formatValue(gate.target)}</span></div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ControlPanel({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <aside className="lab-controls self-start overflow-hidden rounded-[6px] border border-line bg-white lg:sticky lg:top-32">
      <div className="lab-controls-heading border-b border-line px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="lab-step grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-sm font-black text-white">1</span>
          <div><p className="text-[10px] font-extrabold uppercase text-slate-500">{eyebrow}</p><h2 className="mt-0.5 text-lg font-black">{title}</h2></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">{intro}</p>
      </div>
      <div className="px-5 pb-2 pt-1">{children}</div>
    </aside>
  );
}

function ChartPanel({ eyebrow, title, aside, children }: { eyebrow: string; title: string; aside?: string; children: ReactNode }) {
  return (
    <Panel className="min-h-[330px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-extrabold uppercase text-teal">{eyebrow}</p><h2 className="mt-1 text-base font-bold">{title}</h2></div>
        {aside && <span className="text-xs text-slate-500">{aside}</span>}
      </div>
      <div className="mt-4 h-64 min-w-0">{children}</div>
    </Panel>
  );
}

function useReport(report: Report, onReport: (report: Report) => void) {
  useEffect(() => onReport(report), [onReport, report]);
}

function ClassificationLab({ onReport }: { onReport: (report: Report) => void }) {
  const [prevalence, setPrevalence] = useState(1);
  const [threshold, setThreshold] = useState(0.5);
  const [fpCost, setFpCost] = useState(10);
  const [fnCost, setFnCost] = useState(1000);
  const [capacity, setCapacity] = useState(15);
  const [uploaded, setUploaded] = useState<any[] | null>(null);
  const [dataset, setDataset] = useState("Synthetic evaluation · 10,000 rows");
  const rows = useMemo(() => uploaded ?? generateScenario({ size: 10000, prevalence: prevalence / 100 }), [uploaded, prevalence]);
  const costs = useMemo(() => ({ falsePositiveCost: fpCost, falseNegativeCost: fnCost }), [fpCost, fnCost]);
  const metrics = useMemo(() => ({ ...evaluatePredictions(rows, threshold, costs), prAuc: averagePrecision(rows) }), [rows, threshold, costs]);
  const baseline = useMemo(() => allNegativeBaseline(rows, costs), [rows, costs]);
  const assessment = useMemo(() => assessLaunch(metrics, baseline.expectedCost, capacity / 100), [metrics, baseline, capacity]);
  const recommendation = useMemo(() => recommendThreshold(rows, costs, { minRecall: 0.7, maxReviewRate: capacity / 100 }), [rows, costs, capacity]);
  const sweep = useMemo(() => thresholdSweep(rows, costs).map((point: any) => ({ threshold: point.threshold, precision: point.precision, recall: point.recall })), [rows, costs]);
  const report = useMemo(() => makeReport("classification", dataset, { threshold, fpCost, fnCost, capacity }, metrics, assessment), [dataset, threshold, fpCost, fnCost, capacity, metrics, assessment]);
  useReport(report, onReport);
  const savings = baseline.expectedCost === 0 ? null : (baseline.expectedCost - metrics.expectedCost) / baseline.expectedCost;

  return (
    <Workspace
      controls={<ControlPanel eyebrow="Scenario" title="Operating assumptions" intro="Set the decision policy and economics for a binary classifier.">
        {!uploaded && <RangeControl label="Positive prevalence" value={prevalence} display={`${prevalence.toFixed(1)}%`} min={0.2} max={15} step={0.1} help="Share of synthetic examples that are positive." onChange={setPrevalence} />}
        <RangeControl label="Decision threshold" value={threshold} display={threshold.toFixed(2)} min={0} max={1} step="any" help="Scores at or above this value generate an alert." onChange={setThreshold} />
        <RangeControl label="False-alert cost" value={fpCost} display={money(fpCost)} min={1} max={200} step={1} help="Review effort and customer friction per false alert." onChange={setFpCost} />
        <RangeControl label="Missed-positive cost" value={fnCost} display={money(fnCost)} min={100} max={5000} step={50} help="Loss or harm associated with a missed positive." onChange={setFnCost} />
        <RangeControl label="Maximum review rate" value={capacity} display={`${capacity.toFixed(1)}%`} min={1} max={30} step={0.5} help="Maximum share the team can investigate." onChange={setCapacity} />
        <UploadBox schema="actual, score" sample={"actual,score\n0,0.08\n1,0.91\n0,0.24\n1,0.73\n"} onRows={(text, name) => { const parsed = parsePredictionCsv(text); setUploaded(parsed.rows); setDataset(`${name} · ${parsed.rows.length.toLocaleString()} rows`); }} />
      </ControlPanel>}
    >
      <DecisionBanner label="Launch recommendation" status={assessment.status} tone={assessment.tone as Tone} summary={assessment.summary} metricLabel="Expected cost / 1,000" metric={money(metrics.costPerThousand)} source={`${savings === null ? "N/A" : percent(savings)} vs all-negative`} />
      <MetricGrid metrics={[
        { label: "Accuracy", value: percent(metrics.accuracy), help: "Overall correctness" },
        { label: "Precision", value: percent(metrics.precision), help: "Alerts that were positive" },
        { label: "Recall", value: percent(metrics.recall), help: "Positives successfully found" },
        { label: "PR-AUC", value: percent(metrics.prAuc), help: "Rare-event ranking quality" },
        { label: "Alert rate", value: percent(metrics.alertRate), help: "Share sent for review", accent: "border-t-[3px] border-t-sky-600" },
      ]} />
      <Panel className="p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><p className="text-[11px] font-extrabold uppercase text-teal">Policy optimizer</p><h2 className="mt-1 text-base font-bold">Recommended operating point</h2><p className="mt-1 text-xs leading-5 text-slate-500">Lowest expected cost among thresholds meeting 70% recall and the selected review capacity.</p></div>
          <button className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[6px] bg-navy px-4 text-sm font-bold text-white hover:bg-[#24566a]" type="button" onClick={() => setThreshold(recommendation.threshold)}><SlidersHorizontal size={16} /> Apply {recommendation.threshold.toFixed(3)}</button>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <Policy label="Current" threshold={threshold} metrics={metrics} status={assessment.status} />
          <Policy label="Recommended" threshold={recommendation.threshold} metrics={recommendation.metrics} status={recommendation.feasible ? "Feasible" : "Best fallback"} highlight />
          <Policy label="All negative" threshold={1.01} metrics={baseline} status="Baseline" />
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5"><p className="text-[11px] font-extrabold uppercase text-teal">Classification outcomes</p><h2 className="mt-1 text-base font-bold">Confusion matrix</h2><div className="mt-5 grid grid-cols-[90px_1fr_1fr] gap-2 text-center text-xs"><span /><span className="font-bold text-slate-500">Predicted +</span><span className="font-bold text-slate-500">Predicted −</span><span className="self-center text-left font-bold text-slate-500">Actual +</span><Matrix value={metrics.tp} label="True positive" color="bg-emerald-50 text-success" /><Matrix value={metrics.fn} label="False negative" color="bg-red-50 text-coral" /><span className="self-center text-left font-bold text-slate-500">Actual −</span><Matrix value={metrics.fp} label="False positive" color="bg-amber-50 text-amber" /><Matrix value={metrics.tn} label="True negative" color="bg-slate-100 text-navy" /></div></Panel>
        <ChartPanel eyebrow="Operating curve" title="Threshold trade-offs" aside={`Current: ${threshold.toFixed(2)}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={sweep} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid className="chart-grid" vertical={false} /><XAxis dataKey="threshold" tickFormatter={(v) => Number(v).toFixed(2)} /><YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v) => percent(Number(v))} labelFormatter={(v) => `Threshold ${Number(v).toFixed(2)}`} /><Legend /><ReferenceLine x={Math.round(threshold * 20) / 20} stroke="#152126" strokeDasharray="4 4" /><Line type="monotone" dataKey="precision" stroke="#2878a5" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="recall" stroke="#c94a38" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></ChartPanel>
      </div>
      <GateList gates={assessment.gates} />
    </Workspace>
  );
}

function Policy({ label, threshold, metrics, status, highlight = false }: { label: string; threshold: number; metrics: any; status: string; highlight?: boolean }) {
  return <div className={`rounded-[6px] border p-3 ${highlight ? "border-teal bg-emerald-50/60" : "border-line"}`}><div className="flex items-center justify-between gap-2"><strong>{label}</strong><span className="text-xs font-bold text-slate-500">{status}</span></div><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-slate-500">Threshold</dt><dd className="font-bold tabular-nums">{threshold > 1 ? "None" : threshold.toFixed(3)}</dd></div><div><dt className="text-slate-500">Cost / 1K</dt><dd className="font-bold tabular-nums">{money(metrics.costPerThousand)}</dd></div><div><dt className="text-slate-500">Recall</dt><dd className="font-bold tabular-nums">{percent(metrics.recall)}</dd></div><div><dt className="text-slate-500">Alert rate</dt><dd className="font-bold tabular-nums">{percent(metrics.alertRate)}</dd></div></dl></div>;
}

function Matrix({ value, label, color }: { value: number; label: string; color: string }) {
  return <div className={`flex min-h-24 flex-col items-center justify-center rounded-[6px] p-2 ${color}`}><strong className="text-xl tabular-nums">{value.toLocaleString()}</strong><span className="mt-1">{label}</span></div>;
}

const STATUS_DETAILS: Record<ProjectStatus, { label: string; className: string }> = {
  connected: { label: "Connected", className: "border-success bg-emerald-50 text-success" },
  "evidence-ready": { label: "Evidence ready", className: "border-sky-600 bg-sky-50 text-sky-700" },
  "needs-evidence": { label: "Needs artifact", className: "border-amber bg-amber-50 text-amber" },
  learning: { label: "Learning", className: "border-slate-400 bg-slate-50 text-slate-700" },
  infrastructure: { label: "Infrastructure", className: "border-slate-400 bg-slate-50 text-slate-700" },
};

type PortfolioFilter = "all" | ProjectStatus;

function PortfolioLab({ onReport, onNavigate }: { onReport: (report: Report) => void; onNavigate: (module: ModuleId) => void }) {
  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [query, setQuery] = useState("");
  const visible = portfolioProjects.filter((project) => {
    const matchesFilter = filter === "all" || project.status === filter;
    const haystack = `${project.displayName} ${project.name} ${project.summary} ${project.family}`.toLowerCase();
    return matchesFilter && haystack.includes(query.trim().toLowerCase());
  });
  const counts = portfolioProjects.reduce<Record<ProjectStatus, number>>((result, project) => {
    result[project.status] += 1;
    return result;
  }, { connected: 0, "evidence-ready": 0, "needs-evidence": 0, learning: 0, infrastructure: 0 });
  const report = useMemo(() => makeReport(
    "project-portfolio",
    `GitHub portfolio snapshot · ${portfolioProjects.length} repositories`,
    { owner: "Ayush210895", filter },
    { total: portfolioProjects.length, ...counts },
    { status: "Portfolio mapped", next: "Import evidence-ready artifacts with repository-specific adapters" },
  ), [filter]);
  useReport(report, onReport);

  return <Workspace controls={<ControlPanel eyebrow="GitHub portfolio" title="Project connections" intro="Every public repository is mapped to its evidence state and the evaluation workspace that fits its model family.">
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
      <span className="sr-only">Search projects</span>
      <input className="h-10 w-full rounded-[6px] border border-line bg-white pl-9 pr-3 text-sm" type="search" value={query} placeholder="Search projects" onChange={(event) => setQuery(event.target.value)} />
    </label>
    <div className="mt-5 space-y-1" aria-label="Filter projects">
      {(["all", "connected", "evidence-ready", "needs-evidence", "learning", "infrastructure"] as PortfolioFilter[]).map((status) => {
        const label = status === "all" ? "All projects" : STATUS_DETAILS[status].label;
        const count = status === "all" ? portfolioProjects.length : counts[status];
        return <button key={status} type="button" className={`flex min-h-9 w-full items-center justify-between rounded-[6px] px-3 text-left text-xs font-bold ${filter === status ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"}`} onClick={() => setFilter(status)}><span>{label}</span><span className="tabular-nums">{count}</span></button>;
      })}
    </div>
    <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-slate-500">Evidence is read from public, committed artifacts. Source repositories remain independent; the financial-document RAG project is not modified.</p>
  </ControlPanel>}>
    <section className="flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
      <div><p className="text-[11px] font-extrabold uppercase text-teal">Portfolio map</p><h2 className="mt-1 text-2xl font-bold">All GitHub projects, one evaluation path</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A connection means traceable evidence, not merely a repository link. Start with committed reports, then normalize each project into the Quality Lab evidence contract.</p></div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-500">{visible.length} of {portfolioProjects.length} shown</span>
    </section>
    <MetricGrid metrics={[
      { label: "Repositories mapped", value: String(portfolioProjects.length), help: "Complete public inventory" },
      { label: "Live connection", value: String(counts.connected), help: "Interactive evidence adapter" },
      { label: "Evidence ready", value: String(counts["evidence-ready"]), help: "Committed result available" },
      { label: "Needs artifact", value: String(counts["needs-evidence"]), help: "Evaluation output to standardize" },
      { label: "Learning and infrastructure", value: String(counts.learning + counts.infrastructure), help: "Tracked, not scored", accent: "border-t-[3px] border-t-sky-600" },
    ]} />
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-label="GitHub projects">
      {visible.map((project) => <ProjectCard key={project.name} project={project} onNavigate={onNavigate} />)}
    </section>
    {visible.length === 0 && <p className="py-16 text-center text-sm text-slate-500">No projects match this search and filter.</p>}
  </Workspace>;
}

function ProjectCard({ project, onNavigate }: { project: PortfolioProject; onNavigate: (module: ModuleId) => void }) {
  const status = STATUS_DETAILS[project.status];
  return <article className="flex min-h-64 flex-col rounded-[6px] border border-line bg-white p-5">
    <div className="flex items-start justify-between gap-3"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${status.className}`}>{status.label}</span><span className="font-mono text-[11px] text-slate-400">{project.sourceCommit}</span></div>
    <h3 className="mt-4 break-words text-base font-bold text-ink">{project.displayName}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">{project.summary}</p>
    <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs"><div><dt className="font-bold text-slate-500">Model family</dt><dd className="mt-1 text-ink">{project.family}</dd></div><div><dt className="font-bold text-slate-500">Evidence</dt><dd className="mt-1 leading-5 text-ink">{project.evidence}</dd></div></dl>
    <div className="mt-auto flex flex-wrap gap-2 pt-5">
      {project.targetLab && <button className="inline-flex min-h-9 items-center gap-2 rounded-[6px] bg-navy px-3 text-xs font-bold text-white hover:bg-[#24566a]" type="button" onClick={() => onNavigate(project.targetLab!)}>{project.status === "connected" ? "Open evidence" : "Open matching lab"}</button>}
      <a className="inline-flex min-h-9 items-center gap-2 rounded-[6px] border border-line px-3 text-xs font-bold text-navy hover:border-teal hover:text-teal" href={project.repoUrl} target="_blank" rel="noreferrer">Repository <ExternalLink size={14} /></a>
    </div>
  </article>;
}

function ComparisonLab({ onReport }: { onReport: (report: Report) => void }) {
  const evaluation = travelEvaluation;
  const baseline = evaluation.finalTest.baseline;
  const candidate = evaluation.finalTest.candidate;
  const uplift = candidate.harmValueCapture - baseline.harmValueCapture;
  const relativeUplift = uplift / baseline.harmValueCapture;
  const incidentsCaught = Math.round(candidate.recall * evaluation.finalTest.harmfulBookings);
  const dataset = `GitHub artifact · ${evaluation.sourceCommit.slice(0, 7)}`;
  const chart = [
    { metric: "Harm value", baseline: baseline.harmValueCapture, candidate: candidate.harmValueCapture },
    { metric: "Recall", baseline: baseline.recall, candidate: candidate.recall },
    { metric: "Precision", baseline: baseline.precision, candidate: candidate.precision },
  ];
  const gates = [
    { name: "Policy locked before test", value: 1, target: 1, pass: evaluation.policyLockedBeforeTest, direction: "min" },
    { name: "Review capacity", value: evaluation.finalTest.reviewFraction, target: 0.05, pass: evaluation.finalTest.reviewFraction <= 0.05, direction: "max" },
    { name: "Harm-value uplift", value: uplift, target: 0, pass: uplift > 0, direction: "min" },
    { name: "Recall floor", value: candidate.recall, target: 0.15, pass: candidate.recall >= 0.15, direction: "min" },
    { name: "Future-test sample", value: evaluation.finalTest.rows, target: 10000, pass: evaluation.finalTest.rows >= 10000, direction: "min", format: "number" },
  ];
  const assessment = {
    status: "Promote for value objective",
    tone: "pass",
    summary: "Expected-loss ranking captures materially more harmful financial value at the same review capacity. It accepts lower incident recall, so recall remains an explicit production guardrail.",
    gates,
  };
  const report = useMemo(() => makeReport(
    "github-model-comparison",
    dataset,
    { repository: evaluation.repository, sourceCommit: evaluation.sourceCommit, policy: evaluation.policy },
    { baseline, candidate, harmValueUplift: uplift, relativeHarmValueUplift: relativeUplift },
    assessment,
  ), [baseline, candidate, dataset, evaluation, relativeUplift, uplift]);
  useReport(report, onReport);

  return <Workspace controls={<ControlPanel eyebrow="Connected evidence" title="Travel harm-risk model" intro="A traceable decision view built from evaluation artifacts committed in your GitHub model repository.">
    <div className="space-y-4 border-y border-line py-4 text-sm">
      <div><span className="block text-xs font-bold text-slate-500">Model</span><strong className="mt-1 block">{evaluation.model}</strong></div>
      <div><span className="block text-xs font-bold text-slate-500">Locked ranking policy</span><strong className="mt-1 block leading-5">{evaluation.policy}</strong></div>
      <div><span className="block text-xs font-bold text-slate-500">Primary business objective</span><strong className="mt-1 block leading-5">{evaluation.primaryObjective}</strong></div>
    </div>
    <div className="mt-5 space-y-2">
      <a className="flex items-center justify-between gap-2 rounded-[6px] border border-line px-3 py-2.5 text-xs font-bold text-navy hover:border-teal hover:text-teal" href={evaluation.repositoryUrl} target="_blank" rel="noreferrer">Source repository <ExternalLink size={14} /></a>
      <a className="flex items-center justify-between gap-2 rounded-[6px] border border-line px-3 py-2.5 text-xs font-bold text-navy hover:border-teal hover:text-teal" href={evaluation.sourceCommitUrl} target="_blank" rel="noreferrer">Pinned commit {evaluation.sourceCommit.slice(0, 7)} <ExternalLink size={14} /></a>
      <a className="flex items-center justify-between gap-2 rounded-[6px] border border-line px-3 py-2.5 text-xs font-bold text-navy hover:border-teal hover:text-teal" href={evaluation.finalArtifactUrl} target="_blank" rel="noreferrer">Final-test artifact <ExternalLink size={14} /></a>
    </div>
    <p className="mt-5 rounded-[6px] bg-slate-100 p-3 text-xs leading-5 text-slate-600">This workspace evaluates the committed model evidence. The Python/XGBoost model itself remains in its source repository and is not executed in the browser.</p>
  </ControlPanel>}>
    <DecisionBanner label="Model decision" status={assessment.status} tone="pass" summary={assessment.summary} metricLabel="Harmful value captured" metric={percent(candidate.harmValueCapture)} source={`+${percent(uplift)} points vs probability ranking`} />
    <MetricGrid metrics={[
      { label: "Harm value captured", value: percent(candidate.harmValueCapture), help: "Primary business metric" },
      { label: "Relative uplift", value: `+${percent(relativeUplift)}`, help: "Versus probability ranking" },
      { label: "Review capacity", value: percent(evaluation.finalTest.reviewFraction), help: `${evaluation.finalTest.reviewCount.toLocaleString()} bookings flagged` },
      { label: "Harmful bookings caught", value: `${incidentsCaught} / ${evaluation.finalTest.harmfulBookings}`, help: "At the locked operating point" },
      { label: "Future-test rows", value: evaluation.finalTest.rows.toLocaleString(), help: "Untouched chronological period", accent: "border-t-[3px] border-t-sky-600" },
    ]} />
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <ChartPanel eyebrow="Locked final test" title="Probability versus expected-loss ranking" aside="Same XGBoost model · same 5% capacity"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid className="chart-grid" vertical={false} /><XAxis dataKey="metric" /><YAxis domain={[0, 0.45]} tickFormatter={(value) => `${Math.round(value * 100)}%`} /><Tooltip contentStyle={chartTooltipStyle} formatter={(value) => percent(Number(value))} /><Legend /><Bar dataKey="baseline" name="Probability ranking" fill="#94a3b8" radius={[4, 4, 0, 0]} /><Bar dataKey="candidate" name="Expected-loss ranking" fill="#087e72" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartPanel>
      <Panel className="p-5"><p className="text-[11px] font-extrabold uppercase text-teal">Decision trade-off</p><h2 className="mt-1 text-base font-bold">Value improves while incident recall falls</h2><div className="mt-5 space-y-4"><ComparisonDelta label="Harmful value capture" baseline={baseline.harmValueCapture} candidate={candidate.harmValueCapture} /><ComparisonDelta label="Incident recall" baseline={baseline.recall} candidate={candidate.recall} /><ComparisonDelta label="Precision" baseline={baseline.precision} candidate={candidate.precision} /></div><p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-slate-600">This is not a universal model win. It is the correct policy only when prevented financial harm is the primary objective and the recall trade-off is accepted.</p></Panel>
    </div>
    <Panel className="overflow-hidden">
      <div className="border-b border-line p-5"><p className="text-[11px] font-extrabold uppercase text-teal">Development evidence</p><h2 className="mt-1 text-base font-bold">Logistic baseline versus XGBoost candidate</h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Validation policy</th><th className="px-5 py-3 text-right">Precision</th><th className="px-5 py-3 text-right">Recall</th><th className="px-5 py-3 text-right">Harm value captured</th></tr></thead><tbody><ComparisonRow model={evaluation.validation.baseline} /><ComparisonRow model={evaluation.validation.candidate} highlight /></tbody></table></div>
    </Panel>
    <GateList gates={gates} />
  </Workspace>;
}

function ComparisonDelta({ label, baseline, candidate }: { label: string; baseline: number; candidate: number }) {
  const delta = candidate - baseline;
  return <div><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{label}</span><strong className={`text-sm tabular-nums ${delta >= 0 ? "text-success" : "text-coral"}`}>{delta >= 0 ? "+" : ""}{percent(delta)} pts</strong></div><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Baseline {percent(baseline)}</span><span className="text-right">Candidate {percent(candidate)}</span></div></div>;
}

function ComparisonRow({ model, highlight = false }: { model: { readonly name: string; readonly precision: number; readonly recall: number; readonly harmValueCapture: number }; highlight?: boolean }) {
  return <tr className={`border-t border-line ${highlight ? "bg-emerald-50/60" : ""}`}><td className="px-5 py-3 font-bold">{model.name}</td><td className="px-5 py-3 text-right tabular-nums">{percent(model.precision)}</td><td className="px-5 py-3 text-right tabular-nums">{percent(model.recall)}</td><td className="px-5 py-3 text-right font-bold tabular-nums">{percent(model.harmValueCapture)}</td></tr>;
}

function RegressionLab({ onReport }: { onReport: (report: Report) => void }) {
  const [noise, setNoise] = useState(10); const [bias, setBias] = useState(2); const [maxWape, setMaxWape] = useState(12);
  const [uploaded, setUploaded] = useState<any[] | null>(null); const [dataset, setDataset] = useState("Synthetic forecast · 60 periods");
  const rows = useMemo(() => uploaded ?? generateRegressionScenario({ size: 60, noise, bias }), [uploaded, noise, bias]);
  const metrics = useMemo(() => evaluateRegression(rows), [rows]);
  const assessment = useMemo(() => assessRegression(metrics, { maxWape: maxWape / 100 }), [metrics, maxWape]);
  const report = useMemo(() => makeReport("regression-and-forecasting", dataset, { noise, bias, maxWape }, metrics, assessment), [dataset, noise, bias, maxWape, metrics, assessment]); useReport(report, onReport);
  return <Workspace controls={<ControlPanel eyebrow="Model family" title="Regression & forecasting" intro="Evaluate numeric predictions, time-series forecasts, directional bias, and uncertainty intervals.">{!uploaded && <><RangeControl label="Demo error level" value={noise} display={String(noise)} min={2} max={40} step={1} help="Random forecast error in the synthetic set." onChange={setNoise} /><RangeControl label="Demo systematic bias" value={bias} display={`${bias >= 0 ? "+" : ""}${bias}`} min={-20} max={20} step={1} help="Persistent over- or under-prediction." onChange={setBias} /></>}<RangeControl label="Maximum WAPE" value={maxWape} display={`${maxWape}%`} min={3} max={35} step={1} help="Business tolerance for weighted absolute error." onChange={setMaxWape} /><UploadBox schema="actual, predicted; optional lower, upper, period" sample={"period,actual,predicted,lower,upper\n1,120,118,105,131\n2,128,132,119,145\n3,135,137,124,150\n"} onRows={(text, name) => { const parsed = parseRegressionCsv(text); setUploaded(parsed); setDataset(`${name} · ${parsed.length} periods`); }} /></ControlPanel>}>
    <DecisionBanner label="Release recommendation" status={assessment.status} tone={assessment.tone as Tone} summary="Error, directional bias, and uncertainty reliability are evaluated together before release." metricLabel="Weighted absolute error" metric={percent(metrics.wape)} source={dataset} />
    <MetricGrid metrics={[{ label: "MAE", value: number(metrics.mae), help: "Average absolute error" }, { label: "RMSE", value: number(metrics.rmse), help: "Penalizes large misses" }, { label: "Bias", value: number(metrics.bias), help: "Directional error" }, { label: "R²", value: number(metrics.r2, 3), help: "Variance explained" }, { label: "Interval coverage", value: percent(metrics.coverage), help: "Actuals inside bounds", accent: "border-t-[3px] border-t-sky-600" }]} />
    <ChartPanel eyebrow="Forecast behavior" title="Actual versus predicted" aside={`${rows.length} periods`}><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}><CartesianGrid className="chart-grid" vertical={false} /><XAxis dataKey="period" /><YAxis /><Tooltip contentStyle={chartTooltipStyle} /><Legend /><Line type="monotone" dataKey="actual" stroke="#2878a5" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="predicted" stroke="#c94a38" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></ChartPanel><GateList gates={assessment.gates} />
  </Workspace>;
}

function RankingLab({ onReport }: { onReport: (report: Report) => void }) {
  const [k, setK] = useState(5); const [minNdcg, setMinNdcg] = useState(75); const [minCoverage, setMinCoverage] = useState(60);
  const [rows, setRows] = useState<any[]>(() => generateRankingScenario()); const [dataset, setDataset] = useState("Synthetic ranking set · 40 queries");
  const metrics = useMemo(() => evaluateRanking(rows, k), [rows, k]); const assessment = useMemo(() => assessRanking(metrics, { minNdcg: minNdcg / 100, minCoverage: minCoverage / 100 }), [metrics, minNdcg, minCoverage]);
  const chart = [{ name: "Precision", value: metrics.precisionAtK, target: null }, { name: "Recall", value: metrics.recallAtK, target: 0.55 }, { name: "NDCG", value: metrics.ndcgAtK, target: minNdcg / 100 }, { name: "MRR", value: metrics.mrr, target: null }, { name: "Coverage", value: metrics.coverage, target: minCoverage / 100 }];
  const report = useMemo(() => makeReport("ranking-and-recommendations", dataset, { k, minNdcg, minCoverage }, metrics, assessment), [dataset, k, minNdcg, minCoverage, metrics, assessment]); useReport(report, onReport);
  return <Workspace controls={<ControlPanel eyebrow="Model family" title="Ranking & recommendations" intro="Evaluate search, recommendation, retrieval, and prioritization systems at the served cutoff."><RangeControl label="Serving cutoff K" value={k} display={String(k)} min={1} max={10} step={1} help="Results shown to each user or query." onChange={setK} /><RangeControl label="Minimum NDCG@K" value={minNdcg} display={`${minNdcg}%`} min={40} max={95} step={1} help="Required quality of ordering." onChange={setMinNdcg} /><RangeControl label="Minimum coverage" value={minCoverage} display={`${minCoverage}%`} min={20} max={100} step={5} help="Required catalog exposure in top-K results." onChange={setMinCoverage} /><UploadBox schema="query_id, item_id, relevance, score" sample={"query_id,item_id,relevance,score\nq1,a,3,0.92\nq1,b,1,0.71\nq1,c,0,0.18\nq2,a,0,0.28\nq2,b,2,0.84\n"} onRows={(text, name) => { const parsed = parseRankingCsv(text); setRows(parsed); setDataset(`${name} · ${new Set(parsed.map((r: any) => r.queryId)).size} queries`); }} /></ControlPanel>}>
    <DecisionBanner label="Serving recommendation" status={assessment.status} tone={assessment.tone as Tone} summary="Relevance, retrieval completeness, ordering, and catalog exposure are evaluated at the chosen serving cutoff." metricLabel={`NDCG@${k}`} metric={percent(metrics.ndcgAtK)} source={dataset} />
    <MetricGrid metrics={[{ label: `Precision@${k}`, value: percent(metrics.precisionAtK), help: "Top results that matter" }, { label: `Recall@${k}`, value: percent(metrics.recallAtK), help: "Relevant items retrieved" }, { label: `NDCG@${k}`, value: percent(metrics.ndcgAtK), help: "Quality of result order" }, { label: "MRR", value: percent(metrics.mrr), help: "First relevant rank" }, { label: "Catalog coverage", value: percent(metrics.coverage), help: "Catalog surfaced", accent: "border-t-[3px] border-t-sky-600" }]} />
    <ChartPanel eyebrow="Quality profile" title="Ranking metrics at served cutoff" aside={`${metrics.queries} queries`}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid className="chart-grid" vertical={false} /><XAxis dataKey="name" /><YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v) => percent(Number(v))} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{chart.map((entry) => <Cell key={entry.name} fill={entry.target !== null && Number(entry.value ?? 0) < entry.target ? "#c94a38" : "#087e72"} />)}</Bar></BarChart></ResponsiveContainer></ChartPanel><GateList gates={assessment.gates} />
  </Workspace>;
}

function LlmLab({ onReport }: { onReport: (report: Report) => void }) {
  const [quality, setQuality] = useState(84); const [minQuality, setMinQuality] = useState(80); const [minGrounded, setMinGrounded] = useState(85); const [maxLatency, setMaxLatency] = useState(3000); const [maxCost, setMaxCost] = useState(4);
  const [uploaded, setUploaded] = useState<any[] | null>(null); const [dataset, setDataset] = useState("Synthetic evaluation · 80 cases");
  const rows = useMemo(() => uploaded ?? generateLlmScenario({ quality: quality / 100 }), [uploaded, quality]); const metrics = useMemo(() => evaluateLlm(rows), [rows]);
  const assessment = useMemo(() => assessLlm(metrics, { minQuality: minQuality / 100, minGroundedness: minGrounded / 100, maxP95LatencyMs: maxLatency, maxCostUsd: maxCost / 100 }), [metrics, minQuality, minGrounded, maxLatency, maxCost]);
  const chart = [{ name: "Quality", value: metrics.quality, target: minQuality / 100 }, { name: "Grounded", value: metrics.groundedness, target: minGrounded / 100 }, { name: "Retrieval", value: metrics.retrieval, target: null }, { name: "Citations", value: metrics.citation, target: null }, { name: "Safety", value: metrics.safetyPassRate, target: 0.98 }];
  const report = useMemo(() => makeReport("llm-and-rag", dataset, { quality, minQuality, minGrounded, maxLatency, maxCost }, metrics, assessment), [dataset, quality, minQuality, minGrounded, maxLatency, maxCost, metrics, assessment]); useReport(report, onReport);
  return <Workspace controls={<ControlPanel eyebrow="Model family" title="LLM & RAG" intro="Evaluate answer quality, grounding, retrieval, citations, safety, latency, and unit economics.">{!uploaded && <RangeControl label="Demo quality level" value={quality} display={`${quality}%`} min={45} max={96} step={1} help="Base quality of the synthetic evaluation cases." onChange={setQuality} />}<RangeControl label="Minimum answer quality" value={minQuality} display={`${minQuality}%`} min={50} max={95} step={1} help="Required judge or human-review score." onChange={setMinQuality} /><RangeControl label="Minimum groundedness" value={minGrounded} display={`${minGrounded}%`} min={50} max={99} step={1} help="Required support from provided evidence." onChange={setMinGrounded} /><RangeControl label="Maximum P95 latency" value={maxLatency} display={`${maxLatency} ms`} min={500} max={8000} step={100} help="Tail-latency service objective." onChange={setMaxLatency} /><RangeControl label="Maximum average cost" value={maxCost} display={money(maxCost / 100, 2)} min={1} max={15} step={1} help="Maximum model cost per evaluation case." onChange={setMaxCost} /><UploadBox schema="quality, groundedness, retrieval, citation, latency_ms, cost_usd, safety_pass" sample={"case_id,quality,groundedness,retrieval,citation,latency_ms,cost_usd,safety_pass\n1,0.9,0.92,0.86,1,1400,0.021,1\n2,0.82,0.88,0.79,0.8,2300,0.034,1\n"} onRows={(text, name) => { const parsed = parseLlmCsv(text); setUploaded(parsed); setDataset(`${name} · ${parsed.length} cases`); }} /></ControlPanel>}>
    <DecisionBanner label="Release recommendation" status={assessment.status} tone={assessment.tone as Tone} summary="Quality, evidence use, safety, latency, and cost must hold together for a production LLM system." metricLabel="Answer quality" metric={percent(metrics.quality)} source={dataset} />
    <MetricGrid metrics={[{ label: "Quality", value: percent(metrics.quality), help: "Task success" }, { label: "Groundedness", value: percent(metrics.groundedness), help: "Supported by evidence" }, { label: "Retrieval", value: percent(metrics.retrieval), help: "Context quality" }, { label: "Citation coverage", value: percent(metrics.citation), help: "Claims with citations" }, { label: "Safety pass", value: percent(metrics.safetyPassRate), help: "Cases clearing policy" }, { label: "P95 latency", value: `${number(metrics.p95LatencyMs, 0)} ms`, help: "Tail response time" }, { label: "Average cost", value: money(metrics.averageCostUsd, 3), help: "Per evaluated case", accent: "border-t-[3px] border-t-sky-600" }]} />
    <ChartPanel eyebrow="System profile" title="Quality and reliability dimensions" aside={`${metrics.total} cases`}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid className="chart-grid" vertical={false} /><XAxis dataKey="name" /><YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v) => percent(Number(v))} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{chart.map((entry) => <Cell key={entry.name} fill={entry.target !== null && Number(entry.value ?? 0) < entry.target ? "#c94a38" : "#087e72"} />)}</Bar></BarChart></ResponsiveContainer></ChartPanel><GateList gates={assessment.gates} />
  </Workspace>;
}

function MonitoringLab({ onReport }: { onReport: (report: Report) => void }) {
  const [drift, setDrift] = useState(35); const [missing, setMissing] = useState(1.5); const [maxPsi, setMaxPsi] = useState(0.2); const [maxShift, setMaxShift] = useState(0.5);
  const [uploaded, setUploaded] = useState<any | null>(null); const [dataset, setDataset] = useState("Synthetic production window · 2,000 rows");
  const data = useMemo(() => uploaded ?? generateMonitoringScenario({ drift: drift / 100, missingRate: missing / 100 }), [uploaded, drift, missing]); const metrics = useMemo(() => evaluateMonitoring(data), [data]);
  const assessment = useMemo(() => assessMonitoring(metrics, { maxPsi, maxMeanShift: maxShift }), [metrics, maxPsi, maxShift]);
  const performanceDrop = metrics.performanceDelta === null ? null : -metrics.performanceDelta;
  const chart = [{ name: "PSI", value: metrics.psi, target: maxPsi }, { name: "Mean shift", value: Math.abs(metrics.meanShift ?? 0), target: maxShift }, { name: "Missing", value: metrics.missingRate, target: 0.03 }, ...(performanceDrop === null ? [] : [{ name: "Perf. drop", value: performanceDrop, target: 0.05 }])];
  const report = useMemo(() => makeReport("production-monitoring", dataset, { drift, missing, maxPsi, maxShift }, metrics, assessment), [dataset, drift, missing, maxPsi, maxShift, metrics, assessment]); useReport(report, onReport);
  return <Workspace controls={<ControlPanel eyebrow="Operations" title="Production monitoring" intro="Detect input drift, missingness, and performance degradation before they become silent failures.">{!uploaded && <><RangeControl label="Demo drift intensity" value={drift} display={`${drift}%`} min={0} max={100} step={1} help="Distribution shift in the synthetic current window." onChange={setDrift} /><RangeControl label="Demo missing rate" value={missing} display={`${missing.toFixed(1)}%`} min={0} max={15} step={0.5} help="Missing values in the current population." onChange={setMissing} /></>}<RangeControl label="Maximum PSI" value={maxPsi} display={maxPsi.toFixed(2)} min={0.05} max={0.5} step={0.01} help="Population stability limit." onChange={setMaxPsi} /><RangeControl label="Maximum mean shift" value={maxShift} display={`${maxShift.toFixed(2)}σ`} min={0.1} max={1.5} step={0.05} help="Allowed standardized movement in the feature mean." onChange={setMaxShift} /><UploadBox schema="reference, current; optional baseline_performance, current_performance" sample={"reference,current,baseline_performance,current_performance\n0.18,0.22,0.84,0.79\n0.31,0.37,0.84,0.79\n0.54,,0.84,0.79\n0.71,0.78,0.84,0.79\n"} onRows={(text, name) => { const parsed = parseMonitoringCsv(text); setUploaded(parsed); setDataset(`${name} · ${parsed.rows.length} rows`); }} /></ControlPanel>}>
    <DecisionBanner label="Operational status" status={assessment.status} tone={assessment.tone as Tone} summary="Input stability, data completeness, and model performance are evaluated as one production health signal." metricLabel="Population Stability Index" metric={number(metrics.psi, 3)} source={dataset} />
    <MetricGrid metrics={[{ label: "PSI", value: number(metrics.psi, 3), help: "Population drift" }, { label: "Mean shift", value: `${number(Math.abs(metrics.meanShift ?? 0), 2)}σ`, help: "Standardized movement" }, { label: "Missing rate", value: percent(metrics.missingRate), help: "Current values missing" }, { label: "Performance delta", value: metrics.performanceDelta === null ? "N/A" : `${metrics.performanceDelta >= 0 ? "+" : ""}${percent(metrics.performanceDelta)}`, help: "Current minus baseline", accent: "border-t-[3px] border-t-sky-600" }]} />
    <ChartPanel eyebrow="Health profile" title="Observed risk against limits" aside={`${metrics.total.toLocaleString()} rows`}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} layout="vertical" margin={{ top: 5, right: 35, left: 15, bottom: 0 }}><CartesianGrid className="chart-grid" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={76} /><Tooltip contentStyle={chartTooltipStyle} formatter={(v) => number(Number(v), 3)} /><Legend /><Bar dataKey="value" name="Observed" radius={[0, 4, 4, 0]}>{chart.map((entry) => <Cell key={entry.name} fill={entry.value > entry.target ? "#c94a38" : "#087e72"} />)}</Bar><Bar dataKey="target" name="Limit" fill="#94a3b8" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></ChartPanel><GateList gates={assessment.gates} />
  </Workspace>;
}

function Workspace({ controls, children }: { controls: ReactNode; children: ReactNode }) {
  return <main className="mx-auto grid w-full max-w-[1500px] gap-5 px-4 py-5 md:px-7 lg:grid-cols-[310px_minmax(0,1fr)] lg:py-7"><>{controls}</><section className="min-w-0 space-y-4" aria-live="polite">{children}</section></main>;
}

function QualityLabApp({ onExit }: { onExit: () => void }) {
  const assetBase = import.meta.env.BASE_URL;
  const [active, setActive] = useState<ModuleId>("classification");
  const [resetKey, setResetKey] = useState(0);
  const [report, setReport] = useState<Report | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const activeModule = MODULES.find((module) => module.id === active)!;
  const exportReport = () => {
    if (!report) return;
    const valid = reportSchema.parse({ ...report, generatedAt: new Date().toISOString() });
    download(`ai-quality-lab-${active}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(valid, null, 2));
  };
  const navigate = (module: ModuleId) => { setActive(module); setReport(null); setPaletteOpen(false); setPaletteQuery(""); };
  const visibleModules = useMemo(() => MODULES.filter((module) => `${module.label} ${module.short} ${module.description}`.toLowerCase().includes(paletteQuery.trim().toLowerCase())), [paletteQuery]);
  const evaluationStatus = typeof report?.assessment.status === "string" ? report.assessment.status : report ? "Evidence ready" : "Evaluating";
  const moduleCover: Record<ModuleId, string> = {
    classification: "assets/fraud-anomaly-cover.jpg",
    comparison: "assets/travel-harm-risk-cover.jpg",
    regression: "assets/aqi-forecast-cover.jpg",
    ranking: "assets/recommendation-cover.jpg",
    llm: "assets/financial-doc-agent-cover.jpg",
    monitoring: "assets/activity-signals-cover.jpg",
    portfolio: "assets/quality-lab-cover.jpg",
  };
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);
  const lab = active === "portfolio" ? <PortfolioLab onReport={setReport} onNavigate={navigate} /> : active === "classification" ? <ClassificationLab onReport={setReport} /> : active === "comparison" ? <ComparisonLab onReport={setReport} /> : active === "regression" ? <RegressionLab onReport={setReport} /> : active === "ranking" ? <RankingLab onReport={setReport} /> : active === "llm" ? <LlmLab onReport={setReport} /> : <MonitoringLab onReport={setReport} />;
  return (
    <div className="quality-lab relative min-h-screen overflow-hidden bg-[#050814] text-ink" style={{ "--lab-accent": activeModule.color, "--lab-tint": activeModule.tint } as React.CSSProperties}>
      <ConstellationField />
      <div className="relative z-10">
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#07101d]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-3 px-4 md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button className="creator-home-link flex min-w-0 items-center gap-2.5 text-left" type="button" title="Open Ayush Soni portfolio home" onClick={onExit}>
              <img className="h-9 w-9 shrink-0 rounded-full border-2 border-[#2d92ff] object-cover object-top" src={`${assetBase}assets/ayush-soni-headshot.jpg`} alt="" />
              <span className="min-w-0"><strong className="block truncate text-sm">Ayush Soni</strong><span className="block truncate text-[10px] font-extrabold uppercase text-[#75a7ff]">Portfolio home</span></span>
            </button>
            <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden="true" />
            <span className="hidden font-mono text-[10px] font-bold uppercase text-[#8296b5] sm:block">AI Quality Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-1 hidden max-w-56 truncate text-xs text-[#9fb0c8] lg:block" title={report?.dataset}>{report?.dataset ?? "Preparing evaluation"}</span>
            <button className="hidden h-9 items-center gap-2 rounded-[6px] border border-[#324667] bg-[#0b1425] px-3 text-xs font-bold text-[#c8d4e6] hover:border-[#64e8ff] hover:text-white sm:inline-flex" type="button" onClick={() => setPaletteOpen(true)}><Command size={14} /> Workspaces <kbd className="rounded-[3px] border border-[#435777] px-1.5 py-0.5 font-mono text-[9px]">⌘K</kbd></button>
            <button className="lab-icon-button" type="button" title="Reset active workspace" aria-label="Reset" onClick={() => setResetKey((value) => value + 1)}><RefreshCw size={16} /></button>
            <button className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[6px] bg-white px-3 text-xs font-bold text-[#07101d] disabled:cursor-not-allowed disabled:opacity-50" type="button" title="Download JSON evidence report" aria-label="Export evidence" onClick={exportReport} disabled={!report}><Download size={15} /><span className="hidden sm:inline">Export evidence</span><span className="sm:hidden">Export</span></button>
          </div>
        </div>
        <ScrollProgress />
      </header>

      <section className="lab-cinema relative isolate overflow-hidden border-b border-[#263657] bg-[#08111f]/88 text-white backdrop-blur-[2px]">
        <img key={active} className="lab-cinema-backdrop absolute inset-0 -z-20 h-full w-full object-cover" src={`${assetBase}${moduleCover[active]}`} alt="" />
        <span className="lab-cinema-scrim absolute inset-0 -z-10" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1500px] px-4 pb-5 pt-6 md:px-7 md:pt-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><p className="text-[11px] font-extrabold uppercase text-[#64e8ff]">Interactive evaluation studio</p><h1 className="portfolio-display mt-2 text-4xl sm:text-5xl">{activeModule.label}</h1><p className="mt-2 text-sm text-[#aebed6]">{activeModule.description}</p></div>
            <button className="inline-flex min-h-9 w-fit items-center gap-2 rounded-[6px] px-2 text-xs font-bold text-[#aebed6] hover:bg-white/10 hover:text-white" type="button" onClick={onExit}><FolderGit2 size={15} /> Back to all projects</button>
          </div>
          <nav className="scrollbar-thin mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Model evaluation workspaces" role="tablist">
            {MODULES.map((module) => {
              const Icon = module.icon;
              const selected = module.id === active;
              return <button key={module.id} type="button" role="tab" aria-label={module.label} aria-selected={selected} className={`lab-module-tab group relative isolate min-w-[150px] flex-1 overflow-hidden rounded-[6px] border p-3 text-left text-white transition-colors ${selected ? "shadow-[0_8px_20px_rgba(0,0,0,.38)]" : "border-[#324667] hover:border-[#64e8ff]"}`} style={selected ? { borderColor: module.color } : undefined} onClick={() => navigate(module.id)}>
                <img className="lab-module-cover absolute inset-0 -z-20 h-full w-full object-cover" src={`${assetBase}${moduleCover[module.id]}`} alt="" />
                <span className={`lab-module-scrim absolute inset-0 -z-10 ${selected ? "opacity-80" : "opacity-95"}`} aria-hidden="true" />
                <span className="flex items-center gap-2"><Icon size={16} /><strong className="text-xs">{module.short}</strong></span>
                <span className="mt-2 hidden text-[10px] leading-4 text-[#c5d1e3] xl:block">{module.description}</span>
                {selected && <span className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: module.color }} aria-hidden="true" />}
              </button>;
            })}
          </nav>
          <div className="lab-telemetry mt-5 grid gap-px overflow-hidden rounded-[6px] border border-[#263657] bg-[#263657] sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.5fr_1fr]">
            <div><span>Workspace</span><strong>{activeModule.short}</strong></div>
            <div><span>Decision state</span><strong>{evaluationStatus}</strong></div>
            <div className="min-w-0"><span>Evidence source</span><strong className="truncate" title={report?.dataset}>{report?.dataset ?? "Preparing evaluation"}</strong></div>
            <div className="relative overflow-hidden"><span>Runtime</span><strong>Browser local</strong><i className="signal-sweep" aria-hidden="true" /></div>
          </div>
        </div>
      </section>

      <div className="lab-workspace" key={`${active}-${resetKey}`}>{lab}</div>
      <footer className="border-t border-[#263657] bg-[#07101d]/95"><div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-2 px-5 py-4 text-xs text-[#8ea4c2] sm:flex-row md:px-7"><span>Evaluation runs locally in your browser.</span><span>Independent evaluation suite · source projects remain unchanged</span></div></footer>
      {paletteOpen && <div className="fixed inset-0 z-50 flex justify-center bg-[#010309]/82 px-4 pt-[12svh] backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Switch Quality Lab workspace" onClick={() => setPaletteOpen(false)}>
        <section className="h-fit max-h-[72svh] w-full max-w-2xl overflow-hidden rounded-[8px] border border-[#324667] bg-[#08111f] text-white shadow-[0_32px_100px_rgba(0,0,0,.65)]" onClick={(event) => event.stopPropagation()}>
          <label className="flex items-center gap-3 border-b border-[#263657] px-5 py-4"><Search className="text-[#64e8ff]" size={19} /><span className="sr-only">Search workspaces</span><input autoFocus className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[#7184a2]" value={paletteQuery} onChange={(event) => setPaletteQuery(event.target.value)} placeholder="Choose an evaluation workspace" /><kbd className="rounded-[4px] border border-[#324667] px-2 py-1 font-mono text-[10px] text-[#8296b5]">ESC</kbd></label>
          <div className="max-h-[58svh] overflow-y-auto p-2">{visibleModules.map((module) => { const Icon = module.icon; return <button key={module.id} type="button" className={`group grid w-full grid-cols-[38px_1fr_auto] items-center gap-3 rounded-[6px] px-3 py-3 text-left ${module.id === active ? "bg-[#12213a]" : "hover:bg-white/5"}`} onClick={() => navigate(module.id)}><span className="grid h-9 w-9 place-items-center rounded-[5px]" style={{ backgroundColor: module.color }}><Icon size={17} /></span><span><strong className="block text-sm">{module.label}</strong><small className="mt-1 block text-xs text-[#8296b5]">{module.description}</small></span><span className="text-[10px] font-bold uppercase text-[#64e8ff]">{module.id === active ? "Active" : "Open"}</span></button>; })}{visibleModules.length === 0 && <p className="px-4 py-10 text-center text-sm text-[#8296b5]">No matching workspace.</p>}</div>
        </section>
      </div>}
      </div>
    </div>
  );
}

function currentHash() {
  return window.location.hash || "#/";
}

export default function App() {
  const [route, setRoute] = useState(currentHash);
  useEffect(() => {
    const handleHashChange = () => setRoute(currentHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (target: string) => {
    setRoute(target);
    if (window.location.hash !== target) window.location.hash = target;
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });
  };
  if (route.startsWith("#/lab")) return <QualityLabApp onExit={() => navigate("#/")} />;
  const slug = route.startsWith("#/projects/") ? decodeURIComponent(route.slice("#/projects/".length)) : "";
  const project = slug ? projectBySlug.get(slug) : undefined;
  const selectProject = (selected: ProjectStory) => navigate(`#/projects/${selected.slug}`);
  const view = route === "#/projects" ? "projects" : "home";
  return <PortfolioSite project={project} view={view} onHome={() => navigate("#/")} onProjects={() => navigate("#/projects")} onOpenLab={() => navigate("#/lab")} onSelectProject={selectProject} />;
}
