import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChartNoAxesCombined,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileJson2,
  FlaskConical,
  ImageIcon,
  Layers3,
  LayoutGrid,
  Play,
  RotateCcw,
  Search,
  Scale,
  UserRound,
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
  ReferenceLine,
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

const STATUS_COPY: Record<ProjectStory["status"], { label: string; detail: string }> = {
  connected: { label: "Interactive evidence", detail: "Connected to the Quality Lab" },
  "evidence-ready": { label: "Evidence ready", detail: "Results committed and traceable" },
  "needs-evidence": { label: "Validation next", detail: "System built; proof gap is explicit" },
  learning: { label: "Exploration", detail: "Learning or analytical artifact" },
  infrastructure: { label: "Platform", detail: "Portfolio-wide operating layer" },
};

const TRADEOFFS: Record<string, string[]> = {
  "travel-marketplace-harm-risk": ["Harm value captured versus incident recall", "Review capacity versus marketplace coverage", "Locked future performance versus repeated tuning"],
  "Credit-Risk-MLOps-AWS": ["Recall versus false-positive review load", "Model performance versus interpretability", "Automated promotion versus approval control"],
  "Credit-Card-Anomaly-Detection": ["Fraud recall versus investigator capacity", "Transparent anomaly logic versus supervised-model ceiling", "Benchmark quality versus temporal production drift"],
  "Beijing-AQI-Prediction": ["Interpretable baseline versus nonlinear accuracy", "Imputation coverage versus signal distortion", "Random evaluation versus true temporal generalization"],
  "Amazon-Recommendation-System": ["Prediction error versus ranking usefulness", "Personalization versus cold-start coverage", "Offline gains versus online user response"],
  "financial-doc-agent": ["Semantic retrieval versus exact calculation", "Answer coverage versus abstention", "Agent autonomy versus financial-review control"],
  "FinBERT-Financial-News-Sentiment": ["Fast pretrained inference versus domain calibration", "Headline sentiment versus issuer-level context", "Signal coverage versus regime drift"],
  Clustering: ["Compact clusters versus label recovery", "Global geometry versus local density", "Stable segments versus actionable segments"],
  "Portfolio-Risk-PCA-From-Scratch": ["Dimensional simplicity versus factor detail", "Short-sample clarity versus regime stability", "Risk explanation versus allocation advice"],
  "Human-Activity-Monitoring": ["Rich nonlinear features versus inference cost", "Participant-specific patterns versus generalization", "Activity characterization versus deployed classification"],
  "Linear-Regression": ["Transparency versus predictive flexibility", "Optimization simplicity versus convergence speed", "Learning value versus production performance"],
  "Logistic-Regression": ["Interpretability versus nonlinear separation", "Recall versus precision at the threshold", "Synthetic clarity versus domain validity"],
  "Naive-Bayes": ["Simple likelihoods versus feature dependence", "Fast training versus probability calibration", "Synthetic strength versus real-data evidence"],
  "multi-agent-dev-system": ["Agent specialization versus coordination overhead", "Traceability versus execution speed", "Autonomy versus human intervention"],
  "Machine-Learning-From-Scratch": ["Implementation depth versus project breadth", "Mathematical clarity versus library efficiency", "Learning evidence versus deployment evidence"],
  "Space-Race-Visualisation": ["Historical breadth versus source freshness", "Visual simplicity versus analytical nuance", "Descriptive comparison versus causal interpretation"],
  "ai-quality-lab": ["Broad model coverage versus model-specific depth", "Browser portability versus executing arbitrary models", "Simple launch gates versus domain-specific governance"],
};

const BUSINESS_QUESTIONS: Record<VisualKind, string> = {
  risk: "Who should receive limited review capacity?",
  fraud: "Which cases deserve investigator time first?",
  air: "When does a forecast require an operational response?",
  ranking: "Which option creates the strongest customer relevance?",
  language: "Can this signal support a grounded decision?",
  clusters: "Which segments meaningfully change the action?",
  signals: "Which patterns should trigger attention?",
  regression: "How much prediction error is acceptable?",
  space: "Where are activity and investment concentrated?",
  agents: "Where should automation stop for human review?",
  portfolio: "What is driving risk and diversification?",
  learning: "Can the method be explained, tested, and trusted?",
};

const PROJECT_BUSINESS_QUESTIONS: Record<string, string> = {
  "travel-marketplace-harm-risk": "Who should receive limited review capacity?",
  "Credit-Risk-MLOps-AWS": "Which applications clear the risk and approval policy?",
  "Credit-Card-Anomaly-Detection": "Which transactions deserve investigator time first?",
  "Beijing-AQI-Prediction": "When should operations issue an air-quality alert?",
  "Amazon-Recommendation-System": "Which ranking earns attention without losing coverage?",
  "financial-doc-agent": "Can an analyst trust this answer enough to act?",
  "multi-agent-dev-system": "Which delivery steps can be automated with review?",
  "Space-Race-Visualisation": "How have capability and investment shifted over time?",
  "ai-quality-lab": "Is this model ready for a production decision?",
};

const FLAGSHIP_NAMES = ["travel-marketplace-harm-risk", "Credit-Risk-MLOps-AWS", "financial-doc-agent"] as const;

const FLAGSHIP_META: Record<(typeof FLAGSHIP_NAMES)[number], { role: string; differentiator: string }> = {
  "travel-marketplace-harm-risk": {
    role: "Applied ML decision science",
    differentiator: "Optimizes a fixed review queue for harmful financial value, then tests that locked policy on a future period.",
  },
  "Credit-Risk-MLOps-AWS": {
    role: "Production ML and MLOps",
    differentiator: "Treats promotion, approval, serving, and drift monitoring as one controlled model lifecycle.",
  },
  "financial-doc-agent": {
    role: "GenAI and grounded analytics",
    differentiator: "Routes narrative questions and exact calculations through separate, inspectable evidence paths.",
  },
};

const ROLE_FIT: Record<string, string[]> = {
  "travel-marketplace-harm-risk": ["Applied ML", "Decision science", "Risk operations"],
  "Credit-Risk-MLOps-AWS": ["MLOps", "Model governance", "API systems"],
  "financial-doc-agent": ["GenAI", "RAG evaluation", "Agent systems"],
};

function projectDifferentiator(project: ProjectStory) {
  if (FLAGSHIP_NAMES.includes(project.name as (typeof FLAGSHIP_NAMES)[number])) {
    return FLAGSHIP_META[project.name as (typeof FLAGSHIP_NAMES)[number]].differentiator;
  }
  return "The case connects technical evidence to an operating decision, while keeping its limitations and next validation step visible.";
}

