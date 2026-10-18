import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileJson2,
  FlaskConical,
  ImageIcon,
  Layers3,
  LayoutGrid,
  Mail,
  MapPin,
  Play,
  RotateCcw,
  Search,
  Scale,
  Sparkles,
  UserRound,
  X,
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
  view: "home" | "projects";
  onHome: () => void;
  onProjects: () => void;
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

const FLAGSHIP_COVERS: Record<(typeof FLAGSHIP_NAMES)[number], string> = {
  "travel-marketplace-harm-risk": "assets/travel-harm-risk-cover.jpg",
  "Credit-Risk-MLOps-AWS": "assets/credit-mlops-cover.jpg",
  "financial-doc-agent": "assets/financial-doc-agent-cover.jpg",
};

const PROJECT_COVERS: Record<string, string> = {
  ...FLAGSHIP_COVERS,
  "Credit-Card-Anomaly-Detection": "assets/fraud-anomaly-cover.jpg",
  "Beijing-AQI-Prediction": "assets/aqi-forecast-cover.jpg",
  "Amazon-Recommendation-System": "assets/recommendation-cover.jpg",
  "FinBERT-Financial-News-Sentiment": "assets/finbert-sentiment-cover.jpg",
  "Portfolio-Risk-PCA-From-Scratch": "assets/portfolio-risk-cover.jpg",
  "Human-Activity-Monitoring": "assets/activity-signals-cover.jpg",
  "multi-agent-dev-system": "assets/agent-orchestration-cover.jpg",
  "Space-Race-Visualisation": "assets/space-analytics-cover.jpg",
  "ai-quality-lab": "assets/quality-lab-cover.jpg",
};

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

function projectDifferentiator(project: ProjectStory) {
  if (FLAGSHIP_NAMES.includes(project.name as (typeof FLAGSHIP_NAMES)[number])) {
    return FLAGSHIP_META[project.name as (typeof FLAGSHIP_NAMES)[number]].differentiator;
  }
  return "The case connects technical evidence to an operating decision, while keeping its limitations and next validation step visible.";
}

function businessQuestion(project: ProjectStory) {
  return PROJECT_BUSINESS_QUESTIONS[project.name] ?? BUSINESS_QUESTIONS[project.visual];
}

const EXPERIENCE = [
  {
    years: "2024 - Present",
    company: "DISH / EchoStar",
    role: "Senior Data Scientist",
    projects: [
      { name: "Customer Value and Upgrade Decisioning", detail: "Built churn- and survival-driven forward LTV with plan simulation, eligibility and tiering rules, production outputs, and a segment-level holdout design; device propensity was supplied by another team." },
      { name: "Promotion Effectiveness Agent", detail: "Built a Snowflake Cortex AI workflow that accepts natural-language inputs, runs statistical decomposition in Python, and returns structured pre-, promo-, and post-period lift insights." },
      { name: "Causal Demand Planning", detail: "Developed SARIMAX and XGBoost forecasting across Indirect, Web, and Walmart channels, exceeding a 75% N-4 forecast-accuracy target." },
      { name: "Governed Conversational Analytics", detail: "Built a Snowflake Intelligence layer over about 50 curated business tables from roughly 200 sources, with governed metrics, verified queries, follow-up analysis, charts, logs, and user feedback." },
      { name: "Enterprise Knowledge Assistant", detail: "Built version-aware retrieval, evidence-backed answers, citation checks, role-aware access, and abstention when approved source material is insufficient." },
      { name: "Executive Decision Platform", detail: "Built Tableau and Snowflake analytics that accelerated decision-making by 30% and reduced manual reporting effort by 40%." },
    ],
  },
  {
    years: "2024",
    company: "The Partnership Center",
    role: "Data Scientist",
    projects: [
      { name: "Resource Utilization Forecasting", detail: "Deployed ML regression models that reduced forecast error by 20% and improved operational efficiency by 40%." },
      { name: "Portfolio Data Foundation", detail: "Migrated enterprise data to Snowflake and automated repeatable ETL workflows for portfolio-performance monitoring." },
      { name: "Investment Performance Analytics", detail: "Built Power BI dashboards with advanced DAX calculations for investment-portfolio trends and resource-planning decisions." },
      { name: "Operational Adoption", detail: "Partnered with operations teams to translate model outputs into recurring resource-planning workflows." },
    ],
  },
  {
    years: "2023 - 2024",
    company: "UBS",
    role: "Data Scientist - Quant Research and NLP/AI",
    projects: [
      { name: "Bond Market Forecasting", detail: "Built XGBoost pipelines on Bloomberg time-series data, reaching a 62.4% weekly directional hit rate." },
      { name: "Financial News Sentiment", detail: "Developed a FinBERT engine with 87% accuracy for credit-risk, research, and investment-decision workflows." },
      { name: "Equity Research Pipelines", detail: "Designed Python and SQL predictive pipelines to model equity performance and support quantitative research." },
      { name: "Mutual Fund Forecasting", detail: "Improved global forecasting accuracy by 33% through feature engineering and Bloomberg-data validation." },
      { name: "Research Data Automation", detail: "Automated Bloomberg and YODA reporting pipelines across research and risk reporting." },
    ],
  },
  {
    years: "2018 - 2021",
    company: "Accenture",
    role: "Machine Learning Associate - Banking Analytics",
    projects: [
      { name: "Credit Limit Decisioning", detail: "Built ML credit- and debit-limit optimization for OP Financial, driving 23% revenue growth and a 40% efficiency improvement." },
      { name: "Churn and Customer Segmentation", detail: "Developed XGBoost models for Allianz Bank with Tableau and Power BI decision dashboards." },
      { name: "Portfolio Experimentation", detail: "Ran A/B tests and statistical inference across credit and debit portfolios to improve segmentation and campaign response." },
      { name: "Cloud Data Modernization", detail: "Migrated DB2 and Teradata workloads to AWS and standardized validation practices." },
    ],
  },
] as const;

