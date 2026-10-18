# Portfolio Production-Readiness Roadmap

Updated: 2026-10-18

## Readiness Standard

A project is not production-ready because it has a polished interface or a high offline metric. The required gates depend on the project type:

1. **Reproducibility:** pinned dependencies, deterministic commands, tests, and committed evidence.
2. **Model validation:** leakage-resistant splits, relevant baselines, uncertainty, slices, and business-facing thresholds.
3. **Operational safety:** input contracts, failure handling, provenance, least privilege, CI, observability, and rollback.
4. **Live validation:** shadow or canary operation, service-level objectives, drift response, and an accountable decision owner.

## Current Portfolio

| Project | Current stage | Strongest evidence | Next production gate |
|---|---|---|---|
| travel-marketplace-harm-risk | Evaluated decision package | Locked future test, value-ranking artifacts, tests, CI | Shadow test both ranking policies and monitor recall by harm tier |
| Credit-Risk-MLOps-AWS | Local production pattern | API, Docker, MLflow, promotion gates, monitoring, CI | Verify cloud deployment, approval, rollback, security, and live drift response |
| Credit-Card-Anomaly-Detection | Evaluated analytical package | Full-data rare-event report, queue metrics, tests, CI | Temporal stability, calibration, and investigator-yield validation |
| Beijing-AQI-Prediction | Evaluated modeling package | Reusable package, committed results, tests, CI | Temporal cross-validation, nonlinear challenger, and station-level monitoring |
| Amazon-Recommendation-System | Evidence-ready modeling package | Committed historical baseline, temporal split path, tests, CI | Commit temporal ranking metrics, cold-start slices, diversity, and experiment plan |
| financial-doc-agent | Independent evaluated system | Public evaluation, API, Docker, UI | Remains read-only here; expand its own evaluation and abstention controls separately |
| FinBERT-Financial-News-Sentiment | Operationally hardened prototype | Tests, CI, non-root container, validation, atomic output, run manifest | Build and commit a labeled domain evaluation with drift and calibration evidence |
| Clustering | Evaluated analytical package | Silhouette and adjusted-Rand evidence, tests, CI | Define a downstream decision and measure cluster stability and utility |
| Portfolio-Risk-PCA-From-Scratch | Reproducible analytical package | Committed risk report and tested implementation | Extend history and test rolling factor stability across regimes |
| Human-Activity-Monitoring | Evidence-ready feature pipeline | Complete committed feature tables, tests, CI | Train a participant-held-out classifier and measure robustness and inference cost |
| Linear-Regression | Tested learning implementation | Multi-dataset report, tests, CI | Add cross-validation, residual diagnostics, and a real decision context |
| Logistic-Regression | Tested learning implementation | Reproducible metrics, tests, CI | Add real imbalanced data, calibration, slices, and threshold economics |
| Naive-Bayes | Tested learning implementation | Reproducible metrics, tests, CI | Compare on real data against calibrated linear and tree baselines |
| multi-agent-dev-system | Safety-hardened prototype | Approval-aware default, manifests, transcripts, tests, CI | Benchmark quality, intervention rate, latency, cost, sandboxing, and failure recovery |
| Machine-Learning-From-Scratch | Learning repository | Concept and implementation index | Keep educational; link concepts to tested failure cases instead of deploying it |
| Space-Race-Visualisation | Analytical artifact | Tableau and descriptive analysis | Add source freshness, data definitions, uncertainty notes, and interactive release QA |
| Ayush210895.github.io | Public presentation layer | Deployed portfolio | Automate link checks and keep claims synchronized with evidence |
| Ayush210895 | Profile infrastructure | Public discovery index | Keep concise and route visitors to the strongest case studies |
| ai-quality-lab | Deployed evaluation interface | GitHub Pages, tests, CI, multi-model workspaces | Add saved run history, comparison uncertainty, accessibility QA, and monitoring |

## Priority Order

1. **FinBERT labeled evaluation:** closes the largest gap between an operational pipeline and defensible model quality.
2. **Amazon temporal ranking report:** turns the new leakage-resistant path into decision-ready evidence.
3. **Multi-agent benchmark:** establishes whether added autonomy is reliable and economical, not merely impressive in a demo.
4. **Credit-risk controlled deployment:** produces the strongest end-to-end production case study in the portfolio.
5. **Human-activity held-out classifier:** converts a strong feature-analysis project into a complete supervised-learning case.

## Portfolio Claim Boundary

The portfolio contains production-oriented systems, deployed presentation and evaluation infrastructure, reproducible analytical packages, and learning repositories. It does **not** claim that every model is operating in a live business environment. That distinction makes the evidence more credible to engineering leaders, model-risk reviewers, and hiring teams.