function businessQuestion(project: ProjectStory) {
  return PROJECT_BUSINESS_QUESTIONS[project.name] ?? BUSINESS_QUESTIONS[project.visual];
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
        <button className={`inline-flex min-h-9 items-center gap-2 rounded-[6px] px-2.5 text-xs font-bold ${light ? "hover:bg-white/10" : "hover:bg-white"}`} type="button" title="Browse all projects" onClick={onHome}><LayoutGrid size={15} /><span className="hidden sm:inline">Projects</span></button>
        <a className={`hidden min-h-9 items-center gap-2 rounded-[6px] px-3 text-xs font-bold sm:inline-flex ${light ? "hover:bg-white/10" : "hover:bg-white"}`} href="https://github.com/Ayush210895" target="_blank" rel="noreferrer"><Code2 size={15} /> GitHub</a>
        <button className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-[6px] px-3 text-xs font-bold ${light ? "bg-white text-[#142126]" : "bg-[#142126] text-white"}`} type="button" onClick={onOpenLab}><FlaskConical size={15} /> Quality Lab</button>
      </nav>
    </div>
  </header>;
}

function ProjectExplorer({ onOpenLab, onSelectProject }: Pick<PortfolioSiteProps, "onOpenLab" | "onSelectProject">) {
  const [group, setGroup] = useState<ProjectGroup>("Featured");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => projectStories.filter((project) => {
    const matchesGroup = group === "All" || (group === "Featured" ? project.featured : projectGroup(project) === group);
    const text = `${project.name} ${project.summary} ${project.problem} ${project.decision} ${project.stack.join(" ")}`.toLowerCase();
    return matchesGroup && text.includes(query.trim().toLowerCase());
  }), [group, query]);

  return <div className="min-h-screen bg-[#dfe9e6] text-[#142126]">
    <SiteHeader onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })} onOpenLab={onOpenLab} />
    <main>
      <section className="atlas-hero relative overflow-hidden bg-[#0c1a21] text-white">
        <div className="mx-auto grid min-h-[520px] max-w-[1500px] gap-5 px-4 py-7 md:px-7 lg:grid-cols-[minmax(0,.88fr)_minmax(520px,1.12fr)] lg:items-center lg:gap-10 lg:py-8">
          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-extrabold uppercase text-[#66d8c7]">Applied intelligence, made inspectable</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">Systems you can inspect, question, and operate.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#bed0ce] sm:text-base sm:leading-7">Move through the live signal map, open a system, and trace how model evidence becomes a business decision.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#66d8c7] px-4 text-sm font-black text-[#0c1a21]" onClick={() => document.getElementById("flagship-projects")?.scrollIntoView({ behavior: "smooth" })}><LayoutGrid size={17} /> Explore flagships</button>
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-white/30 bg-white/5 px-4 text-sm font-bold text-white hover:bg-white/10" onClick={onOpenLab}><FlaskConical size={17} /> Test a model</button>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-3 border-t border-white/20 pt-4">
              <AtlasStat value={String(projectStories.length)} label="Technical projects" color="#66d8c7" />
              <AtlasStat value={String(projectStories.filter((item) => item.status === "evidence-ready" || item.status === "connected").length)} label="Evidence backed" color="#ff8f70" />
              <AtlasStat value="6" label="Evaluation modes" color="#d0a8ff" />
            </div>
          </div>
          <AtlasSignalField onSelectProject={onSelectProject} />
        </div>
      </section>

      <FlagshipProjects onSelectProject={onSelectProject} />

      <section className="sticky top-16 z-20 border-b border-[#b7c9c5] bg-[#e8f0ee]/95 shadow-[0_8px_22px_rgba(12,26,33,.08)]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-thin flex gap-1 overflow-x-auto" aria-label="Project categories">
            {GROUPS.map((item) => <button key={item} type="button" className={`min-h-9 shrink-0 rounded-[6px] px-3 text-xs font-bold ${group === item ? "bg-[#142126] text-white" : "text-[#536166] hover:bg-white"}`} onClick={() => setGroup(item)}>{item}</button>)}
          </div>
          <label className="relative block w-full lg:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 text-[#758488]" size={16} /><span className="sr-only">Search project atlas</span><input className="h-9 w-full rounded-[6px] border border-[#cbd6d4] bg-white pl-9 pr-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search models, tools, methods" /></label>
        </div>
      </section>

      <section id="project-explorer" className="mx-auto max-w-[1500px] px-4 py-8 md:px-7 lg:py-12">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase text-[#087e72]">Project explorer</p><h2 className="mt-1 text-2xl font-black">{group === "All" ? "The complete atlas" : group === "Featured" ? "Featured systems" : group}</h2></div><span className="text-sm font-bold tabular-nums text-[#687579]">{visible.length} projects</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => <ProjectTile key={item.name} project={item} onSelect={() => onSelectProject(item)} />)}
        </div>
        {visible.length === 0 && <div className="border-y border-[#cbd6d4] py-20 text-center"><strong>No matching project</strong><p className="mt-2 text-sm text-[#687579]">Try a different technology, domain, or category.</p></div>}
      </section>
    </main>
  </div>;
}

function FlagshipProjects({ onSelectProject }: { onSelectProject: (project: ProjectStory) => void }) {
  const flagships = FLAGSHIP_NAMES.map((name) => projectStories.find((project) => project.name === name)).filter((project): project is ProjectStory => Boolean(project));
  return <section id="flagship-projects" className="flagship-band border-b border-[#172a31] bg-[#10242b] text-white">
    <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-7 lg:py-16">
      <div className="mb-10 grid gap-3 md:grid-cols-[1fr_430px] md:items-end lg:mb-14">
        <div><p className="text-xs font-extrabold uppercase text-[#66d8c7]">Flagship Three</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">Three systems. Three kinds of leadership.</h2></div>
        <p className="text-sm leading-6 text-[#aebfbd]">Start here for the clearest evidence of applied modeling, production discipline, and grounded AI system design.</p>
      </div>
      <div className="space-y-14 lg:space-y-20">
        {flagships.map((project, index) => {
          const meta = FLAGSHIP_META[project.name as (typeof FLAGSHIP_NAMES)[number]];
          const visualOrder = index % 2 === 0 ? "lg:order-1" : "lg:order-2";
          const copyOrder = index % 2 === 0 ? "lg:order-2" : "lg:order-1";
          return <article key={project.name} className="flagship-story relative grid gap-7 border-t border-white/15 pt-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,.88fr)] lg:items-center lg:gap-14">
            <div className={`flagship-visual relative h-[640px] overflow-hidden md:h-[560px] lg:h-[360px] ${visualOrder}`} style={{ "--story-accent": project.accent } as CSSProperties}><VisualStage project={project} /><span aria-hidden="true" className="absolute right-4 top-1 font-mono text-7xl font-black text-white/10 sm:text-8xl">0{index + 1}</span></div>
            <div className={`${copyOrder}`}><div className="flex items-center gap-3"><span className="h-px w-10" style={{ backgroundColor: project.accent }} /><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>{meta.role}</span></div><h3 className="mt-4 break-words text-3xl font-black leading-tight sm:text-4xl">{project.name}</h3><p className="mt-4 text-base font-bold leading-7 text-white">{businessQuestion(project)}</p><div className="mt-5 border-l-4 pl-4" style={{ borderColor: project.accent }}><span className="text-[9px] font-extrabold uppercase" style={{ color: project.accent }}>Why this is different</span><p className="mt-1 text-sm leading-6 text-[#c7d4d2]">{meta.differentiator}</p></div><div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3"><span><strong className="block text-3xl font-black tabular-nums" style={{ color: project.accent }}>{project.metrics[0].value}</strong><small className="text-[10px] font-bold uppercase text-[#9fb4b2]">{project.metrics[0].label}</small></span><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[6px] px-4 text-sm font-black text-white" style={{ backgroundColor: project.accent }} onClick={() => onSelectProject(project)}>Open case <ArrowRight size={16} /></button></div></div>
          </article>;
        })}
      </div>
      <button type="button" className="mt-7 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-[#9edfd5]" onClick={() => document.getElementById("project-explorer")?.scrollIntoView({ behavior: "smooth" })}><LayoutGrid size={15} /> Browse the complete project atlas</button>
    </div>
  </section>;
}

function AtlasStat({ value, label, color }: { value: string; label: string; color: string }) {
  return <div className="border-r border-white/20 pr-3 last:border-r-0 sm:pr-5"><strong className="block text-2xl font-black tabular-nums" style={{ color }}>{value}</strong><span className="mt-1 block text-[10px] font-bold uppercase leading-4 text-[#9fb4b2]">{label}</span></div>;
}

const SIGNAL_PROJECTS = [
  { name: "travel-marketplace-harm-risk", label: "Harm risk", x: 8, y: 14, color: "#ff765c" },
  { name: "Credit-Risk-MLOps-AWS", label: "Credit MLOps", x: 57, y: 8, color: "#5fe0bd" },
  { name: "financial-doc-agent", label: "Financial agent", x: 25, y: 43, color: "#c8a2ff" },
  { name: "Amazon-Recommendation-System", label: "Recommender", x: 66, y: 42, color: "#ffc159" },
  { name: "multi-agent-dev-system", label: "Agent system", x: 11, y: 66, color: "#72b7ff" },
  { name: "ai-quality-lab", label: "Quality Lab", x: 58, y: 68, color: "#66d8c7" },
];

function AtlasSignalField({ onSelectProject }: { onSelectProject: (project: ProjectStory) => void }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeName, setActiveName] = useState(SIGNAL_PROJECTS[0].name);
  const activeProject = projectStories.find((item) => item.name === activeName) ?? projectStories[0];

  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    if (!shell || !canvas) return;
    if (window.navigator.userAgent.includes("jsdom")) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animation = 0;

    const draw = (time = 0) => {
      const width = shell.clientWidth;
      const height = shell.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(120, 205, 194, .28)";
      context.lineWidth = 1;
      const points = SIGNAL_PROJECTS.map((item) => ({ x: width * (item.x + 10) / 100, y: height * (item.y + 4) / 100 }));
      const links = [[0, 2], [0, 1], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
      links.forEach(([start, end], index) => {
        const from = points[start];
        const to = points[end];
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        const progress = reducedMotion ? 0.5 : ((time / 1800) + index * 0.17) % 1;
        const pulseX = from.x + (to.x - from.x) * progress;
        const pulseY = from.y + (to.y - from.y) * progress;
        context.fillStyle = index % 2 ? "#66d8c7" : "#ffc159";
        context.fillRect(pulseX - 2, pulseY - 2, 4, 4);
      });
      context.fillStyle = "rgba(255,255,255,.12)";
      for (let i = 0; i < 32; i += 1) context.fillRect((i * 83) % width, (i * 47) % height, 1, 1);
      if (!reducedMotion) animation = window.requestAnimationFrame(draw);
    };
    draw();
    const handleResize = () => { if (reducedMotion) draw(); };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); window.cancelAnimationFrame(animation); };
  }, []);

  return <div ref={shellRef} className="signal-field relative min-h-[360px] overflow-hidden border border-white/15 bg-[#10262d] lg:min-h-[430px]" aria-label="Interactive project signal map">
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="absolute left-4 top-4 z-10"><p className="text-[10px] font-extrabold uppercase text-[#66d8c7]">Live project network</p><p className="mt-1 text-xs text-[#9fb4b2]">Select a signal to open its case study</p></div>
    {SIGNAL_PROJECTS.map((node) => {
      const selected = node.name === activeName;
      const project = projectStories.find((item) => item.name === node.name);
      if (!project) return null;
      return <button key={node.name} type="button" className={`signal-node absolute z-10 min-h-10 border px-3 py-2 text-left text-[10px] font-black uppercase text-white ${selected ? "bg-[#0c1a21]" : "bg-[#17313a]/90"}`} style={{ left: `${node.x}%`, top: `${node.y}%`, borderColor: node.color, boxShadow: selected ? `0 0 0 2px ${node.color}` : undefined }} onMouseEnter={() => setActiveName(node.name)} onFocus={() => setActiveName(node.name)} onClick={() => onSelectProject(project)}><span className="mr-2 inline-block h-2 w-2" style={{ backgroundColor: node.color }} />{node.label}</button>;
    })}
    <div className="absolute bottom-0 left-0 right-0 z-10 grid grid-cols-[1fr_auto] items-end gap-4 border-t border-white/15 bg-[#0c1a21]/95 px-4 py-3">
      <span><span className="block text-[9px] font-extrabold uppercase text-[#66d8c7]">Active decision</span><strong className="mt-1 line-clamp-1 block text-xs sm:text-sm">{businessQuestion(activeProject)}</strong></span>
      <span className="text-right"><strong className="block text-lg tabular-nums text-[#ffc159]">{activeProject.metrics[0].value}</strong><small className="block max-w-24 text-[9px] text-[#9fb4b2]">{activeProject.metrics[0].label}</small></span>
    </div>
  </div>;
}

function ProjectTile({ project, onSelect }: { project: ProjectStory; onSelect: () => void }) {
  return <article className="project-tile group flex min-h-[540px] flex-col overflow-hidden rounded-[6px] transition-transform hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(12,26,33,.18)]" style={{ borderTop: `4px solid ${project.accent}`, backgroundColor: project.soft }}>
    <button type="button" className="block h-48 w-full overflow-hidden text-left" onClick={onSelect} aria-label={`Explore ${project.name}`}>
      <VisualStage project={project} compact />
    </button>
    <div className="flex flex-1 flex-col border-t border-white/70 p-5">
      <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-extrabold uppercase" style={{ color: project.accent }}>{projectGroup(project)}</span><span className="rounded-full border border-[#d7dfdf] px-2 py-1 text-[9px] font-extrabold uppercase text-[#536166]">{STATUS_COPY[project.status].label}</span></div>
      <h3 className="mt-3 break-words text-xl font-black leading-tight">{project.name}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5b696d]">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">{project.stack.slice(0, 4).map((item) => <span key={item} className="rounded-full border border-[#d7dfdf] px-2 py-1 text-[10px] font-bold text-[#536166]">{item}</span>)}</div>
      <div className="mt-4 border-l-4 pl-3" style={{ borderColor: project.accent }}><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>Why it matters</span><p className="mt-1 line-clamp-3 text-xs leading-5 text-[#48565a]">{project.outcome}</p></div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e0e7e6] pt-4"><span className="text-xs font-bold text-[#687579]">{project.metrics[0].label}: <strong className="text-[#142126]">{project.metrics[0].value}</strong></span><button type="button" className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[6px] px-3 text-xs font-bold text-white" style={{ backgroundColor: project.accent }} onClick={onSelect}>Case study <ArrowRight size={15} /></button></div>
    </div>
  </article>;
}

function ProjectPage({ project, onBack, onOpenLab, onSelectProject }: { project: ProjectStory; onBack: () => void; onOpenLab: () => void; onSelectProject: (project: ProjectStory) => void }) {
  const [section, setSection] = useState<"overview" | "architecture" | "evidence">("overview");
  const [audience, setAudience] = useState<"recruiter" | "engineer">("recruiter");
  useEffect(() => { setSection("overview"); setAudience("recruiter"); }, [project.slug]);
  const roleFit = ROLE_FIT[project.name] ?? [projectGroup(project), project.family, "Decision support"];
  const openSection = (nextSection: "overview" | "architecture" | "evidence") => {
    setSection(nextSection);
    window.requestAnimationFrame(() => document.getElementById("project-detail")?.scrollIntoView({ behavior: "smooth" }));
  };
  const related = projectStories.filter((candidate) => candidate.name !== project.name && (projectGroup(candidate) === projectGroup(project) || candidate.visual === project.visual)).slice(0, 3);
  return <div className="min-h-screen bg-[#f4f7f6] text-[#142126]" style={{ "--project-accent": project.accent, "--project-soft": project.soft } as CSSProperties}>
    <SiteHeader onHome={onBack} onOpenLab={onOpenLab} light />
    <main>
      <section className="case-hero border-b-4 bg-[#0f1d24] text-white" style={{ borderColor: project.accent }}>
        <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-7 lg:py-10">
          <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-[6px] px-2 text-xs font-bold text-[#b9cac8] hover:bg-white/10" onClick={onBack}><ArrowLeft size={15} /> All projects</button>
          <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,.85fr)_minmax(480px,1.15fr)] lg:items-stretch">
            <div className="flex flex-col justify-center py-2">
              <p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>{projectGroup(project)} · {project.family}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3"><span className="inline-flex w-fit items-center border border-white/20 px-3 py-2 text-[10px] font-extrabold uppercase text-[#b9cac8]"><span className="mr-2 h-2 w-2" style={{ backgroundColor: project.accent }} />{THEME_LABELS[project.visual]}</span><div className="flex border border-white/20 p-1" role="group" aria-label="Choose case-study audience"><button type="button" aria-pressed={audience === "recruiter"} className={`inline-flex min-h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-[10px] font-extrabold uppercase ${audience === "recruiter" ? "bg-white text-[#142126]" : "text-[#aebfbd]"}`} onClick={() => setAudience("recruiter")}><UserRound size={13} /> Recruiter</button><button type="button" aria-pressed={audience === "engineer"} className={`inline-flex min-h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-[10px] font-extrabold uppercase ${audience === "engineer" ? "bg-white text-[#142126]" : "text-[#aebfbd]"}`} onClick={() => setAudience("engineer")}><Code2 size={13} /> Engineer</button></div></div>
              <h1 className="mt-3 break-words text-4xl font-black leading-[1.04] sm:text-5xl">{project.name}</h1>
              {audience === "recruiter" ? <><p className="mt-5 max-w-2xl text-base leading-7 text-[#b9cac8]">{project.problem}</p><div className="mt-5 border-l-4 bg-white/5 p-4" style={{ borderColor: project.accent }}><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>Why this project is different</span><p className="mt-1 text-sm font-bold leading-6 text-white">{projectDifferentiator(project)}</p></div><div className="mt-4 flex flex-wrap gap-2">{roleFit.map((role) => <span key={role} className="border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-[#c9d6d4]">{role}</span>)}</div></> : <><p className="mt-5 max-w-2xl text-base leading-7 text-[#b9cac8]">{project.approach}</p><div className="mt-5 border-l-4 bg-white/5 p-4" style={{ borderColor: project.accent }}><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>Engineering boundary</span><p className="mt-1 text-sm font-bold leading-6 text-white">{project.boundary}</p></div><div className="mt-4 flex flex-wrap gap-2">{project.stack.slice(0, 5).map((item) => <span key={item} className="border border-white/20 px-2.5 py-1.5 text-[10px] font-bold text-[#c9d6d4]">{item}</span>)}</div></>}
              <div className="mt-6 flex flex-wrap gap-2"><a className="inline-flex min-h-10 items-center gap-2 rounded-[6px] px-4 text-sm font-bold text-white" style={{ backgroundColor: project.accent }} href={project.repoUrl} target="_blank" rel="noreferrer"><Code2 size={16} /> Repository <ArrowUpRight size={15} /></a><button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-white/25 px-3 text-xs font-bold text-white hover:bg-white/10" onClick={() => openSection("architecture")}><Layers3 size={15} /> Architecture</button><button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-white/25 px-3 text-xs font-bold text-white hover:bg-white/10" onClick={() => openSection("evidence")}><Database size={15} /> Evidence</button>{project.name === "ai-quality-lab" && <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[#9baba8] bg-white px-4 text-sm font-bold text-[#142126]" onClick={onOpenLab}><FlaskConical size={16} /> Live demo</button>}</div>
            </div>
            <CaseArtifactDeck project={project} />
          </div>
        </div>
      </section>

      <section className="border-b border-[#d4dddc] bg-[#f7f9f8]">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 md:grid-cols-3">
          <ProjectBriefItem label="Project state" value={STATUS_COPY[project.status].label} detail={STATUS_COPY[project.status].detail} />
          <ProjectBriefItem label="Built for" value={project.decisionOwner} detail="The person or team this evidence supports" />
          <ProjectBriefItem label="Strongest proof" value={`${project.metrics[0].label}: ${project.metrics[0].value}`} detail={project.metrics[0].note} />
        </div>
      </section>

      <section className="border-b border-[#d4dddc] bg-white">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 md:grid-cols-3">{project.metrics.map((metric) => <div key={metric.label} className="border-b border-[#dfe6e5] px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-7"><span className="text-xs font-bold text-[#687579]">{metric.label}</span><strong className="mt-1 block text-3xl font-black tabular-nums">{metric.value}</strong><small className="mt-1 block text-xs text-[#687579]">{metric.note}</small></div>)}</div>
      </section>

      <section className="border-b border-[#d4dddc] bg-[#142126] text-white">
        <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-6 md:grid-cols-[auto_minmax(0,1fr)_260px] md:items-start md:px-7 lg:py-8">
          <span className="grid h-11 w-11 place-items-center rounded-[6px]" style={{ backgroundColor: project.accent }}><Scale size={20} /></span>
          <div><p className="text-[11px] font-extrabold uppercase text-[#9edfd5]">Decision supported</p><h2 className="mt-1 text-xl font-black sm:text-2xl">What this evidence allows us to decide</h2><p className="mt-3 max-w-5xl text-sm leading-6 text-[#d6e0df] sm:text-base sm:leading-7">{project.decision}</p></div>
          <div className="border-t border-white/20 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0"><span className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#9edfd5]"><UserRound size={14} /> Decision owner</span><strong className="mt-2 block text-sm leading-6">{project.decisionOwner}</strong></div>
        </div>
      </section>

      <section id="project-detail" className="mx-auto max-w-[1500px] scroll-mt-24 px-4 py-8 md:px-7 lg:py-12">
        <div className="mb-7 flex gap-1 border-b border-[#ccd7d5]" role="tablist" aria-label="Project detail sections">
          {(["overview", "architecture", "evidence"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={section === item} className={`min-h-11 min-w-0 flex-1 border-b-[3px] px-1 text-center text-[11px] font-extrabold uppercase sm:flex-none sm:px-4 sm:text-xs ${section === item ? "text-[#142126]" : "border-transparent text-[#687579]"}`} style={section === item ? { borderColor: project.accent } : undefined} onClick={() => setSection(item)}>{item}</button>)}
        </div>
        {section === "overview" && <StorySection project={project} />}
        {section === "architecture" && <ArchitectureSection project={project} />}
        {section === "evidence" && <EvidenceSection project={project} />}
      </section>

      <section className="border-t border-[#d4dddc] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-9 md:px-7"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Continue exploring</p><h2 className="mt-1 text-2xl font-black">Related projects</h2></div><button className="hidden min-h-9 items-center gap-2 text-xs font-bold sm:inline-flex" type="button" onClick={onBack}>See all <ArrowRight size={15} /></button></div><div className="grid gap-3 md:grid-cols-3">{related.map((item) => <button key={item.name} type="button" className="flex min-h-28 items-center justify-between gap-4 rounded-[6px] border border-[#d4dddc] p-4 text-left hover:border-[#8ba29e]" onClick={() => onSelectProject(item)}><span><span className="block text-[10px] font-extrabold uppercase" style={{ color: item.accent }}>{projectGroup(item)}</span><strong className="mt-2 block break-words text-sm">{item.name}</strong></span><ArrowRight className="shrink-0" size={18} /></button>)}</div></div>
      </section>
    </main>
  </div>;
}

const THEME_LABELS: Record<VisualKind, string> = {
  risk: "Risk operations console",
  fraud: "Investigation command",
  air: "Environmental sensor grid",
  ranking: "Recommendation studio",
  language: "Language intelligence desk",
  clusters: "Segmentation field",
  signals: "Wearable signal lab",
  regression: "Model diagnostics",
  space: "Mission control archive",
  agents: "Agent operations room",
  portfolio: "Risk factor terminal",
  learning: "Algorithm workbench",
};

const ARTIFACT_NAMES: Partial<Record<string, string>> = {
  "travel-marketplace-harm-risk": "final_test_metrics.json",
  "Credit-Risk-MLOps-AWS": "model_report.json",
  "Credit-Card-Anomaly-Detection": "full_data_report.json",
  "Beijing-AQI-Prediction": "full_dataset_results.csv",
  "Amazon-Recommendation-System": "baseline_random_split.json",
  "financial-doc-agent": "evaluation_results.json",
  "FinBERT-Financial-News-Sentiment": "run_manifest.json",
  "Clustering": "experiment_report.csv",
  "Portfolio-Risk-PCA-From-Scratch": "portfolio_risk_report.csv",
  "Human-Activity-Monitoring": "visibility_metrics.csv",
  "Linear-Regression": "experiment_report.csv",
  "Logistic-Regression": "experiment_report.json",
  "Naive-Bayes": "experiment_report.json",
  "multi-agent-dev-system": "RUN_MANIFEST.json",
  "Machine-Learning-From-Scratch": "tested implementations",
};

const QUALITY_LAB_SCREENSHOT = new URL("../artifacts/ai-quality-lab-v3.png", import.meta.url).href;
const PROJECT_IMAGES: Partial<Record<string, { src: string; alt: string; caption: string }>> = {
  "ai-quality-lab": { src: QUALITY_LAB_SCREENSHOT, alt: "AI Quality Lab model evaluation interface", caption: "Deployed evaluation workspace with production gates and model-quality controls." },
  "Space-Race-Visualisation": { src: "https://raw.githubusercontent.com/Ayush210895/Space-Race-Visualisation/main/outputs/figures/launches_by_year.svg", alt: "Space launch attempts by year", caption: "Repository artifact showing the historical launch timeline used in the case study." },
};

function CaseArtifactDeck({ project }: { project: ProjectStory }) {
  const [view, setView] = useState<"signal" | "artifact" | "decision">("signal");
  const [tourIndex, setTourIndex] = useState(-1);
  const views = ["signal", "artifact", "decision"] as const;
  useEffect(() => { setView("signal"); setTourIndex(-1); }, [project.slug]);
  useEffect(() => {
    if (tourIndex < 0) return;
    setView(views[tourIndex]);
    const timer = window.setTimeout(() => setTourIndex((index) => index === views.length - 1 ? -1 : index + 1), 6000);
    return () => window.clearTimeout(timer);
  }, [tourIndex]);
  const selectView = (nextView: (typeof views)[number]) => { setTourIndex(-1); setView(nextView); };
  const startTour = () => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setView("artifact"); return; }
    setTourIndex(0);
  };
  return <section className="case-workbench min-h-[720px] overflow-hidden bg-[#12272f] lg:min-h-[470px]">
    <div className="border-b border-white/15 px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="block text-[9px] font-extrabold uppercase" style={{ color: project.accent }}>Case workbench</span><strong className="mt-0.5 block text-xs text-white">{THEME_LABELS[project.visual]}</strong></div><button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-[4px] border border-white/20 px-3 text-[10px] font-extrabold uppercase text-white hover:bg-white/10" onClick={startTour}>{tourIndex >= 0 ? <RotateCcw size={14} /> : <Play size={14} />}{tourIndex >= 0 ? "Restart tour" : "18 sec guided tour"}</button></div>
      <div className="mt-3 grid grid-cols-3 gap-1" role="tablist" aria-label="Case views">
        {views.map((item, index) => <button key={item} type="button" role="tab" aria-selected={view === item} className={`min-h-9 rounded-[4px] border-t-2 px-2 text-[9px] font-extrabold uppercase sm:text-[10px] ${view === item ? "bg-white text-[#142126]" : "border-white/15 text-[#aebfbd] hover:bg-white/10"}`} style={view === item ? { borderColor: project.accent } : undefined} onClick={() => selectView(item)}><span aria-hidden="true" className="mr-1 font-mono">0{index + 1}</span>{item}</button>)}
      </div>
    </div>
    <div className="h-[610px] lg:h-[370px]">
      {view === "signal" && <VisualStage project={project} />}
      {view === "artifact" && <ArtifactView project={project} />}
      {view === "decision" && <DecisionView project={project} />}
    </div>
  </section>;
}

function ArtifactView({ project }: { project: ProjectStory }) {
  const image = PROJECT_IMAGES[project.name];
  if (image) return <div className="grid h-full grid-rows-[1fr_auto] bg-[#09161b]">
    <div className="relative min-h-0 overflow-hidden p-4"><img className="h-full w-full object-contain" src={image.src} alt={image.alt} /><span className="absolute left-5 top-5 inline-flex items-center gap-2 bg-[#0f1d24]/95 px-3 py-2 text-[9px] font-extrabold uppercase text-white"><ImageIcon size={13} /> Repository artifact</span></div>
    <p className="border-t border-white/15 px-5 py-3 text-xs leading-5 text-[#b9cac8]">{image.caption}</p>
  </div>;

  const artifactName = ARTIFACT_NAMES[project.name] ?? "evidence_snapshot";
  return <div className="artifact-terminal grid h-full grid-rows-[auto_1fr_auto] bg-[#09161b] text-white">
    <div className="flex items-center justify-between border-b border-white/15 px-5 py-4"><span className="inline-flex items-center gap-2 text-xs font-bold"><FileJson2 size={16} style={{ color: project.accent }} />{artifactName}</span><span className="font-mono text-[9px] uppercase text-[#8fa5a2]">source {project.sourceCommit}</span></div>
    <div className="overflow-hidden px-5 py-4 font-mono text-xs">
      <div className="mb-4 text-[#7f9693]">Evidence record</div>
      <div className="space-y-3">{project.metrics.map((metric, index) => <div key={metric.label} className="grid grid-cols-[28px_minmax(0,1fr)_auto] gap-3 border-b border-white/10 pb-3"><span className="text-[#607773]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 break-words text-[#b9cac8]">{metric.label.toLowerCase().replaceAll(" ", "_")}</span><strong style={{ color: index === 0 ? project.accent : "white" }}>{metric.value}</strong></div>)}</div>
      <div className="mt-5 border-l-2 pl-3 text-[10px] leading-5 text-[#8fa5a2]" style={{ borderColor: project.accent }}>{project.evidence}</div>
    </div>
    <div className="grid grid-cols-3 border-t border-white/15 text-center text-[9px] font-extrabold uppercase text-[#8fa5a2]"><span className="border-r border-white/10 px-2 py-3">Committed</span><span className="border-r border-white/10 px-2 py-3">Traceable</span><span className="px-2 py-3">Reviewable</span></div>
  </div>;
}

function DecisionView({ project }: { project: ProjectStory }) {
  const tradeoffs = TRADEOFFS[project.name] ?? [project.boundary];
  return <div className="grid h-full overflow-auto bg-[#0f1d24] p-5 text-white sm:p-7">
    <div><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>Decision room</span><h2 className="mt-2 max-w-2xl text-2xl font-black leading-tight">{businessQuestion(project)}</h2><p className="mt-4 text-sm leading-6 text-[#b9cac8]">{project.decision}</p></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">{tradeoffs.map((item, index) => <div key={item} className="border-t-2 bg-white/5 p-3" style={{ borderColor: index === 0 ? project.accent : "rgba(255,255,255,.22)" }}><span className="font-mono text-[9px]" style={{ color: project.accent }}>0{index + 1}</span><p className="mt-2 text-xs leading-5 text-[#d6e0df]">{item}</p></div>)}</div>
    <div className="mt-5 border-l-4 bg-white/5 p-4" style={{ borderColor: project.accent }}><span className="text-[9px] font-extrabold uppercase text-[#8fa5a2]">Next validation</span><p className="mt-2 text-xs leading-5">{project.nextStep}</p></div>
  </div>;
}

function ProjectBriefItem({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="border-b border-[#dfe6e5] px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:px-7"><span className="text-[10px] font-extrabold uppercase text-[#687579]">{label}</span><strong className="mt-1 block text-sm leading-6 text-[#142126]">{value}</strong><small className="mt-1 block text-xs leading-5 text-[#687579]">{detail}</small></div>;
}

function StorySection({ project }: { project: ProjectStory }) {
  const tradeoffs = TRADEOFFS[project.name] ?? [project.boundary];
  return <div className="space-y-6">
    <section className="grid overflow-hidden rounded-[6px] border border-[#d4dddc] bg-white lg:grid-cols-3">
      <QuickReadStep number="01" label="Challenge" body={project.problem} accent={project.accent} />
      <QuickReadStep number="02" label="System" body={project.approach} accent={project.accent} />
      <QuickReadStep number="03" label="Evidence" body={project.outcome} accent={project.accent} />
    </section>
    <div className="grid gap-5 lg:grid-cols-[1.08fr_.92fr]">
      <section className="rounded-[6px] bg-[#142126] p-6 text-white">
        <p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Design decisions</p>
        <h2 className="mt-1 text-2xl font-black">What had to be balanced</h2>
        <div className="mt-6 space-y-3">{tradeoffs.map((tradeoff, index) => <div key={tradeoff} className="grid grid-cols-[32px_1fr] gap-3 border-t border-white/15 pt-3"><span className="font-mono text-xs font-bold" style={{ color: project.accent }}>0{index + 1}</span><p className="text-sm leading-6 text-[#d6e0df]">{tradeoff}</p></div>)}</div>
      </section>
      <div className="grid gap-5">
        <ContentBlock icon={<FlaskConical size={18} />} eyebrow="Failure boundary" title="Where this can fail" body={project.boundary} accent={project.accent} />
        <ContentBlock icon={<ArrowRight size={18} />} eyebrow="Next validation" title="What happens next" body={project.nextStep} accent={project.accent} />
      </div>
    </div>
  </div>;
}

function QuickReadStep({ number, label, body, accent }: { number: string; label: string; body: string; accent: string }) {
  return <div className="border-b border-[#dfe6e5] p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"><div className="flex items-center gap-3"><span className="font-mono text-xs font-black" style={{ color: accent }}>{number}</span><span className="text-[11px] font-extrabold uppercase text-[#536166]">{label}</span></div><p className="mt-4 text-sm leading-7 text-[#425156]">{body}</p></div>;
}

function ArchitectureSection({ project }: { project: ProjectStory }) {
  const stageLabels = ["Input", "Preparation", "Model or engine", "Policy", "Decision"];
  const stageIcons = [Database, Layers3, Cpu, Scale, CheckCircle2];
  const [activeStage, setActiveStage] = useState(-1);
  const [running, setRunning] = useState(false);
  useEffect(() => { setActiveStage(-1); setRunning(false); }, [project.slug]);
  useEffect(() => {
    if (!running) return;
    if (activeStage >= project.pipeline.length - 1) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setActiveStage((value) => value + 1), 850);
    return () => window.clearTimeout(timer);
  }, [activeStage, project.pipeline.length, running]);
  const selectedIndex = activeStage < 0 ? 0 : activeStage;
  const selectedStep = project.pipeline[selectedIndex];
  const stageNarratives = [
    `The system starts with ${selectedStep.toLowerCase()}. Input quality and scope define every downstream claim.`,
    `${selectedStep} turns raw evidence into a stable representation the model can use and reviewers can inspect.`,
    `${selectedStep} is where the core intelligence produces a score, prediction, retrieval result, or structured analysis.`,
    `${selectedStep} converts model output into an operating rule, constraint, or ranked queue instead of stopping at a metric.`,
    `${selectedStep} is the accountable end state: a person or system receives evidence it can act on and monitor.`,
  ];
  return <div className="space-y-8">
    <section className="overflow-hidden rounded-[6px] bg-[#142126] text-white">
      <div className="flex flex-col gap-4 border-b border-white/15 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-7"><div><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Interactive system trace</p><h2 className="mt-1 text-2xl font-black">From raw input to an accountable decision</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#b9c8c7]">Run the flow or select a stage to inspect what it contributes to the decision.</p></div><button type="button" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[6px] bg-white px-4 text-xs font-extrabold text-[#142126]" onClick={() => { setActiveStage(0); setRunning(true); }}>{running ? <RotateCcw size={15} /> : <Play size={15} />}{running ? "Restart flow" : "Run system flow"}</button></div>
      <div className="scrollbar-thin overflow-x-auto px-5 py-7 md:px-7"><div className="flex flex-col items-stretch gap-2 md:min-w-[920px] md:flex-row md:gap-0">{project.pipeline.map((step, index) => {
        const Icon = stageIcons[index] ?? Cpu;
        const active = index === activeStage;
        const complete = activeStage > index;
        return <div key={step} className="contents"><button type="button" aria-label={`Inspect ${stageLabels[index]} stage`} aria-pressed={active} className={`architecture-stage flex w-full shrink-0 flex-col rounded-[6px] border p-4 text-left transition-colors md:w-[160px] ${active ? "border-white bg-white text-[#142126]" : complete ? "border-white/40 bg-white/15" : "border-white/20 bg-white/5"}`} onClick={() => { setActiveStage(index); setRunning(false); }}><span className="grid h-9 w-9 place-items-center rounded-[6px] text-white" style={{ backgroundColor: project.accent }}><Icon size={17} /></span><span className={`mt-5 text-[10px] font-extrabold uppercase ${active ? "text-[#536166]" : "text-[#9edfd5]"}`}>0{index + 1} · {stageLabels[index]}</span><strong className="mt-2 text-sm leading-5">{step}</strong></button>{index < project.pipeline.length - 1 && <div className={`grid h-[30px] w-full shrink-0 rotate-90 place-items-center md:h-auto md:w-[34px] md:rotate-0 ${complete ? "text-white" : "text-[#79908e]"}`}><ArrowRight size={18} /></div>}</div>;
      })}</div></div>
      <div className="grid gap-3 border-t border-white/15 bg-black/10 px-5 py-5 md:grid-cols-[170px_1fr] md:px-7"><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>Stage {selectedIndex + 1} · {stageLabels[selectedIndex]}</span><p className="text-sm leading-6 text-[#d6e0df]">{stageNarratives[selectedIndex]}</p></div>
    </section>
    <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
      <section><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Technology layer</p><h2 className="mt-1 text-2xl font-black">Stack and methods</h2><div className="mt-5 flex flex-wrap gap-2">{project.stack.map((item) => <span key={item} className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[#d4dddc] bg-white px-3 text-xs font-bold"><Code2 size={14} style={{ color: project.accent }} />{item}</span>)}</div></section>
      <section className="border-l-4 bg-white p-5" style={{ borderColor: project.accent }}><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Next architecture proof</p><h2 className="mt-1 text-xl font-black">Close the highest-value gap</h2><p className="mt-3 text-sm leading-6 text-[#536166]">{project.nextStep}</p></section>
    </div>
  </div>;
}

function EvidenceSection({ project }: { project: ProjectStory }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_.72fr]"><section className="overflow-hidden rounded-[6px] border border-[#d4dddc] bg-white"><div className="border-b border-[#dfe6e5] p-5"><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Verified snapshot</p><h2 className="mt-1 text-2xl font-black">Committed evidence</h2></div>{project.metrics.map((metric) => <div key={metric.label} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#e1e7e6] px-5 py-4 last:border-b-0"><span><strong className="block text-sm">{metric.label}</strong><small className="mt-1 block text-xs text-[#687579]">{metric.note}</small></span><strong className="text-lg tabular-nums">{metric.value}</strong></div>)}</section><section className="rounded-[6px] p-6" style={{ backgroundColor: project.soft }}><Database size={22} style={{ color: project.accent }} /><p className="mt-5 text-xs font-extrabold uppercase" style={{ color: project.accent }}>Provenance</p><h2 className="mt-1 text-xl font-black">Traceable to source</h2><p className="mt-3 text-sm leading-6 text-[#536166]">Evidence state: {project.evidence}. This page is pinned to repository snapshot <span className="font-mono font-bold">{project.sourceCommit}</span>.</p><a className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-[6px] bg-white px-4 text-sm font-bold" href={project.repoUrl} target="_blank" rel="noreferrer">Inspect repository <ExternalLink size={15} /></a></section></div>;
}

function ContentBlock({ icon, eyebrow, title, body, accent }: { icon: ReactNode; eyebrow: string; title: string; body: string; accent: string }) {
  return <section className="h-full rounded-[6px] border border-[#d4dddc] bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-[6px] text-white" style={{ backgroundColor: accent }}>{icon}</span><p className="mt-5 text-xs font-extrabold uppercase" style={{ color: accent }}>{eyebrow}</p><h2 className="mt-1 text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-7 text-[#536166]">{body}</p></section>;
}

const tooltipStyle = { border: "1px solid #d4dddc", borderRadius: 6, fontSize: 11, boxShadow: "0 8px 22px rgba(20,33,38,.12)" };

function VisualStage({ project, compact = false }: { project: ProjectStory; compact?: boolean }) {
  const { visual: kind, accent, soft } = project;
  const question = businessQuestion(project);
  const common = <CartesianGrid stroke={accent} strokeOpacity={0.16} vertical={false} />;
  const label = visualLabel(kind);
  const chart = kind === "fraud" || kind === "clusters" ? <ScatterVisual kind={kind} accent={accent} common={common} />
    : kind === "ranking" || kind === "language" || kind === "portfolio" || kind === "space" ? <BarVisual kind={kind} accent={accent} common={common} />
      : kind === "agents" || kind === "learning" ? <FlowVisual kind={kind} accent={accent} />
        : kind === "air" ? <AreaVisual accent={accent} common={common} />
          : <LineVisual kind={kind} accent={accent} common={common} />;
  return <div className="flex h-full w-full flex-col overflow-hidden" style={{ backgroundColor: soft }}>
    <div className="flex items-center justify-between gap-3 px-4 pt-4"><span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#536166]">{label}</span><span className="text-[9px] font-extrabold uppercase" style={{ color: accent }}>Technical signal</span></div>
    <div className={compact ? "px-3" : "grid flex-1 grid-rows-[220px_1fr] lg:grid-cols-[minmax(0,1fr)_230px] lg:grid-rows-1"}>
      <div className={`min-w-0 px-1 ${compact ? "h-[118px]" : "h-full"}`}>{chart}</div>
      {!compact && <aside className="business-visual-panel flex flex-col justify-between border-t border-white/30 p-5 text-white lg:border-l lg:border-t-0">
        <div><p className="text-[10px] font-extrabold uppercase text-[#ffd475]">Business question</p><p className="mt-2 text-lg font-black leading-6">{question}</p></div>
        <div className="mt-5 border-t border-white/20 pt-4"><span className="text-[10px] font-extrabold uppercase text-[#9edfd5]">Decision owner</span><strong className="mt-1 block text-sm leading-5">{project.decisionOwner}</strong></div>
        <div className="mt-4 border-t border-white/20 pt-4"><span className="text-[10px] font-extrabold uppercase text-[#9edfd5]">Proof point</span><strong className="mt-1 block text-2xl tabular-nums">{project.metrics[0].value}</strong><small className="mt-1 block text-xs text-[#d6e0df]">{project.metrics[0].label}</small></div>
      </aside>}
    </div>
    {compact && <div className="grid min-h-[46px] grid-cols-[1fr_auto] items-center gap-3 border-t border-white/60 bg-white/75 px-4 py-2"><span><span className="block text-[8px] font-extrabold uppercase" style={{ color: accent }}>Business lens</span><strong className="mt-0.5 line-clamp-1 block text-[10px] text-[#26383d]">{question}</strong></span><span className="text-right"><strong className="block text-sm tabular-nums text-[#142126]">{project.metrics[0].value}</strong><small className="block text-[8px] text-[#687579]">{project.metrics[0].label}</small></span></div>}
  </div>;
}

function visualLabel(kind: VisualKind) {
  const labels: Record<VisualKind, string> = { risk: "Decision surface", fraud: "Rare-event field", air: "AQI timeline", ranking: "Model comparison", language: "Signal profile", clusters: "Cluster geometry", signals: "Activity signal", regression: "Fit behavior", space: "Launch history", agents: "Agent workflow", portfolio: "Risk contribution", learning: "Learning path" };
  return labels[kind];
}

function LineVisual({ kind, accent, common }: { kind: VisualKind; accent: string; common: ReactNode }) {
  const data: Array<{ x: string; a: number; b?: number }> = kind === "signals"
    ? Array.from({ length: 24 }, (_, i) => ({ x: String(i + 1), a: Math.sin(i * 0.72) * 32 + Math.cos(i * 0.21) * 10 + 50 }))
    : kind === "risk"
      ? [{ x: "1%", a: 18, b: 12 }, { x: "2%", a: 23, b: 19 }, { x: "3%", a: 28, b: 24 }, { x: "4%", a: 37, b: 29 }, { x: "5%", a: 46, b: 34 }, { x: "6%", a: 58, b: 43 }]
      : [{ x: "P1", a: 32, b: 30 }, { x: "P2", a: 43, b: 46 }, { x: "P3", a: 38, b: 41 }, { x: "P4", a: 58, b: 54 }, { x: "P5", a: 65, b: 68 }, { x: "P6", a: 73, b: 71 }];
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>{common}<XAxis dataKey="x" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={32} /><Tooltip contentStyle={tooltipStyle} /><ReferenceLine y={kind === "signals" ? 50 : 40} stroke="#a85f00" strokeDasharray="4 4" /><Line type="monotone" dataKey="a" name="Primary" stroke={accent} strokeWidth={3} dot={false} /><Line type="monotone" dataKey="b" name="Baseline" stroke="#2878a5" strokeWidth={2} strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer>;
}

function AreaVisual({ accent, common }: { accent: string; common: ReactNode }) {
  const data = [{ x: "Mon", a: 42 }, { x: "Tue", a: 63 }, { x: "Wed", a: 118 }, { x: "Thu", a: 86 }, { x: "Fri", a: 154 }, { x: "Sat", a: 101 }, { x: "Sun", a: 72 }];
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>{common}<XAxis dataKey="x" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={34} /><Tooltip contentStyle={tooltipStyle} /><ReferenceLine y={100} stroke="#a85f00" strokeDasharray="4 4" /><Area type="monotone" dataKey="a" name="AQI" stroke={accent} fill={accent} fillOpacity={0.34} strokeWidth={3} /></AreaChart></ResponsiveContainer>;
}

function BarVisual({ kind, accent, common }: { kind: VisualKind; accent: string; common: ReactNode }) {
  const data = kind === "ranking" ? [{ name: "Pop", value: .678 }, { name: "User", value: .384 }, { name: "Item", value: .315 }, { name: "SVD", value: .390 }]
    : kind === "space" ? [{ name: "60s", value: 420 }, { name: "70s", value: 1038 }, { name: "80s", value: 964 }, { name: "90s", value: 890 }, { name: "00s", value: 632 }, { name: "10s", value: 380 }]
      : kind === "portfolio" ? [{ name: "AAPL", value: 60 }, { name: "MSFT", value: 47 }, { name: "JPM", value: 48 }, { name: "TLT", value: -44 }, { name: "GLD", value: -10 }]
        : [{ name: "Positive", value: 84 }, { name: "Neutral", value: 57 }, { name: "Negative", value: 29 }];
  const colors = [accent, "#2878a5", "#e29a24", "#398064", "#7656a5", "#d75b4d"];
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>{common}<XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={34} tickFormatter={(value: number) => kind === "ranking" ? value.toFixed(1) : String(Math.round(value))} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Bar></BarChart></ResponsiveContainer>;
}

function ScatterVisual({ kind, accent, common }: { kind: VisualKind; accent: string; common: ReactNode }) {
  const normal = Array.from({ length: 26 }, (_, i) => ({ x: (i * 17) % 83 + (kind === "clusters" && i > 12 ? 48 : 5), y: (i * 29) % 70 + (kind === "clusters" && i > 12 ? 18 : 4), z: 55 }));
  const flagged = kind === "fraud" ? [{ x: 18, y: 88, z: 100 }, { x: 77, y: 82, z: 100 }, { x: 91, y: 31, z: 100 }] : Array.from({ length: 12 }, (_, i) => ({ x: 65 + (i * 13) % 32, y: 45 + (i * 19) % 45, z: 65 }));
  return <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>{common}<XAxis type="number" dataKey="x" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis type="number" dataKey="y" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={32} /><ZAxis type="number" dataKey="z" range={[35, 100]} /><Tooltip contentStyle={tooltipStyle} /><Scatter name="Population" data={normal} fill={kind === "clusters" ? "#2878a5" : "#718487"} fillOpacity={0.68} /><Scatter name={kind === "fraud" ? "Priority review" : "Segment B"} data={flagged} fill={kind === "fraud" ? "#d84b37" : "#e29a24"} /></ScatterChart></ResponsiveContainer>;
}

function FlowVisual({ kind, accent }: { kind: VisualKind; accent: string }) {
  const labels = kind === "agents" ? ["PM", "Architect", "Coder", "Tester", "Review", "DevOps", "Docs"] : ["Concept", "Math", "Code", "Test", "Explain"];
  return <div className="flex h-full items-center overflow-x-auto px-2"><div className="flex min-w-max items-center gap-2">{labels.map((label, index) => <div key={label} className="flex items-center gap-2"><div className="grid h-20 w-20 place-items-center rounded-[6px] border-2 bg-white p-2 text-center text-xs font-black" style={{ borderColor: index % 2 ? "#93a4a6" : accent, color: index % 2 ? "#536166" : accent }}><span><Boxes className="mx-auto mb-1" size={17} />{label}</span></div>{index < labels.length - 1 && <ArrowRight size={16} color="#758488" />}</div>)}</div></div>;
}
