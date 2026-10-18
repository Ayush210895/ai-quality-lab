export type ProjectStatus = "connected" | "evidence-ready" | "needs-evidence" | "learning" | "infrastructure";
export type ProjectLab = "classification" | "comparison" | "regression" | "ranking" | "llm" | "monitoring";

export type PortfolioProject = {
  name: string;
  summary: string;
  family: string;
  status: ProjectStatus;
  evidence: string;
  targetLab?: ProjectLab;
  sourceCommit: string;
  repoUrl: string;
};

const github = "https://github.com/Ayush210895";

export const portfolioProjects: PortfolioProject[] = [
  { name: "travel-marketplace-harm-risk", summary: "Capacity-constrained harmful-booking prioritization with a locked future test.", family: "Classification and value ranking", status: "connected", evidence: "Validation and final-test JSON artifacts", targetLab: "comparison", sourceCommit: "c4a6c0d", repoUrl: `${github}/travel-marketplace-harm-risk` },
  { name: "Credit-Risk-MLOps-AWS", summary: "Credit-risk training, serving, registry, promotion gates, Docker, and monitoring workflow.", family: "Classification and MLOps", status: "evidence-ready", evidence: "Committed model report and promotion thresholds", targetLab: "classification", sourceCommit: "9744a14", repoUrl: `${github}/Credit-Risk-MLOps-AWS` },
  { name: "Credit-Card-Anomaly-Detection", summary: "Rare-event fraud ranking with from-scratch anomaly detectors and top-k review metrics.", family: "Anomaly detection", status: "evidence-ready", evidence: "Committed full-data and demo reports", targetLab: "classification", sourceCommit: "98a25c8", repoUrl: `${github}/Credit-Card-Anomaly-Detection` },
  { name: "Beijing-AQI-Prediction", summary: "AQI regression and category classification implemented as a reusable Python package.", family: "Regression and classification", status: "evidence-ready", evidence: "Current results committed in README", targetLab: "regression", sourceCommit: "5d7aa74", repoUrl: `${github}/Beijing-AQI-Prediction` },
  { name: "Amazon-Recommendation-System", summary: "Recommendation pipeline with collaborative filtering, evaluation utilities, and readable outputs.", family: "Recommendations", status: "needs-evidence", evidence: "Metric code exists; commit a generated result artifact", targetLab: "ranking", sourceCommit: "87bca95", repoUrl: `${github}/Amazon-Recommendation-System` },
  { name: "financial-doc-agent", summary: "Financial-document agent with reranked retrieval, Text2SQL, tool calling, and evaluation cases.", family: "LLM and RAG", status: "evidence-ready", evidence: "Evaluation results available; source remains read-only", targetLab: "llm", sourceCommit: "e8c54d0", repoUrl: `${github}/financial-doc-agent` },
  { name: "FinBERT-Financial-News-Sentiment", summary: "Financial-news sentiment inference with per-label probabilities and structured output.", family: "NLP classification", status: "needs-evidence", evidence: "Commit a labeled evaluation report", targetLab: "classification", sourceCommit: "224bd3a", repoUrl: `${github}/FinBERT-Financial-News-Sentiment` },
  { name: "Clustering", summary: "From-scratch clustering experiments across synthetic and world-indicator datasets.", family: "Unsupervised learning", status: "evidence-ready", evidence: "Committed silhouette and adjusted-Rand report", sourceCommit: "6d53f81", repoUrl: `${github}/Clustering` },
  { name: "Portfolio-Risk-PCA-From-Scratch", summary: "PCA-based portfolio risk analysis with reproducible reporting.", family: "Dimensionality reduction", status: "evidence-ready", evidence: "Committed portfolio risk report", sourceCommit: "e9a8384", repoUrl: `${github}/Portfolio-Risk-PCA-From-Scratch` },
  { name: "Human-Activity-Monitoring", summary: "Visibility-graph and permutation-entropy analysis for wearable activity signals.", family: "Time-series analytics", status: "needs-evidence", evidence: "Reports are generated locally but not committed", targetLab: "monitoring", sourceCommit: "23c74da", repoUrl: `${github}/Human-Activity-Monitoring` },
  { name: "Linear-Regression", summary: "Normal equation, gradient descent, SGD, and regularization implemented from first principles.", family: "Regression", status: "evidence-ready", evidence: "Committed experiment report", targetLab: "regression", sourceCommit: "b25e280", repoUrl: `${github}/Linear-Regression` },
  { name: "Logistic-Regression", summary: "From-scratch binary classifier with transparent loss and classification metrics.", family: "Classification", status: "evidence-ready", evidence: "Committed experiment report", targetLab: "classification", sourceCommit: "0f58493", repoUrl: `${github}/Logistic-Regression` },
  { name: "Naive-Bayes", summary: "From-scratch probabilistic classifier with a reproducible evaluation report.", family: "Classification", status: "evidence-ready", evidence: "Committed experiment report", targetLab: "classification", sourceCommit: "f44f728", repoUrl: `${github}/Naive-Bayes` },
  { name: "multi-agent-dev-system", summary: "Role-based software delivery orchestration with specs, implementation, tests, and review artifacts.", family: "Agent systems", status: "needs-evidence", evidence: "Add task-success, reliability, latency, and cost results", targetLab: "llm", sourceCommit: "cd6352b", repoUrl: `${github}/multi-agent-dev-system` },
  { name: "Machine-Learning-From-Scratch", summary: "Learning collection for understanding core machine-learning algorithms.", family: "Learning repository", status: "learning", evidence: "Concept notes rather than a deployable model", sourceCommit: "beb76e3", repoUrl: `${github}/Machine-Learning-From-Scratch` },
  { name: "Space-Race-Visualisation", summary: "Tableau and data-analysis project covering missions, budgets, agencies, and satellites.", family: "Data visualization", status: "learning", evidence: "Analytical artifact rather than a predictive model", sourceCommit: "c6e7598", repoUrl: `${github}/Space-Race-Visualisation` },
  { name: "Ayush210895.github.io", summary: "Public portfolio presenting selected professional and project work.", family: "Portfolio", status: "infrastructure", evidence: "Presentation layer; no model evaluation expected", sourceCommit: "01aea02", repoUrl: `${github}/Ayush210895.github.io` },
  { name: "Ayush210895", summary: "GitHub profile repository and public developer introduction.", family: "Profile", status: "infrastructure", evidence: "Profile metadata; no model evaluation expected", sourceCommit: "64fe911", repoUrl: `${github}/Ayush210895` },
  { name: "ai-quality-lab", summary: "Browser-based decision suite for model evaluation, launch gates, and evidence export.", family: "Evaluation infrastructure", status: "infrastructure", evidence: "This portfolio-wide evaluation layer", sourceCommit: "current", repoUrl: `${github}/ai-quality-lab` },
];
