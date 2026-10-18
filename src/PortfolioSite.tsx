import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ChartNoAxesCombined,
  Code2,
  Database,
  ExternalLink,
  FlaskConical,
  Layers3,
  Search,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { projectStories, type ProjectStory, type VisualKind } from "./data/projectStories";

type PortfolioSiteProps = {
  project?: ProjectStory;
  onHome: () => void;
  onOpenLab: () => void;
  onSelectProject: (project: ProjectStory) => void;
};

type ProjectGroup = "All" | "Featured" | "Applied ML" | "GenAI & NLP" | "Analytics" | "Systems" | "Learning";

const GROUPS: ProjectGroup[] = ["All", "Featured", "Applied ML", "GenAI & NLP", "Analytics", "Systems", "Learning"];

function projectGroup(project: ProjectStory): Exclude<ProjectGroup, "All" | "Featured"> {
  if (["language", "agents"].includes(project.visual)) return "GenAI & NLP";
  if (["space", "portfolio", "signals"].includes(project.visual)) return "Analytics";
  if (project.visual === "learning") return "Learning";
  if (project.status === "infrastructure") return "Systems";
  return "Applied ML";
}

export default function PortfolioSite({ project, onHome, onOpenLab, onSelectProject }: PortfolioSiteProps) {
  return project
    ? <ProjectPage project={project} onBack={onHome} onOpenLab={onOpenLab} onSelectProject={onSelectProject} />
    : <ProjectExplorer onOpenLab={onOpenLab} onSelectProject={onSelectProject} />;
}