const GITHUB_SHOWCASE = [
  { id: "01", name: "AI Quality Lab", tag: "Evaluation infrastructure", description: "Six interactive workspaces connect model metrics, operating constraints, launch gates, monitoring, and downloadable decision records across ML and LLM systems.", proof: "33 automated tests", repoUrl: "https://github.com/Ayush210895/ai-quality-lab", accent: "#5fe0bd" },
  { id: "02", name: "Travel Marketplace Harm Risk", tag: "Applied ML decision science", description: "A leakage-aware XGBoost system optimizes a fixed review queue for expected loss and validates the locked policy on an untouched future period.", proof: "37.2% harmful value captured at 5% capacity", repoUrl: "https://github.com/Ayush210895/travel-marketplace-harm-risk", accent: "#ff765c" },
  { id: "03", name: "Financial Document Agent", tag: "Grounded GenAI and Text2SQL", description: "Reranked retrieval, source citations, read-only Text2SQL, tool routing, evaluation cases, FastAPI, Docker, and Streamlit form one locally runnable analyst workflow.", proof: "Narrative and numeric evaluation harness", repoUrl: "https://github.com/Ayush210895/financial-doc-agent", accent: "#c8a2ff" },
  { id: "04", name: "Credit Risk MLOps on AWS", tag: "Production ML lifecycle", description: "Tracked training, metric-gated registry promotion, API serving, containers, CI, and drift reporting make the approval path inspectable from model build to operation.", proof: "ROC-AUC 0.807 and recall 80.0%", repoUrl: "https://github.com/Ayush210895/Credit-Risk-MLOps-AWS", accent: "#72b7ff" },
  { id: "05", name: "Amazon Recommendation System", tag: "Ranking and personalization", description: "Collaborative filtering, temporal evaluation, and readable recommendation outputs test whether offline ranking quality survives a realistic holdout.", proof: "Temporal holdout evaluation", repoUrl: "https://github.com/Ayush210895/Amazon-Recommendation-System", accent: "#ffc159" },
] as const;

const STACK_GROUPS = [
  { title: "Programming and data", items: ["Python", "SQL", "R", "PySpark", "DAX", "Power Query"] },
  { title: "AI and ML", items: ["XGBoost", "SARIMAX", "PyTorch", "FinBERT", "Causal inference", "Forecasting", "Recommenders"] },
  { title: "GenAI and MLOps", items: ["Snowflake Cortex", "Text2SQL", "Tool calling", "RAG", "LLM evaluation", "MLflow", "Docker", "Airflow"] },
  { title: "BI and engineering", items: ["Tableau", "Power BI", "Alteryx", "ETL / ELT", "Bloomberg", "Git / CI/CD"] },
] as const;

const CREDENTIALS = {
  education: [
    "Northeastern University - M.S. Data Analytics Engineering, 2021-2023",
    "NMIMS University - B.Tech Computer Engineering, 2014-2018",
  ],
  certifications: [
    "Meta Data Analyst",
    "Google Advanced Data Analytics",
    "Data Visualization in Tableau and Power BI",
    "Machine Learning Coursework Recognition",
  ],
  recognition: [
    "Ace Award",
    "Top SQL 50",
    "Beijing AQI Project Recognition",
    "Accenture Q2 FY20 Team Award",
  ],
} as const;

const CAPABILITIES = [
  { title: "Applied ML", detail: "Classification, forecasting, optimization, causal inference, experimentation, and decision thresholds." },
  { title: "GenAI systems", detail: "RAG, reranking, Text2SQL, tool calling, grounded evaluation, and human-review boundaries." },
  { title: "Production practice", detail: "Snowflake, Databricks, MLflow, FastAPI, Docker, CI/CD, monitoring, and stakeholder adoption." },
] as const;

export default function PortfolioSite({ project, view, onHome, onProjects, onOpenLab, onSelectProject }: PortfolioSiteProps) {
  return project
    ? <ProjectPage project={project} onHome={onHome} onBack={onProjects} onOpenLab={onOpenLab} onSelectProject={onSelectProject} />
    : view === "projects"
      ? <ProjectExplorer onHome={onHome} onProjects={onProjects} onOpenLab={onOpenLab} onSelectProject={onSelectProject} />
      : <UnifiedHome onHome={onHome} onProjects={onProjects} onOpenLab={onOpenLab} onSelectProject={onSelectProject} />;
}

function SiteHeader({ onHome, onProjects, onOpenLab, subtitle = "AI/ML Project Atlas", active = "projects" }: { onHome: () => void; onProjects: () => void; onOpenLab: () => void; light?: boolean; subtitle?: string; active?: "home" | "projects" }) {
  const assetBase = import.meta.env.BASE_URL;
  return <header className="sticky top-0 z-30 border-b border-white/15 bg-[#07101d]/95 text-white backdrop-blur-xl">
    <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 md:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className="creator-home-link flex min-w-0 items-center gap-2.5 text-left" onClick={onHome} title="Open Ayush Soni portfolio home">
          <img className="h-9 w-9 shrink-0 rounded-full border-2 border-[#2d92ff] object-cover object-top" src={`${assetBase}assets/ayush-soni-headshot.jpg`} alt="" />
          <span className="min-w-0"><strong className="block truncate text-sm">Ayush Soni</strong><span className="block truncate text-[10px] font-bold uppercase text-[#64e8ff]">Portfolio home</span></span>
        </button>
        <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden="true" />
        <span className="hidden font-mono text-[10px] font-bold uppercase text-[#8296b5] sm:block">{subtitle}</span>
      </div>
      <nav className="flex items-center gap-2" aria-label="Portfolio navigation">
        <button className={`inline-flex min-h-9 items-center gap-2 rounded-[6px] px-2.5 text-xs font-bold ${active === "projects" ? "bg-white text-[#07101d]" : "hover:bg-white/10"}`} type="button" title="Browse all projects" onClick={onProjects}><LayoutGrid size={15} /><span className="hidden sm:inline">Projects</span></button>
        <a className="hidden min-h-9 items-center gap-2 rounded-[6px] px-3 text-xs font-bold hover:bg-white/10 sm:inline-flex" href="https://github.com/Ayush210895" target="_blank" rel="noreferrer"><Code2 size={15} /> GitHub</a>
        <button className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-[6px] border border-[#435777] bg-[#0b1425]/80 px-3 text-xs font-bold text-white hover:border-[#64e8ff] hover:bg-[#12213a]" type="button" onClick={onOpenLab}><FlaskConical size={15} /> Quality Lab</button>
      </nav>
    </div>
    <ScrollProgress />
  </header>;
}

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? Math.min(1, window.scrollY / available) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return <span className="page-progress" aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />;
}

