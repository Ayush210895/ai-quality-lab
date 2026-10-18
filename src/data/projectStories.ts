import { portfolioProjects, type PortfolioProject } from "./projectRegistry";

export type ProjectMetric = { label: string; value: string; note: string };
export type VisualKind = "risk" | "fraud" | "air" | "ranking" | "language" | "clusters" | "signals" | "regression" | "space" | "agents" | "portfolio" | "learning";

export type ProjectStory = PortfolioProject & {
  slug: string;
  accent: string;
  soft: string;
  visual: VisualKind;
  featured: boolean;
  problem: string;
  approach: string;
  outcome: string;
  stack: string[];
  metrics: ProjectMetric[];
  pipeline: string[];
  boundary: string;
};

type StoryDetails = Omit<ProjectStory, keyof PortfolioProject | "slug">;

const details: Record<string, StoryDetails> = {
  "travel-marketplace-harm-risk": {
    accent: "#d84b37", soft: "#fff0ed", visual: "risk", featured: true,
    problem: "A marketplace can review only a small fraction of bookings, so ranking by probability alone can miss the highest-value harm.",
    approach: "Compare a logistic baseline with tuned XGBoost, lock a 5% review policy, and rank by predicted harm probability multiplied by booking value.",
    outcome: "The locked expected-loss policy captured more harmful financial value on an untouched future period while making the recall trade-off explicit.",
    stack: ["Python", "XGBoost", "Chronological validation", "Cost-sensitive ranking", "Pytest"],
    metrics: [
      { label: "Harm value captured", value: "37.2%", note: "Locked future test" },
      { label: "Relative uplift", value: "+28.5%", note: "Versus probability ranking" },
      { label: "Review capacity", value: "5%", note: "896 of 17,909 bookings" },
    ],
    pipeline: ["Booking features", "Harm probability", "Expected-loss score", "5% review queue", "Future-test decision"],
    boundary: "Promote for a value-first objective only. Incident recall is lower than probability ranking and remains a production guardrail.",
  },
  "Credit-Risk-MLOps-AWS": {
    accent: "#167b67", soft: "#e9f7f3", visual: "risk", featured: true,
    problem: "Credit models need reproducible training, controlled promotion, serving, and monitoring rather than a notebook-only score.",
    approach: "Package logistic-regression training with MLflow tracking, metric-gated registry promotion, FastAPI inference, Docker, CI, and drift reporting.",
    outcome: "A production-style local MLOps path with an explicit approval gate before a candidate becomes the served model.",
    stack: ["Python", "FastAPI", "MLflow", "Docker", "AWS design", "GitHub Actions"],
    metrics: [
      { label: "ROC-AUC", value: "0.807", note: "Held-out test" },
      { label: "Average precision", value: "0.643", note: "Imbalanced ranking quality" },
      { label: "Recall", value: "80.0%", note: "At committed threshold" },
    ],
    pipeline: ["Credit features", "Tracked training", "Candidate registry", "Metric gate", "API and monitoring"],
    boundary: "The repository demonstrates a production architecture and local workflow; cloud deployment maturity should be described separately from the implemented local path.",
  },
  "Credit-Card-Anomaly-Detection": {
    accent: "#b52652", soft: "#fdebf1", visual: "fraud", featured: true,
    problem: "Fraud prevalence is only 0.1727%, making accuracy almost meaningless and investigator capacity the real operating constraint.",
    approach: "Implement anomaly detectors and evaluation metrics from scratch, then assess ranking quality and a top-500 review queue on the public benchmark.",
    outcome: "The top 500 suspicious transactions captured 45 fraud cases in the held-out split, with transparent rare-event metrics.",
    stack: ["Python", "NumPy", "Pandas", "OpenML", "From-scratch metrics", "CI"],
    metrics: [
      { label: "ROC-AUC", value: "0.935", note: "71,201-row test split" },
      { label: "Average precision", value: "0.104", note: "Rare-event metric" },
      { label: "Top-500 recall", value: "36.6%", note: "45 frauds captured" },
    ],
    pipeline: ["284,807 transactions", "Anomaly scores", "Ranked queue", "Top-500 review", "Fraud capture"],
    boundary: "The model is a transparent benchmark implementation, not a claim of production fraud performance or real financial deployment.",
  },
  "Beijing-AQI-Prediction": {
    accent: "#4f6ecb", soft: "#eef1ff", visual: "air", featured: true,
    problem: "Hourly multi-station pollution data needs careful cleaning, rolling features, unit conversion, and AQI breakpoint logic before modeling.",
    approach: "Build reusable data and feature modules, calculate pollutant component indices, and train regression and classification baselines from first principles.",
    outcome: "A reproducible package over 420,684 model-ready rows, with both numeric AQI and category predictions.",
    stack: ["Python", "NumPy", "Pandas", "UCI data", "CLI", "GitHub Actions"],
    metrics: [
      { label: "Model-ready rows", value: "420,684", note: "Full UCI dataset" },
      { label: "Regression RMSE", value: "49.07", note: "Linear baseline" },
      { label: "R²", value: "0.53", note: "Variance explained" },
    ],
    pipeline: ["12 stations", "Imputation and units", "AQI components", "Rolling features", "Regression and classes"],
    boundary: "These are transparent baseline models. The category scores show clear room for stronger nonlinear models and temporal validation.",
  },
  "Amazon-Recommendation-System": {
    accent: "#e07818", soft: "#fff3e5", visual: "ranking", featured: true,
    problem: "A useful recommender must balance prediction error, coverage, personalization, and interpretable top-N outputs.",
    approach: "Compare Bayesian popularity, user KNN, item KNN, and low-rank SVD implementations on the Amazon All Beauty 5-core data.",
    outcome: "Item-based KNN achieved the lowest reported RMSE while all evaluated approaches retained full item coverage.",
    stack: ["Python", "NumPy", "Pandas", "Collaborative filtering", "SVD", "CI"],
    metrics: [
      { label: "Ratings evaluated", value: "4,092", note: "991 users, 85 products" },
      { label: "Best RMSE", value: "0.315", note: "Item KNN" },
      { label: "Coverage", value: "100%", note: "Reported for all baselines" },
    ],
    pipeline: ["Beauty reviews", "User-item matrix", "Four recommenders", "Offline comparison", "Top-N products"],
    boundary: "The split is random and offline. A production decision would add temporal validation, ranking metrics, diversity, and online experimentation.",
  },
  "financial-doc-agent": {
    accent: "#6b48a8", soft: "#f2edfb", visual: "language", featured: true,
    problem: "Financial questions may require narrative retrieval, cross-company comparison, or precise structured calculations from filings.",
    approach: "Route between reranked semantic retrieval and read-only Text2SQL, use tools for calculations, and test narrative and numeric cases.",
    outcome: "A locally runnable financial-document agent with retrieval, SQL, citations, evaluation cases, FastAPI, Docker, and a Streamlit interface.",
    stack: ["Python", "RAG", "Reranking", "Text2SQL", "FastAPI", "Docker", "Streamlit"],
    metrics: [
      { label: "Evaluation cases", value: "15", note: "Narrative, numeric, comparison" },
      { label: "Answer paths", value: "2", note: "Retrieval or read-only SQL" },
      { label: "Interfaces", value: "2", note: "API and Streamlit" },
    ],
    pipeline: ["Question", "Intent routing", "Retrieve or SQL", "Tool calculation", "Grounded answer"],
    boundary: "This page summarizes public repository evidence. The source project remains independent and is not modified by this portfolio site.",
  },
  "FinBERT-Financial-News-Sentiment": {
    accent: "#155f9a", soft: "#e9f3fb", visual: "language", featured: false,
    problem: "Unstructured financial headlines need to become issuer-level signals that analysts can review alongside risk indicators.",
    approach: "Run FinBERT probabilities per headline, compute positive-minus-negative sentiment, and aggregate by issuer, sector, or date.",
    outcome: "A runnable inference and aggregation layer with immediate sample data and structured CSV outputs.",
    stack: ["Python", "PyTorch", "Hugging Face", "FinBERT", "Pandas"],
    metrics: [
      { label: "Sentiment classes", value: "3", note: "Positive, neutral, negative" },
      { label: "Output levels", value: "2", note: "Headline and issuer" },
      { label: "Evaluation status", value: "Pending", note: "Needs labeled test set" },
    ],
    pipeline: ["Headlines", "FinBERT probabilities", "Sentiment score", "Issuer aggregation", "Risk review signal"],
    boundary: "Example inference is not model validation. A labeled financial-news test set and drift checks are still needed.",
  },
  "Clustering": {
    accent: "#1c8b9b", soft: "#e8f7f8", visual: "clusters", featured: false,
    problem: "Cluster behavior changes sharply across geometry, density, outliers, and the choice of k.",
    approach: "Compare from-scratch K-means and agglomerative clustering across eight labeled synthetic datasets and world indicators.",
    outcome: "A reproducible benchmark exposing where internal structure and external label recovery agree or diverge.",
    stack: ["Python", "NumPy", "K-means", "Agglomerative clustering", "Silhouette", "ARI"],
    metrics: [
      { label: "Synthetic datasets", value: "8", note: "Different cluster structures" },
      { label: "Best silhouette", value: "0.704", note: "Agglomerative sample" },
      { label: "Best ARI", value: "1.000", note: "Perfect label recovery" },
    ],
    pipeline: ["Dataset shapes", "Standardization", "Two algorithms", "Internal validation", "External validation"],
    boundary: "Some datasets intentionally fail common assumptions; the report should be read as algorithm-behavior evidence, not one universal winner.",
  },
  "Portfolio-Risk-PCA-From-Scratch": {
    accent: "#20795a", soft: "#eaf7f1", visual: "portfolio", featured: false,
    problem: "Correlated assets hide the small number of market factors driving portfolio variance.",
    approach: "Implement PCA and variance contribution analysis directly, then explain dominant factors and hedging contributions.",
    outcome: "The first component explained most variance in the sample while TLT and GLD reduced equal-weight portfolio risk.",
    stack: ["Python", "NumPy", "PCA", "Covariance analysis", "Risk attribution"],
    metrics: [
      { label: "PC1 variance", value: "95.2%", note: "Dominant shared factor" },
      { label: "Annualized volatility", value: "3.81%", note: "Equal-weight sample" },
      { label: "Assets", value: "5", note: "Equity, bond, and gold" },
    ],
    pipeline: ["Asset returns", "Covariance matrix", "Eigen decomposition", "Risk contributions", "Portfolio interpretation"],
    boundary: "The committed report uses a short 30-return sample, so the results demonstrate the method rather than a stable investment conclusion.",
  },
  "Human-Activity-Monitoring": {
    accent: "#cf5b24", soft: "#fff0e9", visual: "signals", featured: false,
    problem: "Wearable acceleration signals contain nonlinear temporal structure that ordinary summary statistics can miss.",
    approach: "Extract natural and horizontal visibility-graph features plus permutation entropy and statistical complexity.",
    outcome: "A reusable analysis over 15 participants and four activities, producing feature tables and comparison plots.",
    stack: ["Python", "Time series", "Visibility graphs", "Permutation entropy", "Network metrics"],
    metrics: [
      { label: "Participants", value: "15", note: "Chest-mounted accelerometer" },
      { label: "Graph rows", value: "360", note: "Visibility analysis" },
      { label: "Entropy rows", value: "6,480", note: "Complexity analysis" },
    ],
    pipeline: ["52 Hz signals", "Activity windows", "Graph transforms", "Entropy features", "Activity comparison"],
    boundary: "The project characterizes activities; it does not yet report a held-out activity-classification model.",
  },
  "Linear-Regression": {
    accent: "#3c73c8", soft: "#edf4ff", visual: "regression", featured: false,
    problem: "Understanding regression deeply requires seeing optimization, regularization, and error behavior beneath library abstractions.",
    approach: "Implement normal equation, batch gradient descent, stochastic gradient descent, and L2 regularization from first principles.",
    outcome: "A tested experiment runner comparing transparent implementations across housing, yacht, and concrete datasets.",
    stack: ["Python", "NumPy", "Gradient descent", "SGD", "L2 regularization"],
    metrics: [
      { label: "Datasets", value: "3", note: "Housing, yacht, concrete" },
      { label: "Best RMSE", value: "4.53", note: "Housing test split" },
      { label: "Largest dataset", value: "1,030", note: "Concrete rows" },
    ],
    pipeline: ["Tabular datasets", "Scaling and split", "Four estimators", "RMSE and SSE", "Reproducible report"],
    boundary: "The goal is algorithm transparency and reproducibility, not state-of-the-art predictive performance.",
  },
  "Logistic-Regression": {
    accent: "#a94774", soft: "#f9ebf2", visual: "regression", featured: false,
    problem: "Binary classification decisions should be understandable down to the loss curve and learned coefficients.",
    approach: "Implement logistic loss and gradient-based optimization directly, then report the full confusion-derived metric set.",
    outcome: "A compact, reproducible from-scratch classifier with strong results on the committed synthetic experiment.",
    stack: ["Python", "NumPy", "Gradient descent", "Binary cross-entropy", "Unit tests"],
    metrics: [
      { label: "Accuracy", value: "91.0%", note: "300-row test split" },
      { label: "Recall", value: "94.7%", note: "Positive-class coverage" },
      { label: "F1", value: "92.3%", note: "Precision-recall balance" },
    ],
    pipeline: ["Synthetic features", "Train/test split", "Loss optimization", "Probability", "Class decision"],
    boundary: "The data is synthetic; the value is implementation clarity, not evidence of domain deployment.",
  },
  "Naive-Bayes": {
    accent: "#7a58bd", soft: "#f2edfb", visual: "regression", featured: false,
    problem: "Probabilistic classification is easier to trust when class priors, smoothing, and likelihoods are visible.",
    approach: "Implement discrete Naive Bayes with Laplace smoothing and expose learned priors alongside evaluation metrics.",
    outcome: "A small tested classifier showing how transparent assumptions can still produce a strong synthetic benchmark.",
    stack: ["Python", "NumPy", "Bayes rule", "Laplace smoothing", "Unit tests"],
    metrics: [
      { label: "Accuracy", value: "93.0%", note: "300-row test split" },
      { label: "Recall", value: "97.0%", note: "Positive-class coverage" },
      { label: "F1", value: "95.5%", note: "Committed experiment" },
    ],
    pipeline: ["Discrete features", "Class priors", "Likelihood tables", "Posterior score", "Class decision"],
    boundary: "The benchmark is synthetic and demonstrates the algorithm rather than real-world generalization.",
  },
  "multi-agent-dev-system": {
    accent: "#325b88", soft: "#eaf1f8", visual: "agents", featured: true,
    problem: "A free-form software request must become specifications, architecture, code, tests, review, deployment assets, and documentation.",
    approach: "Coordinate seven tightly scoped Claude Agent SDK roles through inspectable filesystem artifacts rather than hidden agent-to-agent messages.",
    outcome: "An end-to-end build pipeline that preserves each role's outputs, transcripts, test report, review, Docker assets, and final README.",
    stack: ["Python", "Claude Agent SDK", "Multi-agent orchestration", "Docker", "GitHub Actions"],
    metrics: [
      { label: "Specialist roles", value: "7", note: "PM through documentation" },
      { label: "Coordination", value: "Files", note: "Inspectable shared artifacts" },
      { label: "Evaluation status", value: "Pending", note: "Needs benchmark suite" },
    ],
    pipeline: ["Free-form request", "Product and architecture", "Code and tests", "Review and DevOps", "Documented application"],
    boundary: "The architecture is implemented; reliable cross-task success, latency, and cost still need a committed benchmark.",
  },
  "Machine-Learning-From-Scratch": {
    accent: "#54666d", soft: "#eff2f3", visual: "learning", featured: false,
    problem: "Library-first learning can hide the mechanics that matter during debugging, interviews, and model design.",
    approach: "Organize implementation notes and learning material around core ML algorithms and their mathematical foundations.",
    outcome: "A focused learning repository that complements the individual tested from-scratch model projects.",
    stack: ["Python", "Mathematics", "Algorithm notes", "Interview preparation"],
    metrics: [
      { label: "Purpose", value: "Learning", note: "Not production evidence" },
      { label: "Companion repos", value: "3+", note: "Regression and classification" },
      { label: "Evaluation", value: "N/A", note: "Concept collection" },
    ],
    pipeline: ["Concept", "Derivation", "Implementation", "Experiment", "Explanation"],
    boundary: "This is intentionally a learning collection and should not be presented as a deployed model.",
  },
  "Space-Race-Visualisation": {
    accent: "#294f9c", soft: "#eaf0fb", visual: "space", featured: true,
    problem: "Global launch history, agency budgets, and satellite data are difficult to understand across disconnected files.",
    approach: "Preserve the Tableau workbook and add a dependency-free Python reporting layer that regenerates summaries and charts.",
    outcome: "A reviewable analytics story spanning 63 years of launches, organizations, countries, budgets, and ISRO missions.",
    stack: ["Tableau", "Python", "CSV analysis", "SVG reporting", "GitHub Actions"],
    metrics: [
      { label: "Launch attempts", value: "4,324", note: "1957–2020" },
      { label: "Mission success", value: "89.7%", note: "Global history" },
      { label: "Budget covered", value: "$512.8B", note: "Nine agencies" },
    ],
    pipeline: ["Mission datasets", "Data profiling", "Summary tables", "Visual reporting", "Tableau exploration"],
    boundary: "The project is descriptive analytics; it does not claim causal effects or predictive launch outcomes.",
  },
  "Ayush210895.github.io": {
    accent: "#167b67", soft: "#e9f7f3", visual: "portfolio", featured: false,
    problem: "A technical portfolio must communicate credible project depth without overstating ownership or maturity.",
    approach: "Present selected applied ML, GenAI, forecasting, causal, and production work with direct evidence links.",
    outcome: "A public professional identity layer connecting resumes, repositories, and project narratives.",
    stack: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    metrics: [
      { label: "Role", value: "Portfolio", note: "Presentation layer" },
      { label: "Hosting", value: "Pages", note: "Public deployment" },
      { label: "Evaluation", value: "N/A", note: "Not a model" },
    ],
    pipeline: ["Verified experience", "Project evidence", "Clear narrative", "Public site", "Recruiter path"],
    boundary: "Claims should remain synchronized with current resumes and repository evidence.",
  },
  "Ayush210895": {
    accent: "#54666d", soft: "#eff2f3", visual: "portfolio", featured: false,
    problem: "GitHub visitors need a concise map of technical focus and the strongest public work.",
    approach: "Use the profile repository as a compact index into applied AI, ML, analytics, and production projects.",
    outcome: "A discoverability layer for the broader portfolio.",
    stack: ["GitHub profile", "Markdown", "Repository curation"],
    metrics: [
      { label: "Public projects", value: "19", note: "Current mapped inventory" },
      { label: "Role", value: "Profile", note: "Discovery layer" },
      { label: "Evaluation", value: "N/A", note: "Not a model" },
    ],
    pipeline: ["Profile visit", "Focus areas", "Featured work", "Repository evidence", "Contact path"],
    boundary: "This repository organizes identity and navigation; technical evidence lives in the linked projects.",
  },
  "ai-quality-lab": {
    accent: "#087e72", soft: "#e8f7f4", visual: "risk", featured: true,
    problem: "Model quality is not one metric: launch decisions combine error, cost, capacity, reliability, and operational constraints.",
    approach: "Provide browser-local workspaces for classification, forecasting, ranking, LLM systems, monitoring, and committed model evidence.",
    outcome: "An interactive production-decision tool with CSV evaluation, scenario controls, launch gates, charts, and evidence export.",
    stack: ["React", "TypeScript", "Vite", "Tailwind", "Recharts", "Zod"],
    metrics: [
      { label: "Model workspaces", value: "6", note: "Applied model families" },
      { label: "Metric tests", value: "21", note: "Core evaluation logic" },
      { label: "UI tests", value: "9", note: "Navigation and workflows" },
    ],
    pipeline: ["Model evidence", "Operating policy", "Quality metrics", "Production gates", "Decision export"],
    boundary: "The browser suite evaluates supplied evidence; it does not execute arbitrary Python model binaries.",
  },
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const projectStories: ProjectStory[] = portfolioProjects.map((project) => ({
  ...project,
  ...details[project.name],
  slug: slugify(project.name),
}));

export const projectBySlug = new Map(projectStories.map((project) => [project.slug, project]));