function SiteHeader({ onHome, onOpenLab, light = false }: { onHome: () => void; onOpenLab: () => void; light?: boolean }) {
  return <header className={`sticky top-0 z-30 border-b ${light ? "border-white/20 bg-[#142126] text-white" : "border-[#d7dfdf] bg-[#f7f9f8]/95 text-[#142126]"}`}>
    <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 md:px-7">
      <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={onHome}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[6px] ${light ? "bg-[#73dbcb] text-[#142126]" : "bg-[#142126] text-white"}`}><ChartNoAxesCombined size={19} /></span>
        <span className="min-w-0"><strong className="block truncate text-sm">Ayush Soni</strong><span className={`block truncate text-[11px] font-bold uppercase ${light ? "text-[#9edfd5]" : "text-[#34766d]"}`}>AI/ML Project Atlas</span></span>
      </button>
      <nav className="flex items-center gap-2" aria-label="Portfolio navigation">
        <a className={`hidden min-h-9 items-center gap-2 rounded-[6px] px-3 text-xs font-bold sm:inline-flex ${light ? "hover:bg-white/10" : "hover:bg-white"}`} href="https://github.com/Ayush210895" target="_blank" rel="noreferrer"><Code2 size={15} /> GitHub</a>
        <button className={`inline-flex min-h-9 items-center gap-2 rounded-[6px] px-3 text-xs font-bold ${light ? "bg-white text-[#142126]" : "bg-[#142126] text-white"}`} type="button" onClick={onOpenLab}><FlaskConical size={15} /> Quality Lab</button>
      </nav>
    </div>
  </header>;
}

function ProjectExplorer({ onOpenLab, onSelectProject }: Pick<PortfolioSiteProps, "onOpenLab" | "onSelectProject">) {
  const [group, setGroup] = useState<ProjectGroup>("All");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => projectStories.filter((project) => {
    const matchesGroup = group === "All" || (group === "Featured" ? project.featured : projectGroup(project) === group);
    const text = `${project.name} ${project.summary} ${project.problem} ${project.stack.join(" ")}`.toLowerCase();
    return matchesGroup && text.includes(query.trim().toLowerCase());
  }), [group, query]);

  return <div className="min-h-screen bg-[#f1f5f4] text-[#142126]">
    <SiteHeader onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onOpenLab={onOpenLab} />
    <main>
      <section className="border-b border-[#d7dfdf] bg-[#f7f9f8]">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-9 md:px-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)] lg:items-end lg:py-12">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#087e72]">Applied intelligence, made inspectable</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.06] sm:text-5xl lg:text-6xl">AI, ML and data systems built around real decisions.</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#536166]">Explore model behavior, architecture, evidence, and honest limitations across production ML, GenAI, recommendations, risk, forecasting, and analytics.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-[#aebcba] pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <AtlasStat value="19" label="Public projects" />
            <AtlasStat value={String(projectStories.filter((project) => project.featured).length)} label="Featured systems" />
            <AtlasStat value="1" label="Interactive lab" />
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-20 border-b border-[#d7dfdf] bg-[#f1f5f4]/95">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-thin flex gap-1 overflow-x-auto" aria-label="Project categories">
            {GROUPS.map((item) => <button key={item} type="button" className={`min-h-9 shrink-0 rounded-[6px] px-3 text-xs font-bold ${group === item ? "bg-[#142126] text-white" : "text-[#536166] hover:bg-white"}`} onClick={() => setGroup(item)}>{item}</button>)}
          </div>
          <label className="relative block w-full lg:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 text-[#758488]" size={16} /><span className="sr-only">Search project atlas</span><input className="h-9 w-full rounded-[6px] border border-[#cbd6d4] bg-white pl-9 pr-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search models, tools, methods" /></label>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-8 md:px-7 lg:py-10">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-[#087e72]">Project explorer</p><h2 className="mt-1 text-2xl font-black">{group === "All" ? "The complete atlas" : group}</h2></div><span className="text-sm font-bold tabular-nums text-[#687579]">{visible.length} projects</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => <ProjectTile key={item.name} project={item} onSelect={() => onSelectProject(item)} />)}
        </div>
        {visible.length === 0 && <div className="border-y border-[#cbd6d4] py-20 text-center"><strong>No matching project</strong><p className="mt-2 text-sm text-[#687579]">Try a different technology, domain, or category.</p></div>}
      </section>
    </main>
  </div>;
}

function AtlasStat({ value, label }: { value: string; label: string }) {
  return <div><strong className="block text-3xl font-black tabular-nums">{value}</strong><span className="mt-1 block text-xs leading-5 text-[#687579]">{label}</span></div>;
}

function ProjectTile({ project, onSelect }: { project: ProjectStory; onSelect: () => void }) {
  return <article className="group flex min-h-[470px] flex-col overflow-hidden rounded-[6px] border border-[#d1dcda] bg-white transition-transform hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(20,33,38,.12)]">
    <button type="button" className="block h-48 w-full overflow-hidden text-left" onClick={onSelect} aria-label={`Explore ${project.name}`}>
      <VisualStage kind={project.visual} accent={project.accent} soft={project.soft} compact />
    </button>
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-extrabold uppercase" style={{ color: project.accent }}>{projectGroup(project)}</span><span className="font-mono text-[10px] text-[#8a989b]">{project.sourceCommit}</span></div>
      <h3 className="mt-3 break-words text-xl font-black leading-tight">{project.name}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5b696d]">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{project.stack.slice(0, 4).map((item) => <span key={item} className="rounded-full border border-[#d7dfdf] px-2 py-1 text-[10px] font-bold text-[#536166]">{item}</span>)}</div>
      <div className="mt-auto flex items-center justify-between border-t border-[#e0e7e6] pt-4"><span className="text-xs font-bold text-[#687579]">{project.metrics[0].label}: <strong className="text-[#142126]">{project.metrics[0].value}</strong></span><button type="button" className="grid h-9 w-9 place-items-center rounded-[6px] text-white" style={{ backgroundColor: project.accent }} onClick={onSelect} title={`Open ${project.name}`}><ArrowRight size={17} /></button></div>
    </div>
  </article>;
}

function ProjectPage({ project, onBack, onOpenLab, onSelectProject }: { project: ProjectStory; onBack: () => void; onOpenLab: () => void; onSelectProject: (project: ProjectStory) => void }) {
  const [section, setSection] = useState<"story" | "architecture" | "evidence">("story");
  useEffect(() => setSection("story"), [project.slug]);
  const related = projectStories.filter((candidate) => candidate.name !== project.name && (projectGroup(candidate) === projectGroup(project) || candidate.visual === project.visual)).slice(0, 3);
  return <div className="min-h-screen bg-[#f4f7f6] text-[#142126]" style={{ "--project-accent": project.accent, "--project-soft": project.soft } as CSSProperties}>
    <SiteHeader onHome={onBack} onOpenLab={onOpenLab} light />
    <main>
      <section className="border-b border-[#cad5d3]" style={{ backgroundColor: project.soft }}>
        <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-7 lg:py-10">
          <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-[6px] px-2 text-xs font-bold text-[#536166] hover:bg-white/70" onClick={onBack}><ArrowLeft size={15} /> All projects</button>
          <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,.85fr)_minmax(480px,1.15fr)] lg:items-stretch">
            <div className="flex flex-col justify-center py-2">
              <p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>{projectGroup(project)} · {project.family}</p>
              <h1 className="mt-3 break-words text-4xl font-black leading-[1.04] sm:text-5xl">{project.name}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#48565a]">{project.problem}</p>
              <div className="mt-6 flex flex-wrap gap-2"><a className="inline-flex min-h-10 items-center gap-2 rounded-[6px] px-4 text-sm font-bold text-white" style={{ backgroundColor: project.accent }} href={project.repoUrl} target="_blank" rel="noreferrer"><Code2 size={16} /> View repository <ArrowUpRight size={15} /></a>{project.name === "ai-quality-lab" && <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[#9baba8] bg-white px-4 text-sm font-bold" onClick={onOpenLab}><FlaskConical size={16} /> Open live lab</button>}</div>
            </div>
            <div className="min-h-[340px] overflow-hidden rounded-[6px] border border-white/70 bg-white/60 shadow-[0_18px_45px_rgba(20,33,38,.12)]"><VisualStage kind={project.visual} accent={project.accent} soft={project.soft} /></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d4dddc] bg-white">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 md:grid-cols-3">{project.metrics.map((metric) => <div key={metric.label} className="border-b border-[#dfe6e5] px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-7"><span className="text-xs font-bold text-[#687579]">{metric.label}</span><strong className="mt-1 block text-3xl font-black tabular-nums">{metric.value}</strong><small className="mt-1 block text-xs text-[#687579]">{metric.note}</small></div>)}</div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-8 md:px-7 lg:py-12">
        <div className="mb-7 flex gap-1 overflow-x-auto border-b border-[#ccd7d5]" role="tablist" aria-label="Project detail sections">
          {(["story", "architecture", "evidence"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={section === item} className={`min-h-11 shrink-0 border-b-[3px] px-4 text-xs font-extrabold uppercase ${section === item ? "text-[#142126]" : "border-transparent text-[#687579]"}`} style={section === item ? { borderColor: project.accent } : undefined} onClick={() => setSection(item)}>{item}</button>)}
        </div>
        {section === "story" && <StorySection project={project} />}
        {section === "architecture" && <ArchitectureSection project={project} />}
        {section === "evidence" && <EvidenceSection project={project} />}
      </section>

      <section className="border-t border-[#d4dddc] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-9 md:px-7"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Continue exploring</p><h2 className="mt-1 text-2xl font-black">Related projects</h2></div><button className="hidden min-h-9 items-center gap-2 text-xs font-bold sm:inline-flex" type="button" onClick={onBack}>See all <ArrowRight size={15} /></button></div><div className="grid gap-3 md:grid-cols-3">{related.map((item) => <button key={item.name} type="button" className="flex min-h-28 items-center justify-between gap-4 rounded-[6px] border border-[#d4dddc] p-4 text-left hover:border-[#8ba29e]" onClick={() => onSelectProject(item)}><span><span className="block text-[10px] font-extrabold uppercase" style={{ color: item.accent }}>{projectGroup(item)}</span><strong className="mt-2 block break-words text-sm">{item.name}</strong></span><ArrowRight className="shrink-0" size={18} /></button>)}</div></div>
      </section>
    </main>
  </div>;
}

function StorySection({ project }: { project: ProjectStory }) {
  return <div className="grid gap-5 lg:grid-cols-2"><ContentBlock icon={<Layers3 size={18} />} eyebrow="Approach" title="How the project works" body={project.approach} accent={project.accent} /><ContentBlock icon={<ChartNoAxesCombined size={18} />} eyebrow="Outcome" title="What the evidence shows" body={project.outcome} accent={project.accent} /><div className="lg:col-span-2"><ContentBlock icon={<FlaskConical size={18} />} eyebrow="Honest boundary" title="How to interpret it" body={project.boundary} accent={project.accent} /></div></div>;
}

function ArchitectureSection({ project }: { project: ProjectStory }) {
  return <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>System flow</p><h2 className="mt-1 text-2xl font-black">From input to decision</h2><div className="mt-6 grid gap-2 sm:grid-cols-5">{project.pipeline.map((step, index) => <div key={step} className="relative rounded-[6px] border border-[#d4dddc] bg-white p-4"><span className="text-[10px] font-black" style={{ color: project.accent }}>0{index + 1}</span><strong className="mt-2 block text-sm leading-5">{step}</strong></div>)}</div></section><section><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Technology</p><h2 className="mt-1 text-2xl font-black">Stack and methods</h2><div className="mt-6 flex flex-wrap gap-2">{project.stack.map((item) => <span key={item} className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[#d4dddc] bg-white px-3 text-xs font-bold"><Code2 size={14} style={{ color: project.accent }} />{item}</span>)}</div></section></div>;
}

function EvidenceSection({ project }: { project: ProjectStory }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_.72fr]"><section className="overflow-hidden rounded-[6px] border border-[#d4dddc] bg-white"><div className="border-b border-[#dfe6e5] p-5"><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Verified snapshot</p><h2 className="mt-1 text-2xl font-black">Committed evidence</h2></div>{project.metrics.map((metric) => <div key={metric.label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#e1e7e6] px-5 py-4 last:border-b-0"><span><strong className="block text-sm">{metric.label}</strong><small className="mt-1 block text-xs text-[#687579]">{metric.note}</small></span><strong className="text-lg tabular-nums">{metric.value}</strong></div>)}</section><section className="rounded-[6px] p-6" style={{ backgroundColor: project.soft }}><Database size={22} style={{ color: project.accent }} /><p className="mt-5 text-xs font-extrabold uppercase" style={{ color: project.accent }}>Provenance</p><h2 className="mt-1 text-xl font-black">Traceable to source</h2><p className="mt-3 text-sm leading-6 text-[#536166]">Evidence state: {project.evidence}. This page is pinned to repository snapshot <span className="font-mono font-bold">{project.sourceCommit}</span>.</p><a className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[6px] bg-white px-4 text-sm font-bold" href={project.repoUrl} target="_blank" rel="noreferrer">Inspect repository <ExternalLink size={15} /></a></section></div>;
}

function ContentBlock({ icon, eyebrow, title, body, accent }: { icon: ReactNode; eyebrow: string; title: string; body: string; accent: string }) {
  return <section className="h-full rounded-[6px] border border-[#d4dddc] bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-[6px] text-white" style={{ backgroundColor: accent }}>{icon}</span><p className="mt-5 text-xs font-extrabold uppercase" style={{ color: accent }}>{eyebrow}</p><h2 className="mt-1 text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-7 text-[#536166]">{body}</p></section>;
}

const tooltipStyle = { border: "1px solid #d4dddc", borderRadius: 6, fontSize: 11, boxShadow: "0 8px 22px rgba(20,33,38,.12)" };

function VisualStage({ kind, accent, soft, compact = false }: { kind: VisualKind; accent: string; soft: string; compact?: boolean }) {
  const height = compact ? 192 : 340;
  const common = <CartesianGrid stroke="#ffffff" strokeOpacity={0.75} vertical={false} />;
  const label = visualLabel(kind);
  return <div className="relative h-full w-full overflow-hidden p-4" style={{ backgroundColor: soft }}>
    <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#536166]">{label}</div>
    <div style={{ height: `${height}px`, paddingTop: compact ? 22 : 30 }}>
      {kind === "fraud" || kind === "clusters" ? <ScatterVisual kind={kind} accent={accent} common={common} />
        : kind === "ranking" || kind === "language" || kind === "portfolio" || kind === "space" ? <BarVisual kind={kind} accent={accent} common={common} />
          : kind === "agents" || kind === "learning" ? <FlowVisual kind={kind} accent={accent} />
            : kind === "air" ? <AreaVisual accent={accent} common={common} />
              : <LineVisual kind={kind} accent={accent} common={common} />}
    </div>
  </div>;
}

function visualLabel(kind: VisualKind) {
  const labels: Record<VisualKind, string> = { risk: "Decision surface", fraud: "Rare-event field", air: "AQI timeline", ranking: "Model comparison", language: "Signal profile", clusters: "Cluster geometry", signals: "Activity signal", regression: "Fit behavior", space: "Launch history", agents: "Agent workflow", portfolio: "Risk contribution", learning: "Learning path" };
  return labels[kind];
}

function LineVisual({ kind, accent, common }: { kind: VisualKind; accent: string; common: ReactNode }) {
  const data = kind === "signals"
    ? Array.from({ length: 24 }, (_, i) => ({ x: i, a: Math.sin(i * 0.72) * 32 + Math.cos(i * 0.21) * 10 + 50 }))
    : kind === "risk"
      ? [{ x: 1, a: 18, b: 12 }, { x: 2, a: 23, b: 19 }, { x: 3, a: 28, b: 24 }, { x: 4, a: 37, b: 29 }, { x: 5, a: 46, b: 34 }, { x: 6, a: 58, b: 43 }]
      : [{ x: 1, a: 32, b: 30 }, { x: 2, a: 43, b: 46 }, { x: 3, a: 38, b: 41 }, { x: 4, a: 58, b: 54 }, { x: 5, a: 65, b: 68 }, { x: 6, a: 73, b: 71 }];
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 16, right: 12, left: -24, bottom: 0 }}>{common}<XAxis dataKey="x" tick={false} axisLine={false} /><YAxis tick={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="a" stroke={accent} strokeWidth={3} dot={false} /><Line type="monotone" dataKey="b" stroke="#758488" strokeWidth={2} strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer>;
}

function AreaVisual({ accent, common }: { accent: string; common: ReactNode }) {
  const data = [{ x: "Mon", a: 42 }, { x: "Tue", a: 63 }, { x: "Wed", a: 118 }, { x: "Thu", a: 86 }, { x: "Fri", a: 154 }, { x: "Sat", a: 101 }, { x: "Sun", a: 72 }];
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 16, right: 12, left: -22, bottom: 0 }}>{common}<XAxis dataKey="x" tick={{ fontSize: 10 }} axisLine={false} /><YAxis tick={{ fontSize: 10 }} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="a" stroke={accent} fill={accent} fillOpacity={0.26} strokeWidth={3} /></AreaChart></ResponsiveContainer>;
}

function BarVisual({ kind, accent, common }: { kind: VisualKind; accent: string; common: ReactNode }) {
  const data = kind === "ranking" ? [{ name: "Pop", value: .678 }, { name: "User", value: .384 }, { name: "Item", value: .315 }, { name: "SVD", value: .390 }]
    : kind === "space" ? [{ name: "60s", value: 420 }, { name: "70s", value: 1038 }, { name: "80s", value: 964 }, { name: "90s", value: 890 }, { name: "00s", value: 632 }, { name: "10s", value: 380 }]
      : kind === "portfolio" ? [{ name: "AAPL", value: 60 }, { name: "MSFT", value: 47 }, { name: "JPM", value: 48 }, { name: "TLT", value: -44 }, { name: "GLD", value: -10 }]
        : [{ name: "Positive", value: 84 }, { name: "Neutral", value: 57 }, { name: "Negative", value: 29 }];
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 16, right: 12, left: -24, bottom: 0 }}>{common}<XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} /><YAxis tick={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{data.map((entry, index) => <Cell key={entry.name} fill={index === 2 ? accent : `${accent}${index % 2 ? "99" : "cc"}`} />)}</Bar></BarChart></ResponsiveContainer>;
}

function ScatterVisual({ kind, accent, common }: { kind: VisualKind; accent: string; common: ReactNode }) {
  const normal = Array.from({ length: 26 }, (_, i) => ({ x: (i * 17) % 83 + (kind === "clusters" && i > 12 ? 48 : 5), y: (i * 29) % 70 + (kind === "clusters" && i > 12 ? 18 : 4), z: 55 }));
  const flagged = kind === "fraud" ? [{ x: 18, y: 88, z: 100 }, { x: 77, y: 82, z: 100 }, { x: 91, y: 31, z: 100 }] : Array.from({ length: 12 }, (_, i) => ({ x: 65 + (i * 13) % 32, y: 45 + (i * 19) % 45, z: 65 }));
  return <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 16, right: 12, left: -22, bottom: 0 }}>{common}<XAxis type="number" dataKey="x" tick={false} axisLine={false} /><YAxis type="number" dataKey="y" tick={false} axisLine={false} /><ZAxis type="number" dataKey="z" range={[35, 100]} /><Tooltip contentStyle={tooltipStyle} /><Scatter data={normal} fill={kind === "clusters" ? "#4f6ecb" : "#9aa8aa"} fillOpacity={0.68} /><Scatter data={flagged} fill={accent} /></ScatterChart></ResponsiveContainer>;
}

function FlowVisual({ kind, accent }: { kind: VisualKind; accent: string }) {
  const labels = kind === "agents" ? ["PM", "Architect", "Coder", "Tester", "Review", "DevOps", "Docs"] : ["Concept", "Math", "Code", "Test", "Explain"];
  return <div className="flex h-full items-center overflow-x-auto px-2"><div className="flex min-w-max items-center gap-2">{labels.map((label, index) => <div key={label} className="flex items-center gap-2"><div className="grid h-20 w-20 place-items-center rounded-[6px] border-2 bg-white p-2 text-center text-xs font-black" style={{ borderColor: index % 2 ? "#93a4a6" : accent, color: index % 2 ? "#536166" : accent }}><span><Boxes className="mx-auto mb-1" size={17} />{label}</span></div>{index < labels.length - 1 && <ArrowRight size={16} color="#758488" />}</div>)}</div></div>;
}
