# AI Quality Lab

AI Quality Lab is a decision-support product for evaluating whether an ML system is ready to launch. The first module, **Decision Threshold Explorer**, connects model scores to operating capacity and business cost.

**Live product:** [ayush210895.github.io/ai-quality-lab](https://ayush210895.github.io/ai-quality-lab/)

![Decision Threshold Explorer](artifacts/decision-threshold-explorer-v1.png)

## Current module

The explorer can generate a reproducible imbalanced-classification scenario or evaluate a real prediction file. A reviewer can change:

- positive-class prevalence;
- decision threshold;
- false-positive and false-negative costs;
- maximum review capacity.

It calculates the confusion matrix, accuracy, precision, recall, F1, PR-AUC, alert volume, expected cost, and cost improvement over an all-negative baseline. Transparent quality, economics, and capacity gates produce a `Pass`, `Conditional pass`, or `Stop` recommendation.

The threshold optimizer evaluates every distinct model score and recommends the lowest-cost operating point that reaches at least 70% recall without exceeding the selected review capacity. The interface compares the current, recommended, and all-negative policies before a reviewer applies a change.

## Evaluate your own model

Choose **Upload CSV** and select a file with these required columns:

```csv
actual,score
0,0.08
1,0.91
```

- `actual` must be `0` or `1`.
- `score` must be between `0` and `1`.
- Both outcome classes must be present.
- Extra columns are allowed and ignored.
- Files are limited to 15 MB and 200,000 rows.

The file is parsed and evaluated locally in the browser. It is not uploaded to a server.

## Run locally

From this directory:

```bash
python3 -m http.server 8765 --directory dist
```

Then open `http://localhost:8765`.

## Test

```bash
node --test tests/metrics.test.mjs
```

Requires a current Node.js release with the built-in test runner.

Every push and pull request runs syntax checks and unit tests through GitHub Actions. A separate workflow deploys the static application to GitHub Pages after changes reach `main`.

## Next product increments

1. Add uncertainty and segment-level reliability checks.
2. Export a human-readable launch decision memo.

## Scope boundary

This is a standalone evaluation product. It does not read from, write to, import, or modify the existing RAG project.

