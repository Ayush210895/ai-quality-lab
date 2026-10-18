# Flagship Case Study Backlog

AI Quality Lab is the current release priority. The projects below are intentionally deferred so each can be strengthened with verified evidence instead of rushed copy.

Every completed case page should answer the same nine questions: problem, user, architecture, decisions, evidence, limitations, business value, repository, and next production step.

## 1. Travel Harm Risk

- Add the chronological feature-to-policy architecture and the locked 5% review-capacity decision.
- Show the policy trade-off: 37.2% harmful value captured versus 28.9% under probability ranking, while incident recall moves from 20.6% to 18.1%.
- Add the untouched future-test evidence and a proposed shadow test by harm tier.

## 2. Financial Document Agent

- Diagram routing from a question to reranked retrieval or read-only Text2SQL, calculation tools, citations, and the final response.
- Summarize the 15-question evaluation, including stronger SQL-backed numeric results and weaker narrative cases when retrieved context is incomplete.
- Document abstention, section-aware retrieval, and separate retrieval-versus-answer scoring as the next production steps.
- Keep the source RAG project read-only; improve only its portfolio case page unless separate permission is given.

## 3. Credit Risk MLOps

- Add a lifecycle diagram from tracked training through the MLflow registry gate, FastAPI, Docker and CI, monitoring, and rollback.
- Connect held-out ROC-AUC, average precision, and threshold recall to the promotion decision.
- Separate the verified local workflow from the proposed AWS operating design and list the missing production controls.

## 4. Recommendation System

- Explain what RMSE, NDCG@K, coverage, diversity, and novelty each reveal about product quality.
- Add temporal holdout, cold-start slices, and readable top-N examples as decision evidence.
- Define the online experiment and guardrails required before a candidate can be promoted.