export function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.navigator.userAgent.includes("jsdom")) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    type Particle = { x: number; y: number; vx: number; vy: number; radius: number; phase: number };
    let particles: Particle[] = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(44, Math.min(112, Math.floor(width * height * .00011)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: (index * 83 + Math.random() * width) % width,
        y: (index * 47 + Math.random() * height) % height,
        vx: (Math.random() - .5) * .38,
        vy: (Math.random() - .5) * .38,
        radius: Math.random() * 1.45 + .85,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const move = (event: MouseEvent) => { pointerX = event.clientX; pointerY = event.clientY; };
    const leave = () => { pointerX = -9999; pointerY = -9999; };

    const draw = (time = 0) => {
      context.clearRect(0, 0, width, height);
      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (!reduced) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.phase += .012;
          if (particle.x < 0 || particle.x > width) particle.vx *= -1;
          if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        }
        for (let next = index + 1; next < particles.length; next += 1) {
          const other = particles[next];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < 165) {
            context.strokeStyle = `rgba(77, 142, 255, ${(1 - distance / 165) * .42})`;
            context.lineWidth = .8;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
            if (!reduced && (index + next) % 19 === 0) {
              const progress = (time / 1900 + index * .073) % 1;
              const packetX = particle.x + (other.x - particle.x) * progress;
              const packetY = particle.y + (other.y - particle.y) * progress;
              context.save();
              context.shadowColor = "#64e8ff";
              context.shadowBlur = 12;
              context.fillStyle = "rgba(129, 239, 255, .95)";
              context.beginPath();
              context.arc(packetX, packetY, 1.8, 0, Math.PI * 2);
              context.fill();
              context.restore();
            }
          }
        }
        const pointerDistance = Math.hypot(particle.x - pointerX, particle.y - pointerY);
        if (pointerDistance < 180) {
          context.strokeStyle = `rgba(0, 224, 255, ${(1 - pointerDistance / 180) * .52})`;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(pointerX, pointerY);
          context.stroke();
        }
        const pulse = .48 + (Math.sin(particle.phase) + 1) * .18;
        context.save();
        context.shadowColor = index % 6 === 0 ? "#2ee5c2" : "#4d8eff";
        context.shadowBlur = index % 6 === 0 ? 16 : 9;
        context.fillStyle = index % 6 === 0 ? `rgba(74, 242, 207, ${pulse + .12})` : `rgba(147, 190, 255, ${pulse})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      if (!reduced) frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} className="constellation-field" aria-hidden="true" />;
}

function UnifiedHome({ onHome, onProjects, onOpenLab, onSelectProject }: Pick<PortfolioSiteProps, "onHome" | "onProjects" | "onOpenLab" | "onSelectProject">) {
  const reducedMotion = useReducedMotion();
  const flagships = FLAGSHIP_NAMES.map((name) => projectStories.find((project) => project.name === name)).filter((project): project is ProjectStory => Boolean(project));
  const [previewName, setPreviewName] = useState<(typeof FLAGSHIP_NAMES)[number] | null>(null);
  const previewProject = flagships.find((project) => project.name === previewName);
  const assetBase = import.meta.env.BASE_URL;

  useEffect(() => {
    if (!previewProject) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewName(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewProject]);

  return <div className="unified-home relative min-h-screen overflow-hidden bg-[#050814] text-[#eaf2ff]">
    <ConstellationField />
    <div className="relative z-10">
    <SiteHeader onHome={onHome} onProjects={onProjects} onOpenLab={onOpenLab} light subtitle="Senior Data Scientist" active="home" />
    <main>
      <section className="unified-hero relative isolate min-h-[640px] overflow-hidden border-b border-[#213050] bg-[#050814]/35 text-white">
        <div className="absolute inset-0 unified-hero-grid" aria-hidden="true" />
        <motion.div className="relative z-10 mx-auto flex min-h-[640px] max-w-[1220px] flex-col justify-center px-4 py-12 md:px-7 lg:py-14" initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="mx-auto grid w-full gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-center lg:gap-10">
            <img className="mx-auto aspect-square w-44 rounded-full object-cover object-top ring-[5px] ring-[#2386d9] shadow-[0_0_48px_rgba(43,145,255,.34)] sm:w-52 lg:w-[230px]" src={`${assetBase}assets/ayush-soni-headshot.jpg`} alt="Ayush Soni" />
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[.08em] text-[#75a7ff]"><span className="status-pulse h-2 w-2 rounded-full bg-[#2ee5c2] shadow-[0_0_16px_#2ee5c2]" /> status: open_to_opportunities <span className="status-cursor">|</span></span>
              <h1 aria-label="Ayush Soni" className="portfolio-display mt-3 text-[64px] leading-[.92] text-[#f0f4ff] sm:text-[88px] lg:text-[112px]">Ayush Soni</h1>
              <p className="mt-4 max-w-3xl text-xl font-bold leading-8 text-white sm:text-3xl">Senior Data Scientist - Applied ML, Causal Inference, and GenAI</p>
            </div>
          </div>
          <div className="mt-9 max-w-4xl">
            <p className="text-base font-black text-white">Applied AI and ML systems for decisions that need evidence.</p><p className="mt-2 max-w-3xl text-base font-semibold leading-8 text-[#cad5e8]">I build customer-value, causal-measurement, forecasting, and grounded GenAI systems that connect model evidence, production discipline, and business decisions.</p><div className="mt-6 flex flex-wrap gap-2"><button type="button" className="group inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[#4d6386] bg-[#0b1425]/55 px-4 text-sm font-black text-[#64e8ff] hover:border-[#64e8ff] hover:bg-[#10213c]" onClick={onProjects}>View Project Atlas <ArrowRight className="transition-transform group-hover:translate-x-1" size={17} /></button><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[#38527c] bg-[#0b1425]/80 px-4 text-sm font-bold" onClick={onOpenLab}><FlaskConical size={17} /> Quality Lab</button><a className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[#38527c] px-4 text-sm font-bold" href={`${assetBase}assets/Ayush_Soni_Resume_BigTech_Generalist.pdf`} download><Download size={17} /> Resume</a></div>
          </div>
        </motion.div>
      </section>

      <section className="border-b border-[#213050] bg-[#09101e]/78 backdrop-blur-[2px]">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 md:grid-cols-3 md:px-7">
          <HomeProof value="37.2%" label="Harmful value captured at 5% review capacity" accent="#5fe0bd" />
          <HomeProof value="33" label="Automated tests across six evaluation workspaces" accent="#ff765c" />
          <HomeProof value="50 / 200" label="Curated business tables from governed sources" accent="#c8a2ff" />
        </div>
      </section>

      <section className="border-b border-[#213050] bg-[#070d19]/82 py-16 backdrop-blur-[2px] lg:py-24" id="systems">
        <div className="mx-auto max-w-[1500px] px-4 md:px-7">
          <div className="grid gap-8 border-b border-[#263657] pb-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div><p className="text-xs font-extrabold uppercase text-[#64e8ff]">GitHub showcase</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Strongest public<br />engineering work.</h2></div>
            <p className="max-w-2xl text-base leading-7 text-[#aebed6]">Five repositories selected for decision quality, technical depth, reproducible evidence, and production thinking across applied ML, GenAI, MLOps, and ranking.</p>
          </div>
          <div>
            {GITHUB_SHOWCASE.map((project) => <article key={project.id} className="group grid gap-5 border-b border-[#263657] py-8 lg:grid-cols-[70px_minmax(240px,.8fr)_minmax(0,1.2fr)_190px] lg:items-start lg:gap-9">
              <span className="font-mono text-sm font-black" style={{ color: project.accent }}>{project.id}</span>
              <div><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>{project.tag}</span><h3 className="mt-2 text-2xl font-black text-white">{project.name}</h3></div>
              <p className="border-l border-[#34476d] pl-5 text-sm leading-7 text-[#b9c7db] transition-colors group-hover:border-white/40">{project.description}</p>
              <div className="lg:text-right"><p className="font-mono text-[10px] font-bold uppercase text-[#8ea4c2]">Evidence signal</p><p className="mt-2 text-xs font-bold leading-5 text-white">{project.proof}</p><a className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#64e8ff] hover:text-white" href={project.repoUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View repository <ArrowUpRight size={14} /></a></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="border-b border-[#213050] bg-[#0a1120]/82 py-16 backdrop-blur-[2px] lg:py-24" id="featured-work">
        <div className="mx-auto max-w-[1500px] px-4 md:px-7">
          <div className="grid gap-8 pb-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div><p className="text-xs font-extrabold uppercase text-[#64e8ff]">Featured work</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Choose a system.<br />Inspect the evidence.</h2></div>
            <p className="max-w-2xl text-base leading-7 text-[#aebed6]">Three distinct business problems, each with its own visual world. Open a preview for the decision, proof, trade-offs, and path into the complete case study.</p>
          </div>
          <div className="featured-shelf scrollbar-thin flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5">
            {flagships.map((project, index) => <button key={project.name} type="button" className="project-cover group relative aspect-[16/10] min-w-[86%] snap-start overflow-hidden rounded-[8px] border border-white/15 text-left sm:min-w-[68%] lg:min-w-[calc(33.333%-11px)]" onClick={() => setPreviewName(project.name as (typeof FLAGSHIP_NAMES)[number])} aria-label={`Preview ${project.displayName}`}>
              <img className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" src={`${assetBase}${FLAGSHIP_COVERS[project.name as (typeof FLAGSHIP_NAMES)[number]]}`} alt="" />
              <span className="project-cover-shade absolute inset-0" aria-hidden="true" />
              <span className="absolute inset-x-0 bottom-0 p-5 sm:p-6"><span className="font-mono text-[10px] font-black uppercase" style={{ color: project.accent }}>0{index + 1} / {FLAGSHIP_META[project.name as (typeof FLAGSHIP_NAMES)[number]].role}</span><strong className="mt-2 block max-w-md text-2xl font-black text-white sm:text-3xl">{project.displayName}</strong><span className="mt-3 flex items-center justify-between gap-4 text-xs font-bold text-white/85"><span>{businessQuestion(project)}</span><ArrowUpRight className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={20} /></span></span>
            </button>)}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#263657] pt-6"><p className="font-mono text-[10px] font-bold uppercase text-[#8ea4c2]">Drag or scroll the shelf - select a cover for the fast preview</p><button type="button" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#64e8ff]" onClick={onProjects}>Explore all 17 projects <ArrowRight size={17} /></button></div>
        </div>
      </section>

      <section className="border-b border-[#213050] bg-[#050814]/84 py-16 text-white backdrop-blur-[2px] lg:py-24" id="experience">
        <div className="mx-auto max-w-[1500px] px-4 md:px-7">
          <div className="grid gap-8 lg:grid-cols-[.6fr_1.4fr]"><div><p className="text-xs font-extrabold uppercase text-[#67dcc7]">Experience</p><h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Built across product, finance, and operations.</h2></div><p className="max-w-2xl text-base leading-7 text-[#b9cac7]">The common thread is not a particular algorithm. It is turning uncertain data into a decision, earning stakeholder trust, and building the path from analysis to use.</p></div>
          <div className="mt-12 border-t border-[#263657]">
            {EXPERIENCE.map((item) => <article key={`${item.company}-${item.years}`} className="grid gap-6 border-b border-[#263657] py-10 lg:grid-cols-[150px_260px_1fr] lg:gap-8"><span className="font-mono text-xs font-bold text-[#64e8ff]">{item.years}</span><span><strong className="block text-lg">{item.company}</strong><small className="mt-1 block text-xs text-[#91a7c5]">{item.role}</small><span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#67dcc7]"><Boxes size={13} /> Selected project work</span></span><div className="border-t border-[#263657]">{item.projects.map((project, index) => <div key={project.name} className="grid gap-2 border-b border-[#263657] py-4 sm:grid-cols-[minmax(170px,.55fr)_minmax(0,1fr)] sm:gap-6"><h3 className="text-sm font-black leading-6 text-white"><span className="mr-2 font-mono text-[10px] text-[#5fe0bd]">0{index + 1}</span>{project.name}</h3><p className="text-sm leading-6 text-[#c8d4e6]">{project.detail}</p></div>)}</div></article>)}
          </div>
        </div>
      </section>

      <section className="border-b border-[#213050] bg-[#0a1120]/82 py-16 backdrop-blur-[2px] lg:py-24">
        <div className="mx-auto max-w-[1500px] px-4 md:px-7">
          <p className="text-xs font-extrabold uppercase text-[#64e8ff]">Capability map</p>
          <div className="mt-4 grid gap-8 border-y border-[#263657] py-10 md:grid-cols-3">
            {CAPABILITIES.map((item, index) => <div key={item.title} className="md:border-r md:border-[#263657] md:pr-8 md:last:border-r-0"><span className="font-mono text-xs font-bold text-[#ff765c]">0{index + 1}</span><h3 className="mt-3 text-2xl font-black">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#aebed6]">{item.detail}</p></div>)}
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {STACK_GROUPS.map((group, index) => <div key={group.title} className="border-t-2 pt-5" style={{ borderColor: ["#5fe0bd", "#ff765c", "#c8a2ff", "#72b7ff"][index] }}><h3 className="text-base font-black">{group.title}</h3><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{group.items.map((item) => <span key={item} className="font-mono text-xs text-[#b9c7db]">{item}</span>)}</div></div>)}
          </div>
        </div>
      </section>

      <section className="border-b border-[#213050] bg-[#070d19]/84 py-16 backdrop-blur-[2px] lg:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-12 px-4 md:grid-cols-3 md:px-7">
          {[{ label: "Education", items: CREDENTIALS.education, color: "#5fe0bd" }, { label: "Certifications", items: CREDENTIALS.certifications, color: "#72b7ff" }, { label: "Recognition", items: CREDENTIALS.recognition, color: "#ffc159" }].map((group) => <section key={group.label}><p className="text-xs font-extrabold uppercase" style={{ color: group.color }}>{group.label}</p><div className="mt-5 border-t border-[#263657]">{group.items.map((item) => <p key={item} className="border-b border-[#263657] py-4 text-sm font-bold leading-6 text-[#d7e0ef]">{item}</p>)}</div></section>)}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-[#213050] bg-[#03050b]/90 py-16 backdrop-blur-[2px] lg:py-24" id="contact">
        <div className="mx-auto max-w-[1500px] px-4 md:px-7">
          <div className="grid gap-10 border-y border-[#263657] py-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:py-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5fe0bd]">Open to the next hard problem</p>
              <h2 className="portfolio-display mt-4 max-w-[840px] text-[clamp(2rem,4vw,4rem)] leading-[1.02] text-white">
                Let&apos;s build AI systems people can trust and teams can operate.
              </h2>
              <p className="mt-6 max-w-[760px] text-base leading-7 text-[#aebed6] md:text-lg">
                I&apos;m exploring Applied Scientist, Senior Data Scientist, and AI/ML leadership opportunities where model quality, business impact, and production discipline matter together.
              </p>
            </div>

            <div className="lg:border-l lg:border-[#263657] lg:pl-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#c7d4e7]">
                <MapPin className="h-4 w-4 text-[#72b7ff]" />
                <span>United States</span>
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#5fe0bd]" />
                <span>Open to relocate</span>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                <a className="inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#5fe0bd] px-4 py-2.5 text-sm font-semibold text-[#04100d] transition hover:bg-[#85efd1]" href="mailto:ayush.so2156@gmail.com">
                  <Mail className="h-4 w-4" /> Email Ayush
                </a>
                <a className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#35527d] bg-[#0b1425] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#72b7ff] hover:bg-[#12213a]" href="https://linkedin.com/in/ayush218" target="_blank" rel="noreferrer">
                  <ArrowUpRight className="h-4 w-4" /> LinkedIn
                </a>
                <a className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#35527d] bg-[#0b1425] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#72b7ff] hover:bg-[#12213a]" href={`${assetBase}assets/Ayush_Soni_Resume_BigTech_Generalist.pdf`} download>
                  <Download className="h-4 w-4" /> Resume
                </a>
              </div>

              <a className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[#aebed6] transition hover:text-white" href="https://github.com/Ayush210895" target="_blank" rel="noreferrer">
                <Code2 className="h-4 w-4 text-[#ffc159]" /> View GitHub profile <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="border-t border-[#213050] bg-[#03050b] text-white"><div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between md:px-7"><span><strong className="block">Ayush Soni</strong><small className="mt-1 block text-[#8fa6c2]">Senior Data Scientist - Applied AI and ML</small></span><div className="flex flex-wrap gap-4 text-xs font-bold"><a href="mailto:ayush.so2156@gmail.com">Email</a><a href="https://github.com/Ayush210895" target="_blank" rel="noreferrer">GitHub</a><a href="https://linkedin.com/in/ayush218" target="_blank" rel="noreferrer">LinkedIn</a></div></div></footer>
    </div>
    <AnimatePresence>
      {previewProject && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[#010309]/85 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="project-preview-title" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewName(null)}>
        <motion.article className="max-h-[92svh] w-full max-w-5xl overflow-y-auto rounded-[8px] border border-white/20 bg-[#080d17] shadow-[0_30px_100px_rgba(0,0,0,.7)]" initial={reducedMotion ? false : { opacity: 0, y: 28, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: .98 }} transition={{ duration: .28 }} onClick={(event) => event.stopPropagation()}>
          <div className="relative h-[250px] overflow-hidden sm:h-auto sm:aspect-[16/7]"><img className="absolute inset-0 h-full w-full object-cover" src={`${assetBase}${FLAGSHIP_COVERS[previewProject.name as (typeof FLAGSHIP_NAMES)[number]]}`} alt="" /><span className="project-cover-shade absolute inset-0" aria-hidden="true" /><button type="button" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md hover:bg-black/80" onClick={() => setPreviewName(null)} aria-label="Close project preview"><X size={19} /></button><div className="absolute inset-x-0 bottom-0 p-6 sm:p-9"><span className="text-[10px] font-extrabold uppercase" style={{ color: previewProject.accent }}>{FLAGSHIP_META[previewProject.name as (typeof FLAGSHIP_NAMES)[number]].role}</span><h2 id="project-preview-title" className="mt-2 max-w-3xl break-words text-3xl font-black text-white sm:text-5xl">{previewProject.displayName}</h2></div></div>
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.2fr_.8fr]">
            <div><p className="text-xs font-extrabold uppercase" style={{ color: previewProject.accent }}>The decision</p><p className="mt-2 text-xl font-black leading-8 text-white">{businessQuestion(previewProject)}</p><p className="mt-5 text-sm leading-7 text-[#b9c7db]">{previewProject.outcome}</p><div className="mt-7 border-l-4 pl-4" style={{ borderColor: previewProject.accent }}><span className="text-[10px] font-extrabold uppercase" style={{ color: previewProject.accent }}>Why this case matters</span><p className="mt-2 text-sm leading-6 text-[#d1dbea]">{projectDifferentiator(previewProject)}</p></div></div>
            <aside className="border-t border-[#263657] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><span className="text-[10px] font-extrabold uppercase text-[#8ea4c2]">Proof snapshot</span><div className="mt-3 grid grid-cols-2 gap-3">{previewProject.metrics.slice(0, 2).map((metric) => <div key={metric.label} className="border-t-2 pt-3" style={{ borderColor: previewProject.accent }}><strong className="block text-2xl font-black text-white">{metric.value}</strong><span className="mt-1 block text-[10px] font-bold uppercase text-[#8ea4c2]">{metric.label}</span></div>)}</div><span className="mt-7 block text-[10px] font-extrabold uppercase text-[#8ea4c2]">Key trade-off</span><p className="mt-2 text-sm leading-6 text-[#c7d3e5]">{TRADEOFFS[previewProject.name]?.[0]}</p><button type="button" className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[5px] px-4 text-sm font-black text-[#07101d]" style={{ backgroundColor: previewProject.accent }} onClick={() => onSelectProject(previewProject)}>Open full case study <ArrowRight size={16} /></button></aside>
          </div>
        </motion.article>
      </motion.div>}
    </AnimatePresence>
  </div>;
}

function HomeProof({ value, label, accent }: { value: string; label: string; accent: string }) {
  return <div className="border-b border-[#213050] px-5 py-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><strong className="block text-3xl font-black tabular-nums" style={{ color: accent }}>{value}</strong><span className="mt-2 block text-xs font-bold uppercase text-[#9fb0c8]">{label}</span></div>;
}

function ProjectExplorer({ onHome, onProjects, onOpenLab, onSelectProject }: Pick<PortfolioSiteProps, "onHome" | "onProjects" | "onOpenLab" | "onSelectProject">) {
  const [group, setGroup] = useState<ProjectGroup>("All");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();
  const visible = useMemo(() => projectStories.filter((project) => {
    if (FLAGSHIP_NAMES.includes(project.name as (typeof FLAGSHIP_NAMES)[number])) return false;
    const matchesGroup = group === "All" || (group === "Featured" ? project.featured : projectGroup(project) === group);
    const text = `${project.displayName} ${project.name} ${project.summary} ${project.problem} ${project.decision} ${project.stack.join(" ")}`.toLowerCase();
    return matchesGroup && text.includes(query.trim().toLowerCase());
  }), [group, query]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return <div className="atlas-page relative min-h-screen overflow-hidden bg-[#050814] text-[#eaf2ff]">
    <ConstellationField />
    <div className="relative z-10">
    <SiteHeader onHome={onHome} onProjects={() => window.scrollTo({ top: 0, behavior: "smooth" })} onOpenLab={onOpenLab} />
    <main>
      <section className="atlas-hero relative isolate h-[min(72svh,700px)] min-h-[560px] overflow-hidden bg-[#050814]/45 text-white">
        <AtlasSignalField onSelectProject={onSelectProject} />
        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1500px] items-start px-4 pt-8 md:px-7 md:pt-12 lg:items-center lg:pt-0">
          <motion.div className="pointer-events-auto max-w-3xl lg:max-w-[650px]" initial={reducedMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-xs font-extrabold uppercase text-[#66d8c7]">Applied intelligence, made inspectable</p>
            <h1 className="hero-title portfolio-display mt-3 max-w-3xl text-4xl leading-[1.02] sm:text-5xl lg:text-7xl">Systems you can inspect, question, and operate.</h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#bed0ce] sm:text-base sm:leading-7">Move through the live signal field, open a system, and trace how model evidence becomes a business decision.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#66d8c7] px-4 text-sm font-black text-[#0c1a21]" onClick={() => document.getElementById("flagship-projects")?.scrollIntoView({ behavior: "smooth" })}><LayoutGrid size={17} /> Explore flagships</button>
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-white/30 bg-white/5 px-4 text-sm font-bold text-white hover:bg-white/10" onClick={onOpenLab}><FlaskConical size={17} /> Test a model</button>
            </div>
          </motion.div>
        </div>
      </section>

      <FlagshipProjects onSelectProject={onSelectProject} />

      <section className="sticky top-16 z-20 border-b border-[#263657] bg-[#07101d]/95 shadow-[0_8px_22px_rgba(0,0,0,.28)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 md:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-thin flex gap-1 overflow-x-auto" aria-label="Project categories">
            {GROUPS.map((item) => <button key={item} type="button" className={`min-h-9 shrink-0 rounded-[6px] px-3 text-xs font-bold ${group === item ? "bg-[#64e8ff] text-[#07101d]" : "text-[#aebed6] hover:bg-white/10 hover:text-white"}`} onClick={() => setGroup(item)}>{item}</button>)}
          </div>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <label className="relative block min-w-0 flex-1 lg:w-72"><Search className="pointer-events-none absolute left-3 top-2.5 text-[#8296b5]" size={16} /><span className="sr-only">Search project atlas</span><input ref={searchRef} className="h-9 w-full rounded-[6px] border border-[#324667] bg-[#0b1425] pl-9 pr-12 text-sm text-white placeholder:text-[#7184a2]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search models, tools, methods" /><kbd className="pointer-events-none absolute right-2 top-2 rounded-[3px] border border-[#324667] px-1.5 py-0.5 font-mono text-[9px] text-[#8296b5]">/</kbd></label>
          </div>
        </div>
      </section>

      <section id="project-explorer" className="mx-auto max-w-[1500px] px-4 py-8 md:px-7 lg:py-12">
        <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#263657] pb-6"><div><p className="text-xs font-extrabold uppercase text-[#64e8ff]">More projects</p><h2 className="portfolio-display mt-2 text-3xl sm:text-4xl">{group === "All" ? "Explore the broader atlas" : group === "Featured" ? "More featured systems" : group}</h2></div><span className="text-sm font-bold tabular-nums text-[#8ea4c2]">{visible.length} projects</span></div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={group} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {visible.map((item) => <ProjectTile key={item.name} project={item} onSelect={() => onSelectProject(item)} />)}
          </motion.div>
        </AnimatePresence>
        {visible.length === 0 && <div className="border-y border-[#cbd6d4] py-20 text-center"><strong>No matching project</strong><p className="mt-2 text-sm text-[#687579]">Try a different technology, domain, or category.</p></div>}
      </section>
    </main></div>
  </div>;
}

function FlagshipProjects({ onSelectProject }: { onSelectProject: (project: ProjectStory) => void }) {
  const reducedMotion = useReducedMotion();
  const assetBase = import.meta.env.BASE_URL;
  const flagships = FLAGSHIP_NAMES.map((name) => projectStories.find((project) => project.name === name)).filter((project): project is ProjectStory => Boolean(project));
  return <section id="flagship-projects" className="flagship-band border-b border-[#263657] bg-[#09101e]/88 text-white backdrop-blur-[2px]">
    <div className="mx-auto max-w-[1500px] px-4 py-12 md:px-7 lg:py-16">
      <div className="mb-10 grid gap-3 md:grid-cols-[1fr_430px] md:items-end lg:mb-14">
        <div><p className="text-xs font-extrabold uppercase text-[#66d8c7]">Flagship Three</p><h2 className="mt-1 text-3xl font-black sm:text-4xl">Three systems. Three kinds of leadership.</h2></div>
        <p className="text-sm leading-6 text-[#aebfbd]">Start here for the clearest evidence of applied modeling, production discipline, and grounded AI system design.</p>
      </div>
      <div className="featured-shelf scrollbar-thin flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {flagships.map((project, index) => {
          const meta = FLAGSHIP_META[project.name as (typeof FLAGSHIP_NAMES)[number]];
          return <motion.article key={project.name} className="project-tile group min-w-[86%] snap-start overflow-hidden rounded-[8px] bg-[#0b1425] sm:min-w-[58%] lg:min-w-0" style={{ borderTop: `4px solid ${project.accent}` }} initial={reducedMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: index * .08 }}>
            <button type="button" className="project-media-panel relative block aspect-[16/9] w-full overflow-hidden text-left" onClick={() => onSelectProject(project)} aria-label={`Open case ${project.displayName}`}><img className="project-media-image absolute inset-0 h-full w-full object-cover" src={`${assetBase}${FLAGSHIP_COVERS[project.name as (typeof FLAGSHIP_NAMES)[number]]}`} alt="" /><span className="project-media-scrim absolute inset-0" aria-hidden="true" /><span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4"><span><span className="text-[9px] font-extrabold uppercase" style={{ color: project.accent }}>0{index + 1} / {meta.role}</span><strong className="mt-1 block text-xl text-white">{project.displayName}</strong></span><ArrowUpRight className="shrink-0 text-white" size={20} /></span></button>
            <div className="p-5"><p className="text-sm font-bold leading-6 text-white">{businessQuestion(project)}</p><div className="mt-5 flex items-end justify-between gap-4 border-t border-[#263657] pt-4"><span><strong className="block text-2xl font-black tabular-nums" style={{ color: project.accent }}>{project.metrics[0].value}</strong><small className="text-[9px] font-bold uppercase text-[#9fb4b2]">{project.metrics[0].label}</small></span><button type="button" className="inline-flex min-h-10 items-center gap-2 text-xs font-black text-white" onClick={() => onSelectProject(project)}>Open case <ArrowRight size={15} /></button></div></div>
          </motion.article>;
        })}
      </div>
      <button type="button" className="mt-7 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold text-[#9edfd5]" onClick={() => document.getElementById("project-explorer")?.scrollIntoView({ behavior: "smooth" })}><LayoutGrid size={15} /> Browse the complete project atlas</button>
    </div>
  </section>;
}

const SIGNAL_PROJECTS = [
  { name: "travel-marketplace-harm-risk", label: "Harm risk", x: 56, y: 18, mobileX: 5, mobileY: 59, color: "#ff765c" },
  { name: "Credit-Risk-MLOps-AWS", label: "Credit MLOps", x: 79, y: 12, mobileX: 54, mobileY: 59, color: "#5fe0bd" },
  { name: "financial-doc-agent", label: "Financial agent", x: 63, y: 45, mobileX: 18, mobileY: 70, color: "#c8a2ff" },
  { name: "Amazon-Recommendation-System", label: "Recommender", x: 82, y: 43, mobileX: 57, mobileY: 70, color: "#ffc159" },
  { name: "multi-agent-dev-system", label: "Agent system", x: 55, y: 69, mobileX: 6, mobileY: 81, color: "#72b7ff" },
  { name: "ai-quality-lab", label: "Quality Lab", x: 77, y: 70, mobileX: 56, mobileY: 81, color: "#66d8c7" },
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
      const compact = width < 768;
      const points = SIGNAL_PROJECTS.map((item) => ({ x: width * (compact ? item.mobileX : item.x) / 100, y: height * (compact ? item.mobileY : item.y) / 100 }));
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

  return <div ref={shellRef} className="signal-field absolute inset-0 overflow-hidden bg-[#10262d]" aria-label="Interactive project signal map">
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="absolute right-7 top-8 z-10 hidden text-right lg:block"><p className="text-[10px] font-extrabold uppercase text-[#66d8c7]">Live project network</p><p className="mt-1 text-xs text-[#9fb4b2]">Select a signal to open its case study</p></div>
    {SIGNAL_PROJECTS.map((node) => {
      const selected = node.name === activeName;
      const project = projectStories.find((item) => item.name === node.name);
      if (!project) return null;
      return <button key={node.name} type="button" className={`signal-node absolute z-10 min-h-10 border px-3 py-2 text-left text-[10px] font-black uppercase text-white ${selected ? "bg-[#0c1a21]" : "bg-[#17313a]/90"}`} style={{ "--node-x": `${node.x}%`, "--node-y": `${node.y}%`, "--mobile-x": `${node.mobileX}%`, "--mobile-y": `${node.mobileY}%`, borderColor: node.color, boxShadow: selected ? `0 0 0 2px ${node.color}` : undefined } as CSSProperties} onMouseEnter={() => setActiveName(node.name)} onFocus={() => setActiveName(node.name)} onClick={() => onSelectProject(project)}><span className="mr-2 inline-block h-2 w-2" style={{ backgroundColor: node.color }} />{node.label}</button>;
    })}
    <div className="signal-decision absolute bottom-5 right-5 z-10 grid w-[min(440px,calc(100%-2.5rem))] grid-cols-[1fr_auto] items-end gap-4 border-t border-white/20 bg-[#0c1a21]/90 px-1 py-3 lg:bottom-8 lg:right-8">
      <span><span className="block text-[9px] font-extrabold uppercase text-[#66d8c7]">Active decision</span><strong className="mt-1 line-clamp-1 block text-xs sm:text-sm">{businessQuestion(activeProject)}</strong></span>
      <span className="text-right"><strong className="block text-lg tabular-nums text-[#ffc159]">{activeProject.metrics[0].value}</strong><small className="block max-w-24 text-[9px] text-[#9fb4b2]">{activeProject.metrics[0].label}</small></span>
    </div>
  </div>;
}

function ProjectTile({ project, onSelect }: { project: ProjectStory; onSelect: () => void }) {
  const reducedMotion = useReducedMotion();
  const assetBase = import.meta.env.BASE_URL;
  const cover = PROJECT_COVERS[project.name];
  return <motion.article layout className="project-tile group flex min-h-[400px] flex-col overflow-hidden rounded-[8px] bg-[#0b1425] text-white transition-transform hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,.35)]" style={{ borderTop: `4px solid ${project.accent}` }} initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1] }}>
    <button type="button" className="project-media-panel relative block h-52 w-full overflow-hidden text-left" onClick={onSelect} aria-label={`Explore ${project.displayName}`}>
      {cover ? <><img className="project-media-image absolute inset-0 h-full w-full object-cover" src={`${assetBase}${cover}`} alt="" /><span className="project-media-scrim absolute inset-0" aria-hidden="true" /><span className="project-media-scan absolute inset-y-0 w-20" aria-hidden="true" /><span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4"><span><span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-[#c7d4e7]"><i className="h-1.5 w-1.5" style={{ backgroundColor: project.accent }} /> Decision system</span><strong className="mt-1 block max-w-xs text-sm leading-5 text-white">{businessQuestion(project)}</strong></span><span className="shrink-0 rounded-full border border-white/30 bg-black/45 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur-md">Explore</span></span></> : <VisualStage project={project} compact />}
    </button>
    <div className="flex flex-1 flex-col border-t border-white/15 p-5">
      <div className="flex items-center justify-between gap-3"><span className="text-[11px] font-extrabold uppercase" style={{ color: project.accent }}>{projectGroup(project)}</span><span className="rounded-full border border-[#324667] px-2 py-1 text-[9px] font-extrabold uppercase text-[#9fb0c8]">{STATUS_COPY[project.status].label}</span></div>
      <h3 className="mt-3 break-words text-xl font-black leading-tight">{project.displayName}</h3>
      <p className="mt-3 text-sm font-bold leading-6 text-[#cbd6e7]">{businessQuestion(project)}</p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#263657] pt-4"><span className="text-xs font-bold text-[#8ea4c2]">{project.metrics[0].label}: <strong className="text-white">{project.metrics[0].value}</strong></span><button type="button" className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-[6px] px-3 text-xs font-bold text-white" style={{ backgroundColor: project.accent }} onClick={onSelect}>Case study <ArrowRight size={15} /></button></div>
    </div>
  </motion.article>;
}

function ProjectPage({ project, onHome, onBack, onOpenLab, onSelectProject }: { project: ProjectStory; onHome: () => void; onBack: () => void; onOpenLab: () => void; onSelectProject: (project: ProjectStory) => void }) {
  const [section, setSection] = useState<"overview" | "architecture" | "evidence">("overview");
  useEffect(() => { setSection("overview"); }, [project.slug]);
  const openSection = (nextSection: "overview" | "architecture" | "evidence") => {
    setSection(nextSection);
    window.requestAnimationFrame(() => document.getElementById("project-detail")?.scrollIntoView({ behavior: "smooth" }));
  };
  const related = projectStories.filter((candidate) => candidate.name !== project.name && (projectGroup(candidate) === projectGroup(project) || candidate.visual === project.visual)).slice(0, 3);
  const assetBase = import.meta.env.BASE_URL;
  const cover = PROJECT_COVERS[project.name];
  return <div className="project-page relative min-h-screen overflow-hidden bg-[#050814] text-[#eaf2ff]" style={{ "--project-accent": project.accent, "--project-soft": project.soft } as CSSProperties}>
    <ConstellationField />
    <div className="relative z-10">
    <SiteHeader onHome={onHome} onProjects={onBack} onOpenLab={onOpenLab} light />
    <main>
      <section className="case-hero relative isolate overflow-hidden border-b-4 bg-[#0f1d24] text-white" style={{ borderColor: project.accent }}>
        {cover && <><img className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" src={`${assetBase}${cover}`} alt="" /><span className="absolute inset-0 -z-10 bg-[#07101d]/80" aria-hidden="true" /></>}
        <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-7 lg:py-10">
          <button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-[6px] px-2 text-xs font-bold text-[#b9cac8] hover:bg-white/10" onClick={onBack}><ArrowLeft size={15} /> All projects</button>
          <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,.85fr)_minmax(480px,1.15fr)] lg:items-stretch">
            <div className="flex flex-col justify-center py-2">
              <p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>{projectGroup(project)} · {project.family}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3"><span className="inline-flex w-fit items-center border border-white/20 px-3 py-2 text-[10px] font-extrabold uppercase text-[#b9cac8]"><span className="mr-2 h-2 w-2" style={{ backgroundColor: project.accent }} />{THEME_LABELS[project.visual]}</span></div>
              <h1 className="portfolio-display mt-3 break-words text-4xl leading-[1.04] sm:text-5xl">{project.displayName}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#b9cac8]">{project.problem}</p><div className="mt-5 border-l-4 bg-white/5 p-4" style={{ borderColor: project.accent }}><span className="text-[10px] font-extrabold uppercase" style={{ color: project.accent }}>Why this project is different</span><p className="mt-1 text-sm font-bold leading-6 text-white">{projectDifferentiator(project)}</p></div>
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
        <div className="mx-auto max-w-[1500px] px-4 py-9 md:px-7"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase" style={{ color: project.accent }}>Continue exploring</p><h2 className="mt-1 text-2xl font-black">Related projects</h2></div><button className="hidden min-h-9 items-center gap-2 text-xs font-bold sm:inline-flex" type="button" onClick={onBack}>See all <ArrowRight size={15} /></button></div><div className="grid gap-3 md:grid-cols-3">{related.map((item) => <button key={item.name} type="button" className="flex min-h-28 items-center justify-between gap-4 rounded-[6px] border border-[#d4dddc] p-4 text-left hover:border-[#8ba29e]" onClick={() => onSelectProject(item)}><span><span className="block text-[10px] font-extrabold uppercase" style={{ color: item.accent }}>{projectGroup(item)}</span><strong className="mt-2 block break-words text-sm">{item.displayName}</strong></span><ArrowRight className="shrink-0" size={18} /></button>)}</div></div>
      </section>
    </main></div>
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
  const reducedMotion = useReducedMotion();
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
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={view} className="h-[610px] lg:h-[370px]" initial={reducedMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? undefined : { opacity: 0, x: -18 }} transition={{ duration: reducedMotion ? 0 : .24, ease: "easeOut" }}>
        {view === "signal" && <VisualStage project={project} />}
        {view === "artifact" && <ArtifactView project={project} />}
        {view === "decision" && <DecisionView project={project} />}
      </motion.div>
    </AnimatePresence>
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
